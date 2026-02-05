/**
 * Paycom Merchant API Service
 * 
 * This is a WEBHOOK HANDLER SERVICE - Payme calls our endpoints, not vice versa
 * 
 * Reference: https://developer.help.paycom.uz/protokol-merchant-api/
 * Methods: https://developer.help.paycom.uz/metody-merchant-api/
 */

const Order = require("../models/Order");

// Receipt types for fiscalization
const RECEIPT_TYPES = {
  SELL: 0,        // Продажа
  RETURN: 1,      // Возврат
  CORRECTION: 2   // Корректировка
};

// Paycom state codes
const PAYCOM_STATES = {
  CREATED: 1,      // Транзакция создана
  PERFORMED: 2,    // Транзакция выполнена
  CANCELLED: -1,   // Транзакция отменена
  REFUNDED: -2     // Возврат
};

// Paycom error codes
const PAYCOM_ERRORS = {
  INVALID_AMOUNT: -31001,
  ORDER_NOT_FOUND: -31003,
  CANNOT_PERFORM: -31008,
  CANNOT_CANCEL: -31007,
  TRANSACTION_NOT_FOUND: -31016,
  INVALID_ACCOUNT: -31050,
  INVALID_PARAMS: -32602,
  UNAUTHORIZED: -32504
};

/**
 * Verify Basic Auth header
 * Expected: Authorization: Basic base64("Paycom:MERCHANT_KEY")
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {boolean} true if valid
 */
function verifyBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const merchantKey = process.env.PAYCOM_MERCHANT_KEY;
  const expectedAuth = Buffer.from(`Paycom:${merchantKey}`).toString('base64');
  const providedAuth = authHeader.substring(6);

  return providedAuth === expectedAuth;
}

/**
 * Build receipt detail object for fiscalization
 * This gets returned in CheckPerformTransaction response
 * 
 * @param {Array} items - Order items with pricing and details
 * @param {Array} catalogItems - Catalog data with IKPU and package codes
 * @returns {Object} detail object with items array
 */
function buildReceiptDetail(items, catalogItems = []) {
  const receiptItems = [];
  let totalAmount = 0;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items array is empty or invalid');
  }

  for (const cartItem of items) {
    try {
      // Read fiscal codes directly from item (already resolved at order creation time)
      const ikpuCode = cartItem.ikpuCode || '00000000000000000'; // Fallback IKPU
      const packageCode = cartItem.package_code || '';
      const vatPercent = cartItem.vat_percent || 12;

      const itemPrice = Math.round((cartItem.price || 0) * 100); // Convert to tiyin
      const itemCount = cartItem.quantity || 1;

      receiptItems.push({
        title: `${cartItem.name || 'Unknown Item'}${cartItem.size ? ' (' + cartItem.size + ')' : ''}`,
        price: itemPrice,
        count: itemCount,
        code: ikpuCode,              // ИКПУ code (обязательное)
        vat_percent: vatPercent,     // НДС процент (обязательное)
        package_code: packageCode    // Код упаковки (опционально)
      });

      totalAmount += itemPrice * itemCount;
    } catch (itemError) {
      console.error(`⚠️ Error processing item ${cartItem.productId}:`, itemError);
      // Continue processing other items instead of failing
    }
  }

  if (receiptItems.length === 0) {
    throw new Error('No valid items in receipt');
  }

  return {
    receipt_type: RECEIPT_TYPES.SELL,
    items: receiptItems
  };
}
/**
 * CheckPerformTransaction Handler
 * Called by Payme BEFORE payment processing
 * Validates order and returns receipt detail for fiscalization
 * 
 * @param {Object} params - { account: { order_id }, amount }
 * @param {Array} catalogItems - Catalog data for building receipt
 * @returns {Promise<Object>} { allow: true/false, detail: {...} }
 */
