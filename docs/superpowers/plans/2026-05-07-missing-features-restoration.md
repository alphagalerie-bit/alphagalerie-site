# Missing Features Restoration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore all features present in the original monolithic `index.html` that were not carried over to the Vite+React migration.

**Architecture:** Each missing feature is implemented as a self-contained React component or hook addition. Features are grouped by blast radius: UI-only additions first (announcement bar, hero, hemp section, footer fixes), then state-dependent additions (frete/cupom in checkout), then side-effect features (pop-up, visit tracking, URL filter params). No new Supabase tables are created — all new tables (`visitas_site`, `leads_whatsapp`) are treated as optional (fire-and-forget with try/catch).

**Tech Stack:** React 18, TypeScript, CSS Modules, Zustand, Supabase JS v2, Vite 5, pnpm

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/AnnouncementBar.tsx` | Create | Marquee animado no topo |
| `src/components/AnnouncementBar.module.css` | Create | Estilos da faixa |
| `src/components/HeroSection.tsx` | Create | Hero com h1, lead, CTA, métricas |
| `src/components/HeroSection.module.css` | Create | Estilos do hero |
| `src/components/HempSection.tsx` | Create | Seção editorial Alpha Hemp Brasil |
| `src/components/HempSection.module.css` | Create | Estilos da seção hemp |
| `src/components/Footer.tsx` | Modify | Adicionar aviso de idade + versão |
| `src/components/Footer.module.css` | Modify | Estilos novos do footer |
| `src/components/Header.tsx` | Modify | Garantir link Hemp Brasil já existente |
| `src/lib/frete.ts` | Create | Cálculo de frete por range de CEP |
| `src/lib/frete.test.ts` | Create | Testes unitários do cálculo de frete |
| `src/components/checkout/CheckoutModal.tsx` | Modify | Adicionar cupom + frete + resumo completo |
| `src/hooks/useVisita.ts` | Create | Registro de visita via ipapi.co + Supabase |
| `src/components/RecuperacaoPopup.tsx` | Create | Pop-up de recuperação de venda |
| `src/components/RecuperacaoPopup.module.css` | Create | Estilos do popup |
| `src/pages/Home.tsx` | Modify | Montar tudo: AnnouncementBar, HeroSection, HempSection, URL params, popup, visita |

---

## Task 1: Announcement Bar (faixa marquee animada)

**Files:**
- Create: `src/components/AnnouncementBar.tsx`
- Create: `src/components/AnnouncementBar.module.css`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Create the CSS module**

Create `src/components/AnnouncementBar.module.css`:

```css
.bar {
  background: #000;
  border-bottom: 1px solid #1a1a1a;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 10px 0;
  overflow: hidden;
  white-space: nowrap;
  user-select: none;
}

.track {
  display: inline-flex;
  gap: 60px;
  animation: marquee 50s linear infinite;
}

.track span::before {
  content: '◆';
  margin-right: 60px;
  color: #c9a961;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

- [ ] **Step 2: Create the component**

Create `src/components/AnnouncementBar.tsx`:

```tsx
import styles from './AnnouncementBar.module.css';

const ITEMS = [
  'Alphaville · Barueri · SP',
  'Atendimento via WhatsApp',
  '+10 anos no mercado',
  'Headshop · Charutaria · Arguile · Lifestyle',
];

// Duplicar para que o marquee seja contínuo (sem gap visível no loop)
const ALL = [...ITEMS, ...ITEMS];

export default function AnnouncementBar() {
  return (
    <div className={styles.bar} aria-hidden="true">
      <div className={styles.track}>
        {ALL.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add to Home.tsx — insert before `<Header>`**

Open `src/pages/Home.tsx`. Add the import at the top:

```tsx
import AnnouncementBar from '../components/AnnouncementBar';
```

Insert `<AnnouncementBar />` as the very first child inside the fragment, before `<Header ...>`:

```tsx
return (
  <>
    <AnnouncementBar />
    <Header onOpenCart={() => setCartOpen(true)} />
    {/* ... rest unchanged ... */}
  </>
);
```

- [ ] **Step 4: Build and verify no TypeScript errors**

```powershell
cd C:\WEBSITES\alphagalerie-site
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/AnnouncementBar.tsx src/components/AnnouncementBar.module.css src/pages/Home.tsx
git commit -m "feat: add announcement bar marquee above header"
```

---

## Task 2: Hero Section completo

**Files:**
- Create: `src/components/HeroSection.tsx`
- Create: `src/components/HeroSection.module.css`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Create the CSS module**

Create `src/components/HeroSection.module.css`:

```css
.hero {
  position: relative;
  padding: 64px 24px 80px;
  overflow: hidden;
  border-bottom: 1px solid rgba(201, 169, 97, 0.12);
}

.hero::before {
  content: '';
  position: absolute;
  top: 10%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(201, 169, 97, 0.08) 0%, transparent 60%);
  filter: blur(80px);
  pointer-events: none;
}

