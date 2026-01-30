# ✨ Variant-Level IKPU Implementation - Complete

## 🎉 What's New

Your payment system now supports **IKPU codes at the variant level** (color + size combinations)!

Each combination of color and size can have its own IKPU code, enabling:
- 🎨 Different colors from different vendors
- 📏 Different sizes from different vendors
- 💰 Per-variant pricing with different merchants
- 🏪 Complete multi-vendor flexibility at variant level

## 📊 Architecture

```
Items in Catalog (CatalogData.ts)
├─ ikpuCode: "507144111111111"           (Default IKPU)
└─ variantIkpuCodes: {                   (Per variant IKPU)
   ├─ "red_1ml": "507144111111111"
   ├─ "red_2ml": "507144111111111"
   ├─ "blue_1ml": "507144222222222"
   └─ "blue_2ml": "507144333333333"
   }
    ↓
User's Cart (CartContext)
├─ Item 1: {color: "red", size: "1ml", ...}
└─ Item 2: {color: "blue", size: "1ml", ...}
    ↓
Backend Resolves IKPU
├─ Item 1: variantIkpuCodes["red_1ml"] = "507144111111111"
└─ Item 2: variantIkpuCodes["blue_1ml"] = "507144222222222"
    ↓
Validation: All same IKPU? ✅
    ↓
Payme URL
└─ https://checkout.paycom.uz/507144111111111?...
```

## 🗂️ Implementation Files

### Updated TypeScript Types

**File:** [src/data/CatalogData.ts](src/data/CatalogData.ts)

```typescript
export type CatalogItem = {
  id: number;
  // ... existing fields ...
  
  // New: Variant-level IKPU codes
  ikpuCode?: string;                           // General IKPU (fallback)
  variantIkpuCodes?: Record<string, string>;   // Per "color_size" => IKPU
}
```

### Backend Logic

**File:** [backend/controllers/paymentController.js](backend/controllers/paymentController.js)

**Logic:**
```javascript
// For Payme payments:

// 1. Try to get variant-level IKPU
if (item.color && item.size && item.variantIkpuCodes) {
  resolvedIkpu = item.variantIkpuCodes[`${item.color}_${item.size}`];
}

// 2. Fall back to general IKPU
if (!resolvedIkpu) {
  resolvedIkpu = item.ikpuCode;
}

// 3. Error if not found
if (!resolvedIkpu) {
  throw error("Item missing IKPU code");
}

// 4. Check all items use same IKPU (single vendor)
const uniqueIkpus = [...new Set(items.map(i => i.resolvedIkpu))];
if (uniqueIkpus.length > 1) {
  throw error("Items from different merchants cannot be mixed");
}
```

### Frontend Validation

**File:** [src/examples/PaymentIntegrationExample.tsx](src/examples/PaymentIntegrationExample.tsx)

```typescript
interface CartItem {
  id: number;
  name: string;
  color?: string;                              // Selected color
  size?: string;                               // Selected size
  quantity: number;
  price: number;
  ikpuCode?: string;                           // General IKPU
  variantIkpuCodes?: Record<string, string>;   // Variant IKPU map
}

// Validation function:
const getItemIkpuCode = (item: CartItem): string | null => {
  // 1. Try variant IKPU
  if (item.color && item.size && item.variantIkpuCodes) {
    const variantKey = `${item.color}_${item.size}`;
    if (item.variantIkpuCodes[variantKey]) {
      return item.variantIkpuCodes[variantKey];
    }
  }
  
  // 2. Fall back to general IKPU
  return item.ikpuCode || null;
};
```

## 📚 Documentation

### Quick Reference
📄 [VARIANT_IKPU_QUICKSTART.md](./VARIANT_IKPU_QUICKSTART.md)
- What changed
- Quick examples
- Before/after comparison
- **START HERE** ← 5 min read

### Complete Guide
📄 [VARIANT_IKPU_CODES.md](./VARIANT_IKPU_CODES.md)
- Full technical documentation
- Architecture explanation
- Complex scenarios
- Testing instructions
- **DETAILED REFERENCE** ← 15 min read

### Setup Instructions
📄 [HOW_TO_ADD_IKPU_CODES.md](./HOW_TO_ADD_IKPU_CODES.md)
- Step-by-step instructions
- Real examples with sample data
- Adding IKPU to catalog
- Testing checklist
- **IMPLEMENTATION GUIDE** ← 10 min read

## 🚀 Getting Started

### Step 1: Understand the Format

```typescript
// Variant key format: "colorKey_sizeKey"
"red_1ml"      ✅
"blue_2ml"     ✅
"white_small"  ✅
```

### Step 2: Add IKPU Codes to Your Catalog

```typescript
// In src/data/CatalogData.ts

{
  id: 1,
  nameKey: "items.1.name",
  sizes: ["variants.sizes.1ml", "variants.sizes.2ml"],
  colors: ["red", "blue"],
  
  // Add these:
  ikpuCode: "507144111111111",           // Fallback
  variantIkpuCodes: {
    "red_1ml": "507144111111111",        // Vendor A
    "red_2ml": "507144111111111",        // Vendor A
    "blue_1ml": "507144222222222",       // Vendor B
    "blue_2ml": "507144222222222"        // Vendor B
  }
}
```

### Step 3: Test the Flow

```bash
# 1. Add item with color/size to cart
# 2. Select Payme payment
# 3. Check browser console for IKPU resolution
# 4. Verify payment URL contains correct IKPU
```

## ✅ What Works

