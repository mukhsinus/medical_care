require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use('/api/auth', authRoutes);

// Пример защищённого роута — вернёт инфу о пользователе
app.get('/api/me', authMiddleware, async (req, res) => {
  // req.userId выставляет middleware
  const User = require('./models/User');
  const user = await User.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  res.json({ user });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Ошибка при подключении к БД', err);
    process.exit(1);
  }
}

start();
