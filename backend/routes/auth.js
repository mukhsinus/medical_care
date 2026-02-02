// backend/routes/auth.js
const express = require('express');
const router = express.Router();
console.log('>> auth routes loaded')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { sendNotification } = require('../utils/telegramNotifier');
const { v4: uuidv4 } = require('uuid');

const ACCESS_TTL = '15m'; // access token TTL
const REFRESH_DAYS = 30; // refresh token lifetime in days
const REFRESH_COOKIE_NAME = 'refreshToken';
const COOKIE_NAME = process.env.COOKIE_NAME || 'token'; // legacy cookie, kept for compatibility

// helper: создать access JWT
function createAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

// helper: создать и сохранить refresh token, выставить cookie
async function createAndSendRefreshToken(res, user, req) {
  const refreshValue = uuidv4() + '.' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    token: refreshValue,
    userId: user._id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    expiresAt
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000
  });
}

// helper: revoke refresh token (remove from DB + clear cookie)
async function revokeRefreshToken(res, tokenValue) {
  if (tokenValue) {
    try {
      await RefreshToken.deleteOne({ token: tokenValue });
    } catch (e) {
      console.error('Failed to delete refresh token:', e && e.message);
    }
  }
  res.clearCookie(REFRESH_COOKIE_NAME);
}

// ===== Register (signup) =====
async function handleRegister(req, res) {
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

    // create access token and refresh token
    const accessToken = createAccessToken(user._id);
    await createAndSendRefreshToken(res, user, req);

    // non-blocking telegram
    try {
      const regMessage = `
<b>New User Registration</b>

👤 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}
📱 <b>Phone:</b> ${phone || 'Not provided'}
🆔 <b>User ID:</b> ${user._id}
⏰ <b>Time:</b> ${new Date().toISOString()}
`;
      sendNotification(regMessage);
    } catch (e) {
      console.error('Telegram notification failed (non-blocking):', e && e.message);
    }

    // keep legacy token cookie too (optional)
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000, // short-living cookie for access
    });

    return res.status(201).json({
      token: accessToken,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '' }
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ message: 'Ошибка регистрации' });
  }
}

router.post('/register', handleRegister);
router.post('/signup', handleRegister);

// ===== Login =====
router.post('/login', async (req, res) => {
  try {
    const { identifier, nameOrEmail, email, password } = req.body || {};
    const loginId = (identifier || nameOrEmail || email || "").trim();
    if (!loginId || !password) {
      return res.status(400).json({ message: 'identifier и password обязательны' });
    }

    const user = await User.findOne({ $or: [{ email: loginId }, { name: loginId }] });
    if (!user) return res.status(400).json({ message: 'Неверные данные' });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(400).json({ message: 'Неверные данные' });

    // Create tokens
    const accessToken = createAccessToken(user._id);
    await createAndSendRefreshToken(res, user, req);

    // set short access cookie (optional / compatibility)
    res.cookie(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000
    });

    return res.json({
      token: accessToken,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '' }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Ошибка логина' });
  }
});

// ===== Refresh endpoint =====
router.post('/refresh', async (req, res) => {
  try {
    const refreshFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshFromCookie) return res.status(401).json({ message: 'No refresh token' });

    const stored = await RefreshToken.findOne({ token: refreshFromCookie });
    if (!stored) {
      // cookie present but not in DB => clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME);
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    if (stored.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ token: refreshFromCookie });
      res.clearCookie(REFRESH_COOKIE_NAME);
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      await RefreshToken.deleteOne({ token: refreshFromCookie });
      res.clearCookie(REFRESH_COOKIE_NAME);
      return res.status(401).json({ message: 'User not found' });
    }

    // rotation: delete old refresh token and issue a new one
    await RefreshToken.deleteOne({ token: refreshFromCookie });
    await createAndSendRefreshToken(res, user, req);

    const newAccess = createAccessToken(user._id);
    // set short access cookie (optional)
    res.cookie(COOKIE_NAME, newAccess, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000
    });

    return res.json({
      token: newAccess,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '' }
    });
  } catch (err) {
    console.error('REFRESH ERROR:', err);
    res.status(500).json({ message: 'Refresh failed' });
  }
});

// ===== Logout =====
router.post('/logout', async (req, res) => {
  try {
    const refreshFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshFromCookie) {
      await RefreshToken.deleteOne({ token: refreshFromCookie });
    }
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.clearCookie(COOKIE_NAME);
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('LOGOUT ERROR:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
});

/**
 * FORGOT PASSWORD (unchanged behavior)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Нужна почта' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Пользователь с такой почтой не найден' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 час
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    const message = `Привет, ${user.name}!\n\nЧтобы сбросить пароль, перейди по ссылке:\n\n${resetUrl}\n\nЕсли ты не просил сброс — просто проигнорируй.`;

    await sendEmail({
      to: user.email,
      subject: 'Сброс пароля',
      text: message,
    });

    return res.json({ message: 'Письмо для сброса отправлено. Проверь почту.' });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Ошибка при запросе сброса пароля' });
  }
});

/**
 * RESET PASSWORD (unchanged)
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

    const newAccess = createAccessToken(user._id);
    await createAndSendRefreshToken(res, user, req);

    res.cookie(COOKIE_NAME, newAccess, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      token: newAccess,
      message: 'Пароль обновлён'
    });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Ошибка при сбросе пароля' });
  }
});

module.exports = router;