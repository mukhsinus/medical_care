/**
 * Uzum Bank Webhook Routes
 * Handles Uzum Bank payment callbacks
 * Documentation: https://developer.uzumbank.uz/en/merchant/
 */

const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
const {
  verifyBasicAuth,
  buildUzumResponse,
  buildUzumErrorResponse,
  validateUzumCheckRequest,
  validateUzumCreateRequest,
  validateUzumConfirmRequest,
  UZUM_STATES,
  UZUM_ERRORS,
  formatUzumTransactionLog,
} = require("../services/uzumMerchantAPI");
const { sendNotification } = require("../utils/telegramNotifier");

const isTestMode = process.env.UZUM_TEST_MODE === "true";

/**
 * Verify Uzum Authorization
 * All endpoints require Basic Auth
 */
const validateUzumAuth = (req, res, next) => {
  if (!isTestMode) {
    const authHeader = req.headers.authorization;
    if (!verifyBasicAuth(authHeader)) {
      console.error("❌ Uzum webhook: Invalid authorization");
      const response = buildUzumErrorResponse("UNAUTHORIZED");
      return res.status(401).json(response);
    }
  } else {
    console.log("⚠️  UZUM TEST MODE: authorization check skipped");
  }
  next();
};

// Apply auth to all Uzum webhook routes
router.use(validateUzumAuth);

/**
 * CHECK Webhook - Verify Payment Possibility
 * Called when user selects payment and provides account details
 * 
 * Response: Confirm order exists and can be paid
 */
router.post("/check", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const payload = req.body;
  const requestTime = new Date().toISOString();

  console.log("\n=== UZUM WEBHOOK: CHECK ===");
  console.log("Time:", requestTime);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const { serviceId, timestamp, params } = payload;

    // ========== STEP 1: Validate service_id ==========
    const expectedServiceId = process.env.UZUM_SERVICE_ID;
    if (!expectedServiceId) {
      console.error("❌ UZUM_SERVICE_ID not configured");
      const response = buildUzumErrorResponse("SYSTEM_ERROR");
      return res.json(response);
    }

    if (String(serviceId) !== String(expectedServiceId)) {
      console.error(
        `❌ Invalid service_id! Expected: ${expectedServiceId}, Got: ${serviceId}`
      );
      return res.json(buildUzumErrorResponse("INVALID_SERVICE"));
    }

    // ========== STEP 2: Extract order ID from params ==========
    // Uzum sends account/merchant reference in params.account or similar
    // Your implementation should match how you pass order ID
    const orderId = params?.account;

    if (!orderId) {
      console.error("❌ No account/orderId in params");
      return res.json(buildUzumErrorResponse("INVALID_REQUEST"));
    }

    // ========== STEP 3: Validate order ==========
    const validation = await validateUzumCheckRequest(orderId);

    if (!validation.valid) {
      console.error("❌ Validation failed:", validation.errorType);
      const response = buildUzumErrorResponse(validation.errorType);
      return res.json(response);
    }

    // ========== STEP 4: Return success ==========
    const response = buildUzumResponse(UZUM_ERRORS.OK, {
      serviceId,
      timestamp: Date.now(),
      data: {
        account: orderId,
        // Add any additional data Uzum expects (customer info, etc.)
      },
    });

    console.log("✅ CHECK Success");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("=== END CHECK ===\n");

    return res.json(response);
  } catch (err) {
    console.error("❌ Check error:", err);
    return res.json(buildUzumErrorResponse("SYSTEM_ERROR"));
  }
});

/**
 * CREATE Webhook - Create Payment Transaction
 * Called after user confirms payment
 * Money NOT deducted yet, just creating transaction in Uzum
 * 
 * Response: Confirm transaction created with state CREATED
 */
