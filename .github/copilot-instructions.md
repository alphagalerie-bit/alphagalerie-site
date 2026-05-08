# Alpha Galerie - Copilot Instructions

> AI-specific guidance for development in this codebase. Last updated: May 8, 2026

## Architecture & Stack

**Core Tech:**
- React 18 + TypeScript (strict mode)
- Vite 5 build pipeline
- Zustand v5 for state management
- CSS Modules for component styling
- Vitest + Playwright for testing
- SVG-based branding (logo, favicon, icons)

**Project Structure:**
```
src/
  components/          # React components with .module.css
  pages/              # Page-level components (Home.tsx)
  hooks/              # Custom React hooks (useCart, useProducts, etc.)
  store/              # Zustand stores (cart.ts, toast.ts)
  lib/                # Utilities (format.ts, API integrations, frete.ts, pix.ts)
  types/              # TypeScript interfaces (index.ts)
  styles/             # Global styles (global.css, tokens.css, animation defs)
  assets/             # Static assets
public/               # Static files (logo.svg, favicon.svg, robots.txt)
```

## Key State & Stores

### Cart Store (`src/store/cart.ts`)
- **Zustand hook:** `useCartStore()`
- **State:** `items` (ItemCarrinho[]), `isOpen` (drawer visibility)
- **Actions:** 
  - `addItem(produto, variacao, qtd)` — adds to cart, merges duplicates
  - `changeQty(cartKey, delta)` — changes quantity; **removes item when qty < 1** (uses flatMap)
  - `removeItem(cartKey)` — removes by cartKey
  - `openCart()` / `closeCart()` — drawer control
  - `calculateTotal()` / `calculateSubtotal()` — pricing
- **CartKey pattern:** `${product.id}::${variacao?.id}` for unique identification
- **ItemCarrinho interface:** id, cartKey, variacaoId, nome, variacao, marca, categoria, preco, imagem, estoque, qtd

### Toast Store (`src/store/toast.ts`)
- **Zustand hook:** `useToastStore()`
- **State:** `item` (ItemCarrinho | null), `visible` (boolean)
- **Actions:**
  - `showToast(item)` — shows toast, auto-hides after 2500ms, clears item 300ms after hide
  - `hideToast()` — manually triggers hide
- **Timing:** 2500ms visibility window + 300ms CSS fade-out animation = 2800ms total
- **Used in:** ProductGrid, ProductModal (on add-to-cart); rendered in Home.tsx

### Product & Category Hooks
- `useProducts()` — fetches product catalog from Supabase
- `useCategories()` — fetches category filters
- `useCheckout()` — manages checkout state
- Data flows from Supabase → hooks → component state

## Styling Conventions

**CSS Modules:**
- File pattern: `Component.module.css` (scoped to component)
- Classes named: camelCase, semantic (`.toast`, `.hidden`, `.content`, etc.)
- Hover/active states within module

**Global Styles (`src/styles/global.css`):**
- Animations: `@keyframes fadeUp`, `slideUp`, `marquee`, `slideIn`
- Component classes: `.section-head`, `.section-eyebrow`, `.section-title`, `.section-sub`
- Responsive breakpoints: `@media (max-width: 760px)` for mobile

**Design Tokens (`src/styles/tokens.css`):**
- Colors: `--gold: #c9a961`, `--dark: #0c0c0c`, `--text: #f4f4f4`
- Spacing, fonts, z-indexes defined here
- Use CSS variables across all components

## Component Patterns

**Functional Components with Hooks:**
```typescript
export default function ProductGrid() {
  const products = useProducts();
  const { addItem } = useCartStore();
  const { showToast } = useToastStore();
  
  // component logic
  return <div>/* JSX */</div>;
}
```

**CSS Modules Import:**
```typescript
import styles from './ProductGrid.module.css';

// Usage: className={styles.container}
```

**Type Safety:**
- All component props typed explicitly
- Use interfaces from `src/types/index.ts`
- No `any`; use strict TypeScript mode

## Testing

**Framework:** Vitest (configured with React testing libraries)

**File Pattern:** `src/**/*.test.ts` or `.test.tsx`

**Mock Timers for Async State:**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

vi.advanceTimersByTime(2500); // advance toast hide timer
```

**Store Testing:**
```typescript
import { useCartStore } from '../store/cart';
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useCartStore());
act(() => {
  result.current.addItem(product, variacao, 1);
});
expect(result.current.items).toHaveLength(1);
```

**Run Tests:** `pnpm run test`

## Build & Scripts

**available:**
- `pnpm run dev` — start Vite dev server
- `pnpm run build` — production build (TypeScript check + Vite bundle)
- `pnpm run test` — run Vitest suite
- `pnpm run lint` — ESLint (eslint.config.js)

**Build Output:** `dist/` folder; index.html, CSS/JS bundles, 241 modules ~454KB JS

## Common Tasks & Patterns

### Adding a Feature
1. Define types in `src/types/index.ts` if new domain entity
2. Create component in `src/components/` with `.module.css`
3. Add hooks/stores if state needed
4. Wire into parent page (usually Home.tsx)
5. Add tests in `.test.ts` file
6. Run `pnpm run build` to validate

### Modifying Cart Behavior
- Edit `src/store/cart.ts` (actions, state)
- Update `src/store/cart.test.ts` if logic changes
- Test in ProductGrid, ProductModal, CartDrawer
- Ensure `changeQty` respects qty < 1 removal rule

### Toast Notifications
- Call `useToastStore().showToast(itemData)` 
- Ensure itemData matches `ItemCarrinho` shape
- Toast auto-hides; no manual cleanup needed
- Component already rendered in Home.tsx

### SVG Branding
- Logo: `public/logo.svg` (420×120 viewBox)
- Favicon: `public/favicon.svg` (64×64 viewBox)
- Update in tandem for visual consistency
- Geometric design (clean circles, monogram AG)

## API Integration

**Supabase:**
- Configured in `src/lib/supabase.ts`
- Products, categories fetched via hooks
- Auth, storage available if needed

**Payment:**
- Mercado Pago: `src/lib/mercadopago.ts`
- PIX: `src/lib/pix.ts`, `src/lib/pix.test.ts`
- Frete calculations: `src/lib/frete.ts`, `src/lib/frete.test.ts`

## Code Quality

**TypeScript:** No implicit `any`, strict mode enabled

**Linting:** ESLint config in eslint.config.js
- Global API usage: Prefer `globalThis.*` over `window.*`
- Use `Number.parseInt()` instead of `parseInt()`

**Tests:** Aim for >80% coverage on store/business logic; component tests for behavior, not implementation details

## Known Conventions

- **Cart merging:** Adding same product+variation twice increments qty (not duplicate items)
- **Toast lifecycle:** visible → 2500ms → fade-out (CSS) → item cleared → invisible
- **Section headers:** Use `.section-head` class for editorial content (vitrine, etc.)
- **Responsive:** Mobile breakpoint at 760px; test avatar states

## Anti-Patterns / Avoid

- Don't use inline styles; use CSS Modules or global classes
- Don't import from `window.*` directly; use `globalThis`
- Don't mutate Zustand store state; always use actions
- Don't hardcode breakpoints; use tokens.css values
- Don't add tests only for UI rendering; focus on logic/state changes

## Next Steps for New Features

1. Check existing type definitions first
2. Identify required stores/hooks
3. Wire component → hook → store (unidirectional data flow)
4. Test at store level first, then component integration
5. Validate build passes with `pnpm run build`
6. Ensure mobile responsive via 760px breakpoint
