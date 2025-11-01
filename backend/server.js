require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8090;

// === Middleware ===
app.use(express.json());
app.use(cookieParser());

// --- Настройка CORS ---
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // разрешаем запросы без Origin (например, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('CORS policy: Origin not allowed by backend.'));
    },
    credentials: true,
  })
);



// DEBUG logger — покажет все входящие запросы и тело
app.use((req, res, next) => {
  console.log('>>> REQ:', req.method, req.originalUrl, 'Content-Type:', req.headers['content-type']);
  // body может быть пустым если парсер ещё не сработал или если request не содержит тело
  console.log('>>> REQ BODY (before):', req.body);
  next();
});



// --- Роуты ---
app.use('/api/auth', authRoutes);
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// --- Пример защищённого роута ---
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error('Ошибка /api/me:', err);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
});

// --- Запуск сервера ---
async function start() {
  try {
    console.log('⏳ Подключаемся к MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // быстро падает если не может подключиться
    });
    console.log('✅ MongoDB Atlas connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🟢 Frontend allowed origin: ${process.env.FRONTEND_URL}`);
    });
  } catch (err) {
    console.error('❌ Ошибка при подключении к MongoDB:', err.message);
    process.exit(1);
  }
}

start();