require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const BotAdmin = require('../models/BotAdmin');

// Usage check
if (process.argv.length !== 4) {
  console.error('Usage: node CreateBotAdmin.js <username> <password>');
  process.exit(1);
}

const [,, username, password] = process.argv;

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const exists = await BotAdmin.findOne({ username });
    if (exists) {
      console.error('❌ Admin with this username already exists');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('Debug - Password:', password);
    console.log('Debug - Hashed:', hashedPassword);

    // Create admin
    const admin = new BotAdmin({
      username,
      password: hashedPassword
    });
    await admin.save();
    
    // Verify the password immediately after saving
    const savedAdmin = await BotAdmin.findOne({ username });
    const testMatch = await bcrypt.compare(password, savedAdmin.password);
    console.log('Debug - Immediate verification:', testMatch ? 'Password verified' : 'Password verification failed');

    console.log(`✅ Created bot admin "${username}" successfully`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();