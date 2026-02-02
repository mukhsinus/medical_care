const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_care';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const authMiddleware = require('./middleware/auth');
const User = require('./models/User');

// Debug logging
console.log('[STARTUP] Backend starting...');
console.log('[STARTUP] Node version:', process.version);
console.log('[STARTUP] Environment variables loaded:', !!process.env.MONGO_URI);


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
console.log(`[CORS] Allowed Origin: ${FRONTEND_URL}`);
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://medicare.uz",
      "https://www.medicare.uz",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];

    // allow server-to-server / curl / health checks
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Content-Type', 'Set-Cookie']
}));
console.log('[CORS] Middleware loaded');


app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json({ user });
  } catch (err) {
    console.error("GET /api/me error:", err);
    res.status(500).json({ message: "Ошибка при получении профиля" });
  }
});

/**
 * ------------------------
 * Health check
 * ------------------------
 */
app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: new Date() })
);

/**
 * ------------------------
 * Global error handler
 * ------------------------
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/**
 * ------------------------
 * Start server
 * ------------------------
 */
async function start() {
  try {
    // Debug MONGO_URI
    console.log(`[DEBUG] MONGO_URI value (first 50 chars): ${MONGO_URI.substring(0, 50)}`);
    console.log(`[DEBUG] MONGO_URI length: ${MONGO_URI.length}`);
    
    console.log(`[INFO] Connecting to MongoDB: ${MONGO_URI.replace(/:[^:/@]*@/, ':***@')}`);
    console.log(`[INFO] Frontend URL: ${FRONTEND_URL}`);
    console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('[SUCCESS] Connected to MongoDB');

    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/paycom', paycomRoutes);
    app.use('/mock', mockRoutes);

    // health
    app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date(), environment: process.env.NODE_ENV || 'development' }));

    app.use((err, req, res, next) => {
      console.error('[ERROR] Unhandled error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SUCCESS] Server listening on 0.0.0.0:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[INFO] SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('[INFO] HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('[INFO] MongoDB connection closed');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('[ERROR] Failed to start server:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    process.exit(1);
  }
}

start();