const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },                        
  email: { type: String, unique: true, sparse: true }, // необязательно
  phone: { type: String, required: true, unique: true }, // ОБЯЗАТЕЛЬНО
  password: { type: String, required: true },   // хеш пароля
  resetPasswordToken: String,                   // хеш токена восстановления
  resetPasswordExpires: Date,                   // срок действия токена
  address: {
    house: { type: String},
    street: { type: String },
    city: { type: String },
    zip: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
