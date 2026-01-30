# Быстрая интеграция Payme (ИКПУ)

## 1️⃣ Что такое ИКПУ код?

**ИКПУ** - это 16-значный **Merchant ID** (код вашего счета в системе Payme).

Пример: `507144111111111`

Вы получите этот код при регистрации на https://merchant.paycom.uz

## 2️⃣ Три шага для подключения

### Шаг 1: Переменные окружения (.env)

```env
PAYME_MERCHANT_ID=ваш_16_значный_код
PAYME_KEY=ваш_api_ключ
PAYME_TEST_MODE=false
```

### Шаг 2: Callback URL в кабинете Payme

1. Перейти на https://merchant.paycom.uz
2. Найти ваш сервис
3. В "API Receiver URL" указать:
```
https://your-domain.com/api/payments/payme/callback
```

### Шаг 3: Frontend интеграция

```typescript
// На frontend при оплате:
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { id: 1, name: "Лекарство", price: 50000, quantity: 1 }
    ],
    amount: 50000,        // в УЗС
    provider: 'payme'     // выбор провайдера
  })
});

const { redirectUrl } = await response.json();
// Перенаправляем на Payme
window.location.href = redirectUrl;
```

## 3️⃣ Как это работает?

```
┌─────────────────┐
│   Frontend      │
│  (выбрать Payme)│
└────────┬────────┘
         │
         ├─→ POST /api/payments/create
         │
┌────────▼────────────────────────────┐
│   Backend (paymentController.js)     │
│  1. Создает заказ в БД (status: pending)
│  2. Возвращает ссылку на Payme       │
└────────┬─────────────────────────────┘
         │
         ├─→ redirectUrl: https://checkout.paycom.uz/MERCHANT_ID?orderId=...&amount=...
         │
┌────────▼─────────────────────┐
│  Payme Gateway               │
│  (пользователь вводит данные)│
└────────┬──────────────────────┘
         │
         ├─→ После оплаты
         │
┌────────▼──────────────────────────────────────┐
│   Backend получает callback                    │
│  POST /api/payments/payme/callback             │
│                                                │
│  1. CheckPerformTransaction (проверка)        │
│  2. PerformTransaction (фиксирует платеж)     │
│  3. Обновляет заказ (status: paid)            │
│  4. Отправляет уведомление в Telegram         │
└────────┬───────────────────────────────────────┘
         │
         ├─→ Уведомление на админа в Telegram
         │
```

## 4️⃣ Проверка работы

### Для тестирования используйте:

```env
PAYME_TEST_MODE=true
PAYME_MERCHANT_ID=507144
PAYME_KEY=0300BF8B4D537FD49D1F1E13B5215E58
```

### Тестовые карты:
- **Visa**: `4111 1111 1111 1111` (12/25, CVV: 000)
- **MasterCard**: `5105 1051 0510 5100` (12/25, CVV: 000)

### Проверить логи:
```bash
# Смотрите console output вашего сервера
# Там будут логи всех callback вызовов от Payme
tail -f backend.log | grep "PAYME\|CALLBACK"
```

## 5️⃣ Документы для подтверждения

При подключении к Payme понадобятся:

- [ ] ИКПУ (код счета - выдается при регистрации)
- [ ] API Key (выдается при создании интеграции)
- [ ] Callback URL вашего сервера (указан в кабинете)
- [ ] Сертификат SSL (используйте HTTPS)

## 6️⃣ Основные файлы

| Файл | Функция |
|------|---------|
| [backend/controllers/paymentController.js](../backend/controllers/paymentController.js) | Обработка платежей и callbacks |
| [backend/routes/payment.js](../backend/routes/payment.js) | API endpoints |
| [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md) | Полная документация |

## 7️⃣ Когда клиент платит

1. ✅ Заказ создается в БД (pending)
2. ✅ Пользователь переходит на Payme
3. ✅ Вводит данные карты
4. ✅ Payme отправляет callback на ваш сервер
5. ✅ Заказ обновляется (paid)
6. ✅ Админ получает уведомление в Telegram

## Готово! 🎉

Ваша интеграция Payme с ИКПУ кодом полностью настроена и готова к работе!

**Вопросы?** Смотрите полную документацию в [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md)
