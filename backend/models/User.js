const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },       // имя
  email: { type: String, required: true, unique: true }, // почта
  phone: { type: String },                      // телефон
  password: { type: String, required: true },   // хеш пароля
  resetPasswordToken: String,                   // хеш токена восстановления
  resetPasswordExpires: Date,                   // срок действия токена
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
