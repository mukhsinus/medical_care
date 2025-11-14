// backend/routes/user.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Order = require("../models/Order");
const { sendNotification } = require("../utils/telegramNotifier");

// Все роуты защищены
router.use(auth);

/**
 * GET /api/user/me
 * Вернуть профиль текущего пользователя (включая address)
 */
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });
    res.json({ user });
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Ошибка при получении профиля" });
  }
});

/**
 * GET /api/user/orders
 * Вернуть список заказов (без изменений)
 */
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json({ orders });
  } catch (err) {
    console.error("GET /orders error:", err);
    res.status(500).json({ message: "Ошибка при получении заказов" });
  }
});

/**
 * PATCH /api/user/profile
 * Обновление профиля: name, phone, address (street, city, zip)
 */
router.patch("/profile", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Валидация
    if (!name) return res.status(400).json({ message: "Name is required" });

    if (address && typeof address !== "object") {
      return res.status(400).json({ message: "Address must be an object" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Обновляем только переданные поля
    user.name = name;
    if (typeof phone !== "undefined") user.phone = phone || null;

    if (address) {
      user.address = user.address || {};
      if (typeof address.street !== "undefined")
        user.address.street = address.street || null;
      if (typeof address.city !== "undefined")
        user.address.city = address.city || null;
      if (typeof address.zip !== "undefined")
        user.address.zip = address.zip || null;
    }

    await user.save();

    // Telegram notification
    try {
      const addr = user.address
        ? `${user.address.street || ""}, ${user.address.city || ""} ${
            user.address.zip || ""
          }`.trim()
        : "Not provided";
      const profileMessage = `
<b>Profile Updated</b>

User: ${user.name} (${user.email})
Phone: ${user.phone || "Not provided"}
Address: ${addr}
User ID: ${req.userId}
Time: ${new Date().toISOString()}
`;
      sendNotification(profileMessage);
    } catch (e) {
      console.error("Telegram notification failed (non-blocking):", e?.message);
    }

    // Безопасный ответ (без пароля)
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: {
        house: user.address?.house || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        zip: user.address?.zip || "",
      },
    };

    res.json({ user: safeUser });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

/**
 * PATCH /api/user/password
 * Смена пароля (без изменений)
 */
router.patch("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const matched = await bcrypt.compare(currentPassword, user.password);
    if (!matched)
      return res.status(400).json({ message: "Current password incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("PASSWORD CHANGE ERROR:", err);
    res.status(500).json({ message: "Error changing password" });
  }
});

module.exports = router;
