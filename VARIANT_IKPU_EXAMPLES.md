# 📝 Real-World IKPU Examples

## Example 1: Syringe with Different Vendor Colors

This syringe exists in 2 colors from 2 different vendors:
- Red syringes → Vendor A (IKPU: `507144111111111`)
- Blue syringes → Vendor B (IKPU: `507144222222222`)

Each vendor has the same sizes (1ml, 2ml, 5ml).

### CatalogData.ts

```typescript
{
  id: 1,
  category: "injection",
  nameKey: "items.1.name",  // "Syringe"
  descriptionKey: "items.1.description",
  
  sizes: [
    "variants.sizes.1ml",
    "variants.sizes.2ml",
    "variants.sizes.5ml"
  ],
  
  colors: ["red", "blue"],  // ← Two colors
  
  // Prices are the same for all variants
  sizePrices: {
    "variants.sizes.1ml": 540,
    "variants.sizes.2ml": 420,
    "variants.sizes.5ml": 448
  },
  
  // ✨ NEW: Variant-level IKPU codes
  ikpuCode: "507144111111111",  // Fallback (Vendor A)
  
  variantIkpuCodes: {
    // Red syringes - Vendor A
    "red_1ml": "507144111111111",
    "red_2ml": "507144111111111",
    "red_5ml": "507144111111111",
    
    // Blue syringes - Vendor B
    "blue_1ml": "507144222222222",
    "blue_2ml": "507144222222222",
    "blue_5ml": "507144222222222"
  }
}
```

### How It Works

```typescript
// User adds: Red Syringe 2ml
const cartItem = {
  id: 1,
  name: "Syringe",
  color: "red",          // ← Selected
  size: "2ml",           // ← Selected
  quantity: 5,
  price: 420
};

// Backend resolves IKPU:
const variantKey = "red_2ml";
const ikpuCode = variantIkpuCodes["red_2ml"];  // "507144111111111" (Vendor A)

// Payment URL:
// https://checkout.paycom.uz/507144111111111?orderId=...
```

---

## Example 2: Medical Glove with Size-Based Vendors

This glove exists in 3 sizes from 3 different vendors:
- Small → Vendor A (cheap, basic)
- Medium → Vendor B (standard, quality)
- Large → Vendor C (premium, luxury)

All sizes come in 2 colors (white, black).

### CatalogData.ts

```typescript
{
  id: 10,
  category: "hygiene",
  nameKey: "items.10.name",  // "Medical Glove"
  
  sizes: ["small", "medium", "large"],
  colors: ["white", "black"],
  
  sizePrices: {
    "small": 25000,
    "medium": 35000,
    "large": 45000
  },
  
  // ✨ NEW: Different vendor per size
  ikpuCode: "507144111111111",  // Fallback
  
  variantIkpuCodes: {
    // Small gloves - Vendor A (budget)
    "white_small": "507144111111111",
    "black_small": "507144111111111",
    
    // Medium gloves - Vendor B (standard)
    "white_medium": "507144222222222",
    "black_medium": "507144222222222",
    
    // Large gloves - Vendor C (premium)
    "white_large": "507144333333333",
    "black_large": "507144333333333"
  }
}
```

### Cart Examples

```typescript
// ✅ ALLOWED: Same size (same vendor)
cart = [
  { id: 10, color: "white", size: "medium", ikpu: "507144222222222" },  // Vendor B
  { id: 10, color: "black", size: "medium", ikpu: "507144222222222" }   // Vendor B
]
// Result: Payment successful ✅

// ✅ ALLOWED: Different sizes from same vendor (if all from vendor B)
cart = [
  { id: 10, color: "white", size: "medium", ikpu: "507144222222222" },  // Vendor B
  { id: 20, color: "blue", size: "any", ikpu: "507144222222222" }       // Vendor B
]
// Result: Payment successful ✅

// ❌ NOT ALLOWED: Different sizes from different vendors
cart = [
  { id: 10, color: "white", size: "small", ikpu: "507144111111111" },   // Vendor A
  { id: 10, color: "black", size: "large", ikpu: "507144333333333" }    // Vendor C
]
// Result: Error ❌ "Items from different merchants cannot be mixed"
```

---

## Example 3: Face Mask with Partial Variant Setup

This mask is from one main vendor but has special contracts for:
- Extra small size → special supplier
- Extra large size → special supplier
- Medium and large → main vendor (fallback)

### CatalogData.ts

