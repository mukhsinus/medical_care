const Order = require('../models/Order');

exports.createOrderAndInitPayment = async (req, res) => {
  try {
    const { items, amount, provider } = req.body; // provider: 'payme' or 'click'

    if (!['payme', 'click'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid payment provider' });
    }

    // 1) Create order in DB
    const order = await Order.create({
      items,
      amount,
      paymentProvider: provider,
    });

    // 2) Build redirect URL / init data (for now just a placeholder)
    let paymentInitData = {};

    if (provider === 'payme') {
      // TODO: Use real Payme API here
      // docs: https://docs.payme.io/ or PayTechUz, Payme guides :contentReference[oaicite:0]{index=0}

      paymentInitData = {
        // Example: hosted payment page URL with query params
        redirectUrl: `${process.env.BACKEND_URL}/mock/payme-gateway?orderId=${order._id}`,
      };
    }

    if (provider === 'click') {
      // TODO: Use real Click API here
      // docs: https://docs.click.uz/en/click-api/ :contentReference[oaicite:1]{index=1}

      paymentInitData = {
        redirectUrl: `${process.env.BACKEND_URL}/mock/click-gateway?orderId=${order._id}`,
      };
    }

    return res.status(201).json({
      orderId: order._id,
      provider,
      paymentInitData,
    });
  } catch (err) {
    console.error('createOrderAndInitPayment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PAYME CALLBACK (skeleton)
exports.paymeCallback = async (req, res) => {
  try {
    const payload = req.body;

    // TODO: verify Payme signature, amount, etc.
    // For actual implementation, check Node example: https://github.com/samarbadriddin0v/payme-uz-integration-nodejs :contentReference[oaicite:2]{index=2}

    const orderId = payload?.order_id; // change to real field
    const transactionId = payload?.transaction_id; // real field

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Example: Assume success (for now)
    order.paymentStatus = 'paid';
    order.providerTransactionId = transactionId;
    await order.save();

    // Payme expects specific JSON response (see docs) – TODO later
    return res.json({ result: 'success' });
  } catch (err) {
    console.error('paymeCallback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// CLICK CALLBACK (skeleton)
exports.clickCallback = async (req, res) => {
  try {
    const payload = req.body;

    // TODO: verify Click signature, action (prepare/complete), etc.
    // For real flow see Click docs + examples :contentReference[oaicite:3]{index=3}

    const orderId = payload?.merchant_trans_id; // usually your order id
    const clickTransId = payload?.click_trans_id;
    const action = payload?.action; // 0=prepare,1=complete etc.

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (action === 0) {
      // prepare – just check amounts, etc.
      // TODO: validate order.amount === payload.amount
      // respond with success (specific JSON)
      return res.json({ error: 0, error_note: 'Success', merchant_trans_id: orderId });
    }

    if (action === 1) {
      // complete – finalize payment
      order.paymentStatus = 'paid';
      order.providerTransactionId = clickTransId;
      await order.save();

      return res.json({ error: 0, error_note: 'Success', merchant_trans_id: orderId });
    }

    // unknown action
    return res.json({ error: -1, error_note: 'Unknown action' });
  } catch (err) {
    console.error('clickCallback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
