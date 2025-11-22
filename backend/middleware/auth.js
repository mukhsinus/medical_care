// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
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
    next();
  } catch (err) {
    console.error('Invalid token:', err.message);
    return res.status(401).json({ 
      message: 'Токен недействителен или просрочен',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};