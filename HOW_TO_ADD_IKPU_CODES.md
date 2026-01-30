# Как добавить IKPU коды в каталог товаров

## 📋 Краткое резюме

Каждый товар в каталоге должен иметь поле `ikpuCode` - это 16-digit Payme Merchant ID.

```typescript
{
  id: 1,
  name: "Syring",
  price: 25000,
  ikpuCode: "507144111111111"  // ← ДОБАВИТЬ ЭТО
}
```

## 🎯 Шаг за шагом

### Шаг 1: Откройте CatalogData.ts

```
src/data/CatalogData.ts
```

### Шаг 2: Для каждого товара добавьте ikpuCode

```typescript
export const items = [
  {
    id: 1,
    category: "injection",
    nameKey: "syring",
    descriptionKey: "syring_desc",
    price: 25000,
    // ➕ ДОБАВЬТЕ ЭТО ПОЛЕ:
    ikpuCode: "507144111111111",  // Ваш 16-digit Payme ID
    imageBase: "syring_100ml",
  },
  {
    id: 2,
    category: "equipment",
    nameKey: "bandage",
    price: 15000,
    // ➕ ДОБАВЬТЕ ЭТО ПОЛЕ:
    ikpuCode: "507144111111111",  // Ваш 16-digit Payme ID
    imageBase: "bandage_sterile",
  },
  // ... остальные товары
];
```

## ⚠️ Важные правила

### 1️⃣ Все товары должны иметь одинаковый IKPU код

```
✅ ПРАВИЛЬНО:
- Товар A: ikpuCode: "507144111111111"
- Товар B: ikpuCode: "507144111111111"
- Результат: OK, один платеж

❌ ОШИБКА:
- Товар A: ikpuCode: "507144111111111"
- Товар B: ikpuCode: "507144222222222"
- Результат: Ошибка! Разные vendorы
```

### 2️⃣ IKPU код должен быть 16 цифр

```
✅ ПРАВИЛЬНО:
507144111111111  (16 цифр)
123456789012345  (16 цифр)

❌ ОШИБКА:
507144           (слишком коротко)
5071441111111111 (слишком длинно)
```

### 3️⃣ IKPU код не должен быть пустым

```
❌ ОШИБКА:
ikpuCode: ""
ikpuCode: null
ikpuCode: undefined

✅ ПРАВИЛЬНО:
ikpuCode: "507144111111111"
```

## 📝 Полный пример

```typescript
// src/data/CatalogData.ts

export const items: CatalogItem[] = [
  // INJECTION CATEGORY
  {
    id: 1,
    category: "injection",
    nameKey: "syring_10ml",
    descriptionKey: "syring_10ml_desc",
    price: 25000,
    ikpuCode: "507144999999999",  // ← IKPU код
    imageBase: "syring_10ml",
  },
  {
    id: 2,
    category: "injection",
    nameKey: "needle_sterile",
    descriptionKey: "needle_sterile_desc",
    price: 5000,
    ikpuCode: "507144999999999",  // ← ОДИНАКОВЫЙ IKPU
    imageBase: "needle_sterile",
  },

  // EQUIPMENT CATEGORY
  {
    id: 3,
    category: "equipment",
    nameKey: "mask_n95",
    descriptionKey: "mask_n95_desc",
    price: 10000,
    ikpuCode: "507144999999999",  // ← ОДИНАКОВЫЙ IKPU
    imageBase: "mask_n95",
  },

  // SURGERY CATEGORY
  {
    id: 4,
    category: "surgery",
    nameKey: "glove_latex",
    descriptionKey: "glove_latex_desc",
    price: 8000,
    ikpuCode: "507144999999999",  // ← ОДИНАКОВЫЙ IKPU
    imageBase: "glove_latex",
  },

  // ... остальные товары с IKPU кодами
];
```

## 🧪 Тестирование

### 1. Добавьте IKPU коды в каталог

