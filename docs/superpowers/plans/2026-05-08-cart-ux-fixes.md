# Cart UX Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two cart UX bugs: (1) decrementing qty=1 now removes the item, and (2) adding a product shows a mini-preview toast in the top-right corner for 2.5s with a "Ver carrinho" link.

**Architecture:** Fix 1 is a one-line change in the Zustand cart store. Fix 2 adds an ephemeral Zustand toast slice (`src/store/toast.ts`) + a fixed-position React component (`AddedToCartToast`) mounted once in `Home.tsx`. `ProductGrid.handleAddToCart` calls `showToast` after `addItem`. No server calls, no queue — last-added item only.

**Tech Stack:** React 18, TypeScript, CSS Modules, Zustand, Vite 5, pnpm, Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/store/cart.ts` | Modify | Fix `changeQty` — remove item when newQty < 1 |
| `src/store/toast.ts` | Create | Ephemeral Zustand slice for toast state |
| `src/components/AddedToCartToast.tsx` | Create | Fixed-position toast UI |
| `src/components/AddedToCartToast.module.css` | Create | Toast styles with slide-in/fade-out animation |
| `src/components/ProductGrid.tsx` | Modify | Call `showToast` after `addItem` in `handleAddToCart` |
| `src/pages/Home.tsx` | Modify | Mount `<AddedToCartToast onOpenCart={...} />` |

---

## Task 1: Fix `changeQty` — remove item when qty reaches zero

**Files:**
- Modify: `src/store/cart.ts:74-84`

The current `changeQty` action ignores decrements that would bring qty below 1. It should remove the item instead.

**Current code (lines 74–84):**
```ts
changeQty(cartKey, delta) {
  set((state) => ({
    items: state.items.map((i) => {
      if (i.cartKey !== cartKey) return i;
      const newQty = i.qtd + delta;
      if (newQty < 1) return i;           // ← BUG: keeps item unchanged
      if (i.estoque !== null && newQty > i.estoque) return i;
      return { ...i, qtd: newQty };
    }),
  }));
},
```

- [ ] **Step 1: Write the failing test**

Open `src/store/cart.ts` — there is no test file yet. Create `src/store/cart.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cart';
import type { Produto } from '../types';

