// backend/routes/auth.js
const express = require("express");
const router = express.Router();

console.log(">> auth routes loaded");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const sendEmail = require("../utils/sendEmail");
const { sendNotification } = require("../utils/telegramNotifier");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const ACCESS_TTL = "15m";
const REFRESH_DAYS = 30;
const REFRESH_COOKIE_NAME = "refreshToken";

/* ===================== HELPERS ===================== */

function createAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

async function createAndSendRefreshToken(res, user, req) {
  const value = uuidv4() + "." + crypto.randomBytes(32).toString("hex");

  await RefreshToken.create({
    token: value,
    userId: user._id,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
  });

  res.cookie(REFRESH_COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
}

/* ===================== SIGNUP ===================== */

async function handleRegister(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hash });

    const accessToken = createAccessToken(user._id);
    await createAndSendRefreshToken(res, user, req);

    try {
      sendNotification(
        `<b>New user</b>\n👤 ${name}\n📧 ${email}\n🆔 ${user._id}`
      );
    } catch (_) {}

    return res.status(201).json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
}

router.post("/signup", handleRegister);
router.post("/register", handleRegister);

/* ===================== LOGIN ===================== */

router.post("/login", async (req, res) => {
  try {
    const { identifier, nameOrEmail, email, password } = req.body || {};
    const loginId = (identifier || nameOrEmail || email || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: "identifier and password required" });
    }

    const user = await User.findOne({
      $or: [{ email: loginId }, { name: loginId }],
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken(user._id);
    await createAndSendRefreshToken(res, user, req);

    return res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ===================== REFRESH ===================== */

router.post("/refresh", async (req, res) => {
  try {
    const value = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!value) return res.status(401).json({ message: "No refresh token" });

    const stored = await RefreshToken.findOne({ token: value });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await RefreshToken.deleteOne({ token: value });
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Refresh invalid" });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      await RefreshToken.deleteOne({ token: value });
      clearRefreshCookie(res);
      return res.status(401).json({ message: "User not found" });
    }

    await RefreshToken.deleteOne({ token: value });
    await createAndSendRefreshToken(res, user, req);

    const accessToken = createAccessToken(user._id);

    return res.json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    res.status(500).json({ message: "Refresh failed" });
  }
});

/* ===================== LOGOUT ===================== */

router.post("/logout", async (req, res) => {
  try {
    const value = req.cookies?.[REFRESH_COOKIE_NAME];
    if (value) await RefreshToken.deleteOne({ token: value });

    clearRefreshCookie(res);
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ message: "Logout failed" });
  }
});

/* ===================== FORGOT PASSWORD ===================== */

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 3600 * 1000;
    await user.save();

    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}&id=${user._id}`;
    await sendEmail({
      to: user.email,
      subject: "Password reset",
      text: `Reset link:\n${url}`,
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed" });
  }
});

/* ===================== RESET PASSWORD ===================== */

router.post("/reset-password", async (req, res) => {
  try {
    const { token, id, password } = req.body;
    if (!token || !id || !password) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      _id: id,
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token invalid" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const accessToken = createAccessToken(user._id);
    await createAndSendRefreshToken(res, user, req);

    res.json({ token: accessToken, message: "Password updated" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Reset failed" });
  }
});

module.exports = router;