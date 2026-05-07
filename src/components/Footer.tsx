import type { FC } from 'react';
import styles from './Footer.module.css';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER as string;
const CURRENT_YEAR = new Date().getFullYear();

const Footer: FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <p className={styles.brandName}>alpha.galerie</p>
          <p className={styles.brandDesc}>
            Curadoria de produtos exclusivos com identidade única. Arte,
            moda e lifestyle em um só lugar.
          </p>
        </div>

        <nav aria-label="Links do rodapé">
          <p className={styles.colTitle}>Navegue</p>
          <ul className={styles.navList}>
            <li><a href="#produtos">Vitrine</a></li>
            <li><a href="#sobre">Sobre</a></li>
            <li>
              <a href="https://alphahempbrasil.com" target="_blank" rel="noopener noreferrer">
                Hemp Brasil
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className={styles.colTitle}>Contato</p>
          <ul className={styles.contactList}>
            <li>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="mailto:contato@alphagalerie.com.br">
                contato@alphagalerie.com.br
              </a>
            </li>
            <li>São Paulo — SP, Brasil</li>
          </ul>
        </div>
      </div>

      <div className={styles.copyright}>
        <p>&copy; {CURRENT_YEAR} alpha.galerie — Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