.inner {
  max-width: 1320px;
  margin: 0 auto;
}

.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9a961;
  margin-bottom: 24px;
}

.title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 600;
  line-height: 1.1;
  color: #f4f4f4;
  margin-bottom: 24px;
}

.title em {
  color: #c9a961;
  font-style: italic;
}

.title .light {
  font-weight: 300;
}

.lead {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: rgba(244, 244, 244, 0.65);
  line-height: 1.7;
  max-width: 600px;
  margin-bottom: 36px;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: #c9a961;
  color: #000;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  margin-bottom: 56px;
}

.cta:hover {
  background: #f4f4f4;
  box-shadow: 0 0 30px rgba(201, 169, 97, 0.25);
}

.meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding-top: 40px;
  border-top: 1px solid rgba(244, 244, 244, 0.08);
  max-width: 480px;
}

.metaNum {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.25rem;
  font-weight: 600;
  color: #f4f4f4;
  line-height: 1;
  margin-bottom: 6px;
}

.metaLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(244, 244, 244, 0.45);
}

@media (max-width: 640px) {
  .hero { padding: 40px 16px 56px; }
  .title { margin-bottom: 20px; }
  .lead { font-size: 1rem; margin-bottom: 28px; }
  .cta { width: 100%; justify-content: center; padding: 18px 24px; margin-bottom: 40px; }
  .meta { gap: 16px; padding-top: 28px; }
  .metaNum { font-size: 1.75rem; }
}
```

- [ ] **Step 2: Create the component**

Create `src/components/HeroSection.tsx`:

```tsx
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
```

- [ ] **Step 3: Replace the inline hero in Home.tsx**

Open `src/pages/Home.tsx`. Add import:

```tsx
import HeroSection from '../components/HeroSection';
```

Remove the existing `<section ... aria-label="Bem-vindo à Alpha Galerie">...</section>` block (the one with the inline `ALPHA GALERIE` h1) and replace it with:

```tsx
<HeroSection />
```

The Home.tsx return should now look like:

```tsx
return (
  <>
    <AnnouncementBar />
    <Header onOpenCart={() => setCartOpen(true)} />
    <HeroSection />
    <main id="main-content">
      <ProductGrid categoryId={categoryId} onCategoryChange={setCategoryId} />
    </main>
    <Footer />
    {/* ... modals unchanged ... */}
  </>
);
```

- [ ] **Step 4: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroSection.tsx src/components/HeroSection.module.css src/pages/Home.tsx
git commit -m "feat: add hero section with h1, lead, CTA and stats"
```

---

## Task 3: Seção Alpha Hemp Brasil

**Files:**
- Create: `src/components/HempSection.tsx`
- Create: `src/components/HempSection.module.css`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Create the CSS module**

Create `src/components/HempSection.module.css`:

```css
.section {
  position: relative;
  padding: 80px 24px;
  background: #000;
  border-top: 1px solid #1a1a1a;
  border-bottom: 1px solid #1a1a1a;
  overflow: hidden;
}

.section::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(74, 154, 74, 0.06) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

.inner {
  max-width: 1320px;
  margin: 0 auto;
  max-width: 720px;
}

.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #4a9a4a;
  margin-bottom: 16px;
}

.name {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 500;
  color: #f4f4f4;
  line-height: 1.1;
  margin-bottom: 6px;
}

.name em {
  color: #4a9a4a;
  font-style: italic;
}

.subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(244, 244, 244, 0.45);
  letter-spacing: 0.04em;
  margin-bottom: 28px;
}

.divider {
  width: 48px;
  height: 1px;
  background: #4a9a4a;
  margin-bottom: 28px;
  opacity: 0.5;
}

.title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.25rem, 2.5vw, 1.625rem);
  font-weight: 500;
  color: #f4f4f4;
  line-height: 1.35;
  margin-bottom: 20px;
}

.title em {
  color: #4a9a4a;
  font-style: italic;
}

.text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: rgba(244, 244, 244, 0.6);
  line-height: 1.75;
  margin-bottom: 28px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 36px;
}

.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #4a9a4a;
  border: 1px solid rgba(74, 154, 74, 0.35);
  padding: 6px 12px;
  border-radius: 2px;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: transparent;
  border: 1px solid #4a9a4a;
  color: #4a9a4a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.cta:hover {
  background: #4a9a4a;
  color: #000;
}

@media (max-width: 640px) {
  .section { padding: 56px 16px; }
  .cta { width: 100%; justify-content: center; }
}
```

