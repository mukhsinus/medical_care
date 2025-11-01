const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // Your auth.js middleware
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendNotification } = require('../utils/telegramNotifier');

// All routes here are protected
router.use(authMiddleware);

// GET /api/user/orders (fetch user's orders)
router.get('/orders', async (req, res) => {
  try {
    const Order = require('../models/Order'); // Assuming Order model exists (see below)
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
    const orderMessage = `
    <b>New Order!</b>
    👤 <b>From:</b> ${user.name} (${user.email})
    💰 <b>Total:</b> $${order.total}
    🆔 <b>Order ID:</b> ${order._id}
    `;
    sendNotification(orderMessage);
  } catch (err) {
    console.error('ORDERS ERROR:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// PATCH /api/user/profile (update name/phone)
router.patch('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    user.phone = phone || user.phone;
    await user.save();
    user.name = name;
    user.phone = phone || user.phone;
    await user.save();

    // Send Telegram notification
    const profileMessage = `
    <b>Profile Updated</b>

    👤 <b>User:</b> ${user.name} (${user.email})
    📱 <b>New Phone:</b> ${user.phone || 'Not provided'}
    🆔 <b>User ID:</b> ${req.userId}
    ⏰ <b>Time:</b> ${new Date().toISOString()}
    `;
    sendNotification(profileMessage);

    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('PROFILE UPDATE ERROR:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// PATCH /api/user/password (change password)
router.patch('/password', async (req, res) => {
  try {
    const { current, new: newPassword } = req.body;
    if (!current || !newPassword) return res.status(400).json({ message: 'Current and new passwords required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matched = await bcrypt.compare(current, user.password);
    if (!matched) return res.status(400).json({ message: 'Current password incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('PASSWORD CHANGE ERROR:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
});

module.exports = router;