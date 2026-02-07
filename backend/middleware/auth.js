// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  let token = null;

  // 1. Сначала пробуем из Authorization заголовка (это наш accessToken из фронта)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Если нет — пробуем из cookie (для старых сессий или refresh)
  if (!token && req.cookies?.[process.env.COOKIE_NAME || 'token']) {
    token = req.cookies[process.env.COOKIE_NAME || 'token'];
  }

  // 3. Если токена вообще нет
  if (!token) {
    return res.status(401).json({ message: 'Не авторизован: токен не найден' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;  // ← теперь точно будет
    req.tokenSource = token.length > 500 ? 'header' : 'cookie'; // для дебага (необязательно)
    
    // Fetch user object for role checks
    try {
      req.user = await User.findById(req.userId);
      if (!req.user) {
        console.error('[AUTH] User not found in DB:', req.userId);
        return res.status(401).json({ message: 'Пользователь не найден' });
      }
    } catch (userErr) {
      console.error('[AUTH] Failed to fetch user:', userErr.message);
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    next();
  } catch (err) {
    console.error('[AUTH] Invalid token:', err.message, 'Token:', token?.substring(0, 50) + '...');
    return res.status(401).json({ 
      message: 'Токен недействителен или просрочен',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};