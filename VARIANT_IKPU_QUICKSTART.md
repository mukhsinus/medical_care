# 🎨 Variant-Level IKPU Codes - Quick Start

## 📖 What Changed?

**Before:** Each item had ONE IKPU code for all colors/sizes
```typescript
{
  id: 1,
  name: "Syringe",
  ikpuCode: "507144111111111"  // ← Same for all colors & sizes
}
```

**After:** Each item can have IKPU codes per **color + size combination**
```typescript
{
  id: 1,
  name: "Syringe",
  ikpuCode: "507144111111111",                    // ← Fallback for all
  variantIkpuCodes: {                             // ← Per color+size
    "red_1ml": "507144111111111",
    "red_2ml": "507144111111111",
    "blue_1ml": "507144222222222",
    "blue_2ml": "507144333333333"
  }
}
```

## 🔍 How the System Works

### Priority Order (highest to lowest)

1. **Variant IKPU** - if item has `color` + `size` → use `variantIkpuCodes["color_size"]`
2. **General IKPU** - if variant not found → use `ikpuCode`
3. **Error** - if neither found → reject payment

### Example Flow

```javascript
// User's cart item:
{
  id: 1,
  name: "Syringe",
  color: "red",         // ← Selected color
  size: "1ml",          // ← Selected size
  variantIkpuCodes: {
    "red_1ml": "507144111111111",
    "blue_1ml": "507144222222222"
  },
  ikpuCode: "507144111111111"
}

// System resolves IKPU:
variantKey = "red_1ml"
resolvedIkpu = variantIkpuCodes["red_1ml"] = "507144111111111" ✅
```

## 📝 Format: Variant Keys

**Format:** `"colorKey_sizeKey"`

```
"red_1ml"           ✅
"blue_2ml"          ✅
"white_small"       ✅
"black_large"       ✅
"green_medium"      ✅
```

**Getting the key:**
```typescript
const variantKey = `${item.color}_${item.size}`;
```

## ⚡ Quick Examples

### Scenario 1: Single IKPU for all variants

```typescript
export const allItems = [
  {
    id: 1,
    nameKey: "items.1.name",
    sizes: ["variants.sizes.1ml", "variants.sizes.2ml"],
    colors: ["red", "blue"],
    ikpuCode: "507144111111111"  // All variants use this
    // No variantIkpuCodes needed!
  }
];
```

### Scenario 2: Different IKPU per color

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  sizes: ["variants.sizes.1ml", "variants.sizes.2ml"],
  colors: ["red", "blue"],
  
  ikpuCode: "507144111111111",
  variantIkpuCodes: {
    // Red from vendor A
    "red_1ml": "507144111111111",
    "red_2ml": "507144111111111",
    
    // Blue from vendor B
    "blue_1ml": "507144222222222",
    "blue_2ml": "507144222222222"
  }
}
```

### Scenario 3: Different IKPU per size

```typescript
{
  id: 2,
  nameKey: "items.2.name",
  sizes: ["small", "medium", "large"],
  colors: ["white"],
  
  ikpuCode: "507144111111111",
  variantIkpuCodes: {
    "white_small": "507144111111111",    // Budget vendor
    "white_medium": "507144222222222",   // Premium vendor
    "white_large": "507144333333333"     // Luxury vendor
  }
}
```

### Scenario 4: Mixed rules

```typescript
{
  id: 3,
  nameKey: "items.3.name",
  sizes: ["s", "m", "l"],
  colors: ["white", "black"],
  
  ikpuCode: "507144111111111",  // Fallback
  variantIkpuCodes: {
    // Only these are explicitly set
    "white_s": "507144222222222",
    "black_s": "507144222222222",
    "white_m": "507144333333333",
    // Others will fallback to ikpuCode
  }
}
```

## 🛠️ Backend Changes

### New Validation Logic

```javascript
// For each cart item:
let resolvedIkpu = null;

// 1. Check variant IKPU
if (item.color && item.size && item.variantIkpuCodes) {
  const variantKey = `${item.color}_${item.size}`;
  resolvedIkpu = item.variantIkpuCodes[variantKey];
}

// 2. Check general IKPU
if (!resolvedIkpu && item.ikpuCode) {
  resolvedIkpu = item.ikpuCode;
}

// 3. Error if not found
if (!resolvedIkpu) {
  return error("Item missing IKPU code");
}

// Use resolvedIkpu for payment...
```

## ✅ Frontend Changes

### Updated CartItem Type

```typescript
interface CartItem {
  id: number;
  name: string;
  color?: string;                           // New!
  size?: string;                            // New!
  quantity: number;
  price: number;
  ikpuCode?: string;                        // General IKPU
  variantIkpuCodes?: Record<string, string>; // New! Variant IKPU map
}
```

### Updated Validation

```typescript
const getItemIkpuCode = (item: CartItem): string | null => {
  // Try variant IKPU first
  if (item.color && item.size && item.variantIkpuCodes) {
    const variantKey = `${item.color}_${item.size}`;
    if (item.variantIkpuCodes[variantKey]) {
      return item.variantIkpuCodes[variantKey];
    }
  }
  
  // Fall back to general IKPU
  return item.ikpuCode || null;
};
```

## 🚫 Rules to Remember

### ✅ Allowed

- ✓ All items in order from ONE vendor (same IKPU)
- ✓ Different colors with different IKPU codes
- ✓ Different sizes with different IKPU codes
- ✓ Some variants with explicit IKPU, others using fallback

### ❌ NOT Allowed

- ✗ Items from DIFFERENT vendors in ONE order (different IKPU codes)
- ✗ Item without ANY IKPU (no ikpuCode AND no variantIkpuCodes)
- ✗ Incomplete variantIkpuCodes (must have all combinations you use)

## 📋 Files Modified

| File | Changes |
|------|---------|
| `src/data/CatalogData.ts` | Added `variantIkpuCodes` to `CatalogItem` type |
| `backend/controllers/paymentController.js` | Updated IKPU resolution logic to check variant codes |
| `src/examples/PaymentIntegrationExample.tsx` | Updated `CartItem` interface and validation |

## 📚 Full Documentation

For complete information, see:
- [VARIANT_IKPU_CODES.md](./VARIANT_IKPU_CODES.md) ← Full technical guide
- [HOW_TO_ADD_IKPU_CODES.md](./HOW_TO_ADD_IKPU_CODES.md) ← Step-by-step instructions

## 🧪 Quick Test

### Test in Browser Console

```javascript
// Check if an item has variant IKPU codes
const item = catalogItems[0];
console.log("ikpuCode:", item.ikpuCode);
console.log("variantIkpuCodes:", item.variantIkpuCodes);

// Get IKPU for a specific variant
const variantKey = "red_1ml";
const resolvedIkpu = item.variantIkpuCodes?.[variantKey] || item.ikpuCode;
console.log(`IKPU for ${variantKey}:`, resolvedIkpu);
```

## 🎯 Summary

| Feature | Before | After |
|---------|--------|-------|
| IKPU per item | ✅ | ✅ |
| IKPU per color | ❌ | ✅ |
| IKPU per size | ❌ | ✅ |
| Fallback support | ❌ | ✅ |
| Multi-vendor per item | ❌ | ✅ |
| Type safety | ✅ | ✅ |

---

**Status:** ✅ Ready to use
**Date:** January 30, 2026
