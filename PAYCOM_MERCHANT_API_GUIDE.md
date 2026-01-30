# Paycom Merchant API Implementation Guide

## Overview

This guide documents the implementation of Paycom Merchant API for receipt fiscalization in the medical_care application. The Merchant API is used to validate and process payment transactions with dynamic fiscal data (IKPU codes, VAT, package codes).

## Quick Start

### 1. Environment Variables Setup

Add these variables to your `.env` file in the `backend/` directory:

```bash
PAYCOM_MERCHANT_ID=your_paycom_merchant_id
PAYCOM_MERCHANT_KEY=your_paycom_merchant_key
PAYCOM_API_URL=https://api.paycom.uz
PAYCOM_TEST_MODE=true
```

### 2. Get Paycom Credentials

1. **Sign up** at [Paycom Developer Console](https://developer.paycom.uz/)
2. **Create a test merchant** in the sandbox environment
3. **Obtain credentials**:
   - Merchant ID (e.g., `617051f16c8e8b76dde70d8b`)
   - Merchant Key (e.g., `jG8D4gH2kL9mN3pQ5sT7vW1xZ`)
4. **Save credentials** to your `.env` file

### 3. Webhook URL Configuration

Configure your Paycom merchant webhook to point to:

```
POST https://your-domain.com/api/paycom/webhook
```

**Authentication**: Basic Auth with `PAYCOM_MERCHANT_ID:PAYCOM_MERCHANT_KEY`

## Architecture

### Components

#### 1. **backend/services/paycomMerchantAPI.js**
Main service layer implementing all Merchant API methods:

- `buildReceiptDetail(items, catalogItems)` - Constructs fiscal detail object
- `checkPerformTransaction(transactionId, amount, detail)` - Validates transaction
- `createTransaction(orderId, amount)` - Creates new transaction
- `performTransaction(transactionId, detail)` - Confirms payment with fiscal data
- `cancelTransaction(transactionId, reason)` - Refunds transaction
- `checkTransaction(transactionId)` - Gets transaction status
- `getStatement(from, to)` - Lists transactions for date range
- `makeAuthenticatedRequest(method, params)` - Internal HTTP client with Basic Auth

#### 2. **backend/routes/paycomWebhook.js**
Webhook handler for Paycom callbacks:

- Validates incoming Basic Auth requests
- Routes methods to handlers
- Updates Order status on payment events
- Sends Telegram notifications
- Handles: CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction

#### 3. **src/data/CatalogData.ts**
Catalog items with fiscal metadata:

```typescript
interface CatalogItem {
  id: string;
  title: string;
  // ... other fields
  
  // IKPU codes (Payme Merchant IDs)
  ikpuCode?: string;                           // General IKPU
  variantIkpuCodes?: Record<string, string>;   // Per "color_size" → IKPU
  sizeIkpuCodes?: Record<string, string>;      // Per size name → IKPU
  
  // Package codes
  package_code?: string;                       // General package code
  sizePackageCodes?: Record<string, string>;   // Per size name → package code
  
  // VAT
  vat_percent: number;                         // VAT percentage (default: 12)
}
```

## Payment Flow

### 1. Customer Initiates Payment

```
Frontend → POST /api/payments/payme
    ↓
Backend resolves IKPU: variantIkpuCodes["color_size"] → ikpuCode → error
    ↓
Returns Payme URL with resolved IKPU
```

### 2. Customer Completes Payment on Payme

```
Payme Backend → POST /api/paycom/webhook (Basic Auth)
    ↓
CheckPerformTransaction: Validate order + build receipt detail
    ↓
CreateTransaction: Create transaction, update order to 'processing'
    ↓
PerformTransaction: Confirm payment, update order to 'completed'
```

### 3. Receipt Detail Structure

Each Paycom method receives a `detail` object for the receipt:

```json
{
  "receipt": {
    "receipt_type": 0,
    "items": [
      {
        "title": "Product Name - Size",
        "price": 100000,
        "count": 1,
        "code": "00000000000012a4",
        "vat_percent": 12,
        "package_code": "101"
      }
    ]
  }
}
```

**Fields**:
- `title`: Product name with variant (e.g., "Sterile Gloves - M")
- `price`: Price in **tiyin** (1 UZS = 100 tiyin)
- `count`: Quantity
- `code`: IKPU code (16-digit hex, resolved from catalog)
- `vat_percent`: VAT percentage (from catalog)
- `package_code`: Package code (from catalog or size-level)

### 4. IKPU Resolution Logic

For each item in order, resolve IKPU in this priority:

```
1. Size-level IKPU: item.sizeIkpuCodes["variants.sizes.XXX"]
2. General IKPU: item.ikpuCode
3. Error: If neither exists, throw error
```

Similarly for package code:

```
1. Size-level code: item.sizePackageCodes["variants.sizes.XXX"]
2. General code: item.package_code
3. Fallback: Use default package code
```

## Merchant API Methods

### CheckPerformTransaction

**Purpose**: Validate transaction before processing payment

**Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "CheckPerformTransaction",
  "params": {
    "account": [{ "name": "order_id", "value": "order123" }],
    "amount": 500000,
    "currency": "UZS",
    "detail": { "receipt": { ... } }
  },
  "id": 1
}
```

**Response (Success)**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "state": 0,
    "receipt": { "receipt_type": 0, "items": [...] }
  },
  "id": 1
}
```

