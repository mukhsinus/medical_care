/**
 * Uzum Bank Merchant API Service
 * Handles Uzum Bank payment gateway integration
 * Documentation: https://developer.uzumbank.uz/en/merchant/
 */

const mongoose = require("mongoose");

// Uzum transaction states
const UZUM_STATES = {
  CREATED: "CREATED",      // Transaction created, awaiting confirmation
  CONFIRMED: "CONFIRMED",  // Payment confirmed, funds deducted
  REVERSED: "REVERSED",    // Transaction cancelled/refunded
  FAILED: "FAILED",        // Payment failed
};

// Uzum error codes
const UZUM_ERRORS = {
  OK: "OK",                       // Success
  INVALID_REQUEST: "INVALID_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_SERVICE: "INVALID_SERVICE",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  SYSTEM_ERROR: "SYSTEM_ERROR",
};

/**
 * Verify Basic Auth header
 * Expected: Authorization: Basic base64("username:password")
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {boolean} true if valid
 */
function verifyBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const username = process.env.UZUM_USERNAME;
  const password = process.env.UZUM_PASSWORD;

  if (!username || !password) {
    console.error("❌ UZUM_USERNAME or UZUM_PASSWORD not configured");
    return false;
  }

  const expectedAuth = Buffer.from(`${username}:${password}`).toString("base64");
  const providedAuth = authHeader.substring(6);

  return providedAuth === expectedAuth;
}

/**
 * Build Uzum API response object
 * All responses must include status field
 * 
 * @param {string} status - Response status (OK, CREATED, CONFIRMED, etc.)
 * @param {Object} data - Additional response data
 * @returns {Object} Properly formatted Uzum API response
 */
function buildUzumResponse(status, data = {}) {
  return {
    ...data,
    status,
  };
}

/**
 * Build Uzum error response
 * 
 * @param {string} errorType - Error type identifier
 * @returns {Object} Uzum API error response
 */
function buildUzumErrorResponse(errorType) {
  const errorMap = {
    UNAUTHORIZED: {
      status: UZUM_ERRORS.UNAUTHORIZED,
      error: "Invalid credentials",
    },
    INVALID_SERVICE: {
      status: UZUM_ERRORS.INVALID_SERVICE,
      error: "Invalid service ID",
    },
    ORDER_NOT_FOUND: {
      status: UZUM_ERRORS.ORDER_NOT_FOUND,
      error: "Order not found",
    },
    INVALID_AMOUNT: {
      status: UZUM_ERRORS.INVALID_AMOUNT,
      error: "Invalid amount",
    },
    INVALID_REQUEST: {
      status: UZUM_ERRORS.INVALID_REQUEST,
      error: "Invalid request format",
    },
    SYSTEM_ERROR: {
      status: UZUM_ERRORS.SYSTEM_ERROR,
      error: "System error",
    },
  };

  return errorMap[errorType] || errorMap.SYSTEM_ERROR;
}

/**
 * Validate Uzum check request
 * Verifies order exists and is in correct state for payment
 * 
 * @param {string} orderId - MongoDB order ID
 * @returns {Object} { valid: boolean, error: string | null, order: Object | null }
 */
async function validateUzumCheckRequest(orderId) {
  try {
    const Order = require("../models/Order");
    const order = await Order.findById(orderId);

    if (!order) {
      return {
        valid: false,
        errorType: "ORDER_NOT_FOUND",
        order: null,
      };
    }

    // Check if order is already completed
    if (order.paymentStatus === "completed") {
      return {
        valid: false,
        errorType: "ORDER_NOT_FOUND", // Uzum treats completed as "can't pay again"
        order,
      };
    }

    return {
      valid: true,
      errorType: null,
      order,
    };
  } catch (err) {
    console.error("Check validation error:", err);
    return {
      valid: false,
      errorType: "SYSTEM_ERROR",
      order: null,
    };
  }
}

