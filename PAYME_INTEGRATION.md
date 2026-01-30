# Payme Payment Integration Setup

## О ИКПУ Коде (Merchant ID)

**ИКПУ** - это уникальный идентификационный код вашего счета (merchant code) в системе Payme. Это 16-значный код, который выдается Payme при подключении.

## Service Information
- **System**: Paycom (Payme)
- **Merchant Code (ИКПУ)**: Предоставляется Payme при подключении
- **Integration Method**: API Receiver
- **Documentation**: https://paycom.uz/ru/developers/

## Payme Account Setup

### 1. Получение учетных данных

1. Зарегистрируйтесь на https://merchant.paycom.uz
2. Создайте новый сервис
3. Получите следующие данные:
   - **Merchant ID (ИКПУ)** - код вашего счета (16 цифр)
   - **API Key** - секретный ключ для API интеграции

### 2. Настройка переменных окружения

Обновите файл `.env`:

```env
# Payme Payment Integration
PAYME_MERCHANT_ID=your_16_digit_merchant_id
PAYME_KEY=your_api_key
PAYME_TEST_MODE=false

# При тестировании используйте:
# PAYME_TEST_MODE=true
# PAYME_KEY=0300BF8B4D537FD49D1F1E13B5215E58 (test key)
```

### 3. Настройка Callback URL в личном кабинете Payme

1. Войдите в https://merchant.paycom.uz
2. Перейдите в настройки сервиса
3. В разделе "API Receiver URL" установите:

```
https://your-domain.com/api/payments/payme/callback
```

4. Сохраните настройки

### 4. Тестирование

#### Тестовые данные:
```env
PAYME_TEST_MODE=true
PAYME_MERCHANT_ID=507144
PAYME_KEY=0300BF8B4D537FD49D1F1E13B5215E58
```

#### Тестовые карты:
- **MasterCard**: 5105105105105100 (срок: 12/25, CVV: 000)
- **Visa**: 4111111111111111 (срок: 12/25, CVV: 000)

### 5. Workflow платежа в Payme

#### Frontend отправляет:
```javascript
POST /api/payments/create
{
  "items": [...],
  "amount": 50000,
  "provider": "payme"
}
```

#### Backend возвращает:
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "provider": "payme",
  "paymentInitData": {
    "redirectUrl": "https://checkout.paycom.uz/MERCHANT_ID?orderId=507f1f77bcf86cd799439011&amount=5000000"
  }
}
```

#### Пользователь переходит на Payme:
- Вводит данные карты на шлюзе Payme
- Подтверждает платеж

#### Payme отправляет callback на `/api/payments/payme/callback`:

**1. CheckPerformTransaction** - проверка перед платежом:
```json
{
  "jsonrpc": "2.0",
  "method": "CheckPerformTransaction",
  "params": {
    "account": {
      "orderId": "507f1f77bcf86cd799439011"
    },
    "amount": 5000000,
    "id": "123456789"
  },
  "id": 1
}
```

**2. PerformTransaction** - выполнение платежа:
```json
{
  "jsonrpc": "2.0",
  "method": "PerformTransaction",
  "params": {
    "account": {
      "orderId": "507f1f77bcf86cd799439011"
    },
    "amount": 5000000,
    "id": "transaction_id_from_payme",
    "time": 1234567890
  },
  "id": 1
}
```

## API Error Codes

### CheckPerformTransaction & PerformTransaction

| Code | Описание |
|------|----------|
| -31050 | Order not found (Заказ не найден) |
| -31001 | Invalid amount (Неверная сумма) |
| -31099 | Order already paid (Заказ уже оплачен) |
| -32504 | Insufficient privilege (Недостаточно прав) |

### CancelTransaction

| Code | Описание |
|------|----------|
| -31007 | Transaction not found (Транзакция не найдена) |

## Security Best Practices

### 1. HTTPS только
- Используйте только HTTPS для всех API вызовов
- Payme не примет HTTP callback URLs

### 2. API Key
- НЕ коммитьте API Key в Git репозиторий
- Используйте только переменные окружения
- Регулярно меняйте API Key в личном кабинете

### 3. IP Whitelist (опционально)
- Если доступно в настройках, активируйте IP whitelist
- Добавьте IP адреса Payme серверов

### 4. Идемпотентность
- Backend должен обрабатывать повторные callback вызовы
- Используйте `providerTransactionId` как уникальный идентификатор

## Troubleshooting

### Callback не приходит
1. Проверьте, что URL установлен в личном кабинете Payme
2. Убедитесь, что используется HTTPS
3. Проверьте логи сервера на ошибки
4. Используйте режим TEST для проверки локально через ngrok

### Amount mismatch error
- Паyme отправляет сумму в **тийинах** (1 УЗС = 100 тийинов)
- Backend автоматически конвертирует: `amount * 100`

### Signature/Authorization failed
- Проверьте, что API Key совпадает в `.env`
- Убедитесь, что не используется пробел в ключе

## Документация

- **Payme Developers**: https://paycom.uz/ru/developers/
- **API Receiver**: https://paycom.uz/ru/developers/api/checkout/
- **Merchant Cabinet**: https://merchant.paycom.uz

## Контакты Payme (Узбекистан)

- **Email**: merchant@paycom.uz
- **Телефон**: +998 71 200-0-200
- **Документация**: https://paycom.uz/ru/developers/
