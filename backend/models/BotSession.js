const mongoose = require('mongoose');

const botSessionSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'BotAdmin', required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 }, // 7 days
});

module.exports = mongoose.model('BotSession', botSessionSchema);