router.post("/create", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const payload = req.body;
  const requestTime = new Date().toISOString();

  console.log("\n=== UZUM WEBHOOK: CREATE ===");
  console.log("Time:", requestTime);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log(formatUzumTransactionLog(payload, "create"));

  try {
    const { serviceId, timestamp, transId, params, amount } = payload;

    // ========== STEP 1: Validate service_id ==========
    const expectedServiceId = process.env.UZUM_SERVICE_ID;
    if (String(serviceId) !== String(expectedServiceId)) {
      console.error(`❌ Invalid service_id: ${serviceId}`);
      return res.json(buildUzumErrorResponse("INVALID_SERVICE"));
    }

    // ========== STEP 2: Extract order ID ==========
    const orderId = params?.account;
    if (!orderId) {
      console.error("❌ No account/orderId in params");
      return res.json(buildUzumErrorResponse("INVALID_REQUEST"));
    }

    // ========== STEP 3: Validate order and amount ==========
    const validation = await validateUzumCreateRequest(orderId, amount);

    if (!validation.valid) {
      console.error("❌ Validation failed:", validation.errorType);
      return res.json(buildUzumErrorResponse(validation.errorType));
    }

    const order = validation.order;

    // ========== STEP 4: Save Uzum transaction ID ==========    // Check for duplicate transId (uniqueness protection)
    const existing = await Order.findOne({
      "meta.uzumTransId": String(transId),
    });
    if (existing && String(existing._id) !== String(order._id)) {
      console.error(
        "❌ Duplicate transId detected! Already assigned to order:",
        existing._id
      );
      return res.json(buildUzumErrorResponse("SYSTEM_ERROR"));
    }
    order.paymentStatus = "processing";
    order.paymentProvider = "uzum";
    order.providerTransactionId = String(transId);
    order.meta = order.meta || {};
    order.meta.uzumTransId = transId;
    order.meta.uzumCreatedAt = new Date();

    await order.save();
    console.log("✅ Order marked as processing with Uzum transId:", transId);

    // ========== STEP 5: Return success ==========
    const response = buildUzumResponse(UZUM_STATES.CREATED, {
      serviceId,
      transId,
      transTime: Date.now(),
      amount,
      data: {
        account: orderId,
      },
    });

    console.log("✅ CREATE Success");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("=== END CREATE ===\n");

    return res.json(response);
  } catch (err) {
    console.error("❌ Create error:", err);
    return res.json(buildUzumErrorResponse("SYSTEM_ERROR"));
  }
});

/**
 * CONFIRM Webhook - Confirm Payment Transaction
 * Called after funds successfully deducted from user's card
 * This is final - must provide service and mark order as completed
 * 
 * Uzum retries this up to 10 times if it fails, so must be idempotent
 * Timeout: 30 minutes - if not confirmed by then, payment is FAILED
 * 
 * Response: Confirm transaction completed with state CONFIRMED
 */