```typescript
// CatalogData.ts
{
  id: 1,
  price: 25000,
  ikpuCode: "507144",  // ← ДОБАВЛЕНО
}
```

### 2. Создайте заказ через frontend

```
Frontend:
1. Выбрать товар
2. Нажать "Оплатить через Payme"
```

### 3. Проверьте что товар имеет ikpuCode

```bash
# Откройте DevTools (F12)
# Console tab
# Смотрите запрос в Network
# POST /api/payments/create

// Должен содержать:
{
  items: [
    {
      id: 1,
      name: "Syring",
      price: 25000,
      ikpuCode: "507144"  // ← ДОЛЖНО БЫТЬ
    }
  ],
  amount: 25000,
  provider: "payme"
}
```

### 4. Проверьте ответ backend

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "paymentInitData": {
    "redirectUrl": "https://checkout.paycom.uz/507144?..."
  }
}
```

⚠️ **ВАЖНО:** URL содержит IKPU код товара!

```
https://checkout.paycom.uz/507144?orderId=507f1f77bcf86cd799439011&amount=2500000
                        ^^^^^^
                        IKPU код из товара
```

## ❓ Часто задаваемые вопросы

### Q: Можно ли использовать разные IKPU коды для разных товаров?
A: Нет. Текущая система требует одинаковый IKPU код для всех товаров в заказе. Если у вас мультивендорная система, нужно разбить заказ на несколько платежей.

### Q: Что если я забуду добавить ikpuCode?
A: Backend вернет ошибку:
```json
{
  "message": "Item missing IKPU code for Payme payment",
  "itemId": 1
}
```

### Q: Где взять IKPU код?
A: На https://merchant.paycom.uz после регистрации вы получите 16-digit Merchant ID.

### Q: Как узнать что IKPU код правильный?
A: 
- Должен быть 16 цифр
- Получен из Payme merchant cabinet
- На него поступают платежи

### Q: Нужно ли обновлять IKPU код в БД?
A: Нет. IKPU код из товара сохраняется в поле `itemIkpuCodes` при создании заказа.

## 🔧 Техническая информация

### Структура товара (TypeScript)

```typescript
export type CatalogItem = {
  id: number;
  category: string;
  nameKey: string;
  descriptionKey?: string;
  price?: number;
  
  // IKPU код для Payme
  ikpuCode?: string;  // 16-digit Merchant ID
  
  // ... другие поля
};
```

### При отправке на backend

```typescript
// Frontend отправляет
{
  items: [
    {
      id: 1,
      name: "Syring",
      price: 25000,
      quantity: 1,
      ikpuCode: "507144111111111"  // ← ВКЛЮЧЕН В ЗАПРОС
    }
  ],
  amount: 25000,
  provider: "payme"
}
```

### Backend сохраняет

```javascript
// Order в БД
{
  _id: ObjectId(...),
  items: [...],
  itemIkpuCodes: ["507144111111111"],  // ← СОХРАНЕНО
  paymentProvider: "payme",
  paymentStatus: "pending"
}
```

### Payme URL

```
https://checkout.paycom.uz/{IKPU_CODE}?orderId={ORDER_ID}&amount={AMOUNT}

Пример:
https://checkout.paycom.uz/507144111111111?orderId=507f1f77bcf86cd799439011&amount=2500000
```

## ✅ Финальный checklist

- [ ] Открыл CatalogData.ts
- [ ] Добавил `ikpuCode` ко всем товарам
- [ ] Все IKPU коды одинаковые (16 цифр)
- [ ] Нет пустых или undefined значений
- [ ] Тестировал создание заказа
- [ ] Платеж прошел успешно

---

**Готово! Ваши товары теперь имеют IKPU коды для обработки платежей через Payme!** ✅

Смотрите также: [ITEM_IKPU_CODES.md](./ITEM_IKPU_CODES.md) для более подробной информации.
