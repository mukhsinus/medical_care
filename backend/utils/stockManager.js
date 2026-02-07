/**
 * Stock Manager - Handle inventory updates on successful payments
 */

const Stock = require('../models/Stock');

/**
 * Deduct stock quantities when an order is completed
 * @param {Object} order - The completed order object
 * @returns {Promise<void>}
 */
async function deductOrderStock(order) {
  try {
    if (!order.items || order.items.length === 0) {
      console.log("[STOCK] No items in order, skipping stock deduction");
      return;
    }

    console.log("[STOCK] Deducting stock for order:", order._id);

    for (const item of order.items) {
      // Extract numeric product ID (handle formats like "102-nosize-nocolor")
      const productId = Number(String(item.productId).split('-')[0]);
      const quantity = item.quantity || 1;
      const color = item.color || null;
      const size = item.size || null;

      // Find matching stock entry
      const stockEntry = await Stock.findOne({
        productId,
        color: color,
        size: size,
      });

      if (!stockEntry) {
        console.warn(
          `[STOCK] ⚠️  No stock entry found for: productId=${productId}, color=${color}, size=${size}`
        );
        continue;
      }

      // Deduct quantity
      const oldQuantity = stockEntry.quantity;
      stockEntry.quantity = Math.max(0, stockEntry.quantity - quantity);

      // Add note about the deduction
      const note = `Deducted for order ${order._id}: -${quantity}`;
      stockEntry.notes = stockEntry.notes
        ? `${stockEntry.notes}; ${note}`
        : note;

      await stockEntry.save();

      console.log(
        `[STOCK] ✅ Deducted: productId=${productId}, color=${color}, size=${size}, quantity: ${oldQuantity} → ${stockEntry.quantity}`
      );
    }

    console.log("[STOCK] ✅ All stock deductions completed for order:", order._id);
  } catch (err) {
    console.error("[STOCK] ❌ Error deducting stock:", err.message);
    // Don't throw - payment is already complete, just log the error
  }
}

module.exports = { deductOrderStock };
