# 🎨 Variant-Level IKPU Codes

## 📖 概览

Каждая комбинация **цвета + размера** может иметь **свой IKPU код** (16-digit Payme Merchant ID).

Это позволяет:
- ✅ Разные цвета одного товара имеют разные IKPU
- ✅ Разные размеры одного товара имеют разные IKPU
- ✅ Каждая комбинация цвет+размер может быть от разного поставщика/vendora

## 🏗️ Структура

### Иерархия IKPU кодов

```
Товар (Item)
├─ ikpuCode (общий IKPU для всех вариантов)
│  └─ Используется если нет variantIkpuCodes
├─ variantIkpuCodes (вариант-уровневые IKPU)
   ├─ "red_1ml": "507144111111111"
   ├─ "red_2ml": "507144111111111"
   ├─ "blue_1ml": "507144222222222"
   └─ "blue_2ml": "507144333333333"
```

### Приоритет IKPU

При оплате система проверяет в этом порядке:

1. **Вариант IKPU** (`variantIkpuCodes["color_size"]`)
   - Если найден - используется для этой комбинации
2. **Общий IKPU** (`ikpuCode`)
   - Если вариант-уровневого нет - используется общий
3. **Ошибка**
   - Если ни один не найден - платеж отклонен

## 📝 Примеры

### Пример 1: Простой случай (один IKPU для всех)

```typescript
{
  id: 1,
  nameKey: "items.1.name",  // "Syringe"
  category: "injection",
  sizes: ["variants.sizes.1ml", "variants.sizes.2ml", "variants.sizes.5ml"],
  colors: ["red", "blue", "yellow"],
  
  // Все размеры и цвета используют этот IKPU
  ikpuCode: "507144111111111",
  
  // variantIkpuCodes не задан, поэтому используется ikpuCode для всех комбинаций
}
```

**Результат:**
- red 1ml → 507144111111111
- red 2ml → 507144111111111
- blue 1ml → 507144111111111
- yellow 5ml → 507144111111111

### Пример 2: Разные IKPU по цветам

```typescript
{
  id: 1,
  nameKey: "items.1.name",  // "Syringe"
  category: "injection",
  sizes: ["variants.sizes.1ml", "variants.sizes.2ml", "variants.sizes.5ml"],
  colors: ["red", "blue", "yellow"],
  
  // Общий IKPU (на случай если вариант не найден)
  ikpuCode: "507144111111111",
  
  // Вариант-уровневые IKPU коды (переопределяют общий)
  variantIkpuCodes: {
    // Красные шприцы - от vendora A
    "red_1ml": "507144111111111",
    "red_2ml": "507144111111111",
    "red_5ml": "507144111111111",
    
    // Синие шприцы - от vendora B
    "blue_1ml": "507144222222222",
    "blue_2ml": "507144222222222",
    "blue_5ml": "507144222222222",
    
    // Жёлтые шприцы - от vendora C
    "yellow_1ml": "507144333333333",
    "yellow_2ml": "507144333333333",
    "yellow_5ml": "507144333333333",
  }
}
```

**Результат:**
- red 1ml → 507144111111111 (vendor A)
- blue 1ml → 507144222222222 (vendor B)
- yellow 1ml → 507144333333333 (vendor C)

### Пример 3: Разные IKPU по размерам

```typescript
{
  id: 2,
  nameKey: "items.2.name",  // "Mask"
  category: "hygiene",
  sizes: ["variants.sizes.small", "variants.sizes.medium", "variants.sizes.large"],
  colors: ["white", "blue"],
  
  ikpuCode: "507144111111111",
  
  variantIkpuCodes: {
    // Маски размера S - более дешевый vendor
    "white_small": "507144111111111",
    "blue_small": "507144111111111",
    
    // Маски размера M - главный vendor
    "white_medium": "507144222222222",
    "blue_medium": "507144222222222",
    
    // Маски размера L - премиум vendor
    "white_large": "507144333333333",
    "blue_large": "507144333333333",
  }
}
```

### Пример 4: Сложный случай (смешанные правила)

```typescript
{
  id: 3,
  nameKey: "items.3.name",  // "Glove"
  category: "hygiene",
  sizes: ["variants.sizes.s", "variants.sizes.m", "variants.sizes.l"],
  colors: ["white", "black"],
  
  // Общий IKPU используется если вариант не найден
  ikpuCode: "507144111111111",
  
  variantIkpuCodes: {
    // Некоторые комбинации явно указаны
    "white_s": "507144222222222",
    "black_s": "507144222222222",
    "white_m": "507144333333333",
    // "black_m" не указан - будет использован ikpuCode (507144111111111)
    // "white_l" не указан - будет использован ikpuCode
    // "black_l" не указан - будет использован ikpuCode
  }
}
```

