// backend/routes/user.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order'); // модель заказов
const { sendNotification } = require('../utils/telegramNotifier');

// Все роуты защищены
router.use(auth);

/**
 * GET /api/user/me
 * Вернуть профиль текущего пользователя
 */
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});

/**
 * GET /api/user/orders
 * Вернуть список заказов текущего пользователя (новейшие первыми)
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error('GET /orders error:', err);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
});

/**
 * PATCH /api/user/profile
 * Обновление профиля (name, phone)
 */
router.patch('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    if (typeof phone !== 'undefined') user.phone = phone;
    await user.save();

    // Telegram notification (неблокирующий)
    try {
      const profileMessage = `
<b>Profile Updated</b>

👤 <b>User:</b> ${user.name} (${user.email})
📱 <b>New Phone:</b> ${user.phone || 'Not provided'}
🆔 <b>User ID:</b> ${req.userId}
⏰ <b>Time:</b> ${new Date().toISOString()}
`;
      sendNotification(profileMessage);
    } catch (e) {
      console.error('Telegram notification failed (non-blocking):', e && e.message);
    }

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    };

    res.json({ user: safeUser });
  } catch (err) {
    console.error('PROFILE UPDATE ERROR:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

/**
 * PATCH /api/user/password
 * Смена пароля: требуется currentPassword и newPassword
 */
router.patch('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matched = await bcrypt.compare(currentPassword, user.password);
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