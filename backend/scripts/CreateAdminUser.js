/**
 * Create Admin User Script
 * 
 * Usage: node backend/scripts/CreateAdminUser.js <name> <email> <phone> <password>
 * Example: node backend/scripts/CreateAdminUser.js "Admin User" admin@medicare.uz 998901234567 MySecurePassword123
 * 
 * This can only be run locally/manually (not exposed via API)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not defined in .env");
  process.exit(1);
}

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
    });
    console.log("✅ MongoDB connected");

    // Get credentials from command line args
    const name = process.argv[2];
    const email = process.argv[3];
    const phone = process.argv[4];
    const password = process.argv[5];

    // Validate inputs
    if (!name || !email || !phone || !password) {
      console.error(
        "❌ Missing arguments. Usage: node CreateAdminUser.js <name> <email> <phone> <password>"
      );
      console.error(
        "Example: node CreateAdminUser.js 'Admin' admin@medicare.uz 998901234567 MyPassword123"
      );
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.error("❌ Admin with this email already exists:", email);
      process.exit(1);
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      console.error("❌ Admin with this phone already exists:", phone);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin", // Set admin role
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Name:", admin.name);
    console.log("Email:", admin.email);
    console.log("Phone:", admin.phone);
    console.log("Role:", admin.role);
    console.log("ID:", admin._id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ Admin can now login with:");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