**Результат:**
- white S → 507144222222222
- black S → 507144222222222
- white M → 507144333333333
- black M → 507144111111111 (fallback)
- white L → 507144111111111 (fallback)
- black L → 507144111111111 (fallback)

## 🛒 Как работает при оплате

### Сценарий 1: Товар с вариантом-IKPU

```javascript
// Пользователь добавил в корзину:
const cartItem = {
  id: 1,
  name: "Syringe",
  color: "red",      // ← Выбранный цвет
  size: "1ml",       // ← Выбранный размер
  quantity: 10,
  price: 540
};

// Backend получит:
{
  id: 1,
  color: "red",
  size: "1ml",
  variantIkpuCodes: {
    "red_1ml": "507144111111111",
    "red_2ml": "507144111111111",
    "blue_1ml": "507144222222222",
    ...
  },
  ikpuCode: "507144111111111"
}

// Логика IKPU выбора:
const variantKey = "red_1ml";
const resolvedIkpuCode = 
  variantIkpuCodes["red_1ml"] ||   // Вариант-уровневый
  ikpuCode;                         // Или общий

// Результат: resolvedIkpuCode = "507144111111111"
```

### Сценарий 2: Смешанная корзина (ошибка)

```javascript
// Пользователь добавил разные товары:
const cartItems = [
  {
    id: 1,
    name: "Syringe",
    color: "red",
    size: "1ml",
    variantIkpuCodes: { "red_1ml": "507144111111111" }
  },
  {
    id: 2,
    name: "Mask",
    color: "white",
    size: "medium",
    variantIkpuCodes: { "white_medium": "507144222222222" }
  }
];

// Разрешённые IKPU коды:
// Item 1: 507144111111111
// Item 2: 507144222222222

// Результат: ❌ ОШИБКА
// "Items from different merchants cannot be purchased together"
```

## 🔍 Как проверить IKPU в CartItem

### TypeScript интерфейс

```typescript
interface CartItem {
  id: number;
  name: string;
  color?: string;                              // Выбранный цвет
  size?: string;                               // Выбранный размер
  quantity: number;
  price: number;
  
  // IKPU информация из каталога
  ikpuCode?: string;                           // Общий IKPU
  variantIkpuCodes?: Record<string, string>;   // Вариант-уровневые IKPU
}
```

### Функция для получения IKPU

```typescript
// Utility function
export const getItemIkpuCode = (item: CartItem): string | null => {
  // 1. Если есть цвет + размер, ищем вариант-уровневый IKPU
  if (item.color && item.size && item.variantIkpuCodes) {
    const variantKey = `${item.color}_${item.size}`;
    if (item.variantIkpuCodes[variantKey]) {
      return item.variantIkpuCodes[variantKey];
    }
  }
  
  // 2. Используем общий IKPU
  if (item.ikpuCode) {
    return item.ikpuCode;
  }
  
  // 3. IKPU не найден
  return null;
};
```

### Frontend валидация

```typescript
// Проверка перед оплатой
const validateCartForPayment = (cart: CartItem[]): string | null => {
  const ikpuCodes = new Set<string>();
  
  for (const item of cart) {
    const itemIkpu = getItemIkpuCode(item);
    
    if (!itemIkpu) {
      return `Item "${item.name}" (${item.color || ''} ${item.size || ''}) missing IKPU code`;
    }
    
    ikpuCodes.add(itemIkpu);
  }
  
  // Все товары должны быть от одного vendor (одинаковый IKPU)
  if (ikpuCodes.size > 1) {
    return `Cannot mix items from different vendors. Found IKPU codes: ${Array.from(ikpuCodes).join(', ')}`;
  }
  
  return null;  // Корзина валидна
};
```

## 📋 Форматирование ключей вариантов

### Правило: `"colorKey_sizeKey"`

**Примеры ключей:**
```typescript
"red_1ml"          // Цвет "red" + Размер "1ml"
"blue_2ml"         // Цвет "blue" + Размер "2ml"
"white_small"      // Цвет "white" + Размер "small"
"black_large"      // Цвет "black" + Размер "large"
```

**Получение ключа из item:**
```typescript
const variantKey = `${item.color}_${item.size}`;
```

## ⚠️ Важные правила

### ✅ Разрешено

- ✓ Все товары в заказе от одного vendor (одинаковый IKPU)
- ✓ Разные цвета одного товара от разных vendor'ов
- ✓ Разные размеры одного товара от разных vendor'ов
- ✓ Смешивать товары если все они от одного vendor'а

### ❌ Запрещено

- ✗ Товары от разных vendor'ов в одном заказе (разные IKPU коды)
- ✗ Товар без IKPU (ни ikpuCode, ни variantIkpuCodes)
- ✗ CartItem без color/size, но с variantIkpuCodes

