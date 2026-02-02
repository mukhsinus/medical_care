const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not configured");
  process.exit(1);
}

if (!FRONTEND_URL) {
  console.error("❌ FRONTEND_URL not configured");
  process.exit(1);
}

const authMiddleware = require("./middleware/auth");
const User = require("./models/User");

const app = express();

/**
 * ------------------------
 * CORS — MUST be FIRST
 * ------------------------
 */
app.use(
  cors({
    origin: [
      FRONTEND_URL,            // https://medicare.uz
      "https://www.medicare.uz"
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// IMPORTANT: allow preflight
app.options("*", cors());

/**
 * ------------------------
 * Middleware
 * ------------------------
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * ------------------------
 * Routes
 * ------------------------
 */
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const mockRoutes = require("./routes/mock");
const paycomRoutes = require("./routes/paycomWebhook");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/paycom", paycomRoutes);
app.use("/mock", mockRoutes);

/**
 * ------------------------
 * Protected profile
 * ------------------------
 */
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
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();