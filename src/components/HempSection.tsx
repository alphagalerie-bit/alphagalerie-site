import styles from './HempSection.module.css';

const TAGS = [
  'Anvisa regulamentado',
  'Prescrição médica',
  'Pacientes + médicos',
  'Cannabis terapêutica',
];

export default function HempSection() {
  return (
    <section className={styles.section} id="hemp" aria-label="Alpha Hemp Brasil">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Universo Alpha · Cannabis Medicinal</p>

        <h2 className={styles.name}>
          Alpha <em>Hemp</em> Brasil
        </h2>
        <p className={styles.subtitle}>Especialistas em Cannabis Medicinal Regulamentada</p>

        <div className={styles.divider} aria-hidden="true" />

        <h3 className={styles.title}>
          Cannabis medicinal com responsabilidade.
          <br />
          Informação, suporte e <em>cuidado especializado</em>.
        </h3>

        <p className={styles.text}>
          A Alpha Hemp Brasil é dedicada exclusivamente ao universo da cannabis
          medicinal regulamentada no Brasil. Atendemos pacientes com prescrição
          médica e cadastro na Anvisa, oferecendo informação qualificada,
          suporte ao tratamento e produtos dentro da legislação brasileira vigente.
        </p>

        <div className={styles.tags} role="list" aria-label="Diferenciais">
          {TAGS.map((tag) => (
            <span key={tag} className={styles.tag} role="listitem">
              {tag}
            </span>
          ))}
        </div>

        <a
          href="https://alphahempbrasil.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
        >
          Acessar Alpha Hemp Brasil
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>
      </div>
    </section>
  );
}
