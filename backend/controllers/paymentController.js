// controllers/paymentController.js
const Order = require("../models/Order");
const User = require("../models/User");
const crypto = require("crypto");
const { sendNotification } = require("../utils/telegramNotifier");
const { deductOrderStock } = require("../utils/stockManager");



// Try to load CatalogData from frontend folder (Vite project)
// This is needed ONLY to map item.id -> IKPU/package_code/vat_percent
let allItems = [];

try {
  // ⚠️ path may differ in your project structure
  const catalogData = require("../data/paymeCatalog");
  allItems = catalogData.allItems || [];
  console.log(`✅ CatalogData loaded: ${allItems.length} items`);
} catch (err) {
  console.warn("⚠️ CatalogData not available for Payme fiscalization");
  console.warn("Reason:", err.message);
}




exports.createOrderAndInitPayment = async (req, res) => {
  console.log('PAYMENT BODY:', req.body);
  console.log('👉 userId from auth:', req.userId);
  try {
    let { items, amount, provider } = req.body;

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({ message: "Invalid items JSON" });
      }
    }

    amount = Number(amount);

    if (!["payme", "click", "uzum"].includes(provider)) {
      return res.status(400).json({ message: "Invalid payment provider" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // authMiddleware should have set req.userId - validate it exists
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User must be logged in to place an order" });
    }
    console.log('👉 First item:', items[0]);

    // Проверяем что у всех товаров есть IKPU код (для Payme)
    if (provider === "payme") {
      for (const item of items) {
        // productId типа "102-nosize-nocolor"
        const numericId = Number(String(item.productId).split("-")[0]);

        const catalogItem = allItems.find((c) => Number(c.id) === numericId);

        if (!catalogItem) {
          return res.status(400).json({
            message: "Item not found in Payme catalog",
            productId: item.productId,
          });
        }

        // Get IKPU (size-level > base)
        let itemIkpuCode = catalogItem.ikpuCode;
        if (item.size && catalogItem.sizeIkpuCodes) {
          const sizeKey = `variants.sizes.${item.size}`;
          itemIkpuCode = catalogItem.sizeIkpuCodes[sizeKey] || itemIkpuCode;
        }

        if (!itemIkpuCode) {
          return res.status(400).json({
            message: "Item missing IKPU code in catalog",
            productId: item.productId,
            catalogId: catalogItem.id,
          });
        }

        // Get package code (size-level > base)
        let itemPackageCode = catalogItem.package_code || '';
        if (item.size && catalogItem.sizePackageCodes) {
          const sizeKey = `variants.sizes.${item.size}`;
          itemPackageCode = catalogItem.sizePackageCodes[sizeKey] || itemPackageCode;
        }

        // Store fiscal data WITH the item
        item.ikpuCode = itemIkpuCode;
        item.package_code = itemPackageCode;
        item.vat_percent = catalogItem.vat_percent || 12;
      }
    }

    // 1) Create order in DB
    const order = await Order.create({
      userId: userId || undefined,
      isGuest: !userId,
      items,
      amount,
      currency: "UZS",
      paymentProvider: provider,
      paymentStatus: "pending",
      meta: {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      },
    });

    console.log("Order created:", order._id);

    // 2) Build redirect URL / init data (for now just a placeholder)
    const backendBase = process.env.BACKEND_URL || "http://localhost:8090";

    let paymentInitData;

    if (provider === "payme") {
      // Paycom GET method: base64(m=MERCHANT_ID;ac.order_id=ORDER_ID;a=AMOUNT)
      const paycomMerchantId = process.env.PAYCOM_MERCHANT_ID;
      if (!paycomMerchantId) {
        return res.status(500).json({ 
          message: "Server error: PAYCOM_MERCHANT_ID not configured" 
        });
      }
      
      // Build params string: m=merchant_id;ac.order_id=order_id;a=amount
      const paramsStr = `m=${paycomMerchantId};ac.order_id=${order._id};a=${Math.round(amount * 100)}`;
      const paramsBase64 = Buffer.from(paramsStr).toString('base64');
      
      const paymeTestMode = process.env.PAYME_TEST_MODE === 'true';
      const paymeGateway = paymeTestMode 
        ? "https://checkout.test.paycom.uz"
        : "https://checkout.paycom.uz";

      // Return redirect URL as JSON instead of HTML
      // This allows axios to include Authorization header
      paymentInitData = {
        redirectUrl: `${paymeGateway}/${paramsBase64}`,
      };

    } else if (provider === "click") {
      const clickServiceId = process.env.CLICK_SERVICE_ID;
      const clickMerchantId = process.env.CLICK_MERCHANT_ID;
      // Click payment URL format: https://my.click.uz/services/pay?service_id=SERVICE_ID&merchant_id=MERCHANT_ID&amount=AMOUNT&transaction_param=ORDER_ID
      const testMode = process.env.CLICK_TEST_MODE === 'true';
      if (testMode) {
        paymentInitData = {
          redirectUrl: `${backendBase}/mock/click-gateway?orderId=${order._id}`,
        };
      } else {
        paymentInitData = {
          redirectUrl: `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${Math.round(amount)}&transaction_param=${order._id}`,
        };
      }
    } else if (provider === "uzum") {
      // Uzum payment flow
      // Uzum typically provides a deeplink or checkout URL in merchant dashboard
      // Format: https://mobile.uzumbank.uz/pay or similar (verify with Uzum docs)
      const uzumServiceId = process.env.UZUM_SERVICE_ID;
      const testMode = process.env.UZUM_TEST_MODE === 'true';
      
      if (testMode) {
        paymentInitData = {
          redirectUrl: `${backendBase}/mock/uzum-gateway?orderId=${order._id}`,
        };
      } else {
        // Production Uzum checkout URL - update based on Uzum merchant docs
        // This is a placeholder format; verify exact URL with Uzum support
        paymentInitData = {
          redirectUrl: `https://mobile.uzumbank.uz/pay?serviceId=${uzumServiceId}&transactionParam=${order._id}&amount=${Math.round(amount * 100)}`,
        };
      }
    }

    return res.status(201).json({
      orderId: order._id,
      provider,
      paymentInitData,
    });

  } catch (err) {
    console.error("createOrderAndInitPayment error:", err);
    res.status(500).json({
      message: "Server error",
      details: err.message,
      name: err.name || "",
    });
  }
};



