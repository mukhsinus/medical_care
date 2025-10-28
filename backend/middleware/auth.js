const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.cookies && req.cookies[process.env.COOKIE_NAME || 'token'];
  if (!token) return res.status(401).json({ message: 'Не авторизован' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Не авторизован' });
  }
};
