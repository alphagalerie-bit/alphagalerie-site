# Alpha Galerie — Vite Migration: Parte 3 — ProductGrid, Checkout, Home & Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar ProductGrid, VariacoesModal, CartDrawer, checkout lazy (PIX + Cartão), ProductModal (?p=ID), montar Home completa e fazer deploy na Vercel.

**Architecture:** CheckoutModal, PixPayment e CardPayment são um único React.lazy chunk, carregado só ao clicar "Finalizar compra". Mercado Pago SDK injetado dinamicamente. ProductModal lê ?p=ID via useSearchParams.

**Tech Stack:** React.lazy + Suspense, dynamic import() para qrcode, Mercado Pago SDK via script injection, Vercel preview deploys

---

## Task 15 — src/components/ProductGrid.tsx

- [ ] Criar `src/components/ProductGrid.tsx` com o conteúdo abaixo:

```tsx
// src/components/ProductGrid.tsx
import { useState, useMemo } from 'react';
import { useProducts, useCategories } from '../hooks/useSupabaseQuery';
import { useCartStore } from '../store/cartStore';
import type { Produto, Variacao } from '../types';
import VariacoesModal from './VariacoesModal';

interface ProductGridProps {
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
}

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-img skeleton-pulse" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-pulse" style={{ width: '60%' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

interface ProductCardProps {
  produto: Produto;
  onAddToCart: (produto: Produto) => void;
  onOpenVariacoes: (produto: Produto) => void;
}

function ProductCard({ produto, onAddToCart, onOpenVariacoes }: ProductCardProps) {
  const temVariacoes = produto._variacoes && produto._variacoes.length > 0;
  const preco = produto.preco_pix ?? produto.preco;
  const label = produto.preco_pix ? 'PIX' : '';

  return (
    <article className="product-card">
      <div className="product-card__img-wrap">
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            loading="lazy"
            className="product-card__img"
          />
        ) : (
          <div className="product-card__img-placeholder" aria-hidden="true" />
        )}
        {!produto.ativo && (
          <span className="product-card__badge product-card__badge--esgotado">ESGOTADO</span>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__marca">{produto.marca}</p>
        <h3 className="product-card__nome">{produto.nome}</h3>
        {produto.subcategoria && (
          <p className="product-card__subcat">{produto.subcategoria}</p>
        )}
        <div className="product-card__preco">
          <span className="product-card__valor">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco)}
          </span>
          {label && <span className="product-card__label">{label}</span>}
        </div>
        <button
          type="button"
          className="product-card__btn"
          disabled={!produto.ativo}
          onClick={() => {
            if (temVariacoes) {
              onOpenVariacoes(produto);
            } else {
              onAddToCart(produto);
            }
          }}
          aria-label={`Adicionar ${produto.nome} ao carrinho`}
        >
          {temVariacoes ? 'VER OPÇÕES' : 'ADICIONAR'}
        </button>
      </div>
    </article>
  );
}

export default function ProductGrid({ categoryId, onCategoryChange }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);
  const [variacoesTarget, setVariacoesTarget] = useState<Produto | null>(null);

  const { data: produtos = [], isLoading: loadingProdutos } = useProducts(categoryId);
  const { data: categorias = [] } = useCategories();
  const addItem = useCartStore((s) => s.addItem);

  const subcategorias = useMemo(() => {
    if (!categoryId) return [];
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.subcategoria) set.add(p.subcategoria);
    });
    return Array.from(set).sort();
  }, [produtos, categoryId]);

  const filtered = useMemo(() => {
    let list = produtos;
    if (activeSubcat) {
      list = list.filter((p) => p.subcategoria === activeSubcat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q)
      );
    }
    return list;
  }, [produtos, activeSubcat, searchQuery]);

  function handleAddToCart(produto: Produto) {
    addItem({
      id: produto.id,
      cartKey: `${produto.id}`,
      nome: produto.nome,
      marca: produto.marca,
      categoria: produto.categorias?.nome ?? '',
      preco: produto.preco_pix ?? produto.preco,
      imagem: produto.imagem_url,
      estoque: produto.estoque,
      qtd: 1,
    });
  }

  function handleSelectVariacao(produto: Produto, variacao: Variacao) {
    addItem({
      id: produto.id,
      cartKey: `${produto.id}-${variacao.id}`,
      variacaoId: variacao.id,
      nome: produto.nome,
      variacao: variacao.nome,
      marca: produto.marca,
      categoria: produto.categorias?.nome ?? '',
      preco: variacao.preco_pix ?? variacao.preco ?? produto.preco_pix ?? produto.preco,
      imagem: produto.imagem_url,
      estoque: variacao.estoque ?? produto.estoque,
      qtd: 1,
    });
    setVariacoesTarget(null);
  }

  return (
    <section className="product-grid-section" aria-label="Produtos">
      {/* Filtro de categorias */}
      <div className="category-filters" role="group" aria-label="Filtrar por categoria">
        <button
          type="button"
          className={`category-btn${categoryId === null ? ' category-btn--active' : ''}`}
          onClick={() => { onCategoryChange(null); setActiveSubcat(null); }}
        >
          TODOS
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-btn${categoryId === cat.id ? ' category-btn--active' : ''}`}
            onClick={() => { onCategoryChange(cat.id); setActiveSubcat(null); }}
          >
            {cat.nome.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Filtro de subcategorias */}
      {subcategorias.length > 0 && (
        <div className="subcat-filters" role="group" aria-label="Filtrar por subcategoria">
          <button
            type="button"
            className={`subcat-btn${activeSubcat === null ? ' subcat-btn--active' : ''}`}
            onClick={() => setActiveSubcat(null)}
          >
            Todas
          </button>
          {subcategorias.map((s) => (
            <button
              key={s}
              type="button"
              className={`subcat-btn${activeSubcat === s ? ' subcat-btn--active' : ''}`}
              onClick={() => setActiveSubcat(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div className="search-wrap">
        <label htmlFor="product-search" className="sr-only">Buscar produtos</label>
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="product-search"
          type="search"
          className="search-input"
          placeholder="Buscar por nome ou marca..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loadingProdutos ? (
        <div className="product-grid" aria-busy="true" aria-label="Carregando produtos">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="product-grid-empty" role="status">
          <p>Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((produto) => (
            <ProductCard
              key={produto.id}
              produto={produto}
              onAddToCart={handleAddToCart}
              onOpenVariacoes={setVariacoesTarget}
            />
          ))}
        </div>
      )}

      {/* Modal de variações */}
      <VariacoesModal
        produto={variacoesTarget}
        onClose={() => setVariacoesTarget(null)}
        onSelect={handleSelectVariacao}
      />
    </section>
  );
}
```

- [ ] Commit: `git add src/components/ProductGrid.tsx && git commit -m "feat: add ProductGrid component with category/subcat/search filters"`

---

## Task 16 — src/components/VariacoesModal.tsx

- [ ] Criar `src/components/VariacoesModal.tsx`:

```tsx
// src/components/VariacoesModal.tsx
import { useEffect, useRef } from 'react';
import type { Produto, Variacao } from '../types';

interface VariacoesModalProps {
  produto: Produto | null;
  onClose: () => void;
  onSelect: (produto: Produto, variacao: Variacao) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function VariacoesModal({ produto, onClose, onSelect }: VariacoesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!produto) return;

    // Focus trap
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length) focusables[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        if (focusables.length === 0) { e.preventDefault(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [produto, onClose]);

  if (!produto) return null;

  const variacoes = produto._variacoes ?? [];

  return (
    <>
      {/* Overlay */}
      <div
        className="modal-overlay"
        onPointerDown={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="variacoes-title"
        className="variacoes-modal"
      >
        <div className="variacoes-modal__header">
          <h2 id="variacoes-title" className="variacoes-modal__title">
            {produto.nome}
          </h2>
          <button
            type="button"
            className="variacoes-modal__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="variacoes-modal__body">
          {variacoes.length === 0 ? (
            <p className="variacoes-modal__empty">Nenhuma variação disponível.</p>
          ) : (
            <ul className="variacoes-list" role="list">
              {variacoes.map((v) => {
                const preco = v.preco_pix ?? v.preco ?? produto.preco_pix ?? produto.preco;
                const esgotado = typeof v.estoque === 'number' && v.estoque <= 0;
                const ultimas = typeof v.estoque === 'number' && v.estoque > 0 && v.estoque <= 3;

                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      className={`variacao-btn${esgotado ? ' variacao-btn--esgotado' : ''}`}
                      disabled={esgotado}
                      onClick={() => onSelect(produto, v)}
                      aria-label={`Selecionar ${v.nome}${esgotado ? ' — esgotado' : ''}`}
                    >
                      <span className="variacao-btn__nome">{v.nome}</span>
                      <span className="variacao-btn__preco">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(preco)}
                      </span>
                      {esgotado && (
                        <span className="variacao-badge variacao-badge--esgotado" aria-hidden="true">
                          ESGOTADO
                        </span>
                      )}
                      {ultimas && !esgotado && (
                        <span className="variacao-badge variacao-badge--ultimas" aria-hidden="true">
                          Últimas {v.estoque} un.
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] Commit: `git add src/components/VariacoesModal.tsx && git commit -m "feat: add VariacoesModal with focus trap, Esc, ESGOTADO/ultimas badges"`

---

## Task 17 — src/components/CartDrawer.tsx + CartDrawer.module.css

- [ ] Criar `src/components/CartDrawer.module.css`:

```css
/* src/components/CartDrawer.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: #0a0a0a;
  border-left: 1px solid rgba(201, 169, 97, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 201;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(201, 169, 97, 0.15);
}

.title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.4rem;
  color: #c9a961;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.closeBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: #f4f4f4;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.closeBtn:hover { opacity: 1; }

.itemList {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(244, 244, 244, 0.4);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

.item {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 0.75rem;
  align-items: start;
}

.itemImg {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 4px;
  background: #1a1a1a;
}

.itemImgPlaceholder {
  width: 72px;
  height: 72px;
  background: #1a1a1a;
  border-radius: 4px;
}

.itemInfo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.itemNome {
  font-size: 0.875rem;
  color: #f4f4f4;
  line-height: 1.3;
}

.itemVariacao {
  font-size: 0.75rem;
  color: rgba(244, 244, 244, 0.5);
}

.itemPreco {
  font-size: 0.875rem;
  color: #c9a961;
  font-weight: 500;
}

.qtyRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.qtyBtn {
  width: 26px;
  height: 26px;
  background: rgba(201, 169, 97, 0.12);
  border: 1px solid rgba(201, 169, 97, 0.3);
  color: #c9a961;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  transition: background 0.15s;
}
.qtyBtn:hover { background: rgba(201, 169, 97, 0.22); }

.qtyValue {
  min-width: 20px;
  text-align: center;
  font-size: 0.875rem;
  color: #f4f4f4;
}

.removeBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(244, 244, 244, 0.35);
  padding: 0.25rem;
  transition: color 0.15s;
  margin-top: 0.1rem;
}
.removeBtn:hover { color: #e55; }

.footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(201, 169, 97, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.totalsRow {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(244, 244, 244, 0.6);
}

.totalsRowHighlight {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #f4f4f4;
  font-weight: 500;
}

.checkoutBtn {
  margin-top: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: #c9a961;
  color: #0a0a0a;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s;
}
.checkoutBtn:hover { background: #d4b87a; }
.checkoutBtn:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] Criar `src/components/CartDrawer.tsx`:

```tsx
// src/components/CartDrawer.tsx
import { useEffect, useRef } from 'react';
import { useCartStore } from '../store/cartStore';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function CartDrawer({ isOpen, onClose, onOpenCheckout }: CartDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotalPix = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const totalCartao = subtotalPix * 1.0; // sem acréscimo, ajustar se necessário

  useEffect(() => {
    if (!isOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusables = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length) focusables[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        if (focusables.length === 0) { e.preventDefault(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div
        className={styles.overlay}
        onPointerDown={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={styles.drawer}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>Carrinho</span>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Fechar carrinho"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className={styles.empty} role="status">
            Seu carrinho está vazio
          </div>
        ) : (
          <ul className={styles.itemList} role="list">
            {items.map((item) => (
              <li key={item.cartKey} className={styles.item}>
                {item.imagem ? (
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    loading="lazy"
                    className={styles.itemImg}
                  />
                ) : (
                  <div className={styles.itemImgPlaceholder} aria-hidden="true" />
                )}
                <div className={styles.itemInfo}>
                  <span className={styles.itemNome}>{item.nome}</span>
                  {item.variacao && (
                    <span className={styles.itemVariacao}>{item.variacao}</span>
                  )}
                  <span className={styles.itemPreco}>{fmt(item.preco)}</span>
                  <div className={styles.qtyRow}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      aria-label={`Diminuir quantidade de ${item.nome}`}
                      onClick={() =>
                        item.qtd > 1
                          ? updateQty(item.cartKey, item.qtd - 1)
                          : removeItem(item.cartKey)
                      }
                    >
                      −
                    </button>
                    <span className={styles.qtyValue} aria-live="polite">
                      {item.qtd}
                    </span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      aria-label={`Aumentar quantidade de ${item.nome}`}
                      onClick={() => updateQty(item.cartKey, item.qtd + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  aria-label={`Remover ${item.nome} do carrinho`}
                  onClick={() => removeItem(item.cartKey)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalsRow}>
              <span>Subtotal PIX</span>
              <span>{fmt(subtotalPix)}</span>
            </div>
            <div className={styles.totalsRowHighlight}>
              <span>Total cartão</span>
              <span>{fmt(totalCartao)}</span>
            </div>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={onOpenCheckout}
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] Commit:

```bash
rtk git add src/components/CartDrawer.tsx src/components/CartDrawer.module.css && rtk git commit -m "feat: add CartDrawer with focus trap, qty controls, totals footer"
```

---

## Task 18 — src/lib/mercadopago.ts

- [ ] Criar `src/lib/mercadopago.ts`:

```typescript
// src/lib/mercadopago.ts
declare global {
  interface Window {
    MercadoPago: any;
  }
}

let mpInstance: any = null;

export function loadMercadoPago(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (mpInstance) {
      resolve(mpInstance);
      return;
    }
    if (window.MercadoPago) {
      mpInstance = new window.MercadoPago(
        import.meta.env.VITE_MP_PUBLIC_KEY,
        { locale: 'pt-BR' }
      );
      resolve(mpInstance);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      mpInstance = new window.MercadoPago(
        import.meta.env.VITE_MP_PUBLIC_KEY,
        { locale: 'pt-BR' }
      );
      resolve(mpInstance);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

- [ ] Commit: `rtk git add src/lib/mercadopago.ts && rtk git commit -m "feat: add lazy Mercado Pago SDK loader (injected only on checkout open)"`

---

## Task 19 — src/hooks/useCheckout.ts

- [ ] Criar `src/hooks/useCheckout.ts`:

```typescript
// src/hooks/useCheckout.ts
import { supabase } from '../lib/supabase';
import type { Pedido, ItemCarrinho } from '../types';

interface SubmitResult {
  success: boolean;
  pedido?: any;
  error?: string;
}

export function useCheckout() {
  async function submitPedido(
    dados: Pedido,
    itens: ItemCarrinho[]
  ): Promise<SubmitResult> {
    try {
      // Tentativa 1: com itens_snapshot
      const payload = {
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email ?? null,
        cep: dados.cep ?? null,
        endereco: dados.endereco ?? null,
        bairro: dados.bairro ?? null,
        cidade: dados.cidade ?? null,
        estado: dados.estado ?? null,
        complemento: dados.complemento ?? null,
        pagamento: dados.pagamento,
        entrega: dados.entrega,
        observacoes: dados.observacoes ?? null,
        total: dados.total,
        status: dados.status ?? 'pendente',
        itens_snapshot: itens,
      };

      let { data, error } = await supabase
        .from('pedidos')
        .insert(payload)
        .select()
        .single();

      // Fallback: coluna itens_snapshot pode não existir
      if (error && error.message?.includes('itens_snapshot')) {
        const { itens_snapshot: _dropped, ...payloadSemItens } = payload;
        const result = await supabase
          .from('pedidos')
          .insert(payloadSemItens)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      return { success: true, pedido: data };
    } catch (err: any) {
      console.error('[useCheckout] submitPedido error:', err);
      return { success: false, error: err?.message ?? 'Erro ao registrar pedido.' };
    }
  }

  return { submitPedido };
}
```

- [ ] Commit: `rtk git add src/hooks/useCheckout.ts && rtk git commit -m "feat: add useCheckout hook with itens_snapshot fallback"`

---

## Task 20 — src/components/checkout/PixPayment.tsx

- [ ] Criar diretório `src/components/checkout/` se não existir.

- [ ] Criar `src/components/checkout/PixPayment.tsx`:

```tsx
// src/components/checkout/PixPayment.tsx
import { useEffect, useRef, useState } from 'react';

interface PixPaymentProps {
  total: number;
  txid: string;
  onClose: () => void;
}

const PIX_KEY = import.meta.env.VITE_PIX_KEY as string;

export default function PixPayment({ total, txid, onClose }: PixPaymentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  const pixPayload = buildPixPayload(total, txid);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QRCode = await import('qrcode');
        if (!cancelled && canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, pixPayload, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });
        }
      } catch {
        if (!cancelled) setQrError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [pixPayload]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback silencioso
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="pix-payment">
      <h3 className="pix-payment__title">Pagamento via PIX</h3>
      <p className="pix-payment__valor" aria-label={`Valor: ${fmt(total)}`}>
        {fmt(total)}
      </p>

      <div className="pix-payment__qr">
        {qrError ? (
          <p className="pix-payment__qr-error">Não foi possível gerar o QR Code.</p>
        ) : (
          <canvas ref={canvasRef} aria-label="QR Code PIX" />
        )}
      </div>

      <div className="pix-payment__key-wrap">
        <label htmlFor="pix-key-display" className="pix-payment__key-label">
          Chave PIX
        </label>
        <input
          id="pix-key-display"
          type="text"
          readOnly
          value={PIX_KEY}
          className="pix-payment__key-input"
          aria-label="Chave PIX para copiar"
        />
        <button
          type="button"
          className="pix-payment__copy-btn"
          aria-label="Copiar chave PIX"
          onClick={handleCopy}
        >
          {copied ? 'Copiado!' : 'Copiar chave'}
        </button>
      </div>

      <p className="pix-payment__hint">
        Após o pagamento, envie o comprovante pelo WhatsApp.
      </p>

      <button
        type="button"
        className="pix-payment__close-btn"
        aria-label="Fechar pagamento PIX"
        onClick={onClose}
      >
        Concluir
      </button>
    </div>
  );
}

// Gera payload EMV básico para PIX estático
function buildPixPayload(amount: number, txid: string): string {
  const name = (import.meta.env.VITE_PIX_NAME as string) ?? 'Alpha Galerie';
  const city = (import.meta.env.VITE_PIX_CITY as string) ?? 'Barueri';
  const key = PIX_KEY;

  function field(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  const gui = field('00', 'BR.GOV.BCB.PIX');
  const keyField = field('01', key);
  const merchantAccountInfo = field('26', gui + keyField);

  const amountStr = amount.toFixed(2);
  const txidClean = txid.replace(/\W/g, '').slice(0, 25) || '***';

  let payload =
    field('00', '01') +
    merchantAccountInfo +
    field('52', '0000') +
    field('53', '986') +
    field('54', amountStr) +
    field('58', 'BR') +
    field('59', name.slice(0, 25)) +
    field('60', city.slice(0, 15)) +
    field('62', field('05', txidClean)) +
    '6304';

  payload += crc16(payload).toString(16).toUpperCase().padStart(4, '0');
  return payload;
}

function crc16(str: string): number {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return crc & 0xffff;
}
```

- [ ] Commit: `rtk git add src/components/checkout/PixPayment.tsx && rtk git commit -m "feat: add PixPayment with QR canvas, copy PIX key, EMV payload builder"`

---

## Task 21 — src/components/checkout/CardPayment.tsx

- [ ] Criar `src/components/checkout/CardPayment.tsx`:

```tsx
// src/components/checkout/CardPayment.tsx
import { useEffect, useRef } from 'react';

interface CardPaymentProps {
  amount: number;
  mp: any;
  onTokenReceived: (token: string, paymentMethodId: string) => void;
}

export default function CardPayment({ amount, mp, onTokenReceived }: CardPaymentProps) {
  const cardFormRef = useRef<any>(null);

  useEffect(() => {
    if (!mp) return;

    const cardForm = mp.cardForm({
      amount: String(amount.toFixed(2)),
      autoMount: true,
      form: {
        id: 'cardFormInternal',
        cardNumber: {
          id: 'mp_card_number',
          placeholder: 'Número do cartão',
        },
        expirationDate: {
          id: 'mp_expiration_date',
          placeholder: 'MM/AA',
        },
        securityCode: {
          id: 'mp_security_code',
          placeholder: 'CVV',
        },
        cardholderName: {
          id: 'mp_cardholder_name',
          placeholder: 'Nome no cartão',
        },
        installments: {
          id: 'mp_installments',
        },
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) console.error('[CardPayment] onFormMounted error:', error);
        },
        onCardTokenReceived: (error: any, token: any) => {
          if (error) {
            console.error('[CardPayment] token error:', error);
            return;
          }
          if (token) {
            onTokenReceived(token.id, token.payment_method_id);
          }
        },
      },
    });

    cardFormRef.current = cardForm;

    return () => {
      try {
        cardFormRef.current?.unmount();
      } catch {
        // ignorar erros de unmount
      }
    };
  }, [mp, amount, onTokenReceived]);

  return (
    <form id="cardFormInternal" className="card-payment-form" noValidate>
      <div className="card-payment-field">
        <label htmlFor="mp_card_number">Número do cartão</label>
        <div id="mp_card_number" className="mp-field" />
      </div>

      <div className="card-payment-row">
        <div className="card-payment-field">
          <label htmlFor="mp_expiration_date">Validade</label>
          <div id="mp_expiration_date" className="mp-field" />
        </div>
        <div className="card-payment-field">
          <label htmlFor="mp_security_code">CVV</label>
          <div id="mp_security_code" className="mp-field" />
        </div>
      </div>

      <div className="card-payment-field">
        <label htmlFor="mp_cardholder_name">Nome no cartão</label>
        <div id="mp_cardholder_name" className="mp-field" />
      </div>

      <div className="card-payment-field">
        <label htmlFor="mp_installments">Parcelas</label>
        <div id="mp_installments" className="mp-field" />
      </div>

      <button type="submit" className="card-payment-submit" aria-label="Confirmar pagamento com cartão">
        Confirmar Pagamento
      </button>
    </form>
  );
}
```

- [ ] Commit: `rtk git add src/components/checkout/CardPayment.tsx && rtk git commit -m "feat: add CardPayment wrapping Mercado Pago cardForm SDK"`

---

## Task 22 — src/components/checkout/CheckoutModal.tsx

- [ ] Criar `src/components/checkout/CheckoutModal.tsx` (este é o lazy chunk):

```tsx
// src/components/checkout/CheckoutModal.tsx
// Este arquivo É o chunk lazy — não importar em outros lugares sem React.lazy
import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useCheckout } from '../../hooks/useCheckout';
import { loadMercadoPago } from '../../lib/mercadopago';
import PixPayment from './PixPayment';
import CardPayment from './CardPayment';
import type { Pedido } from '../../types';

interface CheckoutModalProps {
  onClose: () => void;
}

type Step = 'form' | 'pix' | 'card' | 'success';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const { submitPedido } = useCheckout();

  const [step, setStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [txid, setTxid] = useState('');

  // Dados do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [entrega, setEntrega] = useState<'retirada' | 'delivery'>('retirada');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [complemento, setComplemento] = useState('');
  const [pagamento, setPagamento] = useState<'pix' | 'cartao' | 'pagar_retirada'>('pix');
  const [observacoes, setObservacoes] = useState('');

  // Mercado Pago instance (apenas para cartão)
  const [mpInstance, setMpInstance] = useState<any>(null);

  const total = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);

  // Focus trap + Esc
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length) focusables[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        if (focusables.length === 0) { e.preventDefault(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const dadosPedido: Pedido = {
      nome,
      telefone,
      email: email || undefined,
      cep: cep || undefined,
      endereco: endereco || undefined,
      bairro: bairro || undefined,
      cidade: cidade || undefined,
      estado: estado || undefined,
      complemento: complemento || undefined,
      pagamento,
      entrega,
      observacoes: observacoes || undefined,
      total,
      status: 'pendente',
      itens: items,
    };

    const result = await submitPedido(dadosPedido, items);
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error ?? 'Erro ao registrar pedido.');
      return;
    }

    setPedidoId(result.pedido?.id ?? null);
    const newTxid = `AG${Date.now()}`;
    setTxid(newTxid);

    if (pagamento === 'pix') {
      setStep('pix');
    } else if (pagamento === 'cartao') {
      try {
        const mp = await loadMercadoPago();
        setMpInstance(mp);
        setStep('card');
      } catch {
        setSubmitError('Não foi possível carregar o módulo de pagamento. Tente novamente.');
      }
    } else {
      // pagar_retirada
      clearCart();
      setStep('success');
    }
  }

  function handlePixClose() {
    clearCart();
    setStep('success');
  }

  function handleTokenReceived(_token: string, _paymentMethodId: string) {
    // Aqui normalmente se faria a chamada ao backend para processar o cartão.
    // Por ora, avança para success.
    clearCart();
    setStep('success');
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="modal-overlay" onPointerDown={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar compra"
        className="checkout-modal"
      >
        <button
          type="button"
          className="checkout-modal__close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* STEP: form */}
        {step === 'form' && (
          <div className="checkout-modal__content">
            <h2 className="checkout-modal__title">Finalizar Compra</h2>
            <p className="checkout-modal__total">Total: {fmt(total)}</p>

            <form onSubmit={handleSubmit} noValidate className="checkout-form">
              {/* Dados pessoais */}
              <fieldset className="checkout-form__fieldset">
                <legend>Seus dados</legend>

                <div className="checkout-form__field">
                  <label htmlFor="co_nome">Nome completo *</label>
                  <input
                    id="co_nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="checkout-form__field">
                  <label htmlFor="co_telefone">Telefone / WhatsApp *</label>
                  <input
                    id="co_telefone"
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="checkout-form__field">
                  <label htmlFor="co_email">E-mail</label>
                  <input
                    id="co_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </fieldset>

              {/* Entrega */}
              <fieldset className="checkout-form__fieldset">
                <legend>Entrega</legend>
                <div className="checkout-form__radio-group" role="radiogroup" aria-label="Tipo de entrega">
                  <label className="checkout-form__radio">
                    <input
                      type="radio"
                      name="entrega"
                      value="retirada"
                      checked={entrega === 'retirada'}
                      onChange={() => setEntrega('retirada')}
                    />
                    Retirada na loja
                  </label>
                  <label className="checkout-form__radio">
                    <input
                      type="radio"
                      name="entrega"
                      value="delivery"
                      checked={entrega === 'delivery'}
                      onChange={() => setEntrega('delivery')}
                    />
                    Delivery
                  </label>
                </div>

                {entrega === 'delivery' && (
                  <div className="checkout-form__address">
                    <div className="checkout-form__field">
                      <label htmlFor="co_cep">CEP</label>
                      <input
                        id="co_cep"
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="00000-000"
                        autoComplete="postal-code"
                      />
                    </div>
                    <div className="checkout-form__field">
                      <label htmlFor="co_endereco">Endereço *</label>
                      <input
                        id="co_endereco"
                        type="text"
                        required={entrega === 'delivery'}
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="checkout-form__field">
                      <label htmlFor="co_bairro">Bairro</label>
                      <input
                        id="co_bairro"
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                      />
                    </div>
                    <div className="checkout-form__row">
                      <div className="checkout-form__field">
                        <label htmlFor="co_cidade">Cidade</label>
                        <input
                          id="co_cidade"
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          autoComplete="address-level2"
                        />
                      </div>
                      <div className="checkout-form__field checkout-form__field--small">
                        <label htmlFor="co_estado">UF</label>
                        <input
                          id="co_estado"
                          type="text"
                          maxLength={2}
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase())}
                          autoComplete="address-level1"
                        />
                      </div>
                    </div>
                    <div className="checkout-form__field">
                      <label htmlFor="co_complemento">Complemento</label>
                      <input
                        id="co_complemento"
                        type="text"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </fieldset>

              {/* Pagamento */}
              <fieldset className="checkout-form__fieldset">
                <legend>Pagamento</legend>
                <div className="checkout-form__radio-group" role="radiogroup" aria-label="Forma de pagamento">
                  <label className="checkout-form__radio">
                    <input
                      type="radio"
                      name="pagamento"
                      value="pix"
                      checked={pagamento === 'pix'}
                      onChange={() => setPagamento('pix')}
                    />
                    PIX
                  </label>
                  <label className="checkout-form__radio">
                    <input
                      type="radio"
                      name="pagamento"
                      value="cartao"
                      checked={pagamento === 'cartao'}
                      onChange={() => setPagamento('cartao')}
                    />
                    Cartão de crédito
                  </label>
                  <label className="checkout-form__radio">
                    <input
                      type="radio"
                      name="pagamento"
                      value="pagar_retirada"
                      checked={pagamento === 'pagar_retirada'}
                      onChange={() => setPagamento('pagar_retirada')}
                    />
                    Pagar na retirada
                  </label>
                </div>
              </fieldset>

              {/* Observações */}
              <div className="checkout-form__field">
                <label htmlFor="co_obs">Observações</label>
                <textarea
                  id="co_obs"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Alguma instrução especial?"
                />
              </div>

              {submitError && (
                <p className="checkout-form__error" role="alert">{submitError}</p>
              )}

              <button
                type="submit"
                className="checkout-form__submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'CONFIRMAR PEDIDO'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: pix */}
        {step === 'pix' && (
          <PixPayment total={total} txid={txid} onClose={handlePixClose} />
        )}

        {/* STEP: card */}
        {step === 'card' && mpInstance && (
          <div className="checkout-modal__content">
            <h2 className="checkout-modal__title">Pagamento com Cartão</h2>
            <p className="checkout-modal__total">Total: {fmt(total)}</p>
            <CardPayment
              amount={total}
              mp={mpInstance}
              onTokenReceived={handleTokenReceived}
            />
          </div>
        )}

        {/* STEP: success */}
        {step === 'success' && (
          <div className="checkout-modal__content checkout-modal__success">
            <div className="checkout-modal__success-icon" aria-hidden="true">✓</div>
            <h2 className="checkout-modal__title">Pedido confirmado!</h2>
            {pedidoId && (
              <p className="checkout-modal__pedido-id">
                Pedido #{pedidoId}
              </p>
            )}
            <p className="checkout-modal__success-msg">
              Em breve entraremos em contato pelo WhatsApp para confirmar os detalhes.
            </p>
            <button
              type="button"
              className="checkout-form__submit"
              onClick={onClose}
            >
              FECHAR
            </button>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] Commit: `rtk git add src/components/checkout/CheckoutModal.tsx && rtk git commit -m "feat: add lazy CheckoutModal with pix/card/retirada steps and success screen"`

---

## Task 23 — src/components/ProductModal.tsx

- [ ] Criar `src/components/ProductModal.tsx`:

```tsx
// src/components/ProductModal.tsx
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import type { Produto } from '../types';

interface ProductModalProps {
  produtoId: number | null;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

async function fetchProduto(id: number): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(*), _variacoes(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Produto;
}

export default function ProductModal({ produtoId, onClose }: ProductModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  const { data: produto, isLoading } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: () => fetchProduto(produtoId!),
    enabled: !!produtoId,
    staleTime: 5 * 60 * 1000,
  });

  // Focus trap + Esc
  useEffect(() => {
    if (!produtoId) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length) focusables[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        if (focusables.length === 0) { e.preventDefault(); return; }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [produtoId, onClose]);

  if (!produtoId) return null;

  const shareUrl = `${window.location.origin}/?p=${produtoId}`;

  async function handleShare() {
    if (navigator.share && produto) {
      try {
        await navigator.share({
          title: produto.nome,
          text: `${produto.nome} — Alpha Galerie`,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // silent
    }
  }

  function handleAddToCart() {
    if (!produto) return;
    addItem({
      id: produto.id,
      cartKey: `${produto.id}`,
      nome: produto.nome,
      marca: produto.marca,
      categoria: produto.categorias?.nome ?? '',
      preco: produto.preco_pix ?? produto.preco,
      imagem: produto.imagem_url,
      estoque: produto.estoque,
      qtd: 1,
    });
    onClose();
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="modal-overlay" onPointerDown={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={produto?.nome ?? 'Produto'}
        className="product-modal"
      >
        <button
          type="button"
          className="product-modal__close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {isLoading && (
          <div className="product-modal__loading" role="status" aria-live="polite">
            Carregando...
          </div>
        )}

        {!isLoading && produto && (
          <div className="product-modal__body">
            {produto.imagem_url && (
              <div className="product-modal__img-wrap">
                <img
                  src={produto.imagem_url}
                  alt={produto.nome}
                  className="product-modal__img"
                />
              </div>
            )}

            <div className="product-modal__info">
              <p className="product-modal__marca">{produto.marca}</p>
              <h2 className="product-modal__nome">{produto.nome}</h2>

              {produto.descricao && (
                <p className="product-modal__descricao">{produto.descricao}</p>
              )}

              <div className="product-modal__preco">
                {produto.preco_pix && (
                  <span className="product-modal__preco-pix">
                    {fmt(produto.preco_pix)} <small>PIX</small>
                  </span>
                )}
                <span className="product-modal__preco-normal">
                  {fmt(produto.preco)} <small>cartão</small>
                </span>
              </div>

              <div className="product-modal__actions">
                <button
                  type="button"
                  className="product-modal__add-btn"
                  onClick={handleAddToCart}
                  disabled={!produto.ativo}
                  aria-label={`Adicionar ${produto.nome} ao carrinho`}
                >
                  {produto.ativo ? 'ADICIONAR AO CARRINHO' : 'ESGOTADO'}
                </button>

                <button
                  type="button"
                  className="product-modal__share-btn"
                  onClick={handleShare}
                  aria-label="Compartilhar produto"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Compartilhar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] No `src/App.tsx` (Task 24), usar `useSearchParams` para ler `?p=ID` e passar ao `ProductModal`.

- [ ] Commit: `rtk git add src/components/ProductModal.tsx && rtk git commit -m "feat: add ProductModal reading ?p=ID via useSearchParams, with share and add to cart"`

---

## Task 24 — src/pages/Home.tsx + src/App.tsx + src/main.tsx + index.html

### 24a — src/pages/Home.tsx

- [ ] Criar diretório `src/pages/` se não existir.

- [ ] Criar `src/pages/Home.tsx`:

```tsx
// src/pages/Home.tsx
import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Announcement from '../components/Announcement';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import CartDrawer from '../components/CartDrawer';
import ProductModal from '../components/ProductModal';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Footer from '../components/Footer';

// Lazy chunks — carregados somente quando necessário
const CheckoutModal = lazy(() => import('../components/checkout/CheckoutModal'));

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // ?p=ID controla o ProductModal
  const produtoIdParam = searchParams.get('p');
  const produtoId = produtoIdParam ? parseInt(produtoIdParam, 10) : null;

  function closeProductModal() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('p');
      return next;
    });
  }

  return (
    <>
      <Announcement />
      <Header onOpenCart={() => setCartOpen(true)} />

      {/* Hero */}
      <section className="hero" aria-label="Bem-vindo à Alpha Galerie">
        <div className="hero__inner">
          <h1 className="hero__title">ALPHA GALERIE</h1>
          <p className="hero__sub">
            Headshop · Charutaria · Arguile · Lifestyle · Alphaville
          </p>
        </div>
      </section>

      {/* Produtos */}
      <main id="main-content">
        <ProductGrid
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
        />
      </main>

      {/* Rodapé */}
      <Footer />

      {/* Drawer do carrinho */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onOpenCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout (lazy) */}
      {checkoutOpen && (
        <Suspense fallback={null}>
          <CheckoutModal onClose={() => setCheckoutOpen(false)} />
        </Suspense>
      )}

      {/* ProductModal (?p=ID) */}
      <ProductModal
        produtoId={produtoId}
        onClose={closeProductModal}
      />

      {/* WhatsApp flutuante */}
      <FloatingWhatsApp />
    </>
  );
}
```

### 24b — src/App.tsx

- [ ] Criar/substituir `src/App.tsx`:

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 24c — src/main.tsx

- [ ] Criar/substituir `src/main.tsx`:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 24d — index.html (shell Vite)

- [ ] Substituir `index.html` pela versão shell Vite (sem conteúdo inline, sem JS monolítico):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="canonical" href="https://alphagalerie.com" />
  <title>ALPHA GALERIE — Headshop, Charutaria, Arguile · Alphaville</title>
  <meta name="description" content="Mais de 10 anos sendo a referência em headshop, charutaria, arguile e lifestyle em Alphaville." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ALPHA GALERIE" />
  <meta property="og:title" content="ALPHA GALERIE — Alphaville" />
  <meta property="og:description" content="Headshop · Charutaria · Arguile · Lifestyle · Alphaville/Barueri" />
  <meta property="og:image" content="https://alphagalerie.com/og-default.jpg" />
  <meta property="og:url" content="https://alphagalerie.com" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Alpha Galerie",
    "url": "https://alphagalerie.com",
    "telephone": "+5511942920076",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Barueri",
      "addressRegion": "SP",
      "addressCountry": "BR"
    }
  }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] Commit:

```bash
rtk git add src/pages/Home.tsx src/App.tsx src/main.tsx index.html && rtk git commit -m "feat: wire up Home page, App with QueryClient+Router, main entry, Vite shell index.html"
```

---

## Task 25 — public/ assets + SEO

### 25a — public/robots.txt

- [ ] Criar `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://alphagalerie.com/sitemap.xml
```

### 25b — public/sitemap.xml

- [ ] Criar `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://alphagalerie.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### 25c — Extrair logo do index.html monolítico

- [ ] Executar o seguinte comando para extrair o logo base64 do index.html e salvá-lo como `public/logo.png`:

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/src=\"data:image\/png;base64,([^\"]+)\"/);
if (m) {
  fs.writeFileSync('public/logo.png', Buffer.from(m[1], 'base64'));
  console.log('logo.png extraído com sucesso');
} else {
  console.log('Nenhum PNG base64 encontrado no index.html');
}
"
```

> **Nota:** Se o logo estiver em outro formato (SVG, JPEG) ou como arquivo referenciado, ajustar o regex adequadamente. Se não houver logo embutido, copiar o arquivo de logo existente para `public/logo.png` manualmente.

### 25d — Atualizar og:image para usar logo local

- [ ] Verificar que `index.html` referencia `og-default.jpg`. Criar ou copiar um fallback em `public/og-default.jpg` se não existir:

```bash
# Só rodar se og-default.jpg não existir em public/
node -e "
const fs = require('fs');
if (!fs.existsSync('public/og-default.jpg')) {
  // Copiar logo como fallback de OG image (JPEG seria melhor, mas PNG funciona)
  if (fs.existsSync('public/logo.png')) {
    fs.copyFileSync('public/logo.png', 'public/og-default.jpg');
    console.log('og-default.jpg criado a partir de logo.png');
  } else {
    console.log('Crie manualmente public/og-default.jpg (1200x630px recomendado)');
  }
}
"
```

- [ ] Commit:

```bash
rtk git add public/robots.txt public/sitemap.xml && rtk git commit -m "feat: add robots.txt, sitemap.xml, logo and OG image to public/"
```

---

## Task 26 — Verificação final + merge para main

### 26a — Build de produção

- [ ] Instalar dependência `qrcode` se ainda não instalado:

```bash
npm install qrcode && npm install --save-dev @types/qrcode
```

- [ ] Executar build:

```bash
npm run build
```

**Critério:** zero erros de TypeScript e Vite. Warnings de `any` no código MP são aceitáveis.

- [ ] Verificar tamanho dos chunks gerados:

```bash
# Windows PowerShell
Get-ChildItem dist/assets/*.js | Select-Object Name, @{N='KB';E={[math]::Round($_.Length/1KB,1)}} | Sort-Object KB -Descending
```

**Critério:** chunk inicial (`index-*.js`) < 60 KB gzip. CheckoutModal deve aparecer como chunk separado.

- [ ] Visualizar bundle (opcional):

```bash
npx vite-bundle-visualizer
```

### 26b — Smoke test local

- [ ] Iniciar preview:

```bash
npm run preview
```

- [ ] Abrir `http://localhost:4173` e verificar manualmente:
  - [ ] Home carrega com header, grid de produtos e footer
  - [ ] Filtro de categorias filtra produtos
  - [ ] Busca filtra por nome/marca
  - [ ] Clicar produto com variações abre VariacoesModal
  - [ ] Adicionar ao carrinho abre CartDrawer
  - [ ] Clicar "Finalizar Compra" carrega CheckoutModal (verificar Network tab: MP SDK **não** carregado ainda)
  - [ ] Selecionar PIX → ver QR Code + chave PIX
  - [ ] Selecionar cartão → MP SDK carregado **agora** (verificar Network tab)
  - [ ] Navegar para `/?p=1` → ProductModal abre com produto correto
  - [ ] Esc fecha todos os modais

### 26c — Network tab — first paint sem SDKs externos

- [ ] Abrir DevTools → Network → recarregar página
- [ ] Verificar que **não há** requisição para `sdk.mercadopago.com` no carregamento inicial
- [ ] Verificar que **não há** `supabase-js` sendo carregado como script externo (deve estar no bundle)

### 26d — Lighthouse

- [ ] Executar Lighthouse CLI (com preview rodando):

```bash
npx lighthouse http://localhost:4173 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"
```

- [ ] Verificar scores no JSON ou no relatório HTML:

```bash
node -e "
const r = require('./lighthouse-report.json');
const cats = r.categories;
console.log('Performance:', Math.round(cats.performance.score * 100));
console.log('Accessibility:', Math.round(cats.accessibility.score * 100));
console.log('SEO:', Math.round(cats.seo.score * 100));
console.log('Best Practices:', Math.round(cats['best-practices'].score * 100));
"
```

**Critérios mínimos:**
| Categoria | Score mínimo |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| SEO | ≥ 95 |
| Best Practices | ≥ 90 |

- [ ] Se Accessibility < 95: verificar aria-labels faltando, contraste, ou focus trap incorreto.
- [ ] Se SEO < 95: verificar meta description, canonical, structured data.

### 26e — Push e Pull Request

- [ ] Push da branch para o GitHub:

```bash
rtk git push -u origin feat/migrate-vite
```

- [ ] Criar Pull Request via `gh`:

```bash
gh pr create \
  --title "feat: Vite 5 + React 18 migration — Part 3 (ProductGrid, Checkout, Home, Deploy)" \
  --body "$(cat <<'EOF'
## Summary

- Implements ProductGrid with category/subcategory/search filters (Tasks 15)
- Adds VariacoesModal with full focus trap and ESGOTADO badges (Task 16)
- Adds CartDrawer lateral with qty controls and totals (Task 17)
- Lazy-loads Mercado Pago SDK only when checkout opens (Task 18)
- Adds useCheckout hook with itens_snapshot fallback (Task 19)
- Implements PixPayment with EMV QR Code canvas (Task 20)
- Implements CardPayment wrapping MP cardForm (Task 21)
- Wires up CheckoutModal as single React.lazy chunk (Task 22)
- Adds ProductModal reading ?p=ID via useSearchParams (Task 23)
- Mounts complete Home page + App + main.tsx + index.html shell (Task 24)
- Adds robots.txt, sitemap.xml, logo and OG assets (Task 25)

## Checklist before merge

- [ ] `npm run build` passes with zero errors
- [ ] Initial JS chunk < 60 KB gzip
- [ ] MP SDK absent from first-paint network requests
- [ ] Lighthouse Performance ≥ 90, A11y ≥ 95, SEO ≥ 95
- [ ] Smoke test on Vercel preview deploy

## Vercel env vars required

Set these in the Vercel dashboard before promoting to production:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_MP_PUBLIC_KEY` | Mercado Pago public key |
| `VITE_PIX_KEY` | PIX key (phone, CPF, email or random) |
| `VITE_PIX_NAME` | Receiver name (max 25 chars) |
| `VITE_PIX_CITY` | Receiver city (max 15 chars) |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number with country code (e.g. 5511942920076) |
EOF
)"
```

### 26f — Configurar Vercel

- [ ] No painel Vercel → Settings → Environment Variables, adicionar:

| Variável | Ambiente |
|---|---|
| `VITE_SUPABASE_URL` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `VITE_MP_PUBLIC_KEY` | Production, Preview, Development |
| `VITE_PIX_KEY` | Production, Preview |
| `VITE_PIX_NAME` | Production, Preview |
| `VITE_PIX_CITY` | Production, Preview |
| `VITE_WHATSAPP_NUMBER` | Production, Preview |

- [ ] Framework Preset: **Vite**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### 26g — Smoke test no preview deploy

- [ ] Aguardar deploy do preview no GitHub PR
- [ ] Abrir URL do preview deploy (ex: `https://alphagalerie-site-git-feat-migrate-vite-XXXX.vercel.app`)
- [ ] Repetir checklist do smoke test local (26b)
- [ ] Verificar que Supabase queries retornam dados reais (não mock)
- [ ] Verificar que PIX QR Code é gerado corretamente
- [ ] Só promover para production após todos os itens aprovados

### 26h — Merge para main

- [ ] Após aprovação do PR e smoke test no preview:

```bash
gh pr merge --merge --delete-branch
```

- [ ] Verificar deploy automático da branch `main` na Vercel.
- [ ] Smoke test final em `https://alphagalerie.com`.

---

## Resumo de arquivos criados nas Tasks 15–26

| Arquivo | Task |
|---|---|
| `src/components/ProductGrid.tsx` | 15 |
| `src/components/VariacoesModal.tsx` | 16 |
| `src/components/CartDrawer.tsx` | 17 |
| `src/components/CartDrawer.module.css` | 17 |
| `src/lib/mercadopago.ts` | 18 |
| `src/hooks/useCheckout.ts` | 19 |
| `src/components/checkout/PixPayment.tsx` | 20 |
| `src/components/checkout/CardPayment.tsx` | 21 |
| `src/components/checkout/CheckoutModal.tsx` | 22 |
| `src/components/ProductModal.tsx` | 23 |
| `src/pages/Home.tsx` | 24 |
| `src/App.tsx` | 24 |
| `src/main.tsx` | 24 |
| `index.html` | 24 |
| `public/robots.txt` | 25 |
| `public/sitemap.xml` | 25 |
| `public/logo.png` | 25 |

## Dependências npm adicionadas

```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

> **Dependências das partes anteriores** (devem já estar instaladas):
> `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `@supabase/supabase-js`, `vite`, `@vitejs/plugin-react`, `typescript`