- [ ] **Step 2: Create the component**

Create `src/components/HempSection.tsx`:

```tsx
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
```

- [ ] **Step 3: Add to Home.tsx between ProductGrid and Footer**

Open `src/pages/Home.tsx`. Add import:

```tsx
import HempSection from '../components/HempSection';
```

Insert `<HempSection />` after `</main>` and before `<Footer />`:

```tsx
<main id="main-content">
  <ProductGrid categoryId={categoryId} onCategoryChange={setCategoryId} />
</main>
<HempSection />
<Footer />
```

- [ ] **Step 4: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/HempSection.tsx src/components/HempSection.module.css src/pages/Home.tsx
git commit -m "feat: add Alpha Hemp Brasil editorial section"
```

---

## Task 4: Footer — aviso de idade e versão do site

**Files:**
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/Footer.module.css`

- [ ] **Step 1: Read Footer.module.css to check existing classes**

Read `src/components/Footer.module.css` and identify if a `copyright` class exists. Add two new classes at the bottom of the file:

```css
.warning {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(244, 244, 244, 0.35);
}

.version {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: rgba(244, 244, 244, 0.2);
  letter-spacing: 0.05em;
  margin-left: 12px;
}
```

Also update the `.copyright` block so it uses `display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;`. If it doesn't exist yet, add:

```css
.copyright {
  border-top: 1px solid #1a1a1a;
  padding-top: 24px;
  margin-top: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: rgba(244, 244, 244, 0.3);
}
```

- [ ] **Step 2: Update Footer.tsx copyright block**

Open `src/components/Footer.tsx`. Replace the `<div className={styles.copyright}>` block with:

```tsx
<div className={styles.copyright}>
  <p>
    &copy; {CURRENT_YEAR} Alpha Galerie · Todos os direitos reservados
    <span className={styles.version}>v{APP_VERSION}</span>
  </p>
  <p className={styles.warning}>⚠ Produtos destinados a maiores de 18 anos</p>
</div>
```

And add the version constant near the top of the file (after the imports):

```tsx
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? new Date().toISOString().slice(0, 10);
```

- [ ] **Step 3: Add VITE_APP_VERSION to .env.example**

Open `.env.example` and append:

```
VITE_APP_VERSION=2026.05.07
```

Open `.env.local` and append:

```
VITE_APP_VERSION=2026.05.07
```

- [ ] **Step 4: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx src/components/Footer.module.css .env.example .env.local
git commit -m "feat: add age warning and version to footer"
```

---

## Task 5: Cálculo de frete por CEP

**Files:**
- Create: `src/lib/frete.ts`
- Create: `src/lib/frete.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/frete.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularFrete } from './frete';