**Response (Error)**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -31001,
    "message": "Unable to find transaction for this request"
  },
  "id": 1
}
```

### CreateTransaction

**Purpose**: Create transaction record in system

### PerformTransaction

**Purpose**: Confirm transaction after payment confirmed by Payme

### CancelTransaction

**Purpose**: Refund transaction

### CheckTransaction

**Purpose**: Get current transaction status

### GetStatement

**Purpose**: Get list of transactions for date range

## Error Codes

| Code | Meaning |
|------|---------|
| -32504 | Invalid authorization (wrong merchant ID/key) |
| -31001 | Unable to find transaction |
| -31003 | Operation is not compatible with transaction state |
| -31050 | Could not cancel transaction |

## Order Status Mapping

| Status | Paycom State | Meaning |
|--------|--------------|---------|
| `pending` | 1 | Order created, awaiting payment |
| `processing` | 1 | Payment received, processing |
| `completed` | 2 | Payment confirmed, order fulfilled |
| `cancelled` | -1 | Order cancelled or refunded |
| `failed` | -1 | Payment failed |

## Testing

### 1. Sandbox Environment

Access [Paycom Sandbox](https://developer.help.paycom.uz/pesochnitsa):

- Create test cash register
- Obtain test credentials
- Set `PAYCOM_TEST_MODE=true`

### 2. Test Payment Flow

```bash
# 1. Start backend server
cd backend
npm install
npm start

# 2. Create test order
curl -X POST http://localhost:8090/api/payments/payme \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "itemId": "1",
        "sizeId": "L",
        "colorId": "blue",
        "quantity": 2
      }
    ]
  }'

# 3. Simulate Payme webhook
curl -X POST http://localhost:8090/api/paycom/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic BASE64_ENCODED_MERCHANT:KEY" \
  -d '{
    "jsonrpc": "2.0",
    "method": "CheckPerformTransaction",
    "params": {
      "account": [{ "name": "order_id", "value": "YOUR_ORDER_ID" }],
      "amount": 100000,
      "currency": "UZS",
      "detail": { "receipt": { "receipt_type": 0, "items": [...] } }
    },
    "id": 1
  }'
```

### 3. Verify Order Status

```bash
curl http://localhost:8090/api/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.user.orders'
```

## Database Schema

### Order Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  items: [
    {
      itemId: String,
      sizeId: String,
      colorId: String,
      quantity: Number,
      ikpuCode: String  // Resolved IKPU at order time
    }
  ],
  status: String,  // 'pending', 'processing', 'completed', 'cancelled', 'failed'
  paymentMethod: String,  // 'payme', 'click', 'uzum'
  paymentStatus: String,  // 'awaiting', 'processing', 'completed', 'cancelled'
  transactionId: String,  // Paycom transaction ID
  totalAmount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### 401 Unauthorized on Webhook

**Issue**: `Invalid authorization` error

**Solution**:
1. Verify `PAYCOM_MERCHANT_ID` and `PAYCOM_MERCHANT_KEY` in `.env`
2. Check Basic Auth header: `Authorization: Basic BASE64(ID:KEY)`
3. Ensure IDs match exactly (no extra spaces)

### IKPU Code Not Found

**Issue**: `Error: Unable to resolve IKPU for item`

**Solution**:
1. Check catalog item has either `ikpuCode` or `sizeIkpuCodes`
2. Verify size name matches exactly: `variants.sizes.XXX`
3. See [HOW_TO_ADD_IKPU_CODES.md](./HOW_TO_ADD_IKPU_CODES.md) for setup

### Transaction Not Found

**Issue**: Paycom returns error code -31001

**Solution**:
1. Verify order exists in database
2. Check order ID format matches Paycom account parameter
3. Ensure amount matches: convert UZS to tiyin (×100)

## Integration Checklist

- [ ] Add Paycom credentials to `.env`
- [ ] Configure webhook URL in Paycom dashboard
- [ ] Test webhook delivery with sandbox
- [ ] Verify all 186 catalog items have `vat_percent: 12`
- [ ] Test IKPU resolution for items with sizes
- [ ] Set up Telegram bot notifications (optional)
- [ ] Test payment flow end-to-end
- [ ] Review logs in `backend/logs/`
- [ ] Deploy to production

## References

- [Paycom Merchant API Protocol](https://developer.help.paycom.uz/protokol-merchant-api/)
- [Paycom Developer Console](https://developer.paycom.uz/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Catalog Data with IKPU Codes](./VARIANT_IKPU_COMPLETE.md)
- [How to Add IKPU Codes](./HOW_TO_ADD_IKPU_CODES.md)
