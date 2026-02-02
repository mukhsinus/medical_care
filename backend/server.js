const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medical_care";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const ALLOWED_ORIGINS = [
  "https://medicare.uz",
  "https://www.medicare.uz",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const paycomRoutes = require("./routes/paycomWebhook");
const mockRoutes = require("./routes/mock");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/paycom", paycomRoutes);
app.use("/mock", mockRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: NODE_ENV, time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

const server = app.listen(PORT, "0.0.0.0");

(async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
    });
  } catch {}
})();

process.on("SIGTERM", () => {
  server.close(() => {
    mongoose.connection.close(false, () => process.exit(0));
  });
});