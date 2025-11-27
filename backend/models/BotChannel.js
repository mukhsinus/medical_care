// models/BotChannel.js
const mongoose = require('mongoose');

const botChannelSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['group', 'supergroup', 'channel', 'private'], default: 'group' },
  title: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BotChannel', botChannelSchema);
