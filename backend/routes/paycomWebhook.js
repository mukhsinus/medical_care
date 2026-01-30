/**
 * Payme Merchant API Webhook Handler
 * Handles incoming requests from Payme for transaction callbacks
 * 
 * Reference: https://developer.help.paycom.uz/protokol-merchant-api/
 */

const express = require('express');
const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
const {
  checkPerformTransaction,
  performTransaction,
  cancelTransaction,
  buildReceiptDetail
} = require("../services/paycomMerchantAPI");
const { allItems } = require("../../src/data/CatalogData");
const { sendNotification } = require("../utils/telegramNotifier");

/**
 * Payme Webhook Handler Middleware
 * Validates Paycom Basic Auth and routes to appropriate method
 */
const paycomWebhookHandler = async (req, res) => {
  try {
    // Validate Basic Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: {
          code: -32504,
          message: 'Invalid authorization',
          data: 'Authorization header missing or invalid'
        }
      });
    }

    const merchantId = process.env.PAYCOM_MERCHANT_ID;
    const merchantKey = process.env.PAYCOM_MERCHANT_KEY;
    const expectedAuth = Buffer.from(`${merchantId}:${merchantKey}`).toString('base64');
    const providedAuth = authHeader.substring(6);

    if (providedAuth !== expectedAuth) {
      return res.status(401).json({
        error: {
          code: -32504,
          message: 'Invalid authorization',
          data: 'Merchant ID or Key mismatch'
        }
      });
    }

    // Parse request
    const { method, params, id } = req.body;

    console.log(`📨 Paycom webhook [${method}]:`, params);

    let result;
    switch (method) {
      case 'CheckPerformTransaction':
        result = await handleCheckPerformTransaction(params);
        break;
      case 'CreateTransaction':
        result = await handleCreateTransaction(params);
        break;
      case 'PerformTransaction':
        result = await handlePerformTransaction(params);
        break;
      case 'CancelTransaction':
        result = await handleCancelTransaction(params);
        break;
      case 'CheckTransaction':
        result = await handleCheckTransaction(params);
        break;
      default:
        return res.status(400).json({
          error: {
            code: -32601,
            message: 'Unknown method',
            data: method
          }
        });
    }

    // Return successful response
    return res.status(200).json({
      jsonrpc: '2.0',
      result: result,
      id: id
    });

  } catch (error) {
    console.error('❌ Paycom webhook error:', error);
    return res.status(500).json({
      error: {
        code: -32000,
        message: 'Server error',
        data: error.message
      }
    });
  }
};

/**
 * Handle CheckPerformTransaction
 * Called BEFORE payment to validate receipt and items
 */
async function handleCheckPerformTransaction(params) {
  const { account, amount, detail } = params;
  const orderId = account?.order_id;

  console.log(`✅ CheckPerformTransaction: Order ${orderId}, Amount ${amount}`);

  // Find order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Validate amount
  if (order.amount * 100 !== amount) {
    throw new Error(`Amount mismatch: expected ${order.amount * 100}, got ${amount}`);
  }

  // Build receipt detail from order items
  const receiptDetail = buildReceiptDetail(order.items, allItems);

  return {
    allow: true,
    detail: receiptDetail
  };
}

/**
 * Handle CreateTransaction
 * Create new transaction record
 */
async function handleCreateTransaction(params) {
  const { account, amount, time } = params;
  const orderId = account?.order_id;

  console.log(`🆕 CreateTransaction: Order ${orderId}`);

  // Find and update order
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      paymentStatus: 'processing',
      paycomTransactionId: orderId,
      paycomCreatedAt: new Date(time)
    },
    { new: true }
  );

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Send notification
  await sendNotification(
    `💳 Payment Started\nOrder: ${orderId}\nAmount: ${amount / 100} UZS`
  );

  return {
    transaction_id: orderId,
    state: 1,
    create_time: time,
    perform_time: 0,
    cancel_time: 0,
    transaction: orderId
  };
}

/**
 * Handle PerformTransaction
 * Confirm transaction and update order
 */
async function handlePerformTransaction(params) {
  const { transaction_id, detail } = params;

  console.log(`✔️ PerformTransaction: Transaction ${transaction_id}`);

  // Find and update order
  const order = await Order.findByIdAndUpdate(
    transaction_id,
    {
      paymentStatus: 'completed',
      paycomPerformedAt: new Date(),
      fiskData: detail // Store fiscal data
    },
    { new: true }
  );

  if (!order) {
    throw new Error(`Order not found: ${transaction_id}`);
  }

  // Send notification
  await sendNotification(
    `✅ Payment Completed\nOrder: ${transaction_id}\nStatus: Completed`
  );

  return {
    transaction_id: transaction_id,
    state: 2,
    perform_time: Date.now(),
    transaction: transaction_id
  };
}

/**
 * Handle CancelTransaction
 * Cancel/refund transaction
 */
async function handleCancelTransaction(params) {
  const { transaction_id, reason } = params;

  console.log(`❌ CancelTransaction: Transaction ${transaction_id}, Reason: ${reason}`);

  // Find and update order
  const order = await Order.findByIdAndUpdate(
    transaction_id,
    {
      paymentStatus: 'cancelled',
      paycomCancelledAt: new Date(),
      cancellationReason: reason
    },
    { new: true }
  );

  if (!order) {
    throw new Error(`Order not found: ${transaction_id}`);
  }

  // Send notification
  await sendNotification(
    `🚫 Payment Cancelled\nOrder: ${transaction_id}\nReason: ${reason}`
  );

  return {
    transaction_id: transaction_id,
    state: -1,
    cancel_time: Date.now(),
    transaction: transaction_id
  };
}

/**
 * Handle CheckTransaction
 * Get transaction status
 */
async function handleCheckTransaction(params) {
  const { transaction_id } = params;

  console.log(`🔍 CheckTransaction: Transaction ${transaction_id}`);

  // Find order
  const order = await Order.findById(transaction_id);
  if (!order) {
    throw new Error(`Order not found: ${transaction_id}`);
  }

  // Map payment status to Paycom state
  const stateMap = {
    'pending': 1,      // Created
    'processing': 1,   // Created
    'completed': 2,    // Performed
    'cancelled': -1,   // Cancelled
    'failed': -1       // Cancelled
  };

  const state = stateMap[order.paymentStatus] || 1;

  return {
    transaction_id: transaction_id,
    state: state,
    create_time: order.createdAt.getTime(),
    perform_time: order.paycomPerformedAt ? order.paycomPerformedAt.getTime() : 0,
    cancel_time: order.paycomCancelledAt ? order.paycomCancelledAt.getTime() : 0,
    transaction: transaction_id,
    reason: order.cancellationReason || null
  };
}

/**
 * Error response helper
 */
function errorResponse(code, message, data) {
  return {
    error: {
      code: code,
      message: message,
      data: data || null
    }
  };
}

// Setup the POST endpoint for webhook
router.post('/webhook', paycomWebhookHandler);

module.exports = router;