const mockProduto: Produto = {
  id: 1,
  nome: 'Produto Teste',
  marca: 'Marca',
  preco: 100,
  preco_pix: 95,
  categoria_id: 1,
  subcategoria: null,
  estoque: 10,
  ativo: true,
  destaque: false,
  imagem_url: null,
  _variacoes: [],
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('changeQty', () => {
  it('removes the item when qty is decremented below 1', () => {
    useCartStore.getState().addItem(mockProduto);
    const cartKey = useCartStore.getState().items[0].cartKey;

    // qty is 1, decrement by -1 → should remove
    useCartStore.getState().changeQty(cartKey, -1);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('decrements qty normally when qty > 1', () => {
    useCartStore.getState().addItem(mockProduto);
    useCartStore.getState().addItem(mockProduto); // qty = 2
    const cartKey = useCartStore.getState().items[0].cartKey;

    useCartStore.getState().changeQty(cartKey, -1);

    expect(useCartStore.getState().items[0].qtd).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```powershell
pnpm vitest run src/store/cart.test.ts
```

Expected: FAIL — "expected array length 0, received 1"

- [ ] **Step 3: Fix `changeQty` in `src/store/cart.ts`**

Replace the `changeQty` action (lines 74–84):

```ts
changeQty(cartKey, delta) {
  set((state) => {
    const items = state.items.flatMap((i) => {
      if (i.cartKey !== cartKey) return [i];
      const newQty = i.qtd + delta;
      if (newQty < 1) return [];   // remove item
      if (i.estoque !== null && newQty > i.estoque) return [i];
      return [{ ...i, qtd: newQty }];
    });
    return { items };
  });
},
```

- [ ] **Step 4: Run the test and confirm it passes**

```powershell
pnpm vitest run src/store/cart.test.ts
```

Expected: PASS — all 2 tests pass.

- [ ] **Step 5: Run full test suite to check for regressions**

```powershell
pnpm vitest run
```

Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```powershell
& "C:\Program Files\Git\bin\git.exe" add src/store/cart.ts src/store/cart.test.ts
& "C:\Program Files\Git\bin\git.exe" commit -m "fix(cart): remove item when changeQty decrements below 1"
```

---

## Task 2: Create toast Zustand slice

**Files:**
- Create: `src/store/toast.ts`

This is a standalone Zustand store (not persisted). It holds the last-added item and a `visible` flag. `showToast(item)` sets both and schedules auto-hide after 2500ms. `hideToast` sets `visible: false` immediately (for CSS fade-out) then clears item after 300ms.

- [ ] **Step 1: Write the failing test**

Create `src/store/toast.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToastStore } from './toast';
import type { ItemCarrinho } from '../types';

const mockItem: ItemCarrinho = {
  id: 1,
  cartKey: '1',
  nome: 'Produto Teste',
  marca: 'Marca',
  categoria: 'Cat',
  preco: 100,
  imagem: null,
  estoque: 10,
  qtd: 1,
};

beforeEach(() => {
  useToastStore.setState({ item: null, visible: false });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useToastStore', () => {
  it('sets item and visible on showToast', () => {
    useToastStore.getState().showToast(mockItem);
    expect(useToastStore.getState().item).toEqual(mockItem);
    expect(useToastStore.getState().visible).toBe(true);
  });

  it('hides after 2500ms', () => {
    useToastStore.getState().showToast(mockItem);
    vi.advanceTimersByTime(2500);
    expect(useToastStore.getState().visible).toBe(false);
  });

  it('clears item 300ms after hiding', () => {
    useToastStore.getState().showToast(mockItem);
    vi.advanceTimersByTime(2500 + 300);
    expect(useToastStore.getState().item).toBeNull();
  });

  it('hideToast sets visible false immediately', () => {
    useToastStore.getState().showToast(mockItem);
    useToastStore.getState().hideToast();
    expect(useToastStore.getState().visible).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```powershell
pnpm vitest run src/store/toast.test.ts
```

Expected: FAIL — "Cannot find module './toast'"

- [ ] **Step 3: Create `src/store/toast.ts`**

```ts
import { create } from 'zustand';
import type { ItemCarrinho } from '../types';

interface ToastState {
  item: ItemCarrinho | null;
  visible: boolean;
  showToast(item: ItemCarrinho): void;
  hideToast(): void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>()((set) => ({
  item: null,
  visible: false,

  showToast(item) {
    if (hideTimer) clearTimeout(hideTimer);
    if (clearTimer) clearTimeout(clearTimer);
    set({ item, visible: true });
    hideTimer = setTimeout(() => {
      set({ visible: false });
      clearTimer = setTimeout(() => set({ item: null }), 300);
    }, 2500);
  },

  hideToast() {
    if (hideTimer) clearTimeout(hideTimer);
    if (clearTimer) clearTimeout(clearTimer);
    set({ visible: false });
    clearTimer = setTimeout(() => set({ item: null }), 300);
  },
}));
```

- [ ] **Step 4: Run the test and confirm it passes**

```powershell
pnpm vitest run src/store/toast.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Commit**

```powershell
& "C:\Program Files\Git\bin\git.exe" add src/store/toast.ts src/store/toast.test.ts
& "C:\Program Files\Git\bin\git.exe" commit -m "feat(store): add ephemeral toast Zustand slice"
```

---

## Task 3: Create `AddedToCartToast` component

**Files:**
- Create: `src/components/AddedToCartToast.tsx`
- Create: `src/components/AddedToCartToast.module.css`

Fixed-position toast, top-right. Reads from `useToastStore`. Props: `onOpenCart: () => void`. Shows: product image (40×40, fallback SVG), brand · name, formatted price, "Ver carrinho →" button. Slide-in from right when visible, fade-out when hiding. `role="status"` for a11y.

- [ ] **Step 1: Create `src/components/AddedToCartToast.module.css`**

```css
.toast {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 8000;
  width: 280px;
  background: #111;
  border: 1px solid rgba(201, 169, 97, 0.4);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  transform: translateX(0);
  opacity: 1;
  transition: transform 0.3s ease, opacity 0.3s ease;
  pointer-events: all;
}

.toast.hidden {
  transform: translateX(calc(100% + 32px));
  opacity: 0;
  pointer-events: none;
}

.img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  flex-shrink: 0;
  background: #1a1a1a;
}

.imgPlaceholder {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
}

.info {
  flex: 1;
  min-width: 0;
}

.label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #c9a961;
  margin-bottom: 2px;
}

.name {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #f4f4f4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.price {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(244, 244, 244, 0.6);
}

.cartBtn {
  display: block;
  width: 100%;
  padding: 8px 0;
  margin-top: 10px;
  background: transparent;
  border: 1px solid rgba(201, 169, 97, 0.35);
  color: #c9a961;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  text-align: center;
}

.cartBtn:hover {
  background: #c9a961;
  color: #000;
}
```

- [ ] **Step 2: Create `src/components/AddedToCartToast.tsx`**

```tsx
import { useToastStore } from '../store/toast';
import { formatCurrency } from '../lib/format';
import styles from './AddedToCartToast.module.css';

interface AddedToCartToastProps {
  onOpenCart: () => void;
}

export default function AddedToCartToast({ onOpenCart }: AddedToCartToastProps) {
  const item = useToastStore((s) => s.item);
  const visible = useToastStore((s) => s.visible);
  const hideToast = useToastStore((s) => s.hideToast);

  if (!item) return null;

  function handleOpenCart() {
    hideToast();
    onOpenCart();
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${item.nome} adicionado ao carrinho`}
      className={`${styles.toast}${!visible ? ` ${styles.hidden}` : ''}`}
    >
      {item.imagem ? (
        <img
          src={item.imagem}
          alt={item.nome}
          className={styles.img}
          width={40}
          height={40}
          loading="eager"
        />
      ) : (
        <div className={styles.imgPlaceholder} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      )}

      <div className={styles.info}>
        <p className={styles.label}>{item.marca || 'Adicionado'}</p>
        <p className={styles.name}>{item.nome}</p>
        <p className={styles.price}>{formatCurrency(item.preco)}</p>
        <button
          type="button"
          className={styles.cartBtn}
          onClick={handleOpenCart}
        >
          Ver carrinho →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build to verify TypeScript compiles**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```powershell
& "C:\Program Files\Git\bin\git.exe" add src/components/AddedToCartToast.tsx src/components/AddedToCartToast.module.css
& "C:\Program Files\Git\bin\git.exe" commit -m "feat: add AddedToCartToast component"
```

---

## Task 4: Wire toast into ProductGrid and Home

**Files:**
- Modify: `src/components/ProductGrid.tsx:93-95`
- Modify: `src/pages/Home.tsx`

`handleAddToCart` calls `showToast` after `addItem`. `Home` mounts `<AddedToCartToast>` once.

- [ ] **Step 1: Update `handleAddToCart` in `src/components/ProductGrid.tsx`**

Add the import at the top of `src/components/ProductGrid.tsx` (after existing imports):

```tsx
import { useToastStore } from '../store/toast';
```

Inside the `ProductGrid` function, after the existing `const addItem = useCartStore((s) => s.addItem);` line, add:

```tsx
const showToast = useToastStore((s) => s.showToast);
```

Replace `handleAddToCart` (currently lines 93–95):

```tsx
function handleAddToCart(produto: Produto) {
  addItem(produto);
  const preco = produto.preco_pix ?? produto.preco;
  showToast({
    id: produto.id,
    cartKey: String(produto.id),
    nome: produto.nome,
    marca: produto.marca,
    categoria: produto.categorias?.nome ?? '',
    preco,
    imagem: produto.imagem_url,
    estoque: produto.estoque,
    qtd: 1,
  });
}
```

- [ ] **Step 2: Mount `AddedToCartToast` in `src/pages/Home.tsx`**

Add the import at the top of `src/pages/Home.tsx` (after existing imports):

```tsx
import AddedToCartToast from '../components/AddedToCartToast';
```

In the JSX return, add `<AddedToCartToast>` after `<FloatingWhatsApp />`:

```tsx
<FloatingWhatsApp />
<AddedToCartToast onOpenCart={() => setCartOpen(true)} />
```

- [ ] **Step 3: Build to verify TypeScript compiles**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 4: Run full test suite**

```powershell
pnpm vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
& "C:\Program Files\Git\bin\git.exe" add src/components/ProductGrid.tsx src/pages/Home.tsx
& "C:\Program Files\Git\bin\git.exe" commit -m "feat: show added-to-cart toast on product add"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| `changeQty` removes item when newQty < 1 | Task 1 ✅ |
| Toast store: `showToast`, `hideToast`, `visible`, `item` | Task 2 ✅ |
| Auto-hide after 2500ms | Task 2 ✅ |
| Clear item 300ms after hide (fade-out) | Task 2 ✅ |
| Toast: fixed top-right, z-index above all except modals | Task 3 ✅ |
| Toast content: image, brand + name, price, "Ver carrinho" button | Task 3 ✅ |
| `role="status"` for accessibility | Task 3 ✅ |
| `handleAddToCart` calls `showToast` after `addItem` | Task 4 ✅ |
| `Home` mounts `<AddedToCartToast onOpenCart={...} />` | Task 4 ✅ |

### Placeholder scan — nenhum encontrado.

### Type consistency

- `ItemCarrinho` from `src/types/index.ts` used in `toast.ts`, `toast.test.ts`, and `AddedToCartToast.tsx` ✅
- `showToast` receives `ItemCarrinho` object — fields match the interface (`id`, `cartKey`, `nome`, `marca`, `categoria`, `preco`, `imagem`, `estoque`, `qtd`) ✅
- `formatCurrency` imported from `../lib/format` — same path used in `CartDrawer.tsx` ✅
- `hideToast` called consistently in toast store and component ✅
