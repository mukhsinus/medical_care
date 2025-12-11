// controllers/paymentController.js
const Order = require("../models/Order");
const User = require("../models/User");
const { sendNotification } = require("../utils/telegramNotifier");

exports.createOrderAndInitPayment = async (req, res) => {
  console.log('PAYMENT BODY:', req.body);
  console.log('👉 userId from auth:', req.userId);
  try {
    const { items, amount, provider } = req.body; // provider: 'payme', 'click', or 'uzum'

    if (!["payme", "click", "uzum"].includes(provider)) {
      return res.status(400).json({ message: "Invalid payment provider" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // authMiddleware should have set req.userId
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log('👉 First item:', items[0]);

    // 1) Create order in DB
    const order = await Order.create({
      userId,
      items,
      amount,
      currency: "UZS",
      paymentProvider: provider,
      paymentStatus: "pending",
      meta: {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      },
    });

    console.log("Order created:", order._id);

    // 2) Build redirect URL / init data (for now just a placeholder)
    const backendBase = process.env.BACKEND_URL || "http://localhost:8090";

    let paymentInitData;

    if (provider === "payme") {
      paymentInitData = {
        redirectUrl: `${backendBase}/mock/payme-gateway?orderId=${order._id}`,
      };
    } else if (provider === "click") {
      const clickServiceId = process.env.CLICK_SERVICE_ID;
      const clickMerchantId = process.env.CLICK_MERCHANT_ID;
      // Click payment URL format: https://my.click.uz/services/pay?service_id=SERVICE_ID&merchant_id=MERCHANT_ID&amount=AMOUNT&transaction_param=ORDER_ID
      const testMode = process.env.CLICK_TEST_MODE === 'true';
      if (testMode) {
        paymentInitData = {
          redirectUrl: `${backendBase}/mock/click-gateway?orderId=${order._id}`,
        };
      } else {
        paymentInitData = {
          redirectUrl: `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${Math.round(amount)}&transaction_param=${order._id}`,
        };
      }
    } else {
      // provider === 'uzum'
      paymentInitData = {
        redirectUrl: `${backendBase}/mock/uzum-gateway?orderId=${order._id}`,
      };
    }

    return res.status(201).json({
      orderId: order._id,
      provider,
      paymentInitData,
    });
  } catch (err) {
    console.error("createOrderAndInitPayment error:", err);
    res.status(500).json({
      message: "Server error",
      details: err.message,
      name: err.name || "",
    });
  }
};

// PAYME CALLBACK (skeleton)
exports.paymeCallback = async (req, res) => {
  try {
    const payload = req.body;

    const orderId = payload?.order_id; // TODO: adjust to real field name
    const transactionId = payload?.transaction_id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // TODO: verify Payme signature, amount, etc.
    order.paymentStatus = "paid";
    order.providerTransactionId = transactionId;
    await order.save();

    // Send Telegram notification on successful payment
    try {
      const user = await User.findById(order.userId);
      if (user) {
        const itemsList = order.items
          .map(
            (item) =>
              `• ${item.name}${item.description ? ` - ${item.description}` : ""}\n  Qty: ${item.quantity} | ${(
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
<b>Provider:</b> ${order.paymentProvider}

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

    return res.json({ result: "success" }); // TODO: real Payme format
  } catch (err) {
    console.error("paymeCallback error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// CLICK CALLBACK - SHOP API integration
// Documentation: https://docs.click.uz/click-api-request
exports.clickCallback = async (req, res) => {
  const requestTime = new Date().toISOString();
  console.log('\n=== CLICK CALLBACK REQUEST ===' );
  console.log('Time:', requestTime);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const payload = req.body;

    // Click SHOP API parameters
    const clickTransId = payload?.click_trans_id;
    const serviceId = payload?.service_id;
    const clickPaydocId = payload?.click_paydoc_id;
    const merchantTransId = payload?.merchant_trans_id; // our order ID
    const merchantPrepareId = payload?.merchant_prepare_id;
    const amount = payload?.amount;
    const action = payload?.action; // 0=prepare, 1=complete
    const error = payload?.error;
    const errorNote = payload?.error_note;
    const signTime = payload?.sign_time;
    const signString = payload?.sign_string;

    console.log('Action:', action, '(0=prepare, 1=complete)');
    console.log('Order ID:', merchantTransId);
    console.log('Amount:', amount);

    const order = await Order.findById(merchantTransId);
    if (!order) {
      console.error('Order not found:', merchantTransId);
      const response = {
        error: -5,
        error_note: "Order not found",
      };
      console.log('Response:', JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // Action 0: PREPARE - validate order
    if (action === 0) {
      console.log('PREPARE request for order:', order._id);
      
      // Check if order is already paid
      if (order.paymentStatus === 'paid') {
        console.error('Order already paid');
        const response = {
          error: -4,
          error_note: "Order already paid",
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Validate amount (Click sends amount in UZS without decimals)
      if (Math.round(order.amount) !== Math.round(amount)) {
        console.error('Amount mismatch. Expected:', order.amount, 'Received:', amount);
        const response = {
          error: -2,
          error_note: "Invalid amount",
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Success - order is ready for payment
      const response = {
        error: 0,
        error_note: "Success",
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: order._id,
      };
      console.log('PREPARE Success. Response:', JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // Action 1: COMPLETE - finalize payment
    if (action === 1) {
      console.log('COMPLETE request for order:', order._id);
      
      // Check if already paid
      if (order.paymentStatus === 'paid') {
        console.log('Order already completed');
        const response = {
          error: 0,
          error_note: "Success",
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: order._id,
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // If Click reports error
      if (error && error < 0) {
        console.error('Click reported error:', error, errorNote);
        const response = {
          error: -9,
          error_note: `Payment error: ${errorNote}`,
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Mark as paid
      order.paymentStatus = "paid";
      order.providerTransactionId = clickTransId;
      await order.save();
      console.log('Order marked as paid:', order._id);

      // Send Telegram notification on successful payment
      try {
        const user = await User.findById(order.userId);
        if (user) {
          const itemsList = order.items
            .map(
              (item) =>
                `• ${item.name}${item.description ? ` - ${item.description}` : ""}\n  Qty: ${item.quantity} | ${(
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
<b>Provider:</b> ${order.paymentProvider}
<b>Click Trans ID:</b> ${clickTransId}

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

      const response = {
        error: 0,
        error_note: "Success",
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: order._id,
      };
      console.log('COMPLETE Success. Response:', JSON.stringify(response, null, 2));
      console.log('=== END CLICK CALLBACK ===\n');
      return res.json(response);
    }

    // Unknown action
    console.error('Unknown action:', action);
    const response = { error: -3, error_note: "Action not found" };
    console.log('Response:', JSON.stringify(response, null, 2));
    return res.json(response);
  } catch (err) {
    console.error("clickCallback error:", err);
    const response = { error: -9, error_note: "System error" };
    console.log('Error Response:', JSON.stringify(response, null, 2));
    console.log('=== END CLICK CALLBACK (ERROR) ===\n');
    res.json(response);
  }
};

// UZUM BANK CALLBACK (skeleton)
exports.uzumCallback = async (req, res) => {
  try {
    const payload = req.body;

    const orderId = payload?.orderId; // adjust to real Uzum field name
    const transactionId = payload?.transactionId;
    const status = payload?.status; // adjust to real Uzum status field

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // TODO: verify Uzum signature, amount, etc.
    if (status === "success" || status === "paid") {
      order.paymentStatus = "paid";
      order.providerTransactionId = transactionId;
      await order.save();

      // Send Telegram notification on successful payment
      try {
        const user = await User.findById(order.userId);
        if (user) {
          const itemsList = order.items
            .map(
              (item) =>
                `• ${item.name}${item.description ? ` - ${item.description}` : ""}\n  Qty: ${item.quantity} | ${(
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
<b>Provider:</b> ${order.paymentProvider}

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

      return res.json({ success: true, message: "Payment confirmed" });
    }

    return res.json({ success: false, message: "Payment not confirmed" });
  } catch (err) {
    console.error("uzumCallback error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