```typescript
{
  id: 20,
  category: "hygiene",
  nameKey: "items.20.name",  // "Face Mask"
  
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: ["white", "blue"],
  
  sizePrices: {
    "XS": 5000,
    "S": 7500,
    "M": 10000,
    "L": 10000,
    "XL": 12000
  },
  
  // ✨ NEW: Only explicit special sizes, rest use fallback
  ikpuCode: "507144111111111",  // Main vendor
  
  variantIkpuCodes: {
    // XS - special supplier
    "white_XS": "507144444444444",
    "blue_XS": "507144444444444",
    
    // S - main vendor (use fallback)
    // "white_S": no entry → uses ikpuCode
    // "blue_S": no entry → uses ikpuCode
    
    // M - main vendor (use fallback)
    // L - main vendor (use fallback)
    
    // XL - special supplier
    "white_XL": "507144555555555",
    "blue_XL": "507144555555555"
  }
}
```

### Resolved IKPU for Each Variant

| Size | Color | Resolution | IKPU Code |
|------|-------|-----------|-----------|
| XS | white | variantIkpuCodes | 507144444444444 |
| XS | blue | variantIkpuCodes | 507144444444444 |
| S | white | fallback → ikpuCode | 507144111111111 |
| S | blue | fallback → ikpuCode | 507144111111111 |
| M | white | fallback → ikpuCode | 507144111111111 |
| M | blue | fallback → ikpuCode | 507144111111111 |
| L | white | fallback → ikpuCode | 507144111111111 |
| L | blue | fallback → ikpuCode | 507144111111111 |
| XL | white | variantIkpuCodes | 507144555555555 |
| XL | blue | variantIkpuCodes | 507144555555555 |

---

## Example 4: Complete Product with Colors and Sizes

This is a comprehensive example with:
- 3 colors
- 4 sizes per color
- Mixed vendor setup

### CatalogData.ts

```typescript
{
  id: 30,
  category: "injection",
  nameKey: "items.30.name",  // "Premium Syringe"
  
  sizes: [
    "variants.sizes.1ml",
    "variants.sizes.2ml",
    "variants.sizes.5ml",
    "variants.sizes.10ml"
  ],
  
  colors: ["red", "blue", "yellow"],
  
  sizePrices: {
    "variants.sizes.1ml": 500,
    "variants.sizes.2ml": 600,
    "variants.sizes.5ml": 800,
    "variants.sizes.10ml": 1200
  },
  
  // ✨ Complete variant-level IKPU setup
  ikpuCode: "507144111111111",  // Fallback if variant missing
  
  variantIkpuCodes: {
    // RED - Vendor A
    "red_1ml": "507144111111111",
    "red_2ml": "507144111111111",
    "red_5ml": "507144111111111",
    "red_10ml": "507144111111111",
    
    // BLUE - Vendor B
    "blue_1ml": "507144222222222",
    "blue_2ml": "507144222222222",
    "blue_5ml": "507144222222222",
    "blue_10ml": "507144222222222",
    
    // YELLOW - Vendor C
    "yellow_1ml": "507144333333333",
    "yellow_2ml": "507144333333333",
    "yellow_5ml": "507144333333333",
    "yellow_10ml": "507144333333333"
  }
}
```

### Matrix View

|       | 1ml | 2ml | 5ml | 10ml |
|-------|-----|-----|-----|------|
| **Red** | A | A | A | A |
| **Blue** | B | B | B | B |
| **Yellow** | C | C | C | C |

Legend: A = 507144111111111, B = 507144222222222, C = 507144333333333

---

## Example 5: Mixing Items with Different Setups

One item uses general IKPU, another uses variant IKPU.

### CatalogData.ts

```typescript
// Item 1: Simple general IKPU (no variants)
{
  id: 40,
  nameKey: "items.40.name",
  ikpuCode: "507144111111111"
  // No colors, no sizes
}

// Item 2: Complex variant IKPU
{
  id: 41,
  nameKey: "items.41.name",
  sizes: ["small", "large"],
  colors: ["white", "black"],
  ikpuCode: "507144111111111",
  variantIkpuCodes: {
    "white_small": "507144111111111",
    "white_large": "507144222222222",
    "black_small": "507144111111111",
    "black_large": "507144222222222"
  }
}
```

### Cart Scenarios