async function handleCheckPerformTransaction(params, catalogItems = []) {
  const { account, amount } = params;

  if (!account || !account.order_id) {
    throw {
      code: PAYCOM_ERRORS.INVALID_ACCOUNT,
      message: 'Invalid account parameter'
    };
  }

  const orderId = account.order_id;
  console.log(`🔍 CheckPerformTransaction: Looking for order ${orderId}`);

  // Find order in database
  const order = await Order.findById(orderId);
  if (!order) {
    console.error(`❌ Order not found: ${orderId}`);
    throw {
      code: PAYCOM_ERRORS.ORDER_NOT_FOUND,
      message: `Order not found: ${orderId}`
    };
  }

  console.log(`✓ Order found. Status: ${order.paymentStatus}, Amount: ${order.amount}`);

  // Check order status
  if (order.paymentStatus !== 'pending') {
    console.error(`❌ Invalid order status: ${order.paymentStatus}`);
    throw {
      code: PAYCOM_ERRORS.CANNOT_PERFORM,
      message: `Cannot perform transaction. Order status: ${order.paymentStatus}`
    };
  }

  // Validate amount matches
  const expectedAmount = order.amount * 100; // Convert UZS to tiyin
  if (expectedAmount !== amount) {
    console.error(`❌ Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}`);
    throw {
      code: PAYCOM_ERRORS.INVALID_AMOUNT,
      message: `Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}`
    };
  }

  // Build receipt detail with fiscalization data
  let detail;
  try {
    detail = buildReceiptDetail(order.items, catalogItems);
    console.log(`✓ Receipt detail built with ${detail.items.length} items`);
  } catch (buildError) {
    console.error(`❌ Error building receipt detail:`, buildError);
    throw {
      code: -31008,
      message: 'Error building receipt detail'
    };
  }

  console.log(`✅ CheckPerformTransaction OK: Order ${orderId}, Amount: ${amount} tiyin`);

  return {
    allow: true,
    detail: detail
  };
}

/**
 * CreateTransaction Handler
 * Called by Payme to create transaction record
 * 
 * @param {Object} params - { account: { order_id }, amount, time }
 * @returns {Promise<Object>} Transaction details
 */
async function handleCreateTransaction(params) {
  const { account, amount, time, id: paycomTxId } = params;

  if (!account || !account.order_id) {
    throw {
      code: PAYCOM_ERRORS.INVALID_ACCOUNT,
      message: 'Invalid account parameter'
    };
  }

  const orderId = account.order_id;

  const order = await Order.findById(orderId);
  if (!order) {
    throw {
      code: PAYCOM_ERRORS.ORDER_NOT_FOUND,
      message: `Order not found: ${orderId}`
    };
  }

  // Validate amount
  if (order.amount * 100 !== amount) {
    throw {
      code: PAYCOM_ERRORS.INVALID_AMOUNT,
      message: 'Amount mismatch'
    };
  }

  // 🚨 If order already has a Paycom transaction
  if (order.providerTransactionId) {
    // ✅ Same transaction → idempotent success
    if (order.providerTransactionId === String(paycomTxId)) {
      return {
        transaction_id: order.providerTransactionId,
        state:
          order.paymentStatus === 'completed'
            ? PAYCOM_STATES.PERFORMED
            : PAYCOM_STATES.CREATED,
        create_time: order.meta?.paycomCreatedAt
          ? new Date(order.meta.paycomCreatedAt).getTime()
          : 0,
        perform_time: order.meta?.paycomPerformedAt
          ? new Date(order.meta.paycomPerformedAt).getTime()
          : 0,
        cancel_time: 0,
        transaction: order.providerTransactionId
      };
    }

    // ❌ Different transaction id → MUST ERROR
    throw {
      code: -31099,
      message: 'Order already has another active transaction'
    };
  }

  // ✅ First time CreateTransaction → create it
  order.paymentStatus = 'processing';
  order.providerTransactionId = String(paycomTxId);
  order.meta = order.meta || {};
  order.meta.paycomCreatedAt = new Date(time);
  await order.save();

  console.log(`🆕 CreateTransaction OK: Order ${orderId}, Paycom TxID: ${paycomTxId}`);

  return {
    transaction_id: order.providerTransactionId,
    state: PAYCOM_STATES.CREATED,
    create_time: new Date(order.meta.paycomCreatedAt).getTime(),
    perform_time: 0,
    cancel_time: 0,
    transaction: order.providerTransactionId
  };
}

/**
 * PerformTransaction Handler
 * Called by Payme to confirm transaction (after successful payment)
 * 
 * @param {Object} params - { transaction_id }
 * @returns {Promise<Object>} Performance confirmation
 */
