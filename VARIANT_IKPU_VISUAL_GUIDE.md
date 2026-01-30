# 📊 Variant-Level IKPU - Visual Guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│          MEDICAL CARE PLATFORM                       │
│          Payme Payment Integration                   │
└─────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  CATALOG (CatalogData.ts)                          │
│                                                    │
│  Item: Syringe                                     │
│  ├─ ikpuCode: "507144111111111"                   │
│  └─ variantIkpuCodes: {                           │
│     ├─ "red_1ml": "507144111111111"   (Vendor A)  │
│     ├─ "red_2ml": "507144111111111"   (Vendor A)  │
│     ├─ "blue_1ml": "507144222222222"  (Vendor B)  │
│     └─ "blue_2ml": "507144222222222"  (Vendor B)  │
│  }                                                │
└────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────┐
│  USER CART (CartContext)                           │
│                                                    │
│  Item 1: Syringe                                   │
│  ├─ color: "red"                                  │
│  ├─ size: "1ml"                                   │
│  └─ quantity: 5                                   │
│                                                    │
│  Item 2: Syringe                                   │
│  ├─ color: "red"                                  │
│  ├─ size: "2ml"                                   │
│  └─ quantity: 3                                   │
└────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────┐
│  FRONTEND VALIDATION (React)                       │
│                                                    │
│  Item 1:                                           │
│  └─ getItemIkpuCode() →                           │
│     variantIkpuCodes["red_1ml"]                   │
│     → "507144111111111"                            │
│                                                    │
│  Item 2:                                           │
│  └─ getItemIkpuCode() →                           │
│     variantIkpuCodes["red_2ml"]                   │
│     → "507144111111111"                            │
│                                                    │
│  ✅ All same IKPU! → Allow payment                │
└────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────┐
│  BACKEND (paymentController.js)                    │
│                                                    │
│  POST /api/payments/create                         │
│  {                                                 │
│    items: [                                        │
│      {id: 1, color: "red", size: "1ml", ...},    │
│      {id: 1, color: "red", size: "2ml", ...}     │
│    ],                                              │
│    amount: 2640,                                   │
│    provider: "payme"                               │
│  }                                                 │
│                                                    │
│  ↓ Validate IKPU                                  │
│  ├─ Item 1 → resolve IKPU → "507144111111111"    │
│  ├─ Item 2 → resolve IKPU → "507144111111111"    │
│  └─ All same ✅                                   │
│                                                    │
│  Create Order with itemIkpuCodes:                  │
│  ["507144111111111", "507144111111111"]            │
└────────────────────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────┐
│  PAYME GATEWAY                                      │
│                                                    │
│  URL: https://checkout.paycom.uz/507144111111111  │
│       ?orderId=ORDER_ID&amount=264000              │
│                      ↓                              │
│  Uses correct IKPU (Vendor A's account)            │
│  Payment processed to Vendor A ✅                  │
└────────────────────────────────────────────────────┘
```

---

## IKPU Resolution Flow

```
┌─────────────────────────────────────────┐
│  Does user's CartItem have:             │
│  • color?                               │
│  • size?                                │
│  • variantIkpuCodes?                    │
└──────────┬──────────────────────────────┘
           │
      YES  │  NO
      │    └─────────────────────────────┐
      │                                  │
      ↓                                  ↓
┌────────────────────────┐  ┌──────────────────────────────┐
│ Check                  │  │ Use                          │
│ variantIkpuCodes       │  │ ikpuCode (fallback)         │
│ ["color_size"]         │  │                              │
└─────┬──────────────────┘  └──────────┬───────────────────┘
      │                                │
      │ Found  │ Not Found             │
      │        │                       │
      ↓        ↓                       ↓
   Use it    Check    ← ─ ─ ─ ─ ─ ─ ─ ┘
             ikpuCode

      ↓
┌─────────────────────┐
│ Got IKPU Code? ✅   │
└─────┬───────────────┘
      │
   YES │ NO
   │   │
   │   └─→ ❌ ERROR
   │       "Item missing IKPU code"
   │
   ↓
┌─────────────────────────────────────┐
│ Check all cart items use            │
│ same IKPU code (same vendor) ✅      │
└─────────────────────────────────────┘
```

---

## Data Structure

### Before (Item-Level Only)

```typescript
CatalogItem {
  id: 1
  name: "Syringe"
  price: 540
  colors: ["red", "blue"]
  sizes: ["1ml", "2ml"]
  
  ikpuCode: "507144111111111"  ← Same for ALL colors/sizes
}
```

**Problem:** Red and blue syringes have same merchant ID, but they're from different vendors!

### After (Variant-Level Support)

```typescript
CatalogItem {
  id: 1
  name: "Syringe"
  price: 540
  colors: ["red", "blue"]
  sizes: ["1ml", "2ml"]
  
  ikpuCode: "507144111111111"  ← Fallback/default
  
  variantIkpuCodes: {          ← Per color+size variant
    "red_1ml": "507144111111111"    (Vendor A)
    "red_2ml": "507144111111111"    (Vendor A)
    "blue_1ml": "507144222222222"   (Vendor B)
    "blue_2ml": "507144222222222"   (Vendor B)
  }
}
```

**Solution:** Each color has its own IKPU pointing to correct vendor!

---

## Key Format Examples

### Valid Formats

```
"red_1ml"       ✅ color_size
"blue_2ml"      ✅ color_size
"white_small"   ✅ color_size
"black_medium"  ✅ color_size
"navy_large"    ✅ color_size
```

### Invalid Formats

```
"red"           ❌ Missing size
"1ml"           ❌ Missing color
"red-1ml"       ❌ Wrong separator (- instead of _)
"red 1ml"       ❌ Wrong separator (space instead of _)
"RED_1ML"       ❌ Wrong case (colors/sizes are lowercase)
"red_1 ml"      ❌ Space in size
```

### How to Build Correct Key

```typescript
// Given:
const item = {
  color: "red",
  size: "1ml"
};

// Build key:
const variantKey = `${item.color}_${item.size}`;
// Result: "red_1ml" ✅
```

---

## Priority/Fallback Hierarchy

```
                    ┌─────────────────────────────┐
                    │ Need IKPU for item?         │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
           PRIORITY 1        PRIORITY 2   PRIORITY 3
                    │                     │
         ┌──────────▼────┐   ┌───────────▼──────┐   ┌────────▼──────────┐
         │ variantIkpu   │   │  General ikpu    │   │  No IKPU found   │
         │ Codes         │   │  Code            │   │  ❌ ERROR         │
         │ ["color_size"]│   │                  │   │                   │
         └───────┬───────┘   └────────┬─────────┘   └────────┬──────────┘
                 │                    │                      │
          Found? │ Not found          │               "Item missing IKPU"
           │     │  ↓                 │
           ↓     └──→ Use it          ↓
           
         Use it           Use it     Return error


Example 1: Has variant → Use variant IKPU
───────────────────────────────────────
variantIkpuCodes["red_1ml"] = "507144111111111"  ← Found! Use this
ikpuCode = "507144111111111"                      (ignored)


Example 2: No variant → Use general IKPU
──────────────────────────────────────
variantIkpuCodes["red_1ml"] = undefined           (not found)
ikpuCode = "507144111111111"                      ← Use this


Example 3: No IKPU anywhere → Error
──────────────────────────────
variantIkpuCodes["red_1ml"] = undefined           (not found)
ikpuCode = undefined                              (not found)
                                                  → ❌ ERROR
```

---

## Validation Rules Visualization

```
┌─────────────────────────────────────────────────┐
│ SINGLE VENDOR RULE                              │
│                                                 │
│ All items in ONE ORDER must come from           │
│ ONE VENDOR (same IKPU code)                     │
└─────────────────────────────────────────────────┘

✅ ALLOWED                          ❌ NOT ALLOWED
─────────────────────              ─────────────────

Cart:                              Cart:
├─ Red Syringe                     ├─ Red Syringe (IKPU A)
│  IKPU: 507144111111111           └─ Blue Mask (IKPU B)
├─ Red Mask                        
│  IKPU: 507144111111111           Different IKPU codes
└─ Red Glove
   IKPU: 507144111111111           ❌ ERROR
                                   "Items from different
All same IKPU (A)                  merchants cannot be
                                   purchased together"
✅ Payment succeeds


Cart:                              Cart:
├─ Red Syringe (IKPU B)            ├─ Red Syringe (has IKPU)
├─ Black Syringe (IKPU B)          └─ Blue Mask
└─ White Glove (IKPU B)            (missing IKPU entirely)
                                   
All same IKPU (B)                  ❌ ERROR
                                   "Item missing IKPU code"
✅ Payment succeeds
```

---

## Backend Processing Pipeline

```
Request arrives:
{
  items: [
    {id: 1, color: "red", size: "1ml", variantIkpuCodes: {...}, ikpuCode: "A"},
    {id: 2, color: "white", size: "small", variantIkpuCodes: {...}, ikpuCode: "B"}
  ],
  provider: "payme"
}
  │
  ├─→ Is provider "payme"? ──→ YES
  │                            │
  │                            ├─→ For each item:
  │                            │   ├─ Try variantIkpuCodes["red_1ml"]? ✓ → Got "A"
  │                            │   ├─ Try variantIkpuCodes["white_small"]? ✓ → Got "B"
  │                            │   └─ Store in item._resolvedIkpuCode
  │                            │
  │                            ├─→ Get unique IKPU codes: ["A", "B"]
  │                            │
  │                            ├─→ Count unique: 2 (more than 1!)
  │                            │
  │                            └─→ ❌ REJECT
  │                               "Items from different merchants"
  │
  └─→ Other provider? ──→ Skip IKPU validation
                          (only Payme needs it)

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

If all items have same IKPU:
  │
  ├─→ Create Order in DB with:
  │   └─ itemIkpuCodes: ["507144111111111", "507144111111111"]
  │
  ├─→ Generate Payme URL:
  │   └─ https://checkout.paycom.uz/507144111111111?orderId=...
  │
  └─→ ✅ Return 201 Created
```

---

## Front-to-Back Data Flow

```
React Component (Frontend)
├─ Cart contains items with color/size selected
│  └─ Item: {id: 1, color: "red", size: "1ml", ...}
│
└─ onClick "Pay with Payme"
   │
   ├─ Validate all items
   │  ├─ For each item: getItemIkpuCode()
   │  │  ├─ Check variantIkpuCodes["red_1ml"]? → "A"
   │  │  └─ Store resolved IKPU
   │  │
   │  ├─ Check all same IKPU? → ✅
   │  │
   │  └─ Send to backend with items
   │
   └─ POST /api/payments/create
      │
      body: {
        items: [{id: 1, color: "red", size: "1ml", variantIkpuCodes: {...}}],
        amount: 2640,
        provider: "payme"
      }
         ↓
      Backend (Node.js + Express)
      │
      ├─ Receive items array
      │
      ├─ For each item:
      │  ├─ Resolve IKPU same way as frontend
      │  └─ Store _resolvedIkpuCode
      │
      ├─ Validate all same
      │
      ├─ Create Order
      │  └─ Save itemIkpuCodes: ["A", "A"]
      │
      ├─ Generate Payme URL
      │  └─ https://checkout.paycom.uz/A?...
      │
      └─ Return {orderId, paymentInitData}
         ↓
      Frontend receives response
      │
      └─ window.location.href = paymentInitData.redirectUrl
         │
         └─ Redirect to Payme with correct merchant
```

---

## Error Cases Decision Tree

```
┌─ Does cart have items? 
│  ├─ NO → "No items provided"
│  └─ YES ↓
│
├─ Is provider "payme"?
│  ├─ NO → Skip IKPU validation
│  └─ YES ↓
│
├─ For each item:
│  ├─ Has variantIkpuCodes["color_size"]?
│  │  ├─ YES → Use it ✅
│  │  └─ NO → Has ikpuCode?
│  │         ├─ YES → Use it ✅
│  │         └─ NO → ❌ ERROR
│  │                "Item missing IKPU code"
│  └─ Store resolved IKPU
│
├─ Get all unique IKPUs
│  ├─ Length = 1 → All from same vendor ✅
│  ├─ Length > 1 → ❌ ERROR
│  │               "Items from different merchants"
│  └─ Length = 0 → ❌ ERROR
│                   "No valid IKPU found"
│
└─ All checks passed ✅
   Create order and redirect to Payme
```

---

**Visual Guide Complete**
**Date:** January 30, 2026