function buildPaymeReceiptDetailFromOrder(order, allItems) {
  const receiptItems = [];

  for (const cartItem of order.items) {
    const numericId = Number(String(cartItem.productId).split("-")[0]);
    const catalogItem = allItems.find((c) => Number(c.id) === numericId);

    // Если не нашли в каталоге — это критично для фискализации
    if (!catalogItem) {
      throw new Error(`Catalog item not found for order item id=${cartItem.id}`);
    }

    // 1) IKPU (size-level > base)
    let ikpuCode = catalogItem.ikpuCode;

    if (cartItem.size && catalogItem.sizeIkpuCodes) {
      ikpuCode = catalogItem.sizeIkpuCodes[cartItem.size] || ikpuCode;
    }

    // 2) Package code (size-level > base)
    let packageCode = catalogItem.package_code;

    if (cartItem.size && catalogItem.sizePackageCodes) {
      packageCode = catalogItem.sizePackageCodes[cartItem.size] || packageCode;
    }

    // 3) VAT percent
    const vatPercent = catalogItem.vat_percent || 12;

    // 4) Title
    const titleParts = [];
    if (cartItem.name) titleParts.push(cartItem.name);
    if (cartItem.size) titleParts.push(cartItem.size);
    if (cartItem.color) titleParts.push(cartItem.color);

    const title = titleParts.join(" ");

    // 5) Price in tiyin
    // cartItem.price у тебя в суммах (UZS), Payme ждёт тийины
    const priceTiyin = Math.round(Number(cartItem.price) * 100);

    receiptItems.push({
      title,
      price: priceTiyin,
      count: Number(cartItem.quantity),
      code: String(ikpuCode),
      vat_percent: Number(vatPercent),
      package_code: String(packageCode || ""),
    });
  }

  return {
    receipt_type: 0,
    items: receiptItems,
  };
}