async function handlePerformTransaction(params) {
  const transaction_id = params.transaction_id || params.id;

  if (!transaction_id) {
    throw {
      code: PAYCOM_ERRORS.INVALID_PARAMS,
      message: 'transaction_id is required'
    };
  }

  // Find order by Paycom's transaction ID
  const order = await Order.findOne({ providerTransactionId: String(transaction_id) });
  if (!order) {
    throw {
      code: PAYCOM_ERRORS.TRANSACTION_NOT_FOUND,
      message: `Transaction not found: ${transaction_id}`
    };
  }

  // Check if already performed or cancelled
  if (order.paymentStatus === 'completed') {
    // Already performed - return success with stable times from DB
    return {
      transaction_id: transaction_id,
      state: PAYCOM_STATES.PERFORMED,
      perform_time: order.meta?.paycomPerformedAt ? new Date(order.meta.paycomPerformedAt).getTime() : 0,
      transaction: transaction_id
    };
  }

  if (order.paymentStatus !== 'processing') {
    throw {
      code: PAYCOM_ERRORS.CANNOT_PERFORM,
      message: `Cannot perform. Current status: ${order.paymentStatus}`
    };
  }

  // Mark as completed
  order.paymentStatus = 'completed';
  order.callbackVerified = true;
  order.meta = order.meta || {};
  order.meta.paycomPerformedAt = new Date();
  await order.save();

  console.log(`✔️ PerformTransaction OK: Order ${transaction_id}`);

  return {
    transaction_id: transaction_id,
    state: PAYCOM_STATES.PERFORMED,
    perform_time: order.meta.paycomPerformedAt.getTime(), // Use the actual saved timestamp
    transaction: transaction_id
  };
}

/**
 * CancelTransaction Handler
 * Called by Payme to cancel transaction
 * 
 * @param {Object} params - { transaction_id, reason }
 * @returns {Promise<Object>} Cancellation confirmation
 */
async function handleCancelTransaction(params) {
  const transaction_id = params.transaction_id || params.id;
  const { reason } = params;

  if (!transaction_id) {
    throw {
      code: PAYCOM_ERRORS.INVALID_PARAMS,
      message: 'transaction_id is required'
    };
  }

  // Find order by Paycom's transaction ID
  const order = await Order.findOne({ providerTransactionId: String(transaction_id) });
  if (!order) {
    throw {
      code: PAYCOM_ERRORS.TRANSACTION_NOT_FOUND,
      message: `Transaction not found: ${transaction_id}`
    };
  }

  // ✅ If already cancelled or refunded → return SAME result (idempotent)
  if (order.paymentStatus === 'cancelled' || order.paymentStatus === 'refunded') {
    const cancelTime = order.meta?.paycomCancelledAt
      ? new Date(order.meta.paycomCancelledAt).getTime()
      : 0;

    return {
      transaction_id: transaction_id,
      state: order.paymentStatus === 'refunded' ? PAYCOM_STATES.REFUNDED : PAYCOM_STATES.CANCELLED,
      cancel_time: cancelTime,
      transaction: transaction_id
    };
  }

  order.meta = order.meta || {};
  order.meta.paycomCancelledAt = new Date();
  order.meta.cancellationReason = Number(reason) || 0; // Store as number

  let state;

  if (order.paymentStatus === 'completed') {
    // 🔁 Refund (cancel after payment)
    order.paymentStatus = 'refunded';
    state = PAYCOM_STATES.REFUNDED; // -2
  } else {
    // ❌ Cancel (before payment)
    order.paymentStatus = 'cancelled';
    state = PAYCOM_STATES.CANCELLED; // -1
  }

  await order.save();

  const cancelTime = new Date(order.meta.paycomCancelledAt).getTime();

  console.log(`❌ CancelTransaction OK: Order ${transaction_id}, Status: ${order.paymentStatus}, Reason: ${reason}`);

  return {
    transaction_id: transaction_id,
    state: state,
    cancel_time: cancelTime,
    transaction: transaction_id
  };
}

/**
 * CheckTransaction Handler
 * Called by Payme to get transaction status
 * 
 * @param {Object} params - { transaction_id }
 * @returns {Promise<Object>} Transaction status
 */