```typescript
// ✅ Cart 1: Both items from Vendor A
cart = [
  { id: 40, ikpuCode: "507144111111111" },                    // Simple
  { id: 41, color: "white", size: "small", ikpu: "507144111111111" }  // Variant (resolved)
]
// All same IKPU → Payment OK ✅

// ❌ Cart 2: Mixed vendors
cart = [
  { id: 40, ikpuCode: "507144111111111" },                    // Vendor A
  { id: 41, color: "white", size: "large", ikpu: "507144222222222" }  // Vendor B
]
// Different IKPU → Error ❌

// ✅ Cart 3: Multiple items, same vendor (variant)
cart = [
  { id: 41, color: "white", size: "small", ikpu: "507144111111111" },  // Vendor A
  { id: 41, color: "black", size: "small", ikpu: "507144111111111" },  // Vendor A
]
// All same IKPU → Payment OK ✅
```

---

## Example 6: How to Migrate from Item-Level to Variant-Level

### Before (Item-level only)

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  colors: ["red", "blue"],
  ikpuCode: "507144111111111"  // All colors use same IKPU
}
```

### After (Variant-level support)

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  colors: ["red", "blue"],
  ikpuCode: "507144111111111",  // Keep as fallback
  variantIkpuCodes: {           // Add new variants
    "red_*": "507144111111111",  // Red from same vendor
    "blue_*": "507144222222222"  // Blue from different vendor
  }
}
```

**No breaking changes!** The old setup still works with the new system.

---

## Testing Your Setup

### Step 1: Check Catalog

```javascript
// Browser console:
const item = catalogItems[0];
console.log("General IKPU:", item.ikpuCode);
console.log("Variant IKPU:", item.variantIkpuCodes);
```

**Expected output:**
```
General IKPU: 507144111111111
Variant IKPU: {
  red_1ml: "507144111111111",
  blue_1ml: "507144222222222",
  ...
}
```

### Step 2: Add to Cart

```javascript
// Add item with color/size
const addToCart = (itemId, color, size, quantity) => {
  const item = catalogItems.find(i => i.id === itemId);
  // Cart includes: color, size, variantIkpuCodes, ikpuCode
};
```

### Step 3: Checkout

```javascript
// During checkout validation:
const getIkpu = (cartItem) => {
  if (cartItem.color && cartItem.size && cartItem.variantIkpuCodes) {
    return cartItem.variantIkpuCodes[`${cartItem.color}_${cartItem.size}`];
  }
  return cartItem.ikpuCode;
};
```

### Step 4: Verify Payment URL

```
Before:  https://checkout.paycom.uz/507144111111111?orderId=...
After:   https://checkout.paycom.uz/507144111111111?orderId=...
         (same merchant, but selected via variant logic)
```

---

## Quick Copy-Paste Templates

### Template 1: Single Vendor, All Colors/Sizes

```typescript
{
  id: YOUR_ID,
  nameKey: "items.YOUR_ID.name",
  category: "YOUR_CATEGORY",
  sizes: ["size1", "size2", "size3"],
  colors: ["color1", "color2"],
  
  ikpuCode: "507144111111111",
  // No variantIkpuCodes needed - all use general IKPU
}
```

### Template 2: Color-Based Vendors

```typescript
{
  id: YOUR_ID,
  nameKey: "items.YOUR_ID.name",
  category: "YOUR_CATEGORY",
  sizes: ["size1", "size2"],
  colors: ["color1", "color2"],
  
  ikpuCode: "507144111111111",  // Fallback
  variantIkpuCodes: {
    "color1_size1": "507144111111111",  // Vendor A
    "color1_size2": "507144111111111",  // Vendor A
    "color2_size1": "507144222222222",  // Vendor B
    "color2_size2": "507144222222222"   // Vendor B
  }
}
```

### Template 3: Size-Based Vendors

```typescript
{
  id: YOUR_ID,
  nameKey: "items.YOUR_ID.name",
  category: "YOUR_CATEGORY",
  sizes: ["small", "medium", "large"],
  colors: ["white"],
  
  ikpuCode: "507144111111111",  // Fallback
  variantIkpuCodes: {
    "white_small": "507144111111111",    // Vendor A
    "white_medium": "507144222222222",   // Vendor B
    "white_large": "507144333333333"     // Vendor C
  }
}
```

### Template 4: Complex Mixed

```typescript
{
  id: YOUR_ID,
  nameKey: "items.YOUR_ID.name",
  category: "YOUR_CATEGORY",
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: ["white", "black", "navy"],
  
  ikpuCode: "507144111111111",  // Main vendor
  variantIkpuCodes: {
    // Only special cases - others use fallback
    "white_XS": "507144222222222",    // Special supplier
    "black_XS": "507144222222222",    // Special supplier
    "white_XL": "507144333333333",    // Special supplier
    "black_XL": "507144333333333"     // Special supplier
    // Rest (S, M, L in all colors) use fallback ikpuCode
  }
}
```

---

**Date:** January 30, 2026
