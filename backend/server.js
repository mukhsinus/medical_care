const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_care';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const authMiddleware = require('./middleware/auth');
const User = require('./models/User');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));


app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    return res.json({ user });
  } catch (err) {
    console.error('GET /api/me error:', err);
    return res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});


// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');


// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      // options left default for mongoose v6+
    });
    console.log('Connected to MongoDB');

    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/payment', paymentRoutes);

    // health
    app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
