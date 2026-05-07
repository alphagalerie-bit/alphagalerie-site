import type { FC } from 'react';
import { useCartStore } from '../store/cart';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenCart: () => void;
}

const CartIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const Header: FC<HeaderProps> = ({ onOpenCart }) => {
  const itemCount = useCartStore((state) => state.selectItemCount());

  return (
    <header>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a href="/" aria-label="Alpha Galerie — página inicial">
            <img
              src="/logo.png"
              alt="alpha.galerie"
              className={styles.logoImg}
              width={120}
              height={40}
            />
          </a>

          <ul className={styles.navLinks}>
            <li><a href="#produtos">Vitrine</a></li>
            <li>
              <a
                href="https://alphahempbrasil.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.hempLink}
              >
                Hemp Brasil
              </a>
            </li>
          </ul>

          <button
            type="button"
            className={styles.cartBtn}
            onClick={onOpenCart}
            aria-label="Abrir carrinho"
          >
            <CartIcon />
            <span>Carrinho</span>
            {itemCount > 0 && (
              <span className={styles.cartCount} aria-live="polite">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
