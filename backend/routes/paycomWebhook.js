/**
 * Payme Merchant API Webhook Handler
 * Handles incoming JSON-RPC requests from Payme
 * 
 * Reference: https://developer.help.paycom.uz/protokol-merchant-api/
 * Methods: https://developer.help.paycom.uz/metody-merchant-api/
 */

const express = require('express');
const router = express.Router();

const Order = require("../models/Order");
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
  const catalogData = require("..data/paymeCatalog");
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
  // MUST always return JSON-RPC response, never HTML
  res.setHeader('Content-Type', 'application/json');

  try {
    // Step 1: Validate Basic Auth (Paycom:MERCHANT_KEY)
    const authHeader = req.headers.authorization;
    if (!verifyBasicAuth(authHeader)) {
      console.log('🚫 Paycom webhook: Invalid authorization');
      return res.status(200).json({
        jsonrpc: '2.0',
        error: {
          code: PAYCOM_ERRORS.UNAUTHORIZED,
          message: 'Invalid authorization',
          data: 'Paycom credentials mismatch'
        },
        id: req.body?.id || null
      });
    }

    // Step 2: Parse JSON-RPC request
    const body = req.body || {};
    const { method, params, id } = body;

    console.log(`📨 Paycom webhook [${method}]:`, params);

    if (!method) {
      console.warn('❌ Missing method in request');
      return res.status(200).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request: method is required',
          data: null
        },
        id: id || null
      });
    }

    if (!params || typeof params !== 'object') {
      console.warn(`❌ Invalid params for ${method}:`, params);
      return res.status(200).json({
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid params',
          data: null
        },
        id: id || null
      });
    }

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
    console.error('❌ Paycom webhook CRITICAL error:', error);
    
    // Handle both Error objects and custom error objects
    let errorCode = -32000;
    let errorMessage = 'Server error';
    let errorData = null;
    
    try {
      if (error && typeof error === 'object') {
        if (error.code !== undefined) {
          errorCode = error.code;
        }
        if (error.message) {
          errorMessage = String(error.message);
        }
        if (error.data !== undefined) {
          errorData = error.data;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }
    } catch (parseError) {
      console.error('Error parsing error object:', parseError);
      errorMessage = 'Unknown error';
    }

    console.error(`   Error details: code=${errorCode}, message=${errorMessage}`);

    // Ensure we always send valid JSON
    const responseData = {
      jsonrpc: '2.0',
      error: {
        code: Number(errorCode) || -32000,
        message: String(errorMessage) || 'Server error',
        data: errorData || null
      },
      id: (req.body && req.body.id) ? req.body.id : null
    };

    return res.status(200).json(responseData);
  }
};

// Setup the POST endpoint for webhook
router.post('/webhook', paycomWebhookHandler);

module.exports = router;
