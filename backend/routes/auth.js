const express = require('express');
const router = express.Router();
console.log('>> auth routes loaded')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const { sendNotification } = require('../utils/telegramNotifier');

const COOKIE_NAME = process.env.COOKIE_NAME || 'token';

// helper: создать JWT
function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Регистрация (вынесена в функцию и подключена к /register и /signup)
 */
async function handleRegister(req, res) {
    console.log('handleRegister called with body:', req.body);
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email и password обязательны' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Пользователь с такой почтой уже есть' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, phone, password: hash });
    await user.save();

    const token = createToken(user._id);
    // Send Telegram notification
    const regMessage = `
    <b>New User Registration</b>

    👤 <b>Name:</b> ${name}
    📧 <b>Email:</b> ${email}
    📱 <b>Phone:</b> ${phone || 'Not provided'}
    🆔 <b>User ID:</b> ${user._id}
    ⏰ <b>Time:</b> ${new Date().toISOString()}
    `;
    sendNotification(regMessage);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ message: 'Ошибка регистрации' });
  }
}

// подключаем оба пути (register и signup)
router.post('/register', handleRegister);
router.post('/signup', handleRegister);

/**
 * LOGIN
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier может быть именем или почтой
    if (!identifier || !password) return res.status(400).json({ message: 'identifier и password обязательны' });

    const user = await User.findOne({ $or: [{ email: identifier }, { name: identifier }] });
    if (!user) return res.status(400).json({ message: 'Неверные данные' });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(400).json({ message: 'Неверные данные' });

    const token = createToken(user._id);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Ошибка логина' });
  }
});

/**
 * LOGOUT
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Вышли' });
});

/**
 * FORGOT PASSWORD
 * Примечание: если Mailtrap/SMTP глючит, можно временно
 * - закомментировать sendEmail(...) и вернуть resetUrl в JSON (DEV),
 * - либо заменить utils/sendEmail.js на логгер (консоль).
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Нужна почта' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Пользователь с такой почтой не найден' });

    // создаём токен (отправим в письме НЕ-хеш, а в БД сохраним хеш)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 час
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    const message = `Привет, ${user.name}!\n\nЧтобы сбросить пароль, перейди по ссылке:\n\n${resetUrl}\n\nЕсли ты не просил сброс — просто проигнорируй.`;

    // Если Mailtrap/SMTP работает, используем sendEmail.
    // Если нет — можно временно закомментировать следующую строку и вернуть resetUrl в ответе (DEV).
    await sendEmail({
      to: user.email,
      subject: 'Сброс пароля',
      text: message,
    });

    return res.json({ message: 'Письмо для сброса отправлено. Проверь почту.' });

    // ======= DEV вариант (быстрое тестирование, без почты) =======
    // return res.json({ message: 'DEV: reset link', resetUrl });
    // ============================================================
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Ошибка при запросе сброса пароля' });
  }
});

/**
 * RESET PASSWORD
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, id, password } = req.body;
    if (!token || !id || !password) return res.status(400).json({ message: 'Токен, id и password обязательны' });

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      _id: id,
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Токен неверный или устарел' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // после сброса — можно сразу залогинить пользователя
    const newToken = createToken(user._id);
    res.cookie(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Пароль обновлён' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Ошибка при сбросе пароля' });
  }
});

module.exports = router;