describe('calcularFrete', () => {
  it('returns zero and free label for retirada', () => {
    const r = calcularFrete('retirada', '');
    expect(r.valor).toBe(0);
    expect(r.label).toMatch(/retirada/i);
  });

  it('returns zero and free label for delivery with empty CEP', () => {
    const r = calcularFrete('delivery', '');
    expect(r.valor).toBe(0);
    expect(r.label).toBe('');
  });

  it('returns R$ 30 for CEP in Barueri range', () => {
    // CEP 06400000 to 06499999 — Barueri
    const r = calcularFrete('delivery', '06454-600');
    expect(r.valor).toBe(30);
    expect(r.label).toMatch(/Barueri/);
  });

  it('returns R$ 50 for CEP in Gênesis / CENIC range', () => {
    // CEP 06454600 to 06454999
    const r = calcularFrete('delivery', '06454-700');
    expect(r.valor).toBe(50);
    expect(r.label).toMatch(/G.nesis/);
  });

  it('returns R$ 25 for Grande SP', () => {
    const r = calcularFrete('delivery', '01310-100');
    expect(r.valor).toBe(25);
    expect(r.label).toMatch(/Grande SP/);
  });

  it('returns R$ 35 for national delivery', () => {
    const r = calcularFrete('delivery', '80010-010');
    expect(r.valor).toBe(35);
    expect(r.label).toMatch(/nacional/i);
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```powershell
pnpm test
```

Expected: FAIL — `Cannot find module './frete'`

- [ ] **Step 3: Implement the module**

Create `src/lib/frete.ts`:

```ts
export interface FreteResult {
  valor: number;
  label: string;
}

export function calcularFrete(
  tipoEntrega: 'retirada' | 'delivery',
  cep: string
): FreteResult {
  if (tipoEntrega === 'retirada') {
    return { valor: 0, label: 'Retirada no local · Grátis' };
  }

  const digits = cep.replace(/\D/g, '');
  if (digits.length < 7) return { valor: 0, label: '' };

  const n = parseInt(digits.slice(0, 8).padEnd(8, '0'), 10);

  // Alphaville / Gênesis / CENIC (dentro do condomínio)
  if (n >= 6454600 && n <= 6454999) {
    return { valor: 50, label: 'Motoboy · Gênesis / CENIC' };
  }
  // Região Barueri / Alphaville
  if (n >= 6400000 && n <= 6499999) {
    return { valor: 30, label: 'Motoboy · Região Barueri' };
  }
  // Grande SP (CEPs 01000000 a 09999999)
  if (n >= 1000000 && n <= 9999999) {
    return { valor: 25, label: 'Sedex · Grande SP (estimativa)' };
  }
  // Nacional
  return { valor: 35, label: 'Sedex · Envio nacional (estimativa)' };
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```powershell
pnpm test
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/frete.ts src/lib/frete.test.ts
git commit -m "feat(lib): add frete calculator with CEP range logic and tests"
```

---

## Task 6: Cupom de desconto + frete no CheckoutModal

**Files:**
- Modify: `src/components/checkout/CheckoutModal.tsx`

- [ ] **Step 1: Add state variables for cupom and frete**

Open `src/components/checkout/CheckoutModal.tsx`.

Add the import for the frete calculator at the top, after existing imports:

```tsx
import { calcularFrete } from '../../lib/frete';
import type { FreteResult } from '../../lib/frete';
```

Add the cupom map constant before the component function (after the `FOCUSABLE` constant):

```tsx
const CUPONS: Record<string, { tipo: 'pct' | 'fixo' | 'frete'; valor: number; descricao: string }> = {
  ALPHA10:     { tipo: 'pct',   valor: 10, descricao: '10% de desconto' },
  ALPHA15:     { tipo: 'pct',   valor: 15, descricao: '15% de desconto' },
  VIP20:       { tipo: 'pct',   valor: 20, descricao: '20% de desconto VIP' },
  BEMVINDO:    { tipo: 'fixo',  valor: 15, descricao: 'R$ 15 de desconto' },
  FRETEGRATIS: { tipo: 'frete', valor: 0,  descricao: 'Frete grátis' },
};
```

Add new state variables inside the `CheckoutModal` function, after the existing state declarations:

```tsx
const [cupomInput, setCupomInput] = useState('');
const [cupomAtivo, setCupomAtivo] = useState<typeof CUPONS[string] & { codigo: string } | null>(null);
const [cupomStatus, setCupomStatus] = useState<{ ok: boolean; msg: string } | null>(null);
const [frete, setFrete] = useState<FreteResult>({ valor: 0, label: '' });
```

- [ ] **Step 2: Add frete calculation effect and cupom apply function**

Inside `CheckoutModal`, after the state declarations, add:

```tsx
// Recalculate frete whenever entrega type or CEP changes
useEffect(() => {
  setFrete(calcularFrete(entrega, cep));
}, [entrega, cep]);

function handleAplicarCupom() {
  const codigo = cupomInput.trim().toUpperCase();
  if (!codigo) {
    setCupomAtivo(null);
    setCupomStatus(null);
    return;
  }
  const cupom = CUPONS[codigo];
  if (!cupom) {
    setCupomAtivo(null);
    setCupomStatus({ ok: false, msg: '✗ Cupom inválido ou expirado' });
  } else {
    setCupomAtivo({ ...cupom, codigo });
    setCupomStatus({ ok: true, msg: `✓ ${cupom.descricao} aplicado!` });
  }
}
```

- [ ] **Step 3: Update total calculation to include PIX discount, frete and cupom**

Find the existing line:

```tsx
const total = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
```

Replace it with:

```tsx
const subtotal = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);

const descontoPix = pagamento === 'pix' ? subtotal * 0.05 : 0;

const freteValor = (() => {
  if (!cupomAtivo || cupomAtivo.tipo !== 'frete') return frete.valor;
  return 0;
})();

const descontoCupom = (() => {
  if (!cupomAtivo) return 0;
  if (cupomAtivo.tipo === 'pct') return (subtotal - descontoPix) * (cupomAtivo.valor / 100);
  if (cupomAtivo.tipo === 'fixo') return Math.min(cupomAtivo.valor, subtotal - descontoPix);
  return 0; // frete: handled above
})();

const total = Math.max(0, subtotal - descontoPix - descontoCupom + freteValor);
```

Also update the `dadosPedido` in `handleSubmit` so it uses `total` (already correct since we overwrote the variable).

- [ ] **Step 4: Add cupom field and order summary to the form JSX**

Inside the `step === 'form'` block, after the `<fieldset>` for Pagamento and before the `submitError` paragraph, add:

```tsx
{/* Cupom de desconto */}
<div style={{ marginBottom: '0.75rem' }}>
  <label htmlFor="co_cupom" style={labelStyle}>Cupom de desconto</label>
  <div style={{ display: 'flex', gap: '8px', marginTop: '0.35rem' }}>
    <input
      id="co_cupom"
      type="text"
      value={cupomInput}
      onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
      placeholder="ALPHA10"
      style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }}
    />
    <button
      type="button"
      onClick={handleAplicarCupom}
      style={{
        padding: '0.625rem 1rem', background: 'transparent', border: '1px solid #c9a961',
        color: '#c9a961', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
        fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: 2,
      }}
    >
      Aplicar
    </button>
  </div>
  {cupomStatus && (
    <p style={{ fontSize: '0.75rem', marginTop: '4px', color: cupomStatus.ok ? '#4ade80' : '#ef4444' }}>
      {cupomStatus.msg}
    </p>
  )}
</div>

{/* Resumo do pedido */}
<div style={{ background: '#111', border: '1px solid rgba(244,244,244,0.08)', borderRadius: 2, padding: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
  <p style={{ color: 'rgba(244,244,244,0.5)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Resumo</p>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'rgba(244,244,244,0.7)' }}>
    <span>Subtotal</span><span>{fmt(subtotal)}</span>
  </div>
  {descontoPix > 0 && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#c9a961' }}>
      <span>Desconto PIX (5%)</span><span>− {fmt(descontoPix)}</span>
    </div>
  )}
  {freteValor > 0 && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'rgba(244,244,244,0.7)' }}>
      <span>{frete.label || 'Frete'}</span><span>{fmt(freteValor)}</span>
    </div>
  )}
  {frete.valor > 0 && cupomAtivo?.tipo === 'frete' && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#4ade80' }}>
      <span>Frete grátis (cupom)</span><span>− {fmt(frete.valor)}</span>
    </div>
  )}
  {descontoCupom > 0 && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#4ade80' }}>
      <span>Cupom {cupomAtivo?.codigo}</span><span>− {fmt(descontoCupom)}</span>
    </div>
  )}
  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,244,244,0.08)', paddingTop: '0.5rem', marginTop: '0.5rem', color: '#f4f4f4', fontWeight: 700, fontSize: '0.95rem' }}>
    <span>Total</span><span style={{ color: '#c9a961' }}>{fmt(total)}</span>
  </div>
