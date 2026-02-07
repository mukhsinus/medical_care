/**
 * Stock Model
 * Tracks inventory quantities for each product variant (color + size combinations)
 * Supports items with multiple colors and sizes as separate inventory entries
 * Can be deleted without affecting order history
 */

const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    // Reference to a product ID from catalog
    productId: {
      type: Number,
      required: true,
    },
    
    // Product name (denormalized for convenience)
    productName: {
      type: String,
      required: true,
    },

    // Color variant (null if product has no color variants)
    color: {
      type: String,
      default: null,
    },

    // Size variant (null if product has no size variants)
    size: {
      type: String,
      default: null,
    },

    // Current quantity in stock
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Reorder level warning
    minStockLevel: {
      type: Number,
      default: 10,
    },

    // Is product available for sale
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Who created this stock entry
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Last updated by (admin user ID)
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Audit trail
    notes: String,
  },
  { timestamps: true }
);

// Create compound index for unique product+color+size combination
// This allows multiple entries for the same product with different color/size combinations
stockSchema.index({ productId: 1, color: 1, size: 1 }, { unique: true });

module.exports = mongoose.model("Stock", stockSchema);
