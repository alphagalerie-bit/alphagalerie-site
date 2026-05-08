# Cart UX Fixes — Design Spec

**Date:** 2026-05-08  
**Branch:** feat/migrate-vite  
**Status:** Approved

## Problem

Two UX bugs identified by comparing the migrated Vite site against the original:

1. **Adding a product gives no feedback** — `handleAddToCart` in `ProductGrid` calls `addItem()` but nothing visual happens. User has no confirmation the item was added.
2. **Decrementing quantity at 1 does not remove the item** — `changeQty` in the cart store returns the item unchanged when `newQty < 1` instead of removing it.

## Solution Overview

### Fix 1 — `changeQty` removes item when qty reaches zero

**File:** `src/store/cart.ts`

Change the `changeQty` action: when `newQty < 1`, filter the item out of the array instead of returning it unchanged.

```
Before: if (newQty < 1) return i;   ← keeps item, ignores decrement
After:  if (newQty < 1) remove item ← filter it out
```

One-line change, no other files affected.

### Fix 2 — Mini-preview toast on add to cart

**Design:** Fixed-position toast, top-right corner. Appears for 2.5s on every `addItem` call. Contains product image, name, formatted price, and a "Ver carrinho →" link that opens the CartDrawer.

#### New file: `src/store/toast.ts`

Zustand slice (separate from cart store). State: `{ item: ItemCarrinho | null, visible: boolean }`. Actions: `showToast(item)` — sets item + visible, schedules `setTimeout(hideToast, 2500)`. `hideToast` — sets visible false, clears item after 300ms (allows fade-out animation to complete).

#### New file: `src/components/AddedToCartToast.tsx`

Pure UI component. Props: `onOpenCart: () => void`.

- `position: fixed`, top-right, z-index above everything except modals
- Reads `{ item, visible }` from toast store
- Animates: slide-in from right on mount, fade-out on hide
- Content: product image (40×40), brand + name, formatted price, "Ver carrinho →" button
- `role="status"` for accessibility (screen readers announce additions)
- Auto-hidden after 2.5s; clicking "Ver carrinho" also triggers `onOpenCart()`

#### Modified: `src/components/ProductGrid.tsx`

`handleAddToCart` (line 93) — after `addItem(produto)`, call `showToast()` with the cart item data derived from the produto. The toast store receives an `ItemCarrinho`-shaped object (id, nome, marca, imagem_url, preco).

#### Modified: `src/pages/Home.tsx`

Mount `<AddedToCartToast onOpenCart={() => setCartOpen(true)} />` once, after `<FloatingWhatsApp />`.

## Data Flow

```
ProductGrid.handleAddToCart(produto)
  → addItem(produto)          [cart store — persisted]
  → showToast(toastItem)      [toast store — ephemeral]
      ↓
AddedToCartToast (fixed position)
  → visible for 2.5s
  → "Ver carrinho" click → onOpenCart() → CartDrawer opens
```

## Files Changed

| File | Action |
|---|---|
| `src/store/cart.ts` | Fix `changeQty` — remove item when newQty < 1 |
| `src/store/toast.ts` | Create — ephemeral toast Zustand slice |
| `src/components/AddedToCartToast.tsx` | Create — toast UI |
| `src/components/AddedToCartToast.module.css` | Create — toast styles |
| `src/components/ProductGrid.tsx` | Call `showToast` after `addItem` |
| `src/pages/Home.tsx` | Mount `<AddedToCartToast>` |

## Non-Goals

- No server-side persistence of toast state
- No toast for `changeQty` increases (only initial add)
- No toast queue (only last added item shown)