</div>
```

Also update the total display in the header paragraph from `{fmt(total)}` — it stays since `total` is now the correct computed value.

- [ ] **Step 5: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/checkout/CheckoutModal.tsx
git commit -m "feat(checkout): add coupon codes, frete calc by CEP and full order summary"
```

---

## Task 7: Registro de visitas (fire-and-forget)

**Files:**
- Create: `src/hooks/useVisita.ts`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useVisita.ts`:

```ts
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVisita() {
  useEffect(() => {
    // Run only once per browser session
    if (sessionStorage.getItem('ag_visited')) return;
    sessionStorage.setItem('ag_visited', '1');

    (async () => {
      let cidade: string | null = null;
      let estado: string | null = null;
      let pais: string | null = null;

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const d = await res.json();
          cidade = d.city ?? null;
          estado = d.region ?? null;
          pais = d.country_name ?? null;
        }
      } catch { /* geo lookup is optional */ }

      try {
        await supabase.from('visitas_site').insert({
          data: new Date().toISOString().slice(0, 10),
          pagina: 'home',
          ts: new Date().toISOString(),
          cidade,
          estado,
          pais,
        });
      } catch { /* table may not exist yet — ignore */ }
    })();
  }, []);
}
```

- [ ] **Step 2: Use the hook in Home.tsx**

Open `src/pages/Home.tsx`. Add import:

```tsx
import { useVisita } from '../hooks/useVisita';
```

Add the hook call at the top of the `Home` function body (before the return):

```tsx
useVisita();
```

- [ ] **Step 3: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useVisita.ts src/pages/Home.tsx
git commit -m "feat: add visit tracking hook (fire-and-forget, session-once)"
```

---

## Task 8: Pop-up de recuperação de venda

**Files:**
- Create: `src/components/RecuperacaoPopup.tsx`
- Create: `src/components/RecuperacaoPopup.module.css`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Create the CSS module**

