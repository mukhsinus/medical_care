/**
 * Stock Routes
 * Check availability and get stock information
 */

const express = require("express");
const router = express.Router();

const Stock = require("../models/Stock");

/**
 * GET /api/stock/check/:productId
 * Check if a product variant is in stock
 * 
 * Query params:
 * - color: Color variant (optional)
 * - size: Size variant (optional)
 * 
 * Response: { available: boolean, quantity: number, message: string }
 */
router.get("/check/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { color = null, size = null } = req.query;

    const productIdNum = Number(productId);
    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Find stock entry
    const stock = await Stock.findOne({
      productId: productIdNum,
      color: color === "null" || color === "" ? null : color,
      size: size === "null" || size === "" ? null : size,
    });

    if (!stock) {
      return res.json({
        available: false,
        quantity: 0,
        message: "Product not found",
      });
    }

    const available = stock.quantity > 0 && stock.isAvailable;

    return res.json({
      available,
      quantity: stock.quantity,
      minStockLevel: stock.minStockLevel,
      message: available 
        ? `${stock.quantity} in stock`
        : "Out of stock",
    });
  } catch (err) {
    console.error("[STOCK CHECK]", err.message);
    res.status(500).json({ error: "Failed to check stock" });
  }
});

/**
 * GET /api/stock/availability
 * Batch check availability for multiple products
 * 
 * POST body:
 * [
 *   { productId: 1, color: null, size: "variants.sizes.1ml" },
 *   { productId: 2, color: "variants.colors.red", size: null },
 *   ...
 * ]
 * 
 * Response: Array of { productId, color, size, available, quantity }
 */
router.post("/availability", async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Request body must be an array" });
    }

    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const stock = await Stock.findOne({
            productId: Number(item.productId),
            color: item.color || null,
            size: item.size || null,
          });

          const available = stock ? stock.quantity > 0 && stock.isAvailable : false;
          const quantity = stock ? stock.quantity : 0;

          return {
            productId: item.productId,
            color: item.color,
            size: item.size,
            available,
            quantity,
          };
        } catch (err) {
          console.error("[STOCK BATCH CHECK]", err.message);
          return {
            productId: item.productId,
            color: item.color,
            size: item.size,
            available: false,
            quantity: 0,
            error: err.message,
          };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error("[STOCK AVAILABILITY]", err.message);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

module.exports = router;
