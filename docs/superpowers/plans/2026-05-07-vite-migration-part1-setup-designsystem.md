# Alpha Galerie — Vite Migration: Parte 1 — Setup & Design System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar branch feat/migrate-vite, scaffoldar projeto Vite+React+TS, configurar Vercel, variáveis de ambiente e extrair o design system.

**Architecture:** Branch paralela feat/migrate-vite. O main permanece intocado. Cada task termina com commit. Vercel cria preview deploy automático a cada push.

**Tech Stack:** Vite 5, React 18, TypeScript, react-router-dom v6, Zustand, TanStack Query v5, @supabase/supabase-js, qrcode

---

### Task 1: Criar branch e scaffold Vite

**Files:**
- Create: `package.json` (gerado pelo Vite scaffold)
- Create: `vite.config.ts` (gerado pelo Vite scaffold)
- Create: `tsconfig.json` (gerado pelo Vite scaffold)
- Create: `tsconfig.app.json` (gerado pelo Vite scaffold)
- Create: `tsconfig.node.json` (gerado pelo Vite scaffold)
- Create: `src/main.tsx` (gerado pelo Vite scaffold)
- Create: `src/App.tsx` (gerado pelo Vite scaffold)
- Create: `index.html` (gerado pelo Vite scaffold — substituirá o monolítico)

- [ ] **Step 1: Criar branch feat/migrate-vite a partir de main**
```bash
git checkout main
git pull origin main
git checkout -b feat/migrate-vite
```

- [ ] **Step 2: Scaffoldar projeto Vite + React + TypeScript com SWC**

Execute na raiz do repositório (`c:\WEBSITES\alphagalerie-site`). Ao ser perguntado sobre sobrescrever arquivos existentes, responda `y` para todos.

```bash
npm create vite@latest . -- --template react-swc-ts
```

- [ ] **Step 3: Instalar dependências de produção**
```bash
npm install react-router-dom @supabase/supabase-js zustand @tanstack/react-query qrcode
```

- [ ] **Step 4: Instalar dependências de desenvolvimento**
```bash
npm install -D @types/qrcode
```

- [ ] **Step 5: Verificar package.json resultante**

O `package.json` após os passos acima deve ter a seguinte estrutura de dependências:

```json
{
  "name": "alphagalerie-site",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "@tanstack/react-query": "^5.x.x",
    "qrcode": "^1.5.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "react-router-dom": "^6.x.x",
    "zustand": "^5.x.x"
  },
  "devDependencies": {
    "@eslint/js": "^9.x.x",
    "@types/node": "^22.x.x",
    "@types/qrcode": "^1.5.x",
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "@vitejs/plugin-react-swc": "^3.x.x",
    "eslint": "^9.x.x",
    "eslint-plugin-react-hooks": "^5.x.x",
    "eslint-plugin-react-refresh": "^0.4.x",
    "globals": "^15.x.x",
    "typescript": "^5.x.x",
    "typescript-eslint": "^8.x.x",
    "vite": "^5.x.x"
  }
}
```

> As versões exatas serão resolvidas pelo npm no momento da instalação. Os números acima representam faixas mínimas esperadas.

- [ ] **Step 6: Commit do scaffold**
```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/main.tsx src/App.tsx src/App.css src/index.css src/vite-env.d.ts eslint.config.js public/vite.svg src/assets/react.svg
git commit -m "chore: scaffold Vite 5 + React 18 + TypeScript (SWC)"
```

---

### Task 2: Criar vercel.json

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Criar vercel.json na raiz do repositório**

Crie o arquivo `vercel.json` com o conteúdo abaixo. Ele configura:
- SPA fallback (qualquer rota que não seja `/api/*` serve `index.html`)
- Cache imutável de 1 ano para assets com hash e arquivos estáticos

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)\\.(jpg|png|webp|svg|ico|woff2)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**
```bash
git add vercel.json
git commit -m "chore: add vercel.json with SPA rewrites and immutable asset cache headers"
```

---

### Task 3: Configurar .env.local e .env.example

