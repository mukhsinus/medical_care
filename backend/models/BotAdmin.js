const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const botAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Will store HASH
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BotAdmin', botAdminSchema);