router.post("/confirm", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const payload = req.body;
  const requestTime = new Date().toISOString();

  console.log("\n=== UZUM WEBHOOK: CONFIRM ===");
  console.log("Time:", requestTime);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log(formatUzumTransactionLog(payload, "confirm"));

  try {
    const {
      serviceId,
      timestamp,
      transId,
      params,
      amount,
      paymentSource,
      phone,
      cardType,
    } = payload;

    // ========== STEP 1: Validate service_id ==========
    const expectedServiceId = process.env.UZUM_SERVICE_ID;
    if (String(serviceId) !== String(expectedServiceId)) {
      console.error(`❌ Invalid service_id: ${serviceId}`);
      return res.json(buildUzumErrorResponse("INVALID_SERVICE"));
    }

    // ========== STEP 2: Extract order ID ==========
    const orderId = params?.account;
    if (!orderId) {
      console.error("❌ No account/orderId in params");
      return res.json(buildUzumErrorResponse("INVALID_REQUEST"));
    }

    // ========== STEP 3: Find order ==========
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("❌ Order not found:", orderId);
      return res.json(buildUzumErrorResponse("ORDER_NOT_FOUND"));
    }

    // ========== STEP 4: Idempotent - check if already confirmed ==========
    if (order.paymentStatus === "completed") {
      console.log("⚠️  Order already completed");

      if (order.providerTransactionId === String(transId)) {
        console.log("Same transaction ID - returning idempotent success response");

        const response = buildUzumResponse(UZUM_STATES.CONFIRMED, {
          serviceId,
          transId,
          confirmTime: Date.now(),
          amount,
        });

        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      } else {
        // Different transaction tried to confirm - this is suspicious
        console.error(
          "Order completed with different transaction:",
          order.providerTransactionId,
          "vs",
          transId
        );
        return res.json(buildUzumErrorResponse("ORDER_NOT_FOUND"));
      }
    }

    // ========== STEP 5: Verify transId matches what we saved in CREATE ==========
    // Safety check: ensure this is the same transaction from /create
    if (String(order.providerTransactionId) !== String(transId)) {
      console.error(
        "❌ Transaction ID mismatch! Expected:",
        order.providerTransactionId,
        "Got:",
        transId
      );
      return res.json(buildUzumErrorResponse("ORDER_NOT_FOUND"));
    }

    // ========== STEP 6: Final amount validation ==========
    const orderAmountInTiyin = Math.round(order.amount * 100);
    if (orderAmountInTiyin !== Math.round(amount)) {
      console.error(
        "❌ Amount mismatch! Expected:",
        orderAmountInTiyin,
        "Got:",
        amount
      );
      return res.json(buildUzumErrorResponse("INVALID_AMOUNT"));
    }

    // ========== STEP 7: Mark order as completed ==========
    order.paymentStatus = "completed";
    order.meta = order.meta || {};
    order.meta.uzumConfirmedAt = new Date();
    order.meta.uzumPaymentSource = paymentSource;
    order.meta.uzumPhone = phone;
    order.meta.uzumCardType = cardType;

    await order.save();
    console.log("✅ Order marked as completed:", orderId);

    // ========== STEP 8: Send Telegram notification ==========
    try {
      const user = await User.findById(order.userId);
      if (user) {
        const itemsList = order.items
          .map(
            (item) =>
              `• ${item.name}${
                item.description ? ` - ${item.description}` : ""
              }\n  Qty: ${item.quantity} | ${(
                item.price * item.quantity
              ).toLocaleString("uz-UZ")} UZS`
          )
          .join("\n");

        const addr = user.address
          ? `${user.address.house ? user.address.house + ", " : ""}${
              user.address.street || ""
            }, ${user.address.city || ""} ${user.address.zip || ""}`.trim()
          : "Not provided";

        const orderMessage = `
<b>🛒 New Order Placed</b>

<b>Order ID:</b> ${order._id}
<b>Payment Status:</b> ✅ Paid
<b>Provider:</b> Uzum Bank
<b>Uzum Trans ID:</b> ${transId}

<b>Customer:</b>
• Name: ${user.name}
• Email: ${user.email}
• Phone: ${user.phone || "Not provided"}
• Address: ${addr}

<b>Products:</b>
${itemsList}

<b>Total:</b> ${order.amount.toLocaleString("uz-UZ")} UZS

<b>Payment Source:</b> ${paymentSource}
<b>Phone:</b> ${phone}

<b>Time:</b> ${new Date().toISOString()}
`;
        sendNotification(orderMessage);
      }
    } catch (e) {
      console.error(
        "Telegram notification failed (non-blocking):",
        e?.message
      );
    }

    // ========== STEP 9: Return success ==========
    const response = buildUzumResponse(UZUM_STATES.CONFIRMED, {
      serviceId,
      transId,
      confirmTime: Date.now(),
      amount,
    });

    console.log("✅ CONFIRM Success");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("=== END CONFIRM ===\n");

    return res.json(response);
  } catch (err) {
    console.error("❌ Confirm error:", err);
    return res.json(buildUzumErrorResponse("SYSTEM_ERROR"));
  }
});

/**
 * REVERSE Webhook - Cancel Payment Transaction
 * Called when user cancels or payment fails
 * Free up any reserved resources
 * 
 * Response: Confirm transaction reversed with state REVERSED
 */