/**
 * Validate Uzum create request
 * Verifies order exists, amount matches, status allows payment
 * 
 * @param {string} orderId - MongoDB order ID
 * @param {number} expectedAmount - Amount in tiyin
 * @returns {Object} { valid: boolean, errorType: string | null, order: Object | null }
 */
async function validateUzumCreateRequest(orderId, expectedAmount) {
  try {
    const Order = require("../models/Order");
    const order = await Order.findById(orderId);

    if (!order) {
      return {
        valid: false,
        errorType: "ORDER_NOT_FOUND",
        order: null,
      };
    }

    // Check if order is already processing/completed
    if (["completed", "processing"].includes(order.paymentStatus)) {
      return {
        valid: false,
        errorType: "ORDER_NOT_FOUND",
        order,
      };
    }

    // Validate amount (Uzum sends amount in tiyin, convert order amount to tiyin)
    const orderAmountInTiyin = Math.round(order.amount * 100);
    if (orderAmountInTiyin !== Math.round(expectedAmount)) {
      return {
        valid: false,
        errorType: "INVALID_AMOUNT",
        order,
      };
    }

    return {
      valid: true,
      errorType: null,
      order,
    };
  } catch (err) {
    console.error("Create validation error:", err);
    return {
      valid: false,
      errorType: "SYSTEM_ERROR",
      order: null,
    };
  }
}

/**
 * Validate Uzum confirm request
 * Final validation before marking order as paid
 * 
 * @param {string} orderId - MongoDB order ID
 * @param {number} expectedAmount - Amount in tiyin
 * @returns {Object} { valid: boolean, errorType: string | null, order: Object | null }
 */
async function validateUzumConfirmRequest(orderId, expectedAmount) {
  try {
    const Order = require("../models/Order");
    const order = await Order.findById(orderId);

    if (!order) {
      return {
        valid: false,
        errorType: "ORDER_NOT_FOUND",
        order: null,
      };
    }

    // Check if already confirmed
    if (order.paymentStatus === "completed") {
      return {
        valid: true, // Idempotent - return success
        idempotent: true,
        order,
      };
    }

    // Validate amount one final time
    const orderAmountInTiyin = Math.round(order.amount * 100);
    if (orderAmountInTiyin !== Math.round(expectedAmount)) {
      return {
        valid: false,
        errorType: "INVALID_AMOUNT",
        order,
      };
    }

    return {
      valid: true,
      errorType: null,
      order,
    };
  } catch (err) {
    console.error("Confirm validation error:", err);
    return {
      valid: false,
      errorType: "SYSTEM_ERROR",
      order: null,
    };
  }
}

/**
 * Format Uzum transaction details for logging
 * 
 * @param {Object} payload - Uzum API payload
 * @param {string} action - Action name (check, create, confirm, etc.)
 * @returns {string} Formatted transaction info
 */
function formatUzumTransactionLog(payload, action) {
  return `
Uzum Transaction (${action.toUpperCase()}):
  Service ID: ${payload.serviceId}
  Trans ID: ${payload.transId}
  Timestamp: ${payload.timestamp}
  Amount: ${payload.amount} tiyin (${(payload.amount / 100).toLocaleString("uz-UZ")} UZS)
  ${payload.params ? `Params: ${JSON.stringify(payload.params)}` : ""}
  ${payload.paymentSource ? `Payment Source: ${payload.paymentSource}` : ""}
  ${payload.phone ? `Phone: ${payload.phone}` : ""}
`;
}

module.exports = {
  // Constants
  UZUM_STATES,
  UZUM_ERRORS,

  // Auth
  verifyBasicAuth,

  // Response builders
  buildUzumResponse,
  buildUzumErrorResponse,

  // Validators
  validateUzumCheckRequest,
  validateUzumCreateRequest,
  validateUzumConfirmRequest,

  // Utilities
  formatUzumTransactionLog,
};
