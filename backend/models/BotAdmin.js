const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const botAdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
    },

    password: {
      type: String,
      required: true,
      minlength: 60, // bcrypt hash length
    },

    role: {
      type: String,
      enum: ['owner', 'admin', 'viewer'],
      default: 'admin',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
    versionKey: false,
  }
);

/* =========================
   HOOKS
========================= */

// Auto-hash password on create/update
botAdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* =========================
   METHODS
========================= */

botAdminSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

botAdminSchema.methods.markLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

/* =========================
   EXPORT
========================= */

module.exports = mongoose.model('BotAdmin', botAdminSchema);