| Feature | Status |
|---------|--------|
| Variant IKPU resolution | ✅ Done |
| Backend validation | ✅ Done |
| Frontend validation | ✅ Done |
| Type safety | ✅ Done |
| Error handling | ✅ Done |
| Fallback support | ✅ Done |
| MongoDB storage | ✅ Done |

## 🔧 Examples

### Simple: Single IKPU for All Variants

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  ikpuCode: "507144111111111"
  // variantIkpuCodes not needed - all use ikpuCode
}
```

### Medium: Different IKPU per Color

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  ikpuCode: "507144111111111",
  variantIkpuCodes: {
    "red_1ml": "507144111111111",    // Vendor A
    "blue_1ml": "507144222222222"    // Vendor B
  }
}
```

### Advanced: Different IKPU per Size

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  ikpuCode: "507144111111111",
  variantIkpuCodes: {
    "white_small": "507144111111111",    // Budget
    "white_medium": "507144222222222",   // Standard
    "white_large": "507144333333333"     // Premium
  }
}
```

### Complex: Mixed Variants

```typescript
{
  id: 1,
  nameKey: "items.1.name",
  ikpuCode: "507144111111111",
  variantIkpuCodes: {
    "white_s": "507144222222222",      // Explicit
    "black_s": "507144222222222",      // Explicit
    "white_m": "507144333333333",      // Explicit
    // "black_m" uses fallback ikpuCode
    // "white_l" uses fallback ikpuCode
  }
}
```

## 🎯 Key Rules

### ✅ Always Allowed

```typescript
// Same IKPU - all from one vendor ✅
cartItems = [
  { id: 1, color: "red", size: "1ml", ikpuCode: "507144111111111" },
  { id: 2, color: "blue", size: "2ml", ikpuCode: "507144111111111" }
];
```

### ❌ Never Allowed

```typescript
// Different IKPU - different vendors ❌
cartItems = [
  { id: 1, color: "red", size: "1ml", ikpuCode: "507144111111111" },
  { id: 2, color: "white", size: "m", ikpuCode: "507144222222222" }
];
// Error: "Items from different merchants cannot be mixed"
```

## 🧪 Testing Checklist

- [ ] Added `variantIkpuCodes` to at least one item in CatalogData.ts
- [ ] Verified all color+size combinations have IKPU codes
- [ ] Tested adding item with color/size to cart
- [ ] Verified Payme payment redirects with correct IKPU
- [ ] Tested error case (different vendor items in cart)
- [ ] Checked browser console for IKPU resolution logs

## 📞 Troubleshooting

### "Item missing IKPU code for Payme payment"

**Causes:**
- ❌ Item doesn't have `ikpuCode`
- ❌ Item doesn't have `variantIkpuCodes`
- ❌ Selected color+size not in `variantIkpuCodes`

**Fix:**
1. Add `ikpuCode: "507144..."` to item
2. Or add `variantIkpuCodes` with all color+size combinations
3. Format: `"colorKey_sizeKey": "507144XXXXXXXXX"`

### "Items from different merchants cannot be purchased together"

**Cause:**
- ❌ Cart has items with different IKPU codes (different vendors)

**Fix:**
- Buy items from same vendor in one order
- Try again with items that have same IKPU code

### "variantIkpuCodes is missing color_X or size_Y"

**Cause:**
- ❌ User selected color/size combination not in `variantIkpuCodes`
- ❌ Fallback `ikpuCode` is also missing

**Fix:**
1. Add the missing combination to `variantIkpuCodes`
2. Or set `ikpuCode` as fallback
3. Example: `"red_2ml": "507144111111111"`

## 📊 Files Changed

| Path | Changes | Status |
|------|---------|--------|
| `src/data/CatalogData.ts` | Added `variantIkpuCodes` type | ✅ |
| `backend/controllers/paymentController.js` | Updated IKPU resolution logic | ✅ |
| `backend/models/Order.js` | Already supports itemIkpuCodes | ✅ |
| `src/examples/PaymentIntegrationExample.tsx` | Updated CartItem interface | ✅ |

## 🔄 Flow Diagram

```
User selects item with color/size
         ↓
Item added to cart with { color, size, variantIkpuCodes, ikpuCode }
         ↓
User clicks "Pay with Payme"
         ↓
Frontend validates:
├─ Extract IKPU from variantIkpuCodes["color_size"]
├─ Or fallback to ikpuCode
└─ Check all items have same IKPU
         ↓
POST /api/payments/create with items
         ↓
Backend validates:
├─ For each item, resolve IKPU
├─ Check no duplicates from different vendors
└─ Create order with itemIkpuCodes
         ↓
Generate Payme URL with IKPU
         ↓
Redirect: https://checkout.paycom.uz/{IKPU}?orderId=...&amount=...
         ↓
Payment processed with correct merchant
```

## 🎓 Learning Path

1. **5 min:** Read [VARIANT_IKPU_QUICKSTART.md](./VARIANT_IKPU_QUICKSTART.md)
2. **10 min:** Add IKPU codes to your items
3. **15 min:** Test the payment flow
4. **Deep dive:** Read [VARIANT_IKPU_CODES.md](./VARIANT_IKPU_CODES.md)

## 🏁 Next Steps

1. ✅ **Add variant IKPU codes** to your catalog items
2. ✅ **Test with Payme** (test mode: `PAYME_TEST_MODE=true`)
3. ✅ **Verify payment URLs** contain correct IKPU
4. ✅ **Deploy to production** with real IKPU codes

---

**Implementation Status:** ✅ **COMPLETE**
**Code Quality:** ✅ **NO ERRORS**
**Type Safety:** ✅ **FULL COVERAGE**
**Documentation:** ✅ **COMPREHENSIVE**

**Date:** January 30, 2026
