const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  try {
    // Проверяем токен сначала в cookie, потом в Authorization
    let token = req.cookies?.[process.env.COOKIE_NAME || 'token'];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts[0] === 'Bearer' && parts[1]) token = parts[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Не авторизован: токен не найден' });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Не авторизован: токен неверный или просрочен' });
  }
};