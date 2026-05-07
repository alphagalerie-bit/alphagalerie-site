import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.hero} aria-label="Bem-vindo à Alpha Galerie">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Alpha Galerie · Alphaville · Desde 2014</p>

        <h1 className={styles.title}>
          <span className={styles.light}>A referência</span>
          <br />
          em <em>tabacaria</em>
          <br />
          de Alphaville.
        </h1>

        <p className={styles.lead}>
          Headshop, charutaria, arguile e lifestyle reunidos numa curadoria
          que respeita quem entende.{' '}
          <strong style={{ color: '#f4f4f4' }}>
            Atendimento direto, curadoria de verdade.
          </strong>
        </p>

        <a href="#produtos" className={styles.cta}>
          Explorar Vitrine
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>

        <div className={styles.meta} aria-label="Números da Alpha Galerie">
          <div>
            <div className={styles.metaNum}>10+</div>
            <div className={styles.metaLabel}>Anos no mercado</div>
          </div>
          <div>
            <div className={styles.metaNum}>500+</div>
            <div className={styles.metaLabel}>Produtos curados</div>
          </div>
          <div>
            <div className={styles.metaNum}>100%</div>
            <div className={styles.metaLabel}>Atendimento direto</div>
          </div>
        </div>
      </div>
    </section>
  );
}