Create `src/components/RecuperacaoPopup.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.4s ease;
}

.box {
  background: #111;
  border: 1px solid #c9a961;
  max-width: 400px;
  width: 100%;
  padding: 32px;
  position: relative;
  animation: slideUp 0.4s ease;
}

.closeBtn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #555;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.closeBtn:hover { color: #888; }

.eyebrow {
  font-family: 'Cormorant Garamond', serif;
  font-size: 13px;
  letter-spacing: 0.2em;
  color: #c9a961;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.headline {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.2;
  margin-bottom: 8px;
  color: #f4f4f4;
}

.headline em { color: #c9a961; }

.desc {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #888;
  margin-bottom: 20px;
  line-height: 1.6;
}

.cupomBox {
  background: #0a0a0a;
  border: 1px dashed #c9a961;
  padding: 14px;
  text-align: center;
  margin-bottom: 20px;
}

.cupomLabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #666;
  letter-spacing: 0.2em;
  margin-bottom: 4px;
}

.cupomCode {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 700;
  color: #c9a961;
  letter-spacing: 0.15em;
}

.cupomValidity {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #555;
  margin-top: 4px;
}

.ctaBtn {
  width: 100%;
  background: #c9a961;
  color: #000;
  border: none;
  padding: 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  cursor: pointer;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.ctaBtn:hover { background: #f4f4f4; }

.whatsSection {
  border-top: 1px solid #1a1a1a;
  padding-top: 14px;
  margin-top: 4px;
}

.whatsLabel {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: #555;
  letter-spacing: 0.15em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.whatsRow {
  display: flex;
  gap: 8px;
}

.whatsInput {
  flex: 1;
  background: #0a0a0a;
  border: 1px solid #222;
  color: #f4f4f4;
  padding: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.whatsBtn {
  padding: 10px 14px;
  background: #25D366;
  color: #000;
  border: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.whatsSuccess {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  margin-top: 6px;
  color: #4ade80;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

- [ ] **Step 2: Create the component**

Create `src/components/RecuperacaoPopup.tsx`:

```tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './RecuperacaoPopup.module.css';

interface RecuperacaoPopupProps {
  onClose: () => void;
}

