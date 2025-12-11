# Click Integration Review - Security & Compliance Report

**Date:** December 2024  
**Service ID:** 89457  
**Merchant:** "MEDICARE" MCHJ  
**Documentation:** https://docs.click.uz/

---

## ✅ FIXED ISSUES

### 1. 🔴 CRITICAL: Missing Signature Verification
**Status:** ✅ FIXED

**Problem:**  
The implementation was not verifying the `sign_string` parameter sent by Click. This is a critical security vulnerability that would allow anyone to send fake payment confirmations to your callback endpoint.

**What was added:**
- MD5 signature verification using `crypto` module
- Separate signature formats for Prepare (action=0) and Complete (action=1)
- Proper error response (-1) for signature failures

**Signature formulas implemented:**
```javascript
// Prepare (action=0):
md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)

// Complete (action=1):
md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
```

**Security impact:** Without this fix, malicious actors could mark orders as paid without actual payment.

---

### 2. 🟡 Duplicate Transaction Protection
**Status:** ✅ IMPROVED

**Enhancement:**
- Added check to distinguish between duplicate requests (same `click_trans_id`) and fraud attempts (different `click_trans_id` for same order)
- Idempotent responses for legitimate duplicate requests
- Error -4 for attempts to pay already-paid orders with different transaction IDs

**Per documentation:**
> "Поставщик должен в своей биллинг системе поставить защиту от повторного проведения платежа, ранее уже подтверденного, с одним и тем же click_trans_id."

---

## ✅ COMPLIANT ASPECTS

### 1. Request/Response Structure
✅ All required parameters handled correctly:
- `click_trans_id`, `service_id`, `click_paydoc_id`, `merchant_trans_id`, `amount`, `action`, `error`, `error_note`, `sign_time`, `sign_string`

✅ Response format matches specification:
- **Prepare response:** `click_trans_id`, `merchant_trans_id`, `merchant_prepare_id`, `error`, `error_note`
- **Complete response:** `click_trans_id`, `merchant_trans_id`, `merchant_confirm_id`, `error`, `error_note`

### 2. Error Codes
✅ All standard error codes implemented:
- `0` - Success
- `-1` - Signature verification failed (NEW)
- `-2` - Invalid amount
- `-3` - Action not found
- `-4` - Already paid
- `-5` - Order not found
- `-9` - Transaction cancelled/error

### 3. Business Logic
✅ Prepare (action=0) validates:
- Order existence
- Order not already paid
- Amount matches order total

✅ Complete (action=1) handles:
- Duplicate transaction detection
- Click-reported errors (error < 0)
- Payment confirmation and status update
- Telegram notifications

### 4. Logging
✅ Comprehensive request/response logging:
- All incoming parameters logged
- Response decisions logged
- Signature verification results logged
- Useful for debugging and audit trail

---

## ⚠️ REQUIRED ACTIONS BEFORE PRODUCTION

### 1. 🔑 Add CLICK_SECRET_KEY to .env
**Priority:** CRITICAL  
**Action:** Contact Click support to obtain your SECRET_KEY

```env
CLICK_SECRET_KEY=your-secret-key-from-click
```

Without this, signature verification will fail all requests.

---

### 2. 🔄 Rotate Exposed Credentials
**Priority:** HIGH  
**Reason:** .env file was committed to Git with sensitive data

**Credentials to rotate:**
1. **MongoDB password** - Change in MongoDB Atlas, update `MONGO_URI`
2. **JWT_SECRET** - Generate new random 32+ character string
3. **JWT_REFRESH_SECRET** - Generate new random 32+ character string
4. **TELEGRAM_BOT_TOKEN** - Revoke via @BotFather, get new token
5. **Click credentials** - Request new from Click if they were exposed

**How to generate new secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. 🌐 Configure Callback URL in Merchant Cabinet
**Priority:** HIGH  
**Steps:**
1. Login to https://merchant.click.uz/
2. Navigate to "Сервисы" (Services)
3. Find Service ID 89457
4. Set callback URL: `https://your-domain.com/api/payments/click/callback`
5. Save configuration
6. Contact Саттаров Сухроб (integrations) to activate

**Note:** Use HTTPS in production. Click requires secure connections.

---

### 4. 🌍 IP Whitelisting (If Required)
**Priority:** MEDIUM (Check with Click)  
**When needed:** If your server is not in TAS-IX network

**Action:**
1. Get your server's static IP address
2. Contact Click integration department
3. Provide: domain, IP, port
4. **Important:** Notify Click before any IP changes

---

### 5. 🧪 Testing Requirements
**Priority:** HIGH  
**Before going live:**

1. **Test with Click Up app:**
   - Make small test payment (1000 UZS)
   - Verify Prepare request received and validated
   - Verify Complete request received and payment confirmed
   - Check Telegram notification sent
   - Verify order status updated in database

2. **Test error scenarios:**
   - Invalid signature (modify sign_string in test request)
   - Wrong amount (send different amount than order total)
   - Duplicate payment attempt (send Complete twice)
   - Already paid order (try to pay same order with different transaction)

3. **Monitor logs:**
   - Check all requests logged properly
   - Verify signature validation working
   - Confirm error responses formatted correctly

---

## 📋 ADDITIONAL RECOMMENDATIONS

### 1. Database Indexing
Add index on `providerTransactionId` for faster duplicate checks:
```javascript
// In Order model
orderSchema.index({ providerTransactionId: 1 });
```

### 2. Transaction Timeout
Consider adding timeout for pending transactions (e.g., 15 minutes):
```javascript
// In PREPARE handler
const prepareTimeout = 15 * 60 * 1000; // 15 minutes
order.prepareExpiresAt = new Date(Date.now() + prepareTimeout);
await order.save();
```

### 3. Webhook IP Validation
Add IP whitelist validation for Click requests:
```javascript
const CLICK_IPS = ['91.202.67.82', '91.202.67.83']; // Get actual IPs from Click
const requestIP = req.ip || req.connection.remoteAddress;
if (!CLICK_IPS.includes(requestIP)) {
  return res.json({ error: -1, error_note: "Access denied" });
}
```

### 4. Error Monitoring
Set up alerts for:
- Signature verification failures (potential fraud)
- Multiple failed payment attempts
- System errors during Complete phase

---

## 📞 CLICK CONTACTS

**Integration Support:**
- Саттаров Сухроб (integrations)
- Аманжолов Абылайхан (sales)
- Игамкулова Сайёра (connections)

**Documentation:**
- Main docs: https://docs.click.uz/
- SHOP API: https://docs.click.uz/click-api-request/

---

## ✅ CHECKLIST BEFORE GO-LIVE

- [ ] CLICK_SECRET_KEY added to .env
- [ ] All exposed credentials rotated
- [ ] Callback URL configured in merchant.click.uz
- [ ] IP whitelisting completed (if required)
- [ ] Test payment successful via Click Up app
- [ ] Error scenarios tested
- [ ] Telegram notifications working
- [ ] Logs monitoring set up
- [ ] Database indexes created
- [ ] Service activated by Click support

---

## 📊 SUMMARY

**Security Score:** 🟢 SECURE (after applying fixes)  
**Compliance:** ✅ Fully compliant with Click SHOP API specification  
**Production Ready:** 🟡 After completing required actions above

The implementation now correctly follows Click's SHOP API specification with proper signature verification, error handling, and duplicate transaction protection. Complete the checklist above before accepting real payments.