**Files:**
- Create: `.env.local` (valores reais — NÃO commitar)
- Create: `.env.example` (valores vazios — commitar)
- Modify: `.gitignore` (garantir que `.env.local` está ignorado)

- [ ] **Step 1: Criar .env.local com valores reais**

> ATENÇÃO: Este arquivo NUNCA deve ser commitado. Ele contém segredos reais de produção.

Crie `.env.local` na raiz do repositório:

```dotenv
VITE_SUPABASE_URL=https://wxkwkfkidigeuupaajre.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_MP_PUBLIC_KEY=APP_USR-246210c3-9c5d-425b-9e82-1e0c97064d9c
VITE_PIX_KEY=+5511942920076
VITE_PIX_NAME=Alpha Galerie
VITE_PIX_CITY=Barueri
VITE_WHATSAPP_NUMBER=5511942920076
```

> Substitua `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` pela anon key completa do Supabase.

- [ ] **Step 2: Criar .env.example com valores vazios**

Crie `.env.example` na raiz do repositório:

```dotenv
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Mercado Pago
VITE_MP_PUBLIC_KEY=

# PIX
VITE_PIX_KEY=
VITE_PIX_NAME=
VITE_PIX_CITY=

# WhatsApp
VITE_WHATSAPP_NUMBER=
```

- [ ] **Step 3: Verificar .gitignore**

Abra `.gitignore` e confirme que as seguintes linhas estão presentes. Se não estiverem, adicione-as:

```gitignore
# Environment variables — never commit local secrets
.env.local
.env.*.local
```

O `.gitignore` gerado pelo Vite já inclui `.env.local` por padrão, mas confirme antes de continuar.

- [ ] **Step 4: Commit (apenas .env.example e .gitignore — NUNCA .env.local)**
```bash
git add .env.example .gitignore
git commit -m "chore: add .env.example and ensure .env.local is gitignored"
```

---

### Task 4: Criar src/types/index.ts

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Criar diretório src/types**
```bash
mkdir -p src/types
```

- [ ] **Step 2: Criar src/types/index.ts com todos os tipos do domínio**

```typescript
// ============================================================
// Alpha Galerie — Domain Types
// Fonte: schema Supabase + lógica de carrinho/pedido
// ============================================================

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  ordem: number;
  ativo: boolean;
}

export interface Variacao {
  id: number;
  produto_id: number;
  nome: string;
  preco: number | null;
  estoque: number;
  ordem: number;
  ativo: boolean;
}

export interface Produto {
  id: number;
  nome: string;
  marca: string;
  preco: number;
  preco_pix: number | null;
  categoria_id: number;
  subcategoria: string | null;
  estoque: number | null;
  ativo: boolean;
  destaque: boolean;
  imagem_url: string | null;
  descricao?: string;
  categorias?: Categoria;
  _variacoes: Variacao[];
}

export interface ItemCarrinho {
  id: number;
  cartKey: string;
  variacaoId?: number;
  codigo?: string;
  nome: string;
  variacao?: string;
  marca: string;
  categoria: string;
  preco: number;
  imagem: string | null;
  estoque: number | null;
  qtd: number;
}

export interface Pedido {
  id?: number;
  nome: string;
  telefone: string;
  email?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string;
  pagamento: 'pix' | 'cartao' | 'pagar_retirada';
  entrega: 'retirada' | 'delivery';
  observacoes?: string;
  total: number;
  status: string;
  itens: ItemCarrinho[];
}
```

- [ ] **Step 3: Commit**
```bash
git add src/types/index.ts
git commit -m "feat: add domain TypeScript types (Produto, Categoria, Variacao, Carrinho, Pedido)"
```

---

### Task 5: Extrair design system — tokens.css e global.css

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

- [ ] **Step 1: Criar diretório src/styles**
```bash
mkdir -p src/styles
```

- [ ] **Step 2: Criar src/styles/tokens.css**

Extraído das linhas 39–52 do `index.html` monolítico original.

