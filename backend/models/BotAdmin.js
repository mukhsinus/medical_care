const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const botAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Will store HASH
  createdAt: { type: Date, default: Date.now },
});

// Optional: Hash password before saving
botAdminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

module.exports = mongoose.model('BotAdmin', botAdminSchema);