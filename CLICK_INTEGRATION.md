# Click Payment Integration Setup

## Service Information
- **Merchant**: "MEDICARE" MCHJ
- **Service ID**: 89457
- **Integration Method**: SHOP API
- **Documentation**: https://docs.click.uz

## Contacts
- **Отдел подключений**: Игамкулова Сайёра
- **Отдел продаж**: Аманжолов Абылайхан  
- **Отдел интеграций**: Саттаров Сухроб

## Setup Steps

### 1. Configure Callback URLs in Click Merchant Cabinet

1. Go to https://merchant.click.uz
2. Navigate to "Сервисы" (Services) in the left menu
3. Click the pencil icon in "Действие" (Action) column
4. Set the following callback URLs:

**Prepare URL (action=0):**
```
https://your-domain.com/api/payments/click/callback
```

**Complete URL (action=1):**
```
https://your-domain.com/api/payments/click/callback
```

### 2. Whitelist Your Server IP

If your server IP is NOT in TAS-IX network, contact Click support to add your server to the firewall whitelist:

- **Domain**: your-domain.com
- **IP Address**: your.server.ip.address
- **Port**: 443 (or your port)

**IMPORTANT**: Your IP address MUST be static. Notify Click support BEFORE changing IP or domain.

### 3. Environment Variables

Update your `.env` file:

```env
CLICK_MERCHANT_ID=your_merchant_id_from_click
CLICK_SECRET_KEY=your_secret_key_from_click
CLICK_SERVICE_ID=89457
CLICK_TEST_MODE=false
BACKEND_URL=https://your-domain.com
```

### 4. Testing

#### Test with Click Up App:

1. Install Click Up mobile app
2. Generate test payment URL:
```
https://my.click.uz/services/pay?service_id=89457&merchant_id=YOUR_MERCHANT_ID&amount=1000&transaction_param=test
```
3. Open URL in browser
4. Enter phone number or card details
5. Pay the invoice in Click Up app
6. Check your server logs for request/response

#### Test with Testing Tool:

Use Click's testing tool: https://docs.click.uz/click-api-testing

### 5. Payment Buttons

Implement both payment options on your website:

#### Option 1: Click Button (for Click users)
Documentation: https://docs.click.uz/click-button/

```html
<!-- Users registered with Click can pay via invoice -->
```

#### Option 2: Card Payment (any card)
Documentation: https://docs.click.uz/click-pay-by-card/

```html
<!-- Any user can pay by entering card number and expiry -->
```

## API Response Codes

### Error Codes
- `0` - Success
- `-1` - Sign check failed
- `-2` - Invalid amount
- `-3` - Action not found
- `-4` - Already paid
- `-5` - Order not found
- `-9` - Transaction cancelled

## Server Logs

The implementation includes detailed logging for debugging:
- All incoming requests (body and headers)
- Action type (prepare/complete)
- Order validation
- Amount verification
- Response sent to Click

Check your server logs at: `/var/log/` or your logging directory

## Important Notes

1. **Fiscalization**: If using more than 1 ИКПУ (cash register), integrate fiscalization: https://docs.click.uz/fiscalization/

2. **Logging**: The callback implementation logs all requests/responses to help debug payment issues.

3. **IP Whitelist**: Server must have static IP. Notify Click BEFORE making changes.

4. **Testing**: Complete all tests BEFORE attempting first real payment.

5. **Activation**: After providing callback URLs, notify Click support to activate your service (disabled by default).

## Support

- **Documentation**: https://docs.click.uz
- **AI Integration Bot**: https://t.me/ClickUz_IntegrationDeptBot
- **Video Tutorial**: https://www.loom.com/share/ebcd7b3246ab4c23852c00662a397863

## Integration Checklist

- [ ] Callback URLs configured in merchant.click.uz
- [ ] Server IP added to Click whitelist (if needed)
- [ ] Environment variables set
- [ ] Test payment completed successfully
- [ ] Logging system confirmed working
- [ ] Click support notified for service activation
- [ ] Both payment buttons implemented on frontend
- [ ] Fiscalization integrated (if required)
