/**
 * Click Webhook Routes
 * Handles Click payment gateway callbacks
 * Documentation: https://docs.click.uz/merchant/
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Order = require("../models/Order");
const User = require("../models/User");
const {
  verifyClickSignature,
  buildClickResponse,
  buildErrorResponse,
  validateClickPrepareRequest,
  CLICK_ERRORS,
  CLICK_ACTIONS,
  formatClickTransactionLog,
} = require("../services/clickMerchantAPI");
const { sendNotification } = require("../utils/telegramNotifier");

const isTestMode = process.env.CLICK_TEST_MODE === "true";

/**
 * Main Click Webhook Handler
 * Processes PREPARE and COMPLETE actions from Click
 * 
 * Request flow:
 * 1. User initiates payment via Click gateway
 * 2. Click sends PREPARE request to validate order
 * 3. If user confirms, Click sends COMPLETE request to finalize
 * 4. We confirm payment and update order status
 */
router.post("/webhook", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const payload = req.body;
  const requestTime = new Date().toISOString();

  console.log("\n=== CLICK WEBHOOK REQUEST ===");
  console.log("Time:", requestTime);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log(formatClickTransactionLog(payload));

  try {
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string,
    } = payload;

    // ========== STEP 1: Validate service_id ==========
    const expectedServiceId = process.env.CLICK_SERVICE_ID;
    if (!expectedServiceId) {
      console.error("❌ CLICK_SERVICE_ID not configured");
      const response = buildErrorResponse("SYSTEM_ERROR");
      console.log("Response:", JSON.stringify(response, null, 2));
      return res.json(response);
    }

    if (String(service_id) !== String(expectedServiceId)) {
      console.error(
        `❌ Invalid service_id! Expected: ${expectedServiceId}, Got: ${service_id}`
      );
      const response = buildErrorResponse("SYSTEM_ERROR");
      console.log("Response:", JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // ========== STEP 2: Verify Signature ==========
    if (!isTestMode) {
      const secretKey = process.env.CLICK_SECRET_KEY;
      if (!secretKey) {
        console.error("❌ CLICK_SECRET_KEY not configured");
        const response = buildErrorResponse("SYSTEM_ERROR");
        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      if (!verifyClickSignature(payload, secretKey)) {
        console.error("❌ INVALID SIGNATURE!");
        console.error("Expected sign computation using SECRET_KEY");
        console.error("Received sign_string:", sign_string);

        const response = buildErrorResponse("INVALID_SIGNATURE");
        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      console.log("✅ Signature verified successfully");
    } else {
      console.log("⚠️  CLICK TEST MODE: signature verification skipped");
    }

    // ========== STEP 3: Handle PREPARE Action ==========
    if (action === CLICK_ACTIONS.PREPARE) {
      console.log("📋 PREPARE action: validating order");

      const validation = await validateClickPrepareRequest(
        merchant_trans_id,
        amount
      );

      if (!validation.valid) {
        const response = buildErrorResponse(
          validation.code === CLICK_ERRORS.ORDER_NOT_FOUND
            ? "ORDER_NOT_FOUND"
            : validation.code === CLICK_ERRORS.ORDER_ALREADY_COMPLETED
            ? "ORDER_ALREADY_COMPLETED"
            : "INVALID_AMOUNT"
        );

        console.log("❌ Validation failed:", validation.error);
        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Order is valid and ready for payment
      const response = buildClickResponse(0, "Success", {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id: merchant_trans_id, // We use order._id as prepare_id
      });

      console.log("✅ PREPARE Success");
      console.log("Response:", JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // ========== STEP 4: Handle COMPLETE Action ==========
    if (action === CLICK_ACTIONS.COMPLETE) {
      console.log("✅ COMPLETE action: finalizing payment");

      const order = await Order.findById(merchant_trans_id);

      if (!order) {
        console.error("❌ Order not found:", merchant_trans_id);
        const response = buildErrorResponse("ORDER_NOT_FOUND");
        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Validate merchant_prepare_id matches what we returned in PREPARE
      // (safety check to catch tampering or system errors)
      if (String(merchant_prepare_id) !== String(order._id)) {
        console.error(
          "❌ merchant_prepare_id mismatch! Expected:",
          order._id,
          "Got:",
          merchant_prepare_id
        );
        const response = buildErrorResponse("SYSTEM_ERROR");
        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // ---- Check if already completed (idempotent) ----
      if (order.paymentStatus === "completed") {
        console.log("⚠️  Order already completed");

        // Idempotent response: if same transaction, return success
        if (order.providerTransactionId === String(click_trans_id)) {
          console.log("Same transaction ID - returning idempotent success response");

          const response = buildClickResponse(0, "Success", {
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: merchant_trans_id,
          });

          console.log("Response:", JSON.stringify(response, null, 2));
          return res.json(response);
        } else {
          // Different transaction tried to complete - reject
          console.error(
            "Order completed with different transaction:",
            order.providerTransactionId,
            "vs",
            click_trans_id
          );

          const response = buildErrorResponse("ORDER_ALREADY_COMPLETED");
          console.log("Response:", JSON.stringify(response, null, 2));
          return res.json(response);
        }
      }

      // ---- Check if Click reported an error ----
      // Type safety: Convert to number in case Click sends "0" as string
      if (Number(error) < 0) {
        console.error(`❌ Click reported payment error: ${error} - ${error_note}`);
        console.log("Funds were NOT deducted. Cancelling order...");

        // Update order with failed status
        order.paymentStatus = "failed";
        order.meta = order.meta || {};
        order.meta.clickError = error;
        order.meta.clickErrorNote = error_note;
        await order.save();

        // Return error -9: Cannot fulfill due to payment failure on Click side
        const response = buildClickResponse(
          CLICK_ERRORS.SYSTEM_ERROR,
          `Payment cancelled: ${error_note}`,
          {
            click_trans_id,
            merchant_trans_id,
          }
        );

        console.log("Response (payment failed):", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // ---- Validate amount one final time ----
      // CRITICAL: Always re-validate amount in COMPLETE before marking paid
      // This is the final money operation - must double-check
      if (Math.round(order.amount) !== Math.round(amount)) {
        console.error(
          "❌ Amount mismatch in COMPLETE! Expected:",
          order.amount,
          "Got:",
          amount
        );
        const response = buildErrorResponse("INVALID_AMOUNT");
        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // ---- Mark order as completed ----
      // At this point, error = 0 (from Click), meaning funds were successfully deducted
      // We now fulfill the order
      order.paymentStatus = "completed";
      order.providerTransactionId = String(click_trans_id);
      order.meta = order.meta || {};
      order.meta.clickPaydocId = click_paydoc_id;
      order.meta.clickCompletedAt = new Date();

      await order.save();
      console.log("✅ Order marked as completed:", order._id);

      // ---- Send Telegram notification ----
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
<b>Provider:</b> Click
<b>Click Trans ID:</b> ${click_trans_id}

<b>Customer:</b>
• Name: ${user.name}
• Email: ${user.email}
• Phone: ${user.phone || "Not provided"}
• Address: ${addr}

<b>Products:</b>
${itemsList}

<b>Total:</b> ${order.amount.toLocaleString("uz-UZ")} UZS

<b>Time:</b> ${new Date().toISOString()}
`;
          sendNotification(orderMessage);
        }
      } catch (e) {
        console.error("Telegram notification failed (non-blocking):", e?.message);
      }

      const response = buildClickResponse(0, "Success", {
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: merchant_trans_id,
      });

      console.log("✅ COMPLETE Success");
      console.log("Response:", JSON.stringify(response, null, 2));
      console.log("=== END CLICK WEBHOOK ===\n");

      return res.json(response);
    }

    // ========== UNKNOW ACTION ==========
    console.error("❌ Unknown action:", action);
    const response = buildErrorResponse("ACTION_NOT_FOUND");
    console.log("Response:", JSON.stringify(response, null, 2));
    return res.json(response);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    const response = buildErrorResponse("SYSTEM_ERROR");
    console.log("Error Response:", JSON.stringify(response, null, 2));
    console.log("=== END CLICK WEBHOOK (ERROR) ===\n");
    return res.json(response);
  }
});

module.exports = router;
