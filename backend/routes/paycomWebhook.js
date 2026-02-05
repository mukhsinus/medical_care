/**
 * Payme Merchant API Webhook Handler
 * Handles incoming JSON-RPC requests from Payme
 * 
 * Reference: https://developer.help.paycom.uz/protokol-merchant-api/
 * Methods: https://developer.help.paycom.uz/metody-merchant-api/
 */

const express = require('express');
const router = express.Router();

const Order = require("../models/order");
const {
  verifyBasicAuth,
  handleCheckPerformTransaction,
  handleCreateTransaction,
  handlePerformTransaction,
  handleCancelTransaction,
  handleCheckTransaction,
  handleGetStatement,
  PAYCOM_ERRORS
} = require("../services/paycomMerchantAPI");

const { sendNotification } = require("../utils/telegramNotifier");

// Try to load CatalogData for receipt building
let allItems = [];
try {
  const catalogData = require("../../src/data/CatalogData");
  allItems = catalogData.allItems || [];
  console.log(`✅ CatalogData loaded: ${allItems.length} items for Paycom fiscalization`);
} catch (err) {
  console.log('[WARN] CatalogData not available - fiscalization will use fallback IKPU');
}

/**
 * Main Payme Webhook Handler
 * Validates auth, routes JSON-RPC methods, handles errors
 */
const paycomWebhookHandler = async (req, res) => {
  try {
    // Step 1: Validate Basic Auth (Paycom:MERCHANT_KEY)
    const authHeader = req.headers.authorization;
    if (!verifyBasicAuth(authHeader)) {
      console.log('🚫 Paycom webhook: Invalid authorization');
      return res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: PAYCOM_ERRORS.UNAUTHORIZED,
          message: 'Invalid authorization',
          data: 'Paycom credentials mismatch'
        },
        id: req.body.id || null
      });
    }

    // Step 2: Parse JSON-RPC request
    const { method, params, id } = req.body;

    console.log(`📨 Paycom webhook [${method}]:`, JSON.stringify(params));

    // Step 3: Route to appropriate handler
    let result;
    switch (method) {
      case 'CheckPerformTransaction':
        result = await handleCheckPerformTransaction(params, allItems);
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
      case 'GetStatement':
        result = await handleGetStatement(params);
        break;
      default:
        console.log(`❌ Unknown method: ${method}`);
        return res.status(200).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found',
            data: method
          },
          id: id
        });
    }

    // Step 4: Return successful response
    console.log(`✅ ${method} completed successfully`);
    return res.status(200).json({
      jsonrpc: '2.0',
      result: result,
      id: id
    });

  } catch (error) {
    console.error('❌ Paycom webhook error:', error);
    
    // Check if it's a structured Paycom error or generic error
    const errorCode = error.code || -32000;
    const errorMessage = error.message || 'Server error';

    return res.status(200).json({
      jsonrpc: '2.0',
      error: {
        code: errorCode,
        message: errorMessage,
        data: error.data || null
      },
      id: req.body.id || null
    });
  }
};

// Setup the POST endpoint for webhook
router.post('/webhook', paycomWebhookHandler);

module.exports = router;