router.post("/reverse", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const payload = req.body;
  const requestTime = new Date().toISOString();

  console.log("\n=== UZUM WEBHOOK: REVERSE ===");
  console.log("Time:", requestTime);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const { serviceId, timestamp, transId } = payload;

    // ========== STEP 1: Validate service_id ==========
    const expectedServiceId = process.env.UZUM_SERVICE_ID;
    if (String(serviceId) !== String(expectedServiceId)) {
      console.error(`❌ Invalid service_id: ${serviceId}`);
      return res.json(buildUzumErrorResponse("INVALID_SERVICE"));
    }

    // ========== STEP 2: Find order by Uzum transId ==========
    const order = await Order.findOne({
      "meta.uzumTransId": String(transId),
    });

    if (!order) {
      console.error("❌ Order not found for transId:", transId);
      return res.json(buildUzumErrorResponse("ORDER_NOT_FOUND"));
    }

    // ========== STEP 3: Mark as cancelled/failed ==========
    if (order.paymentStatus !== "completed") {
      order.paymentStatus = "cancelled";
      order.meta = order.meta || {};
      order.meta.uzumReversedAt = new Date();
      await order.save();

      console.log("✅ Order marked as cancelled:", order._id);
    } else {
      // Order was already completed - this is a refund
      console.log("⚠️  Order already completed - marking as refunded");
      order.paymentStatus = "refunded";
      order.meta = order.meta || {};
      order.meta.uzumRefundedAt = new Date();
      await order.save();
    }

    // ========== STEP 4: Return success ==========
    const response = buildUzumResponse(UZUM_STATES.REVERSED, {
      serviceId,
      transId,
      reverseTime: Date.now(),
    });

    console.log("✅ REVERSE Success");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("=== END REVERSE ===\n");

    return res.json(response);
  } catch (err) {
    console.error("❌ Reverse error:", err);
    return res.json(buildUzumErrorResponse("SYSTEM_ERROR"));
  }
});

/**
 * STATUS Webhook - Check Payment Transaction Status
 * Called by Uzum if CONFIRM fails or times out
 * Uzum retries this up to 10 times
 * 
 * Must return current transaction status: CREATED, CONFIRMED, REVERSED, FAILED
 * Timeout: 30 minutes - if not confirmed by then, status should be FAILED
 */
router.post("/status", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const payload = req.body;
  const requestTime = new Date().toISOString();

  console.log("\n=== UZUM WEBHOOK: STATUS ===");
  console.log("Time:", requestTime);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const { serviceId, timestamp, transId } = payload;

    // ========== STEP 1: Validate service_id ==========
    const expectedServiceId = process.env.UZUM_SERVICE_ID;
    if (String(serviceId) !== String(expectedServiceId)) {
      console.error(`❌ Invalid service_id: ${serviceId}`);
      return res.json(buildUzumErrorResponse("INVALID_SERVICE"));
    }

    // ========== STEP 2: Find order by Uzum transId ==========
    const order = await Order.findOne({
      "meta.uzumTransId": String(transId),
    });

    if (!order) {
      console.error("❌ Order not found for transId:", transId);
      return res.json(buildUzumErrorResponse("ORDER_NOT_FOUND"));
    }

    // ========== STEP 3: Map payment status to Uzum state ==========
    let uzumStatus;
    switch (order.paymentStatus) {
      case "completed":
        uzumStatus = UZUM_STATES.CONFIRMED;
        break;
      case "cancelled":
      case "refunded":
        uzumStatus = UZUM_STATES.REVERSED;
        break;
      case "failed":
        uzumStatus = UZUM_STATES.FAILED;
        break;
      case "processing":
      case "pending":
      default:
        uzumStatus = UZUM_STATES.CREATED;
        break;
    }

    // ========== STEP 4: Check 30-minute timeout ==========
    // If transaction is still in CREATED after 30 minutes, mark as FAILED
    if (
      uzumStatus === UZUM_STATES.CREATED &&
      order.meta?.uzumCreatedAt
    ) {
      const createdTime = new Date(order.meta.uzumCreatedAt);
      const now = new Date();
      const diffMinutes = (now - createdTime) / (1000 * 60);

      if (diffMinutes > 30) {
        console.warn(
          "⚠️  Transaction not confirmed within 30 minutes - marking as FAILED"
        );
        uzumStatus = UZUM_STATES.FAILED;
        order.paymentStatus = "failed";
        await order.save();
      }
    }

    // ========== STEP 5: Return current status ==========
    const response = buildUzumResponse(uzumStatus, {
      serviceId,
      transId,
      transTime: order.meta?.uzumCreatedAt
        ? new Date(order.meta.uzumCreatedAt).getTime()
        : timestamp,
      confirmTime: order.meta?.uzumConfirmedAt
        ? new Date(order.meta.uzumConfirmedAt).getTime()
        : null,
      reverseTime: order.meta?.uzumReversedAt
        ? new Date(order.meta.uzumReversedAt).getTime()
        : null,
    });

    console.log("✅ STATUS Success -", uzumStatus);
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("=== END STATUS ===\n");

    return res.json(response);
  } catch (err) {
    console.error("❌ Status error:", err);
    return res.json(buildUzumErrorResponse("SYSTEM_ERROR"));
  }
});

module.exports = router;
