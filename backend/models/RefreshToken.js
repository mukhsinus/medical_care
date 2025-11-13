const mongoose = require('mongoose');

const refreshSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ip: String, // опционально — для логов / привязки к устройству
  userAgent: String, // опционально
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RefreshToken', refreshSchema);