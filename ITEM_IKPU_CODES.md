# IKPU код для каждого товара

## Обзор

В этой системе **каждый товар имеет свой IKPU код** (Merchant ID в Payme). Это позволяет обрабатывать платежи для разных vendorов/поставщиков.

## Что такое IKPU код товара?

**IKPU код товара** - это 16-значный Payme Merchant ID, связанный с конкретным товаром.

```typescript
{
  id: 1,
  name: "Лекарство А",
  price: 50000,
  ikpuCode: "507144111111111",  // IKPU код этого товара
  category: "medicine"
}
```

## Структура товара с IKPU

### В CatalogData.ts

```typescript
export type CatalogItem = {
  id: number;
  category: string;
  nameKey: string;
  price?: number;
  
  // IKPU код для Payme платежей
  ikpuCode?: string; // 16-digit Payme merchant ID
  
  // ... другие поля
};
```

### Пример в каталоге

```typescript
const catalogItems: CatalogItem[] = [
  {
    id: 1,
    category: "injection",
    nameKey: "medicine_a",
    price: 50000,
    ikpuCode: "507144111111111",  // IKPU для товара A
    imageBase: "medicine_a"
  },
  {
    id: 2,
    category: "surgery",
    nameKey: "equipment_b",
    price: 100000,
    ikpuCode: "507144222222222",  // IKPU для товара B
    imageBase: "equipment_b"
  }
];
```

## Workflow платежа с IKPU товаров

### 1. Пользователь выбирает товары

```
Корзина:
├─ Товар A (IKPU: 507144111111111)
├─ Товар B (IKPU: 507144111111111)  ← SAME IKPU
└─ Товар C (IKPU: 507144111111111)  ← SAME IKPU
```

### 2. Обработка в Backend

```javascript
// createOrderAndInitPayment
if (provider === "payme") {
  // Проверяем что все товары имеют IKPU
  for (const item of items) {
    if (!item.ikpuCode) {
      return error("Item missing IKPU code");
    }
  }
  
  // Проверяем что все товары имеют ОДИНАКОВЫЙ IKPU
  const ikpuCodes = [...new Set(items.map(i => i.ikpuCode))];
  if (ikpuCodes.length > 1) {
    return error("Items from different merchants");
  }
  
  // Используем IKPU товара
  const itemIkpuCode = items[0].ikpuCode;
  const redirectUrl = `https://checkout.paycom.uz/${itemIkpuCode}?...`;
}
```

### 3. Платежный URL

```
https://checkout.paycom.uz/{IKPU_ТОВАРА}?orderId={ORDER_ID}&amount={AMOUNT}

Пример:
https://checkout.paycom.uz/507144111111111?orderId=507f1f77bcf86cd799439011&amount=5000000
```

### 4. Payme отправляет callback

```javascript
{
  "method": "PerformTransaction",
  "params": {
    "account": { "orderId": "507f1f77bcf86cd799439011" },
    "amount": 5000000,
    "id": "transaction_id"
  }
}
```

### 5. Backend обновляет заказ

```javascript
order.paymentStatus = "paid";
order.itemIkpuCodes = ["507144111111111"];  // сохраняем IKPU коды
order.providerTransactionId = "transaction_id";
await order.save();
```

## Ограничения в текущей системе

### ❌ Нельзя смешивать товары с разными IKPU

```
❌ Ошибка:
Корзина:
├─ Товар A (IKPU: 507144111111111)
├─ Товар B (IKPU: 507144222222222)  ← РАЗНЫЙ IKPU
└─ Результат: Items from different merchants
```

### ✅ Правильно: Товары с одинаковым IKPU

```
✅ OK:
Корзина:
├─ Товар A (IKPU: 507144111111111)
├─ Товар B (IKPU: 507144111111111)  ← ОДИНАКОВЫЙ IKPU
└─ Результат: Платеж обработан
```

## Как добавить IKPU код к товару

### 1. В файле каталога (CatalogData.ts)

```typescript
export const items = [
  {
    id: 1,
    category: "injection",
    nameKey: "syring",
    descriptionKey: "syring_desc",
    price: 25000,
    ikpuCode: "507144111111111",  // ← ДОБАВЬТЕ IKPU
    imageBase: "syring_100ml",
  },
  // ... другие товары
];
```

### 2. На Frontend (при отправке заказа)

```typescript
// Товары уже имеют ikpuCode из каталога
const cartItems = [
  {
    id: 1,
    name: "Syring",
    price: 25000,
    quantity: 2,
    ikpuCode: "507144111111111"  // ← АВТОМАТИЧЕСКИ из каталога
  }
];

