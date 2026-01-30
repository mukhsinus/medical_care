# 📱 PAYME PAYMENT INTEGRATION - COMPLETE GUIDE

## 🎯 TL;DR (Краткое резюме)

Вы интегрировали **Payme** (узбекскую платежную систему). 

**ИКПУ код** = ваш 16-значный Merchant ID

**Что нужно:**
1. Получить ИКПУ код на https://merchant.paycom.uz
2. Добавить в `.env`: `PAYME_MERCHANT_ID=ваш_код`
3. Установить callback URL в Payme кабинет
4. На frontend вызвать `/api/payments/create`

**Готово!** ✅

---

## 🗂️ ВСЕ ДОКУМЕНТЫ (выберите одну)

### 🚀 Начните ОТСЮДА (если вы в спешке)
- [**START_HERE.md**](./START_HERE.md) - 2 минуты ⚡

### 📖 Полная информация
- [**PAYME_QUICK_START.md**](./PAYME_QUICK_START.md) - основные концепции
- [**PAYME_INTEGRATION.md**](./PAYME_INTEGRATION.md) - техническая документация
- [**PAYME_CHECKLIST.md**](./PAYME_CHECKLIST.md) - пошаговые инструкции

### 🎥 Видео и примеры
- [**PAYME_VIDEO_TUTORIAL.md**](./PAYME_VIDEO_TUTORIAL.md) - 10-минутная инструкция
- [**src/examples/PaymentIntegrationExample.tsx**](./src/examples/PaymentIntegrationExample.tsx) - примеры кода

### 💻 Для разработчиков
- [**FRONTEND_PAYME_INTEGRATION.md**](./FRONTEND_PAYME_INTEGRATION.md) - frontend код
- [**PAYME_IKPU_USAGE.md**](./PAYME_IKPU_USAGE.md) - как использовать ИКПУ
- [**backend/controllers/paymentController.js**](./backend/controllers/paymentController.js) - backend код

### 📚 Дополнительно
- [**PAYME_DOCUMENTATION_INDEX.md**](./PAYME_DOCUMENTATION_INDEX.md) - полный индекс
- [**IMPLEMENTATION_SUMMARY.md**](./IMPLEMENTATION_SUMMARY.md) - что было сделано
- [**.env.example**](./.env.example) - переменные окружения

---

## ⚡ БЫСТРАЯ НАСТРОЙКА (3 шага за 5 минут)

### Шаг 1: Получить ИКПУ
```
Идите на https://merchant.paycom.uz
Зарегистрируйтесь / Войдите
Найдите ваш Merchant ID (16 цифр)
Пример: 507144111111111
```

### Шаг 2: Обновить .env
```env
PAYME_MERCHANT_ID=507144111111111
PAYME_KEY=0300BF8B4D537FD49D1F1E13B5215E58
PAYME_TEST_MODE=false
```

### Шаг 3: Установить URL в Payme
```
https://your-domain.com/api/payments/payme/callback
```

**Готово!** Платежи работают 🎉

---

## 💻 FRONTEND ПРИМЕР (одна кнопка!)

```typescript
<button onClick={async () => {
  const res = await fetch('/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: cart,
      amount: 50000,
      provider: 'payme'
    })
  });
  const data = await res.json();
  window.location.href = data.paymentInitData.redirectUrl;
}}>
  Оплатить через Payme
</button>
```

That's it! Backend делает все остальное.

---

## 🧪 ТЕСТИРОВАНИЕ

```bash
# Запустить backend
npm run dev

# Протестировать (в другом терминале)
node test-payme.js
```

**Тестовые карты:**
- Visa: `4111 1111 1111 1111`
- MasterCard: `5105 1051 0510 5100`
- Месяц: `12` Год: `25` CVV: `000`

---

## 🔄 КАК ЭТО РАБОТАЕТ

```
User: "Оплатить"
  ↓
Frontend: POST /api/payments/create
  ↓
Backend: Создает заказ, возвращает URL
  ↓
Frontend: window.location.href = URL
  ↓
Payme Gateway: User вводит карту
  ↓
Payme: Отправляет callback на backend
  ↓
Backend: Обновляет БД, отправляет Telegram
  ↓
Done: Заказ готов ✅
```

---

## ❓ ЧАСТЫЕ ВОПРОСЫ

**Q: Где мой ИКПУ код?**
A: На https://merchant.paycom.uz в разделе "Сервисы"

**Q: Что такое ИКПУ?**
A: Ваш 16-значный Merchant ID в системе Payme

**Q: Как я узнаю что платеж прошел?**
A: Проверьте БД - заказ будет иметь `paymentStatus: "paid"`

**Q: Нужен ли мне специальный код?**
A: Нет! Все уже написано. Только вызовите `/api/payments/create`

**Q: Это безопасно?**
A: Да! Backend проверяет подпись от Payme

---

## 📁 ФАЙЛЫ ПРОЕКТА

```
medical_care/
├── START_HERE.md ⭐ (начните отсюда)
├── PAYME_*.md (документация)
├── PAYME_VIDEO_TUTORIAL.md (10 мин видео)
├── FRONTEND_PAYME_INTEGRATION.md (frontend)
├── IMPLEMENTATION_SUMMARY.md (что было сделано)
├── .env.example (переменные)
├── test-payme.js (тестирование)
├── test-payme.sh (bash тесты)
├── backend/
│   ├── controllers/paymentController.js ✅
│   └── routes/payment.js ✅
└── src/
    └── examples/PaymentIntegrationExample.tsx ✅
```

---

## ✅ CHECKLIST

- [ ] ИКПУ код получен
- [ ] .env обновлен
- [ ] Callback URL установлен в Payme
- [ ] test-payme.js работает
- [ ] Frontend кнопка добавлена
- [ ] Тестовая оплата успешна
- [ ] Заказ в БД обновился
- [ ] Telegram уведомление пришло
- [ ] PAYME_TEST_MODE=false для production

---

## 🚀 PRODUCTION

Когда все работает локально:

1. Используйте **реальный ИКПУ** вместо тестового
2. Используйте **реальный API Key** 
3. Измените `PAYME_TEST_MODE=false`
4. Используйте **HTTPS с SSL**
5. Убедитесь что Callback URL верный

Больше ничего! 🎉

---

## 📞 ПОМОЩЬ

- Читайте: [START_HERE.md](./START_HERE.md)
- Смотрите: [PAYME_VIDEO_TUTORIAL.md](./PAYME_VIDEO_TUTORIAL.md)
- Поддержка Payme: merchant@paycom.uz

---

**Вы готовы к платежам!** 💳

👉 **Начните с [START_HERE.md](./START_HERE.md)**
