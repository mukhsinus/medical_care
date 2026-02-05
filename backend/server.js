const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET environment variable is not set");
  process.exit(1);
}

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined");
  process.exit(1);
}

const app = express();

/* -------------------------
   Core middlewares
------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* -------------------------
   JSON parsing error handler (must be right after middleware)
------------------------- */
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON parse error:', err.message);
    return res.status(200).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error: Invalid JSON',
        data: err.message
      },
      id: null
    });
  }
  next(err);
});

/* -------------------------
   Paycom webhook logging
------------------------- */
app.use('/api/paycom/webhook', (req, res, next) => {
  console.log('🔔 Paycom webhook request received');
  console.log('   Auth:', req.headers.authorization?.substring(0, 20) + '...');
  console.log('   Method:', req.body?.method);
  console.log('   Body keys:', Object.keys(req.body || {}));
  next();
});

/* -------------------------
   CORS (SAFARI FIX)
------------------------- */
const ALLOWED_ORIGINS = [
  "https://medicare.uz",
  "https://www.medicare.uz",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests without origin (like from some mobile apps)
      if (!origin) return cb(null, true);
      
      // Allow from whitelist
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      
      // Reject others with proper error
      return cb(new Error("CORS origin not allowed: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // Cache preflight 24 hours
  })
);

/* -------------------------
   Routes
------------------------- */
let authRoutes, userRoutes, paymentRoutes, paycomRoutes, mockRoutes;

try {
  authRoutes = require("./routes/auth");
  console.log("[ROUTES] ✅ auth loaded");
} catch (e) {
  console.error("[ROUTES] ❌ auth failed:", e.message);
  process.exit(1);
}

try {
  userRoutes = require("./routes/user");
  console.log("[ROUTES] ✅ user loaded");
} catch (e) {
  console.error("[ROUTES] ❌ user failed:", e.message);
  process.exit(1);
}

try {
  paymentRoutes = require("./routes/payment");
  console.log("[ROUTES] ✅ payment loaded");
} catch (e) {
  console.error("[ROUTES] ❌ payment failed:", e.message);
  process.exit(1);
}

try {
  paycomRoutes = require("./routes/paycomWebhook");
  console.log("[ROUTES] ✅ paycom loaded");
} catch (e) {
  console.error("[ROUTES] ❌ paycom failed:", e.message);
  process.exit(1);
}

try {
  mockRoutes = require("./routes/mock");
  console.log("[ROUTES] ✅ mock loaded");
} catch (e) {
  console.error("[ROUTES] ❌ mock failed:", e.message);
  process.exit(1);
}

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/paycom", paycomRoutes);
app.use("/mock", mockRoutes);

/* -------------------------
   Health check
------------------------- */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    env: NODE_ENV,
    time: new Date().toISOString(),
  });
});

/* -------------------------
   Error handler
------------------------- */
app.use((err, req, res, next) => {
  console.error("[ERROR] Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

/* -------------------------
   404 handler
------------------------- */
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.path}`);
  res.status(404).json({ error: "Not Found" });
});

/* -------------------------
   Start server
------------------------- */
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[START] Server running on 0.0.0.0:${PORT}`);
  console.log(`[ENV] ${NODE_ENV}`);
});

/* ======================== CATCH UNHANDLED ERRORS ======================== */
process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION]", reason);
  process.exit(1);
});

/* -------------------------
   MongoDB
------------------------- */
(async () => {
  try {
    console.log("[MONGO] Connecting...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("MONGO_URI:", MONGO_URI);
    console.error("NODE_ENV:", NODE_ENV);
    process.exit(1);
  }
})();

/* -------------------------
   Graceful shutdown
------------------------- */
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("[SHUTDOWN] Mongo closed");
      process.exit(0);
    });
  });
});