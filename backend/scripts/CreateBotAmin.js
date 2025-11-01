// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const BotAdmin = require('../models/BotAdmin');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admin = await BotAdmin.create({
      username: 'admin',
      password: 'medicare2025' // Will be hashed automatically
    });

    console.log('Admin created!');
    console.log('Login: admin');
    console.log('Password: medicare2025');
    process.exit(0);
  } catch (err) {
    if (err.code === 11000) {
      console.log('Admin already exists');
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();