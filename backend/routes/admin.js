/**
 * Admin Routes
 * All routes require authentication AND admin role
 * 
 * Endpoints:
 * GET  /api/admin/users - list all users
 * PUT  /api/admin/users/:id - update user
 * DELETE /api/admin/users/:id - delete user
 * 
 * GET  /api/admin/stock - list all stock
 * POST /api/admin/stock - create stock entry
 * PUT  /api/admin/stock/:productId - update stock
 * DELETE /api/admin/stock/:productId - delete stock entry
 */

const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Stock = require("../models/Stock");
const adminAuthMiddleware = require("../middleware/adminAuth");
const authMiddleware = require("../middleware/auth");

// Apply auth middleware first (checks authentication)
router.use(authMiddleware);

// Then apply admin middleware (checks admin role)
router.use(adminAuthMiddleware);

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/users
 * List all users with pagination and filtering
 */
router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password") // Don't return passwords
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details (name, phone, email, role, address)
 */
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, role, address } = req.body;

    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
    }

    // Check if phone/email already exist (if changed)
    if (phone) {
      const existing = await User.findOne({ phone, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: "Phone already in use" });
      }
    }

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ User updated by admin:", req.userId);
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("❌ Update user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user account (irreversible)
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (String(req.userId) === String(id)) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ User deleted by admin:", req.userId, "deleted user:", id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/stock
 * List all stock with pagination
 */
router.get("/stock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const stock = await Stock.find({})
      .populate("updatedBy", "name email")
      .sort({ productName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Stock.countDocuments();

    res.json({
      stock,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get stock error:", err);
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

/**
 * POST /api/admin/stock
 * Create new stock entry
 * Supports multiple entries for the same product with different color/size combinations
 */
router.post("/stock", async (req, res) => {
  try {
    const { productId, productName, quantity, minStockLevel, isAvailable, color, size } =
      req.body;

    if (!productId || productId === undefined) {
      return res
        .status(400)
        .json({ error: "productId is required" });
    }

    if (!productName) {
      return res
        .status(400)
        .json({ error: "productName is required" });
    }

    // Check if stock already exists for this product+color+size combination
    const existing = await Stock.findOne({ productId, color: color || null, size: size || null });
    if (existing) {
      return res.status(400).json({ 
        error: "Stock entry already exists for this product variant", 
        variant: { productId, color: color || null, size: size || null }
      });
    }

    const stock = new Stock({
      productId,
      productName,
      quantity: quantity || 0,
      minStockLevel: minStockLevel || 10,
      isAvailable: isAvailable !== false, // Default true
      color: color || null,
      size: size || null,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await stock.save();

    console.log("✅ Stock entry created by admin:", req.userId, "product:", productId, "variant:", { color, size });
    res.status(201).json({ message: "Stock entry created", stock });
  } catch (err) {
    console.error("❌ Create stock error:", err);
    res.status(500).json({ error: "Failed to create stock entry" });
  }
});

/**
 * PUT /api/admin/stock/:productId
 * Update stock quantity and details
 * Supports color and size query parameters for variants
 * Example: PUT /api/admin/stock/123?color=red&size=1ml
 */
router.put("/stock/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, size } = req.query;
    const { quantity, minStockLevel, isAvailable, notes } = req.body;

    const stock = await Stock.findOne({ 
      productId: parseInt(productId),
      color: color || null, 
      size: size || null 
    });
    
    if (!stock) {
      return res.status(404).json({ 
        error: "Stock entry not found", 
        searched: { productId, color: color || null, size: size || null }
      });
    }

    if (quantity !== undefined) stock.quantity = quantity;
    if (minStockLevel !== undefined) stock.minStockLevel = minStockLevel;
    if (isAvailable !== undefined) stock.isAvailable = isAvailable;
    if (notes !== undefined) stock.notes = notes;

    stock.updatedBy = req.userId;

    await stock.save();

    console.log("✅ Stock updated by admin:", req.userId, "product:", productId, "variant:", { color: color || null, size: size || null });
    res.json({ message: "Stock updated successfully", stock });
  } catch (err) {
    console.error("❌ Update stock error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

/**
 * DELETE /api/admin/stock/:productId
 * Delete stock entry
 * Supports color and size query parameters for variants
 * Example: DELETE /api/admin/stock/123?color=red&size=1ml
 */
router.delete("/stock/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { color, size } = req.query;

    const stock = await Stock.findOneAndDelete({ 
      productId: parseInt(productId),
      color: color || null, 
      size: size || null 
    });

    if (!stock) {
      return res.status(404).json({ 
        error: "Stock entry not found", 
        searched: { productId, color: color || null, size: size || null }
      });
    }

    console.log("✅ Stock deleted by admin:", req.userId, "product:", productId, "variant:", { color: color || null, size: size || null });
    res.json({ message: "Stock entry deleted successfully" });
  } catch (err) {
    console.error("❌ Delete stock error:", err);
    res.status(500).json({ error: "Failed to delete stock entry" });
  }
});

module.exports = router;