async function handleCheckTransaction(params) {
  const transaction_id = params.transaction_id || params.id;

  if (!transaction_id) {
    throw {
      code: PAYCOM_ERRORS.INVALID_PARAMS,
      message: 'transaction_id is required'
    };
  }

  // Find order by Paycom's transaction ID
  const order = await Order.findOne({ providerTransactionId: String(transaction_id) });
  if (!order) {
    throw {
      code: PAYCOM_ERRORS.TRANSACTION_NOT_FOUND,
      message: `Transaction not found: ${transaction_id}`
    };
  }

  // Map order status to Paycom state
  const statusToState = {
    'pending': PAYCOM_STATES.CREATED,
    'processing': PAYCOM_STATES.CREATED,
    'completed': PAYCOM_STATES.PERFORMED,
    'cancelled': PAYCOM_STATES.CANCELLED,
    'refunded': PAYCOM_STATES.REFUNDED,
    'failed': PAYCOM_STATES.CANCELLED
  };

  const state = statusToState[order.paymentStatus] || PAYCOM_STATES.CREATED;

  const createTime = order.meta?.paycomCreatedAt
    ? new Date(order.meta.paycomCreatedAt).getTime()
    : 0;

  // ✅ CRITICAL: perform_time logic depends on state
  // If state = -2 (REFUNDED) → MUST have perform_time > 0 (when it was performed)
  // If state = -1 (CANCELLED) → perform_time = 0 (never performed)
  let performTime = 0;
  if (order.paymentStatus === 'completed' || order.paymentStatus === 'refunded') {
    // Was performed, so include the timestamp
    performTime = order.meta?.paycomPerformedAt
      ? new Date(order.meta.paycomPerformedAt).getTime()
      : 0;
  }

  // cancel_time is set only for cancelled/refunded
  let cancelTime = 0;
  if (order.paymentStatus === 'cancelled' || order.paymentStatus === 'refunded') {
    cancelTime = order.meta?.paycomCancelledAt
      ? new Date(order.meta.paycomCancelledAt).getTime()
      : 0;
  }

  // ✅ reason is only set when state is -1 or -2
  const reason =
    order.paymentStatus === 'cancelled' || order.paymentStatus === 'refunded'
      ? Number(order.meta?.cancellationReason) || null
      : null;

  console.log(`🔍 CheckTransaction OK: Order ${transaction_id}, State: ${state}, PerformTime: ${performTime}, CancelTime: ${cancelTime}`);

  return {
    transaction_id: transaction_id,
    state: state,
    create_time: createTime,
    perform_time: performTime,
    cancel_time: cancelTime,
    transaction: transaction_id,
    reason: reason
  };
}

/**
 * GetStatement Handler
 * Get list of transactions for date range
 * 
 * @param {Object} params - { from, to } (Unix timestamps in seconds)
 * @returns {Promise<Object>} { transactions: Array }
 */
async function handleGetStatement(params) {
  const { from, to } = params;

  if (!from || !to) {
    throw {
      code: PAYCOM_ERRORS.INVALID_PARAMS,
      message: 'from and to parameters are required'
    };
  }

  const fromDate = new Date(from * 1000);
  const toDate = new Date(to * 1000);

  // Find all orders in date range with paymentProvider = 'payme'
  const orders = await Order.find({
    paymentProvider: 'payme',
    createdAt: { $gte: fromDate, $lte: toDate }
  }).lean();

  const transactions = orders.map(order => {
    const statusToState = {
      'pending': PAYCOM_STATES.CREATED,
      'processing': PAYCOM_STATES.CREATED,
      'completed': PAYCOM_STATES.PERFORMED,
      'cancelled': PAYCOM_STATES.CANCELLED,
      'refunded': PAYCOM_STATES.CANCELLED,
      'failed': PAYCOM_STATES.CANCELLED
    };

    const state = statusToState[order.paymentStatus] || PAYCOM_STATES.CREATED;
    const performTime = order.meta?.paycomPerformedAt ? new Date(order.meta.paycomPerformedAt).getTime() : 0;
    const cancelTime = order.meta?.paycomCancelledAt ? new Date(order.meta.paycomCancelledAt).getTime() : 0;

    return {
      transaction_id: order._id.toString(),
      state: state,
      create_time: order.createdAt ? order.createdAt.getTime() : 0,
      perform_time: performTime,
      cancel_time: cancelTime,
      transaction: order._id.toString(),
      amount: order.amount * 100 // Convert to tiyin
    };
  });

  console.log(`📊 GetStatement OK: ${transactions.length} transactions from ${fromDate} to ${toDate}`);

  return {
    transactions: transactions
  };
}

module.exports = {
  RECEIPT_TYPES,
  PAYCOM_STATES,
  PAYCOM_ERRORS,
  verifyBasicAuth,
  buildReceiptDetail,
  handleCheckPerformTransaction,
  handleCreateTransaction,
  handlePerformTransaction,
  handleCancelTransaction,
  handleCheckTransaction,
  handleGetStatement
};