## 🚀 Как добавить variantIkpuCodes

### Шаг 1: Откройте CatalogData.ts

```typescript
export const allItems: CatalogItem[] = [
  {
    id: 1,
    nameKey: "items.1.name",
    category: "injection",
    sizes: ["variants.sizes.1ml", "variants.sizes.2ml", "variants.sizes.5ml"],
    colors: ["red", "blue"],
    
    // Добавьте эти две строки:
    ikpuCode: "507144111111111",           // Общий IKPU
    variantIkpuCodes: {                     // Вариант-уровневые IKPU
      "red_1ml": "507144111111111",
      "red_2ml": "507144111111111",
      "red_5ml": "507144111111111",
      "blue_1ml": "507144222222222",
      "blue_2ml": "507144222222222",
      "blue_5ml": "507144222222222",
    }
  }
];
```

### Шаг 2: Получите IKPU коды

1. Зайдите на https://merchant.paycom.uz
2. Для каждого vendor'а создайте Payme счёт
3. Каждый счёт имеет 16-digit IKPU код (Merchant ID)
4. Запишите IKPU для каждой комбинации цвет+размер

### Шаг 3: Заполните варианты

```typescript
// Для каждой комбинации цвет + размер:
variantIkpuCodes: {
  "colorKey_sizeKey": "507144XXXXXXXXX",
  // ...
}
```

## 🧪 Тестирование

### Тест 1: Проверка IKPU в каталоге

```bash
# В консоли браузера:
const item = catalogItems[0];
console.log("ikpuCode:", item.ikpuCode);
console.log("variantIkpuCodes:", item.variantIkpuCodes);
```

**Ожидается:**
```javascript
ikpuCode: "507144111111111"
variantIkpuCodes: {
  "red_1ml": "507144111111111",
  "blue_1ml": "507144222222222",
  ...
}
```

### Тест 2: Проверка выбора IKPU

```typescript
// Добавьте товар с цветом и размером в корзину
const cartItem = {
  id: 1,
  color: "red",
  size: "1ml",
  variantIkpuCodes: { "red_1ml": "507144111111111" }
};

const resolvedIkpu = getItemIkpuCode(cartItem);
console.log("Resolved IKPU:", resolvedIkpu);
// Ожидается: "507144111111111"
```

### Тест 3: Проверка валидации платежа

```bash
# POST /api/payments/create

Request:
{
  items: [
    {
      id: 1,
      color: "red",
      size: "1ml",
      variantIkpuCodes: { "red_1ml": "507144111111111" },
      price: 540
    }
  ],
  amount: 540,
  provider: "payme"
}

Response (success):
{
  orderId: "...",
  provider: "payme",
  paymentInitData: {
    redirectUrl: "https://checkout.paycom.uz/507144111111111?orderId=...&amount=54000"
  }
}
```

### Тест 4: Проверка ошибки при разных IKPU

```bash
# Попробуйте смешать товары от разных vendor'ов

Request:
{
  items: [
    {
      id: 1,
      color: "red",
      size: "1ml",
      variantIkpuCodes: { "red_1ml": "507144111111111" }
    },
    {
      id: 2,
      color: "white",
      size: "medium",
      variantIkpuCodes: { "white_medium": "507144222222222" }
    }
  ],
  amount: 1000,
  provider: "payme"
}

Response (error):
{
  message: "Items from different merchants cannot be purchased together",
  ikpuCodes: ["507144111111111", "507144222222222"],
  details: "All items in a single order must belong to the same vendor (same IKPU code)"
}
```

## 📊 Сравнение: item-level vs variant-level

| Аспект | Item-level | Variant-level |
|--------|-----------|----------------|
| **IKPU на уровне** | Весь товар | Каждая комбинация цвет+размер |
| **Разные цвета** | ❌ Один IKPU | ✅ Разные IKPU возможны |
| **Разные размеры** | ❌ Один IKPU | ✅ Разные IKPU возможны |
| **Complexity** | 🟢 Простая | 🟡 Средняя |
| **Flexibility** | 🟡 Ограниченная | 🟢 Полная |
| **Use case** | Один vendor | Много vendor'ов |

## 🎯 Итоги

1. ✅ Товар может иметь **общий IKPU** (`ikpuCode`)
2. ✅ Товар может иметь **вариант-уровневые IKPU** (`variantIkpuCodes`)
3. ✅ Вариант-уровневые IKPU **переопределяют** общий IKPU
4. ✅ При оплате система выбирает правильный IKPU
5. ✅ Все товары в заказе должны быть от **одного vendor'а** (одинаковый IKPU)

---

**Статус:** ✅ Документировано и реализовано
**Дата:** 30 января 2026
