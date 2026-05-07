// src/components/CartDrawer.tsx
import { useEffect, useRef } from 'react';
import { useCartStore } from '../store/cart';
import { formatCurrency } from '../lib/format';
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
  const removeItem = useCartStore((s) => s.removeItem);
  const changeQty = useCartStore((s) => s.changeQty);
  const selectTotal = useCartStore((s) => s.selectTotal);

  const total = selectTotal();
  const itemCount = items.reduce((acc, i) => acc + i.qtd, 0);

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

  const fmt = formatCurrency;

  return (
    <>
      {/* Overlay */}
      <div
        className={styles.overlay}
        onPointerDown={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={styles.drawer}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>
            Carrinho{itemCount > 0 ? ` (${itemCount})` : ''}
          </span>
          <button
            type="button"
            aria-label="Fechar carrinho"
            onClick={onClose}
            className={styles.closeBtn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span style={{ fontFamily: 'Inter, sans-serif' }}>Seu carrinho está vazio.</span>
          </div>
        ) : (
          <ul className={styles.itemList} role="list" aria-label="Itens no carrinho">
            {items.map((item) => (
              <li key={item.cartKey} className={styles.item}>
                {/* Imagem */}
                {item.imagem ? (
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    className={styles.itemImg}
                    width={72}
                    height={72}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={styles.itemImgPlaceholder} aria-hidden="true" />
                )}

                {/* Info */}
                <div className={styles.itemInfo}>
                  <span className={styles.itemNome} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.nome}
                  </span>
                  {item.variacao && (
                    <span className={styles.itemVariacao} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.variacao}
                    </span>
                  )}
                  <span className={styles.itemPreco} style={{ fontFamily: 'Inter, sans-serif' }}>
                    {fmt(item.preco)}
                  </span>
                  {/* Qty controls */}
                  <div className={styles.qtyRow}>
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${item.nome}`}
                      onClick={() => changeQty(item.cartKey, -1)}
                      className={styles.qtyBtn}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue} aria-live="polite" aria-label={`Quantidade: ${item.qtd}`}>
                      {item.qtd}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${item.nome}`}
                      onClick={() => changeQty(item.cartKey, +1)}
                      className={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  aria-label={`Remover ${item.nome} do carrinho`}
                  onClick={() => removeItem(item.cartKey)}
                  className={styles.removeBtn}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
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
              <span style={{ fontFamily: 'Inter, sans-serif' }}>Subtotal</span>
              <span style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(total)}</span>
            </div>
            <div className={styles.totalsRowHighlight}>
              <span style={{ fontFamily: 'Inter, sans-serif' }}>Total</span>
              <span style={{ fontFamily: 'Inter, sans-serif', color: '#c9a961' }}>{fmt(total)}</span>
            </div>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={() => { onClose(); onOpenCheckout(); }}
              disabled={items.length === 0}
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </>
  );
}
