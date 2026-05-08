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
      className={`${styles.toast}${visible ? '' : ` ${styles.hidden}`}`}
    >
      <div className={styles.row}>
        <div className={styles.media} aria-hidden="true">
          {item.imagem ? (
            <img
              src={item.imagem}
              alt=""
              className={styles.image}
              width={40}
              height={40}
              loading="eager"
              decoding="async"
            />
          ) : (
            <svg className={styles.placeholder} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>{item.marca || 'Adicionado'}</p>
          <p className={styles.name}>{item.nome}</p>
          {item.variacao && <p className={styles.variation}>{item.variacao}</p>}
          <p className={styles.price}>{formatCurrency(item.preco)}</p>
        </div>
      </div>

      <button type="button" className={styles.action} onClick={handleOpenCart}>
        Ver carrinho →
      </button>
    </div>
  );
}