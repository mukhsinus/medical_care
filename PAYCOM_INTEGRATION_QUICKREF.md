# Paycom Integration Quick Reference

## Files Created

| File | Purpose |
|------|---------|
| `backend/services/paycomMerchantAPI.js` | Merchant API service layer (6 methods + receipt builder) |
| `backend/routes/paycomWebhook.js` | Webhook handler for Paycom callbacks |
| `backend/.env.example` | Environment variables template |
| `PAYCOM_MERCHANT_API_GUIDE.md` | Full implementation documentation |

## Webhook Endpoint

```
POST /api/paycom/webhook
Authorization: Basic {base64(MERCHANT_ID:MERCHANT_KEY)}
Content-Type: application/json
```

## Environment Variables Required

```bash
PAYCOM_MERCHANT_ID=your_merchant_id
PAYCOM_MERCHANT_KEY=your_merchant_key
PAYCOM_API_URL=https://api.paycom.uz
PAYCOM_TEST_MODE=true
```

## IKPU Code Resolution

For each item with variants:

```typescript
// 1. Check size-level IKPU
const ikpuCode = item.sizeIkpuCodes?.[`variants.sizes.${sizeId}`] 
  // 2. Fall back to general IKPU
  ?? item.ikpuCode 
  // 3. Error if missing
  ?? (() => { throw new Error(`No IKPU for item ${itemId}`) })();
```

## Receipt Detail Structure

```javascript
{
  receipt: {
    receipt_type: 0,  // Always 0 for sale
    items: [
      {
        title: "Product Name - Size",      // String
        price: 100000,                     // Amount in tiyin (×100 UZS)
        count: 1,                          // Quantity
        code: "00000000000012a4",          // IKPU code (hex)
        vat_percent: 12,                   // VAT percentage
        package_code: "101"                // Package code from catalog
      }
    ]
  }
}
```

## Order Status Lifecycle

```
pending → processing → completed
        ↘ cancelled
```

| Method | From → To |
|--------|-----------|
| CreateTransaction | pending → processing |
| PerformTransaction | processing → completed |
| CancelTransaction | any → cancelled |

## Merchant API Methods

| Method | Purpose | When Called |
|--------|---------|-------------|
| CheckPerformTransaction | Validate transaction | Before payment |
| CreateTransaction | Create transaction record | Payment initiated |
| PerformTransaction | Confirm payment processed | Payment completed |
| CancelTransaction | Refund transaction | User cancels/refund requested |
| CheckTransaction | Get transaction status | Status query |
| GetStatement | List transactions | Reporting |

## Common Error Codes

| Code | Error | Fix |
|------|-------|-----|
| -32504 | Invalid authorization | Check MERCHANT_ID:MERCHANT_KEY in .env |
| -31001 | Unable to find transaction | Verify order exists in database |
| -31003 | Operation not compatible with state | Check current order status before operation |

## Testing Workflow

1. **Set up credentials**:
   ```bash
   # Copy .env.example to .env and add Paycom test credentials
   cp backend/.env.example backend/.env
   ```

2. **Start server**:
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Verify webhook is accessible**:
   ```bash
   curl -X POST http://localhost:8090/api/paycom/webhook \
     -H "Authorization: Basic $(echo -n 'test:test' | base64)" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"CheckTransaction","id":1}'
   ```

4. **Configure Paycom sandbox webhook** to: `https://your-domain/api/paycom/webhook`

5. **Test payment flow** through Payme interface

## Key Features Implemented

✅ **Receipt Fiscalization**: Dynamic IKPU + VAT + package code per item
✅ **Variant Support**: Different IKPU codes for different sizes
✅ **Basic Auth**: Secure Paycom communication
✅ **Order Tracking**: Status updates from payment to completion
✅ **Error Handling**: Proper JSON-RPC 2.0 error responses
✅ **Notifications**: Telegram alerts on payment events
✅ **Fallback Logic**: Size-level → general IKPU resolution

## Database Updates

All 186 catalog items include:
- `vat_percent: 12` (VAT at 12%)
- `sizeIkpuCodes` and `sizePackageCodes` (first 3 items as examples)
- `ikpuCode` and `package_code` (general fallback)

## Integration Points

### Frontend → Backend
```
POST /api/payments/payme
```
Initiates Payme checkout with resolved IKPU code

### Payme Backend → Your Backend
```
POST /api/paycom/webhook
```
Webhook calls for: CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction

### Your Backend → Paycom API
```
POST https://api.paycom.uz (via paycomMerchantAPI.js)
```
Direct API calls for: checkPerformTransaction, performTransaction, etc.

## Logs to Monitor

- Backend console: Webhook received / processed
- Database: Order status changes
- Telegram: Payment notifications (if configured)

## Debugging Tips

1. **Enable verbose logging** in `paycomMerchantAPI.js`:
   ```javascript
   console.log('Webhook received:', req.body);
   console.log('Receipt detail:', detail);
   ```

2. **Check order in database**:
   ```javascript
   db.orders.findOne({ _id: ObjectId("...") })
   ```

3. **Verify IKPU resolution**:
   - Check `sizeIkpuCodes` for exact key format: `variants.sizes.XXX`
   - Verify fallback to `ikpuCode` works

4. **Monitor Basic Auth**:
   - Log incoming auth header
   - Compare with expected: `base64(MERCHANT_ID:MERCHANT_KEY)`

## Next Steps

1. Add Paycom credentials to `.env`
2. Configure webhook URL in Paycom dashboard
3. Test webhook with sandbox payment
4. Deploy to production when tested
5. Monitor logs and Telegram notifications
