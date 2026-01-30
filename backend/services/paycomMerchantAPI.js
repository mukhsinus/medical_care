/**
 * Paycom Merchant API Service
 * Handles receipt fiscalization and transaction processing
 * 
 * Reference: https://developer.help.paycom.uz/protokol-merchant-api/
 */

const axios = require('axios');
const crypto = require('crypto');

const PAYCOM_API_BASE = process.env.PAYCOM_API_URL || 'https://api.paycom.uz';
const MERCHANT_ID = process.env.PAYCOM_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYCOM_MERCHANT_KEY;

// Receipt types
const RECEIPT_TYPES = {
  SELL: 0,        // Продажа
  RETURN: 1,      // Возврат
  CORRECTION: 2   // Корректировка
};

/**
 * Build receipt detail object for fiscalization
 * @param {Array} items - Cart items with pricing and details
 * @param {Array} catalogItems - Catalog data with IKPU and package codes
 * @returns {Object} detail object for Payme API
 */
function buildReceiptDetail(items, catalogItems) {
  const receiptItems = [];
  
  for (const cartItem of items) {
    const catalogItem = catalogItems.find(c => c.id === cartItem.id);
    if (!catalogItem) {
      console.warn(`Catalog item not found: ${cartItem.id}`);
      continue;
    }

    // Get IKPU code (size-level > general)
    let ikpuCode = catalogItem.ikpuCode;
    if (cartItem.size && catalogItem.sizeIkpuCodes) {
      const sizeKey = cartItem.size;
      ikpuCode = catalogItem.sizeIkpuCodes[sizeKey] || ikpuCode;
    }

    // Get package code (size-level > general)
    let packageCode = catalogItem.package_code;
    if (cartItem.size && catalogItem.sizePackageCodes) {
      const sizeKey = cartItem.size;
      packageCode = catalogItem.sizePackageCodes[sizeKey] || packageCode;
    }

    // Get VAT percent (defaults to 12 or from catalog)
    const vatPercent = catalogItem.vat_percent || 12;

    // Add to receipt items
    receiptItems.push({
      title: `${cartItem.name}${cartItem.size ? ' (' + cartItem.size + ')' : ''}${cartItem.color ? ', ' + cartItem.color : ''}`,
      price: Math.round(cartItem.price * 100), // Convert to tiyin
      count: cartItem.quantity,
      code: ikpuCode,                          // ИКПУ code
      vat_percent: vatPercent,                 // НДС процент
      package_code: packageCode || ''          // Package code
    });
  }

  return {
    receipt_type: RECEIPT_TYPES.SELL,
    items: receiptItems
  };
}

/**
 * Make authenticated request to Paycom API
 * @param {string} method - API method name
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} API response
 */
async function makeAuthenticatedRequest(method, params) {
  const basicAuth = Buffer.from(`${MERCHANT_ID}:${MERCHANT_KEY}`).toString('base64');
  
  try {
    const response = await axios.post(
      `${PAYCOM_API_BASE}/api/`,
      {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
      },
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Paycom API error [${method}]:`, error.message);
    throw error;
  }
}

/**
 * CheckPerformTransaction - Check if transaction can be performed
 * Called BEFORE payment is processed
 * 
 * @param {string} transactionId - Payme transaction ID
 * @param {number} amount - Transaction amount in tiyin
 * @param {Object} detail - Receipt detail with items, IKPU, VAT, package codes
 * @returns {Promise<Object>} Response with allow flag and detail
 */
async function checkPerformTransaction(transactionId, amount, detail) {
  const params = {
    account: {
      order_id: transactionId
    },
    amount: amount,
    detail: detail
  };

  return await makeAuthenticatedRequest('CheckPerformTransaction', params);
}

/**
 * CreateTransaction - Create new transaction
 * 
 * @param {string} orderId - Order ID
 * @param {number} amount - Amount in tiyin
 * @returns {Promise<Object>} Response with transaction ID
 */
async function createTransaction(orderId, amount) {
  const params = {
    account: {
      order_id: orderId
    },
    amount: amount,
    time: Date.now(),
    detail: {}
  };

  return await makeAuthenticatedRequest('CreateTransaction', params);
}

/**
 * PerformTransaction - Confirm transaction processing
 * Called AFTER user pays
 * 
 * @param {string} transactionId - Payme transaction ID
 * @param {Object} detail - Receipt detail object
 * @returns {Promise<Object>} Response with transaction details
 */
async function performTransaction(transactionId, detail) {
  const params = {
    transaction_id: transactionId,
    detail: detail
  };

  return await makeAuthenticatedRequest('PerformTransaction', params);
}

/**
 * CancelTransaction - Cancel/Rollback transaction
 * 
 * @param {string} transactionId - Payme transaction ID
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<Object>} Response with cancellation details
 */
async function cancelTransaction(transactionId, reason) {
  const params = {
    transaction_id: transactionId,
    reason: reason || null
  };

  return await makeAuthenticatedRequest('CancelTransaction', params);
}

/**
 * CheckTransaction - Get transaction status
 * 
 * @param {string} transactionId - Payme transaction ID
 * @returns {Promise<Object>} Response with transaction status
 */
async function checkTransaction(transactionId) {
  const params = {
    transaction_id: transactionId
  };

  return await makeAuthenticatedRequest('CheckTransaction', params);
}

/**
 * GetStatement - Get transaction statement
 * Get list of transactions for date range
 * 
 * @param {number} from - Start date (Unix timestamp in ms)
 * @param {number} to - End date (Unix timestamp in ms)
 * @returns {Promise<Object>} Response with transactions list
 */
async function getStatement(from, to) {
  const params = {
    from: Math.floor(from / 1000),  // Convert to seconds
    to: Math.floor(to / 1000)
  };

  return await makeAuthenticatedRequest('GetStatement', params);
}

module.exports = {
  RECEIPT_TYPES,
  buildReceiptDetail,
  checkPerformTransaction,
  createTransaction,
  performTransaction,
  cancelTransaction,
  checkTransaction,
  getStatement
};