export default function RecuperacaoPopup({ onClose }: RecuperacaoPopupProps) {
  const [whats, setWhats] = useState('');
  const [whatsOk, setWhatsOk] = useState(false);

  function handleUsarCupom() {
    onClose();
    // Pre-fill cupom in checkout when it opens
    sessionStorage.setItem('ag_cupom_auto', 'ALPHA10');
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSalvarWhats() {
    const tel = whats.trim();
    if (!tel || tel.length < 8) return;
    try {
      await supabase.from('leads_whatsapp').insert({
        whatsapp: tel,
        origem: 'popup_recuperacao',
        cupom: 'ALPHA10',
        ts: new Date().toISOString(),
        pagina: window.location.href,
      });
    } catch { /* table may not exist yet — ignore */ }
    setWhatsOk(true);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Oferta exclusiva">
      <div className={styles.box}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        <p className={styles.eyebrow}>Antes de ir embora...</p>

        <h2 className={styles.headline}>
          <em>10% OFF</em> pra você
          <br />agora mesmo.
        </h2>

        <p className={styles.desc}>
          Encontrou algo que gostou? Use o cupom abaixo e garanta com desconto:
        </p>

        <div className={styles.cupomBox}>
          <p className={styles.cupomLabel}>Seu cupom exclusivo</p>
          <p className={styles.cupomCode}>ALPHA10</p>
          <p className={styles.cupomValidity}>válido por 24 horas</p>
        </div>

        <button type="button" className={styles.ctaBtn} onClick={handleUsarCupom}>
          Ver vitrine e usar cupom →
        </button>

        <div className={styles.whatsSection}>
          <p className={styles.whatsLabel}>Quer receber promoções exclusivas?</p>
          <div className={styles.whatsRow}>
            <input
              type="tel"
              className={styles.whatsInput}
              placeholder="(11) 99999-9999"
              value={whats}
              onChange={(e) => setWhats(e.target.value)}
              disabled={whatsOk}
            />
            <button
              type="button"
              className={styles.whatsBtn}
              onClick={handleSalvarWhats}
              disabled={whatsOk}
            >
              Enviar
            </button>
          </div>
          {whatsOk && (
            <p className={styles.whatsSuccess}>
              ✓ Número salvo! Em breve entraremos em contato.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire popup into Home.tsx**

Open `src/pages/Home.tsx`. Add the import:

```tsx
import RecuperacaoPopup from '../components/RecuperacaoPopup';
```

Add state variable:

```tsx
const [popupOpen, setPopupOpen] = useState(false);
```

Add a `useEffect` that triggers the popup after 90 seconds if the cart is empty, and also on exit intent (mouseleave from viewport top). Place this after the `useVisita()` call:

```tsx
const cartItems = useCartStore((s) => s.items);

useEffect(() => {
  const popupShown = sessionStorage.getItem('ag_popup_shown');
  if (popupShown) return;

  function maybeShow() {
    if (cartItems.length > 0) return;
    if (sessionStorage.getItem('ag_popup_shown')) return;
    sessionStorage.setItem('ag_popup_shown', '1');
    setPopupOpen(true);
  }

  const timer = setTimeout(maybeShow, 90_000);

  function handleExitIntent(e: MouseEvent) {
    if (e.clientY <= 0) maybeShow();
  }
  document.addEventListener('mouseleave', handleExitIntent);

  return () => {
    clearTimeout(timer);
    document.removeEventListener('mouseleave', handleExitIntent);
  };
}, [cartItems.length]);
```

Add the component to the JSX at the bottom of the fragment (before the closing `</>`):

```tsx
{popupOpen && (
  <RecuperacaoPopup onClose={() => setPopupOpen(false)} />
)}
```

Also add the import for `useCartStore` in `Home.tsx` if not already present:

```tsx
import { useCartStore } from '../store/cart';
```

- [ ] **Step 4: Handle auto-fill of cupom from popup**

Open `src/components/checkout/CheckoutModal.tsx`. Add a `useEffect` at the top of the component to read and apply the auto cupom from sessionStorage when the modal mounts:

```tsx
useEffect(() => {
  const auto = sessionStorage.getItem('ag_cupom_auto');
  if (auto) {
    sessionStorage.removeItem('ag_cupom_auto');
    const codigo = auto.trim().toUpperCase();
    const cupom = CUPONS[codigo];
    if (cupom) {
      setCupomInput(codigo);
      setCupomAtivo({ ...cupom, codigo });
      setCupomStatus({ ok: true, msg: `✓ ${cupom.descricao} aplicado!` });
    }
  }
}, []);
```

- [ ] **Step 5: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/RecuperacaoPopup.tsx src/components/RecuperacaoPopup.module.css src/pages/Home.tsx src/components/checkout/CheckoutModal.tsx
git commit -m "feat: add sale recovery popup with 90s timer and exit intent"
```

---

## Task 9: Filtro por parâmetros de URL (`?cat=`, `?sub=`, `?q=`)

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/components/ProductGrid.tsx`

- [ ] **Step 1: Expose URL filter props from ProductGrid**

Open `src/components/ProductGrid.tsx`. The component already has `categoryId`, `onCategoryChange` and internal `search` state. We need to also accept an optional `initialSearch` and `initialSubcat` prop so Home can seed them from the URL.

Update the `ProductGridProps` interface:

```tsx
interface ProductGridProps {
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  initialSearch?: string;
  initialSubcat?: string | null;
}
```

Update the function signature:

```tsx
export default function ProductGrid({
  categoryId,
  onCategoryChange,
  initialSearch = '',
  initialSubcat = null,
}: ProductGridProps) {
```

Change the `useState` declarations for `searchInput`, `search`, and `activeSubcat` to use the initial values:

```tsx
const [searchInput, setSearchInput] = useState(initialSearch);
const [search, setSearch] = useState(initialSearch);
const [activeSubcat, setActiveSubcat] = useState<string | null>(initialSubcat);
```

- [ ] **Step 2: Read URL params in Home.tsx and pass to ProductGrid**

Open `src/pages/Home.tsx`. The file already imports `useSearchParams`. Add a function to read the URL filter params, executed once on mount via a `useEffect`.

Add state for seeded values:

```tsx
const [initialSearch, setInitialSearch] = useState('');
const [initialSubcat, setInitialSubcat] = useState<string | null>(null);
```

Add a `useEffect` that runs once to read params and set initial state, AND scroll to `#produtos` if any filter param is present:

```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const sub = params.get('sub');
  const cat = params.get('cat');

  if (q) setInitialSearch(q);
  if (sub) setInitialSubcat(sub);

  if (cat || sub || q) {
    setTimeout(() => {
      document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }

  // Category by slug — find matching category from data; done inside ProductGrid
  // For ?cat= we need to map slug to id; handled in step 3 below
}, []);
```

Pass the new props to `<ProductGrid>`:

```tsx
<ProductGrid
  categoryId={categoryId}
  onCategoryChange={setCategoryId}
  initialSearch={initialSearch}
  initialSubcat={initialSubcat}
/>
```

- [ ] **Step 3: Handle `?cat=` slug-to-id mapping in Home.tsx**

For `?cat=<slug>` we need to map a category slug to an ID after categories are loaded. The `useCategories` hook is available but currently only used inside `ProductGrid`. We need to call it from Home too.

Add import in `Home.tsx`:

```tsx
import { useCategories } from '../hooks/useCategories';
```

Add inside the Home function (after the existing state declarations):

```tsx
const { data: categorias = [] } = useCategories();

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const catSlug = params.get('cat');
  if (catSlug && categorias.length > 0) {
    const match = categorias.find((c) => c.slug === catSlug || c.nome.toLowerCase() === catSlug.toLowerCase());
    if (match) setCategoryId(match.id);
  }
}, [categorias]);
```

- [ ] **Step 4: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/components/ProductGrid.tsx
git commit -m "feat: support ?cat= ?sub= ?q= URL filter params on page load"
```

---

## Task 10: Mobile — filtros com scroll horizontal e layout de card horizontal

**Files:**
- Modify: `src/components/ProductGrid.tsx` (inline styles)
- Modify: `src/components/ProductCard.tsx` (se existir CSS Module) ou inline styles

- [ ] **Step 1: Read ProductCard.tsx to understand current structure**

Read `src/components/ProductCard.tsx` and `src/components/ProductCard.module.css` to understand the current card layout.

- [ ] **Step 2: Make category filter row scroll horizontally on mobile**

In `src/components/ProductGrid.tsx`, the category filter `<div>` currently has `flexWrap: 'wrap'`. Add a CSS custom approach via a wrapping element, or just update the style to use `overflowX: 'auto'` with `flexWrap: 'nowrap'` only on mobile.

Replace the category filter div style (line ~115):

```tsx
<div
  style={{
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
    scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
    paddingBottom: '4px',
  }}
  role="group"
  aria-label="Filtrar por categoria"
>
```

And add a `<style>` tag in the component (or add to `index.css`) to hide the scrollbar:

In `src/index.css` (or `src/styles/global.css` — whichever exists), append:

```css
/* Hide scrollbar for filter rows on mobile */
.filter-scroll::-webkit-scrollbar { display: none; }
```

Then add `className="filter-scroll"` to both filter divs in `ProductGrid.tsx` (the category filters div and the subcategory filters div).

- [ ] **Step 3: Make ProductCard horizontal on mobile**

Read `src/components/ProductCard.module.css`. If a `.card` class exists, append a media query:

```css
@media (max-width: 640px) {
  .card {
    flex-direction: row;
    min-height: 130px;
  }

  .imageWrapper {
    width: 130px;
    min-width: 130px;
    aspect-ratio: unset;
    height: auto;
    border-right: 1px solid rgba(244, 244, 244, 0.07);
    border-bottom: none;
  }

  .info {
    flex: 1;
    padding: 14px;
    justify-content: space-between;
  }

  .name {
    font-size: 1.1rem;
  }

  .price {
    font-size: 1.4rem;
  }

  .cta {
    padding: 10px 12px;
    font-size: 10px;
    min-height: 40px;
  }
}
```

The exact class names must match what is in `ProductCard.module.css` — read the file first and use the actual class names.

- [ ] **Step 4: Build**

```powershell
pnpm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProductGrid.tsx src/components/ProductCard.module.css
git commit -m "feat: mobile — horizontal card layout and scrollable filter row"
```

---

## Self-Review

### Spec coverage check

| Feature from analysis | Task |
|---|---|
| Announcement bar marquee | Task 1 ✅ |
| Hero com h1, lead, CTA, métricas | Task 2 ✅ |
| Seção Alpha Hemp Brasil | Task 3 ✅ |
| Footer aviso 18+ e versão | Task 4 ✅ |
| Cálculo de frete por CEP | Task 5 ✅ |
| Cupom de desconto no checkout | Task 6 ✅ |
| Resumo completo do pedido (subtotal/frete/cupom/PIX) | Task 6 ✅ |
| Registro de visitas (fire-and-forget) | Task 7 ✅ |
| Pop-up recuperação de venda (90s + exit intent) | Task 8 ✅ |
| Auto-fill de cupom vindo do popup | Task 8 ✅ |
| Filtro por URL params `?cat=`, `?sub=`, `?q=` | Task 9 ✅ |
| Mobile filtros scroll horizontal | Task 10 ✅ |
| Mobile card horizontal layout | Task 10 ✅ |
| Link Hemp Brasil no nav (já existe em Header.tsx) | Header já tem — sem tarefa ✅ |

### Placeholder scan — nenhum encontrado.

### Type consistency check
- `FreteResult` definido em Task 5, importado em Task 6 ✅
- `CUPONS` e `cupomAtivo` tipados consistentemente em Task 6 ✅
- `initialSearch`/`initialSubcat` em `ProductGridProps` e uso em Task 9 ✅
- `useCartStore` já importado em Home.tsx em Task 8 (verificar se duplica import — não duplica pois Home.tsx não o usava antes, adicionar na mesma importação se já houver outro import do arquivo)