// Отправляем на backend
const response = await fetch('/api/payments/create', {
  method: 'POST',
  body: JSON.stringify({
    items: cartItems,
    amount: 50000,
    provider: 'payme'
  })
});
```

## Backend обработка

### Проверка IKPU при создании заказа

```javascript
exports.createOrderAndInitPayment = async (req, res) => {
  const { items, amount, provider } = req.body;

  // Проверяем для Payme
  if (provider === "payme") {
    // 1. Каждый товар должен иметь IKPU
    for (const item of items) {
      if (!item.ikpuCode) {
        return res.status(400).json({ 
          message: "Item missing IKPU code for Payme payment",
          itemId: item.id 
        });
      }
    }
    
    // 2. Все товары должны иметь одинаковый IKPU
    const ikpuCodes = [...new Set(items.map(i => i.ikpuCode))];
    if (ikpuCodes.length > 1) {
      return res.status(400).json({ 
        message: "Items from different merchants cannot be purchased together",
        ikpuCodes: ikpuCodes
      });
    }
  }

  // Создаем заказ с IKPU кодами
  const order = await Order.create({
    userId,
    items,
    amount,
    paymentProvider: provider,
    itemIkpuCodes: provider === "payme" ? items.map(i => i.ikpuCode) : undefined,
    // ...
  });

  // Используем IKPU первого товара для платежного URL
  if (provider === "payme") {
    const itemIkpuCode = items[0].ikpuCode;
    const redirectUrl = `https://checkout.paycom.uz/${itemIkpuCode}?orderId=${order._id}&amount=...`;
  }
};
```

## Модель Order в БД

```javascript
const orderSchema = new mongoose.Schema({
  // ... другие поля
  
  // IKPU коды товаров (для мультивендорной системы)
  itemIkpuCodes: [{ type: String }], // массив IKPU кодов
  
  // Например: ["507144111111111", "507144111111111"]
  // (может быть один код если товары от одного vendora)
});
```

## Пример запроса на платеж

### Frontend → Backend

```bash
POST /api/payments/create
Content-Type: application/json

{
  "items": [
    {
      "id": 1,
      "name": "Syring 100ml",
      "price": 25000,
      "quantity": 2,
      "ikpuCode": "507144111111111"
    }
  ],
  "amount": 50000,
  "provider": "payme"
}
```

### Backend → Frontend

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "provider": "payme",
  "paymentInitData": {
    "redirectUrl": "https://checkout.paycom.uz/507144111111111?orderId=507f1f77bcf86cd799439011&amount=5000000"
  }
}
```

## Тестирование

### 1. Добавить IKPU в каталог

```typescript
// CatalogData.ts
{
  id: 1,
  price: 25000,
  ikpuCode: "507144",  // тестовый код
}
```

### 2. Протестировать запрос

```bash
node test-payme.js
```

### 3. Проверить в БД

```bash
db.orders.findOne()
{
  _id: ObjectId(...),
  items: [...],
  itemIkpuCodes: ["507144"],  // ← IKPU коды сохранены
  paymentStatus: "paid"
}
```

## Ошибки и обработка

### Ошибка: Item missing IKPU code

```
❌ Status 400
{
  "message": "Item missing IKPU code for Payme payment",
  "itemId": 1
}
```

**Решение:** Добавьте `ikpuCode` в CatalogData.ts для товара

### Ошибка: Different merchants

```
❌ Status 400
{
  "message": "Items from different merchants cannot be purchased together",
  "ikpuCodes": ["507144111111111", "507144222222222"]
}
```

**Решение:** Пользователь должен выбрать товары от одного vendora

## Использование в разных сценариях

### Сценарий 1: Один vendor (текущая система)

```
Все товары от одного поставщика:
├─ Товар A (IKPU: 507144111111111)
├─ Товар B (IKPU: 507144111111111)
└─ Результат: OK, один платеж
```

### Сценарий 2: Мультивендорная система (будущее)

```
Товары от разных vendorов:
├─ Товар от Vendor A (IKPU: 507144111111111)
├─ Товар от Vendor B (IKPU: 507144222222222)
└─ Результат: Нужно разбить на разные платежи
```

## Дополнительная информация

- **IKPU код** = 16-digit Payme Merchant ID
- **itemIkpuCodes** = массив IKPU кодов в заказе
- **Текущее ограничение** = одинаковые IKPU для всех товаров
- **Будущая возможность** = разные IKPU (требует изменения workflow'а)

---

**Используйте IKPU коды товаров для правильной обработки платежей через Payme!** 💳