// PAYME CALLBACK - API RECEIVER
// Documentation: https://paycom.uz/ru/developers/api/checkout/
exports.paymeCallback = async (req, res) => {
  const isTest = process.env.PAYME_TEST_MODE === 'true';
  
  const requestTime = new Date().toISOString();
  console.log('\n=== PAYME CALLBACK REQUEST ===');
  console.log('Time:', requestTime);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const payload = req.body;
    const method = payload?.method;
    const params = payload?.params;
    const requestId = payload?.id;

    // Verify authorization (using API key)
    const authHeader = req.headers['authorization'];
    const expectedAuth = `Basic ${Buffer.from(`:${process.env.PAYME_KEY}`).toString('base64')}`;

    if (!isTest && authHeader !== expectedAuth) {
      console.error('Authorization failed');
      const response = {
        jsonrpc: "2.0",
        error: {
          code: -32504,
          message: "Insufficient privilege to perform this method.",
        },
        id: requestId,
      };
      console.log('Response:', JSON.stringify(response, null, 2));
      return res.json(response);
    }

    if (isTest) {
      console.log('⚠️ PAYME TEST MODE: authorization check skipped');
    }

    // Method: CheckPerformTransaction (проверка перед оплатой)
    if (method === "CheckPerformTransaction") {
      console.log("Method: CheckPerformTransaction");

      const account = params?.account;
      const amount = params?.amount; // в тийинах
      const orderId = account?.orderId;

      const order = await Order.findById(orderId);

      if (!order) {
        const response = {
          jsonrpc: "2.0",
          error: { code: -31050, message: "Order not found" },
          id: requestId,
        };
        return res.json(response);
      }

      // Check amount
      if (Math.round(order.amount * 100) !== Math.round(amount)) {
        const response = {
          jsonrpc: "2.0",
          error: { code: -31001, message: "Invalid amount" },
          id: requestId,
        };
        return res.json(response);
      }

      // Already paid
      if (order.paymentStatus === "completed") {
        const response = {
          jsonrpc: "2.0",
          error: { code: -31099, message: "Order already completed" },
          id: requestId,
        };
        return res.json(response);
      }

      // Build fiscal receipt detail
      let detail;
      try {
        detail = buildPaymeReceiptDetailFromOrder(order, allItems);
      } catch (e) {
        console.error("❌ Fiscal detail build failed:", e.message);

        const response = {
          jsonrpc: "2.0",
          error: {
            code: -31001,
            message: "Fiscalization error: cannot build receipt items",
          },
          id: requestId,
        };

        return res.json(response);
      }

      const response = {
        jsonrpc: "2.0",
        result: {
          allow: true,
          detail,
        },
        id: requestId,
      };

      return res.json(response);
    }


    // Method: PerformTransaction (выполнение платежа)
    if (method === "PerformTransaction") {
      console.log("Method: PerformTransaction");

      const account = params?.account;
      const amount = params?.amount;
      const transactionId = params?.id; // Payme transaction ID
      const time = params?.time;
      const orderId = account?.orderId;

      const order = await Order.findById(orderId);
      if (!order) {
        console.error("Order not found:", orderId);

        const response = {
          jsonrpc: "2.0",
          error: {
            code: -31050,
            message: "Order not found",
          },
          id: requestId,
        };

        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // (опционально, но правильно) проверка суммы
      if (Math.round(order.amount * 100) !== Math.round(amount)) {
        console.error(
          "Amount mismatch. Expected:",
          order.amount * 100,
          "Received:",
          amount
        );

        const response = {
          jsonrpc: "2.0",
          error: {
            code: -31001,
            message: "Invalid amount",
          },
          id: requestId,
        };

        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Check if already paid (idempotency)
      if (order.paymentStatus === "completed") {
        if (order.providerTransactionId === String(transactionId)) {
          console.log("Idempotent response - same transaction already completed");

          const response = {
            jsonrpc: "2.0",
            result: {
              transaction: String(transactionId),
              perform_time: Math.floor(Date.now() / 1000),
              transaction_time: time,
              state: 2, // COMPLETED
            },
            id: requestId,
          };

          console.log("Response:", JSON.stringify(response, null, 2));
          return res.json(response);
        }

        // Если заказ уже оплачен, но пришёл другой transactionId — это ошибка
        const response = {
          jsonrpc: "2.0",
          error: {
            code: -31099,
            message: "Order already completed",
          },
          id: requestId,
        };

        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Mark as completed
      order.paymentStatus = "completed";
      order.providerTransactionId = String(transactionId);
      await order.save();

      // Deduct stock for ordered items
      await deductOrderStock(order);

      console.log("Order marked as completed:", order._id);
      // Send Telegram notification on successful payment
      try {
        const user = order.userId ? await User.findById(order.userId) : null;
        const itemsList = order.items
          .map((item) => {
            const lineTotal = Number(item.price) * Number(item.quantity);

            return `• ${item.name}${item.description ? ` - ${item.description}` : ""}\n  Qty: ${
              item.quantity
            } | ${lineTotal.toLocaleString("uz-UZ")} UZS`;
          })
          .join("\n");

        const customerName = user?.name || order.customer?.fullName || "Guest";
        const customerEmail = user?.email || "Not provided";
        const customerPhone = user?.phone || order.customer?.phone || "Not provided";
        const addr = user?.address
          ? `${user.address.house ? user.address.house + ", " : ""}${
              user.address.street || ""
            }, ${user.address.city || ""} ${user.address.zip || ""}`.trim()
          : order.customer?.address || "Not provided";

        const orderMessage = `
    <b>🛒 New Order Placed</b>

    <b>Order ID:</b> ${order._id}
    <b>Payment Status:</b> ✅ Paid
    <b>Provider:</b> ${order.paymentProvider}
    <b>Payme Trans ID:</b> ${transactionId}

    <b>Customer:</b>
    • Name: ${customerName}
    • Email: ${customerEmail}
    • Phone: ${customerPhone}
    • Address: ${addr}

    <b>Products:</b>
    ${itemsList}

    <b>Total:</b> ${order.amount.toLocaleString("uz-UZ")} UZS

    <b>Time:</b> ${new Date().toISOString()}
    `;

        sendNotification(orderMessage);
      } catch (e) {
        console.error("Telegram notification failed (non-blocking):", e?.message);
      }

      console.log("✅ PerformTransaction successful");

      const response = {
        jsonrpc: "2.0",
        result: {
          transaction: String(transactionId),
          perform_time: Math.floor(Date.now() / 1000),
          transaction_time: time,
          state: 2, // COMPLETED
        },
        id: requestId,
      };

      console.log("Response:", JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // Method: CancelTransaction (отмена платежа)
    if (method === "CancelTransaction") {
      console.log("Method: CancelTransaction");

      const transactionId = params?.id;

      const order = await Order.findOne({
        providerTransactionId: String(transactionId),
      });

      if (!order) {
        console.error("Transaction not found:", transactionId);

        const response = {
          jsonrpc: "2.0",
          error: {
            code: -31007,
            message: "Transaction not found",
          },
          id: requestId,
        };

        console.log("Response:", JSON.stringify(response, null, 2));
        return res.json(response);
      }

      order.paymentStatus = "cancelled";
      await order.save();

      console.log("Order cancelled:", order._id);

      const response = {
        jsonrpc: "2.0",
        result: {
          transaction: String(transactionId),
          cancel_time: Math.floor(Date.now() / 1000),
          state: -2, // CANCELLED
        },
        id: requestId,
      };

      console.log("Response:", JSON.stringify(response, null, 2));
      console.log("=== END PAYME CALLBACK ===\n");
      return res.json(response);
    }

    // Unknown method
    console.error("Unknown method:", method);

    const response = {
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not found",
      },
      id: requestId,
    };

    console.log("Response:", JSON.stringify(response, null, 2));
    return res.json(response);

  } catch (err) {
    console.error("paymeCallback error:", err);

    const response = {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal error",
      },
      id: req.body?.id,
    };

    console.log("Error Response:", JSON.stringify(response, null, 2));
    console.log("=== END PAYME CALLBACK (ERROR) ===\n");
    return res.json(response);
  }
};

// CLICK CALLBACK - SHOP API integration
// Documentation: https://docs.click.uz/click-api-request
exports.clickCallback = async (req, res) => {
  const isTest = process.env.CLICK_TEST_MODE === 'true';

  const requestTime = new Date().toISOString();
  console.log('\n=== CLICK CALLBACK REQUEST ===' );
  console.log('Time:', requestTime);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const payload = req.body;

    // Click SHOP API parameters
    const clickTransId = payload?.click_trans_id;
    const serviceId = payload?.service_id;
    const clickPaydocId = payload?.click_paydoc_id;
    const merchantTransId = payload?.merchant_trans_id; // our order ID
    const merchantPrepareId = payload?.merchant_prepare_id;
    const amount = payload?.amount;
    const action = payload?.action; // 0=prepare, 1=complete
    const error = payload?.error;
    const errorNote = payload?.error_note;
    const signTime = payload?.sign_time;
    const signString = payload?.sign_string;

    console.log('Action:', action, '(0=prepare, 1=complete)');
    console.log('Order ID:', merchantTransId);
    console.log('Amount:', amount);

    if (!isTest) {
      const SECRET_KEY = process.env.CLICK_SECRET_KEY;
      if (!SECRET_KEY) {
        console.error('CLICK_SECRET_KEY not configured');
        return res.json({ error: -1, error_note: "Configuration error" });
      }

      let expectedSignString;

      if (action === 0) {
        // Prepare
        expectedSignString = crypto
          .createHash('md5')
          .update(
            `${clickTransId}${serviceId}${SECRET_KEY}${merchantTransId}${amount}${action}${signTime}`
          )
          .digest('hex');
      } 
      else if (action === 1) {
        // Complete
        expectedSignString = crypto
          .createHash('md5')
          .update(
            `${clickTransId}${serviceId}${SECRET_KEY}${merchantTransId}${merchantPrepareId}${amount}${action}${signTime}`
          )
          .digest('hex');
      }

      if (signString !== expectedSignString) {
        console.error('INVALID SIGNATURE!');
        console.error('Expected:', expectedSignString);
        console.error('Received:', signString);

        return res.json({
          error: -1,
          error_note: "SIGN CHECK FAILED",
        });
      }

      console.log('✅ Signature verified successfully');
    } else {
      console.log('⚠️ CLICK TEST MODE: signature verification skipped');
    }

    const order = await Order.findById(merchantTransId);
    if (!order) {
      console.error('Order not found:', merchantTransId);
      const response = {
        error: -5,
        error_note: "Order not found",
      };
      console.log('Response:', JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // Action 0: PREPARE - validate order
    if (action === 0) {
      console.log('PREPARE request for order:', order._id);
      
      // Check if order is already completed
      if (order.paymentStatus === 'completed') {
        console.error('Order already completed');
        const response = {
          error: -4,
          error_note: "Order already completed",
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Validate amount (Click sends amount in UZS without decimals)
      if (Math.round(order.amount) !== Math.round(amount)) {
        console.error('Amount mismatch. Expected:', order.amount, 'Received:', amount);
        const response = {
          error: -2,
          error_note: "Invalid amount",
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Success - order is ready for payment
      const response = {
        error: 0,
        error_note: "Success",
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: order._id,
      };
      console.log('PREPARE Success. Response:', JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // Action 1: COMPLETE - finalize payment
    if (action === 1) {
      console.log('COMPLETE request for order:', order._id);
      
      // Check if already completed
      if (order.paymentStatus === 'completed') {
        console.log('Order already completed');
        // Check if same click_trans_id was used for this payment
        if (order.providerTransactionId === String(clickTransId)) {
          console.log('Same transaction ID - idempotent response');
          const response = {
            error: 0,
            error_note: "Success",
            click_trans_id: clickTransId,
            merchant_trans_id: merchantTransId,
            merchant_confirm_id: order._id,
          };
          console.log('Response:', JSON.stringify(response, null, 2));
          return res.json(response);
        } else {
          console.error('Order already completed with different transaction ID');
          const response = {
            error: -4,
            error_note: "Order already completed",
          };
          console.log('Response:', JSON.stringify(response, null, 2));
          return res.json(response);
        }
      }

      // If Click reports error
      if (error && error < 0) {
        console.error('Click reported error:', error, errorNote);
        const response = {
          error: -9,
          error_note: `Payment error: ${errorNote}`,
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        return res.json(response);
      }

      // Mark as completed
      order.paymentStatus = "completed";
      order.providerTransactionId = clickTransId;
      await order.save();
      console.log('Order marked as completed:', order._id);

      // Deduct stock for ordered items
      await deductOrderStock(order);

      // Send Telegram notification on successful payment
      try {
        const user = order.userId ? await User.findById(order.userId) : null;
        const itemsList = order.items
          .map(
            (item) =>
              `• ${item.name}${item.description ? ` - ${item.description}` : ""}\n  Qty: ${item.quantity} | ${(
                item.price * item.quantity
              ).toLocaleString("uz-UZ")} UZS`
          )
          .join("\n");

        const customerName = user?.name || order.customer?.fullName || "Guest";
        const customerEmail = user?.email || "Not provided";
        const customerPhone = user?.phone || order.customer?.phone || "Not provided";
        const addr = user?.address
          ? `${user.address.house ? user.address.house + ", " : ""}${
              user.address.street || ""
            }, ${user.address.city || ""} ${user.address.zip || ""}`.trim()
          : order.customer?.address || "Not provided";

        const orderMessage = `
<b>🛒 New Order Placed</b>

<b>Order ID:</b> ${order._id}
<b>Payment Status:</b> ✅ Paid
<b>Provider:</b> ${order.paymentProvider}
<b>Click Trans ID:</b> ${clickTransId}

<b>Customer:</b>
• Name: ${customerName}
• Email: ${customerEmail}
• Phone: ${customerPhone}
• Address: ${addr}

<b>Products:</b>
${itemsList}

<b>Total:</b> ${order.amount.toLocaleString("uz-UZ")} UZS

<b>Time:</b> ${new Date().toISOString()}
`;
        sendNotification(orderMessage);
      } catch (e) {
        console.error("Telegram notification failed (non-blocking):", e?.message);
      }

      const response = {
        error: 0,
        error_note: "Success",
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: order._id,
      };
      console.log('COMPLETE Success. Response:', JSON.stringify(response, null, 2));
      console.log('=== END CLICK CALLBACK ===\n');
      return res.json(response);
    }

    // Unknown action
    console.error('Unknown action:', action);
    const response = { error: -3, error_note: "Action not found" };
    console.log('Response:', JSON.stringify(response, null, 2));
    return res.json(response);
  } catch (err) {
    console.error("clickCallback error:", err);
    const response = { error: -9, error_note: "System error" };
    console.log('Error Response:', JSON.stringify(response, null, 2));
    console.log('=== END CLICK CALLBACK (ERROR) ===\n');
    res.json(response);
  }
};

// UZUM BANK CALLBACK (skeleton) 
exports.uzumCallback = async (req, res) => {
  try {
    const payload = req.body;

    const orderId = payload?.orderId; // adjust to real Uzum field name
    const transactionId = payload?.transactionId;
    const status = payload?.status; // adjust to real Uzum status field

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // TODO: verify Uzum signature, amount, etc.
    if (status === "success" || status === "completed") {
      order.paymentStatus = "completed";
      order.providerTransactionId = transactionId;
      await order.save();

      // Deduct stock for ordered items
      await deductOrderStock(order);

      // Send Telegram notification on successful payment
      try {
        const user = order.userId ? await User.findById(order.userId) : null;
        const itemsList = order.items
          .map(
            (item) =>
              `• ${item.name}${item.description ? ` - ${item.description}` : ""}\n  Qty: ${item.quantity} | ${(
                item.price * item.quantity
              ).toLocaleString("uz-UZ")} UZS`
          )
          .join("\n");

        const customerName = user?.name || order.customer?.fullName || "Guest";
        const customerEmail = user?.email || "Not provided";
        const customerPhone = user?.phone || order.customer?.phone || "Not provided";
        const addr = user?.address
          ? `${user.address.house ? user.address.house + ", " : ""}${
              user.address.street || ""
            }, ${user.address.city || ""} ${user.address.zip || ""}`.trim()
          : order.customer?.address || "Not provided";

        const orderMessage = `
<b>🛒 New Order Placed</b>

<b>Order ID:</b> ${order._id}
<b>Payment Status:</b> ✅ Paid
<b>Provider:</b> ${order.paymentProvider}

<b>Customer:</b>
• Name: ${customerName}
• Email: ${customerEmail}
• Phone: ${customerPhone}
• Address: ${addr}

<b>Products:</b>
${itemsList}

<b>Total:</b> ${order.amount.toLocaleString("uz-UZ")} UZS

<b>Time:</b> ${new Date().toISOString()}
`;
        sendNotification(orderMessage);
      } catch (e) {
        console.error("Telegram notification failed (non-blocking):", e?.message);
      }

      return res.json({ success: true, message: "Payment confirmed" });
    }

    return res.json({ success: false, message: "Payment not confirmed" });
  } catch (err) {
    console.error("uzumCallback error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
