/**
 * Click Merchant API Service
 * Handles Click payment gateway integration
 * Documentation: https://docs.click.uz/merchant/
 */

const crypto = require("crypto");
const mongoose = require("mongoose");

// Click SHOP API error codes
const CLICK_ERRORS = {
  SIGN_CHECK_FAILED: -1,
  INVALID_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ORDER_ALREADY_COMPLETED: -4,
  ORDER_NOT_FOUND: -5,
  SYSTEM_ERROR: -9,
};

// Click action codes
const CLICK_ACTIONS = {
  PREPARE: 0,      // Validate and prepare the order
  COMPLETE: 1,     // Finalize and confirm payment
};

/**
 * Generate Click signature for verification
 * MD5 hash of concatenated values in specific order
 * 
 * @param {number} clickTransId - Click transaction ID
 * @param {number} serviceId - Click service ID
 * @param {string} secretKey - Merchant secret key
 * @param {string} merchantTransId - Our order ID
 * @param {number} amount - Payment amount in UZS
 * @param {number} action - Action code (0=prepare, 1=complete)
 * @param {number} signTime - Request sign time
 * @param {string} merchantPrepareId - Our prepare ID (for complete action only)
 * @returns {string} Expected MD5 signature
 */
function generateClickSignature(
  clickTransId,
  serviceId,
  secretKey,
  merchantTransId,
  amount,
  action,
  signTime,
  merchantPrepareId = null
) {
  let signatureString;

  if (action === CLICK_ACTIONS.PREPARE) {
    // Prepare signature: click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time
    signatureString = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${amount}${action}${signTime}`;
  } else if (action === CLICK_ACTIONS.COMPLETE) {
    // Complete signature: click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time
    signatureString = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${merchantPrepareId}${amount}${action}${signTime}`;
  } else {
    throw new Error(`Invalid action: ${action}`);
  }

  return crypto.createHash("md5").update(signatureString).digest("hex");
}

/**
 * Verify Click signature
 * Compares provided signature against expected signature
 * 
 * @param {Object} payload - Click API request payload
 * @param {string} secretKey - Merchant secret key
 * @returns {boolean} True if signature is valid
 */
function verifyClickSignature(payload, secretKey) {
  const {
    click_trans_id,
    service_id,
    merchant_trans_id,
    merchant_prepare_id,
    amount,
    action,
    sign_time,
    sign_string,
  } = payload;

  try {
    const expectedSignature = generateClickSignature(
      click_trans_id,
      service_id,
      secretKey,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      merchant_prepare_id
    );

    return sign_string === expectedSignature;
  } catch (err) {
    console.error("Signature verification error:", err.message);
    return false;
  }
}

/**
 * Build Click API response object
 * All responses must include error code (0 = success, negative = error)
 * 
 * @param {number} errorCode - Error code (0 for success, negative for errors)
 * @param {string} errorNote - Human-readable error message
 * @param {Object} additionalData - Additional response fields
 * @returns {Object} Properly formatted Click API response
 */
function buildClickResponse(errorCode, errorNote, additionalData = {}) {
  return {
    error: errorCode,
    error_note: errorNote,
    ...additionalData,
  };
}

/**
 * Validate Click prepare request
 * Checks order exists, amount matches, status allows payment
 * 
 * @param {string} orderId - MongoDB order ID
 * @param {number} expectedAmount - Amount in UZS
 * @returns {Object} { valid: boolean, error: string | null, order: Object | null }
 */
async function validateClickPrepareRequest(orderId, expectedAmount) {
  try {
    const Order = require("../models/Order");
    const order = await Order.findById(orderId);

    if (!order) {
      return {
        valid: false,
        error: "Order not found",
        code: CLICK_ERRORS.ORDER_NOT_FOUND,
        order: null,
      };
    }

    // Check if order is already completed
    if (order.paymentStatus === "completed") {
      return {
        valid: false,
        error: "Order already completed",
        code: CLICK_ERRORS.ORDER_ALREADY_COMPLETED,
        order,
      };
    }

    // Validate amount (Click sends amount in UZS without decimals)
    if (Math.round(order.amount) !== Math.round(expectedAmount)) {
      return {
        valid: false,
        error: "Invalid amount",
        code: CLICK_ERRORS.INVALID_AMOUNT,
        order,
      };
    }

    return {
      valid: true,
      error: null,
      code: 0,
      order,
    };
  } catch (err) {
    console.error("Prepare validation error:", err);
    return {
      valid: false,
      error: "System error",
      code: CLICK_ERRORS.SYSTEM_ERROR,
      order: null,
    };
  }
}

/**
 * Build error response with appropriate Click error code
 * 
 * @param {string} errorType - Name of error type
 * @returns {Object} Click API error response
 */
function buildErrorResponse(errorType) {
  const errorMap = {
    INVALID_SIGNATURE: {
      error: CLICK_ERRORS.SIGN_CHECK_FAILED,
      error_note: "SIGN CHECK FAILED",
    },
    INVALID_AMOUNT: {
      error: CLICK_ERRORS.INVALID_AMOUNT,
      error_note: "Invalid amount",
    },
    ORDER_NOT_FOUND: {
      error: CLICK_ERRORS.ORDER_NOT_FOUND,
      error_note: "Order not found",
    },
    ORDER_ALREADY_COMPLETED: {
      error: CLICK_ERRORS.ORDER_ALREADY_COMPLETED,
      error_note: "Order already completed",
    },
    ACTION_NOT_FOUND: {
      error: CLICK_ERRORS.ACTION_NOT_FOUND,
      error_note: "Action not found",
    },
    SYSTEM_ERROR: {
      error: CLICK_ERRORS.SYSTEM_ERROR,
      error_note: "System error",
    },
  };

  return errorMap[errorType] || errorMap.SYSTEM_ERROR;
}

/**
 * Format Click transaction details for logging
 * 
 * @param {Object} payload - Click API payload
 * @returns {string} Formatted transaction info
 */
function formatClickTransactionLog(payload) {
  return `
Click Transaction:
  Click Trans ID: ${payload.click_trans_id}
  Merchant Trans ID: ${payload.merchant_trans_id}
  Service ID: ${payload.service_id}
  Amount: ${payload.amount} UZS
  Action: ${payload.action} (${payload.action === 0 ? "PREPARE" : "COMPLETE"})
  Sign Time: ${payload.sign_time}
  ${payload.click_paydoc_id ? `Click PayDoc ID: ${payload.click_paydoc_id}` : ""}
  ${payload.error ? `Error: ${payload.error}` : ""}
  ${payload.error_note ? `Error Note: ${payload.error_note}` : ""}
`;
}

module.exports = {
  // Constants
  CLICK_ERRORS,
  CLICK_ACTIONS,

  // Signature verification
  generateClickSignature,
  verifyClickSignature,

  // Response builders
  buildClickResponse,
  buildErrorResponse,

  // Validators
  validateClickPrepareRequest,

  // Utilities
  formatClickTransactionLog,
};
