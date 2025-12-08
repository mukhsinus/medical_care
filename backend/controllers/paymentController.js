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
      paymentInitData = {
        redirectUrl: `${backendBase}/mock/click-gateway?orderId=${order._id}`,
      };
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

// CLICK CALLBACK (skeleton)
exports.clickCallback = async (req, res) => {
  try {
    const payload = req.body;

    const orderId = payload?.merchant_trans_id; // usually your order id
    const clickTransId = payload?.click_trans_id;
    const action = payload?.action; // 0=prepare, 1=complete

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (action === 0) {
      // prepare – validate amount etc.
      return res.json({
        error: 0,
        error_note: "Success",
        merchant_trans_id: orderId,
      });
    }

    if (action === 1) {
      order.paymentStatus = "paid";
      order.providerTransactionId = clickTransId;
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

      return res.json({
        error: 0,
        error_note: "Success",
        merchant_trans_id: orderId,
      });
    }

    return res.json({ error: -1, error_note: "Unknown action" });
  } catch (err) {
    console.error("clickCallback error:", err);
    res.status(500).json({ error: "Server error" });
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