```css
/* ============================================================
   Alpha Galerie — Design Tokens
   Paleta: preto + branco + dourado
   Importar antes de qualquer outro CSS.
   ============================================================ */
:root {
  --bg: #0a0a0a;
  --bg-soft: #111;
  --bg-card: #161616;
  --line: #222;
  --line-soft: #1a1a1a;
  --text: #f4f4f4;
  --text-dim: #888;
  --text-faint: #555;
  --gold: #c9a961;
  --gold-soft: #b39555;
  --gold-glow: rgba(201, 169, 97, 0.25);
  --maxw: 1320px;
}
```

- [ ] **Step 3: Criar src/styles/global.css**

Extraído das linhas 54–127 + 490–493 do `index.html` monolítico original.
Inclui: reset, body, helpers semânticos (`.container`, `.serif`, `.mono`), utilitários de botão (`.btn`, `.btn-gold`, `.btn-ghost`) e keyframes (`fadeUp`, `marquee`).

```css
/* ============================================================
   Alpha Galerie — Global Styles
   Requer tokens.css importado antes.
   ============================================================ */

/* ---------- Reset ---------- */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  line-height: 1.5;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

/* ---------- Layout helpers ---------- */
.container {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 24px;
}

/* ---------- Typography helpers ---------- */
.serif {
  font-family: 'Cormorant Garamond', serif;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* ---------- Buttons ---------- */
.btn {
  padding: 14px 28px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-gold {
  background: var(--gold);
  color: #000;
}

.btn-gold:hover {
  background: var(--text);
  box-shadow: 0 0 30px var(--gold-glow);
}

.btn-ghost {
  background: transparent;
  color: var(--text-dim);
  border: 1px solid var(--line);
}

.btn-ghost:hover {
  border-color: var(--text-dim);
  color: var(--text);
}

/* ---------- Keyframes ---------- */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
```

- [ ] **Step 4: Referenciar os novos CSS no src/main.tsx**

Abra `src/main.tsx` e garanta que os imports de estilo ficam nesta ordem (antes de qualquer import de componente):

```tsx
import './styles/tokens.css'
import './styles/global.css'
```

O `src/main.tsx` completo deve ficar assim:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

> Remove o import de `./index.css` gerado pelo scaffold — esse arquivo será deletado ou esvaziado para evitar conflito com os novos arquivos de estilo.

- [ ] **Step 5: Remover ou esvaziar o src/index.css gerado pelo scaffold**

O scaffold do Vite gera um `src/index.css` com estilos de exemplo. Como o design system agora está em `tokens.css` + `global.css`, esvazie esse arquivo para evitar conflito:

```css
/* Estilos movidos para src/styles/tokens.css e src/styles/global.css */
```

- [ ] **Step 6: Commit**
```bash
git add src/styles/tokens.css src/styles/global.css src/main.tsx src/index.css
git commit -m "feat: extract design system tokens and global styles from monolithic index.html"
```

---

## Checklist de conclusão da Parte 1

- [ ] Branch `feat/migrate-vite` criada a partir de `main`
- [ ] Vite 5 + React 18 + TypeScript (SWC) scaffoldado
- [ ] Todas as dependências instaladas (`react-router-dom`, `@supabase/supabase-js`, `zustand`, `@tanstack/react-query`, `qrcode`, `@types/qrcode`)
- [ ] `vercel.json` com SPA rewrites e cache headers configurado
- [ ] `.env.local` criado localmente com valores reais (NÃO commitado)
- [ ] `.env.example` commitado com chaves vazias
- [ ] `.gitignore` garante que `.env.local` é ignorado
- [ ] `src/types/index.ts` com todos os tipos do domínio
- [ ] `src/styles/tokens.css` com variáveis CSS do design system
- [ ] `src/styles/global.css` com reset, helpers e keyframes
- [ ] `src/main.tsx` importa os novos arquivos de estilo na ordem correta
- [ ] 5 commits atômicos na branch `feat/migrate-vite`
- [ ] Push da branch para o remote (aciona preview deploy na Vercel)

```bash
git push -u origin feat/migrate-vite
```
