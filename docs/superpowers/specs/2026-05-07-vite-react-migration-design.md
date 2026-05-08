# Design: Migração Vite + React + TypeScript — Alpha Galerie

**Data:** 2026-05-07  
**Status:** Aprovado  
**Branch alvo:** `feat/migrate-vite`

---

## Contexto

O repositório é hoje um único `index.html` de 4.025 linhas / 169 KB contendo todo o CSS (~80 KB inline), todo o JavaScript (~90 KB inline), integração com Supabase, Mercado Pago e geração de PIX/QR Code. A migração para Vite + React SPA elimina render-blocking, habilita code-splitting e torna o código mantível.

---

## Abordagem escolhida: Branch paralela com fases verificáveis

Branch `feat/migrate-vite` com checkpoints de deploy preview na Vercel entre cada fase. O `main` permanece intocado até a Fase 7 ser aprovada. Cada fase termina com smoke test no preview URL antes de avançar.

---

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Build | Vite 5 + SWC | HMR rápido, bundle otimizado |
| UI | React 18 + TypeScript | Componentização, type safety |
| Roteamento | react-router-dom v6 | Rota única `/`, modal via `?p=ID` |
| Estado carrinho | Zustand + persist | Substitui `window._cartRef` + localStorage manual |
| Fetch/cache | TanStack Query v5 | Cache automático, stale-while-revalidate, loading/error states |
| Supabase | `@supabase/supabase-js` npm | Tree-shaking, sem CDN síncrono |
| Estilo | CSS Modules + tokens globais | Mantém design system atual, remove ~50 classes mortas |
| Hosting | Vercel | Edge Function `og-product` existente inalterada |

**Sem:** Tailwind, styled-components, Redux, SSR.

---

## Estrutura de pastas

```
alphagalerie-site/
├── index.html                        # shell mínimo (~10 linhas)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json
├── .env.local                        # não commitado
├── .env.example                      # commitado, valores vazios
├── public/
│   ├── logo.png                      # extraído do base64 inline
│   ├── og-default.jpg
│   ├── robots.txt
│   └── favicon.ico
├── src/
│   ├── main.tsx                      # ReactDOM.createRoot + QueryClientProvider + Router
│   ├── App.tsx                       # rota "/" + detecção ?p=ID
│   ├── styles/
│   │   ├── tokens.css                # :root vars (--bg, --gold, etc.)
│   │   └── global.css                # body, reset, .container, .btn, .serif, .mono
│   ├── types/
│   │   └── index.ts                  # Produto, Variacao, ItemCarrinho, Pedido, Categoria
│   ├── lib/
│   │   ├── supabase.ts               # createClient com import.meta.env
│   │   ├── mercadopago.ts            # loadMercadoPago() — script dinâmico em useEffect
│   │   ├── pix.ts                    # gerarPayloadPix + CRC16
│   │   └── format.ts                 # formatCurrency, formatPhone, formatCep
│   ├── store/
│   │   └── cart.ts                   # Zustand store com persist
│   ├── hooks/
│   │   ├── useProducts.ts            # TanStack Query: produtos + variacoes por categoria
│   │   ├── useCategories.ts          # TanStack Query: categorias ativas
│   │   └── useCheckout.ts            # lógica submit pedido (Supabase + MP + PIX)
│   ├── components/
│   │   ├── Header.tsx + Header.module.css
│   │   ├── Footer.tsx + Footer.module.css
│   │   ├── FloatingWhatsApp.tsx
│   │   ├── ProductCard.tsx + ProductCard.module.css
│   │   ├── ProductGrid.tsx
│   │   ├── VariacoesModal.tsx
│   │   ├── CartDrawer.tsx + CartDrawer.module.css
│   │   ├── ProductModal.tsx
│   │   └── checkout/
│   │       ├── CheckoutModal.tsx     # lazy-loaded
│   │       ├── PixPayment.tsx        # lazy-loaded
│   │       └── CardPayment.tsx       # lazy-loaded
│   └── pages/
│       └── Home.tsx
```

---

## Data flow

### Produtos

```
useCategories()
  query key: ['categorias']
  → sb.from('categorias').select('*').eq('ativo', true).order('ordem')

useProducts(categoryId)
  query key: ['produtos', categoryId]
  staleTime: 5 min
  → Promise.all([
      sb.from('produtos').select(COLS).eq('categoria_id', categoryId),
      sb.from('produto_variacoes').select('*').in('produto_id', ids)
    ])
  → retorna produtos[] com _variacoes embedadas
```

`ProductGrid` e `ProductCard` consomem apenas os hooks — nunca fazem fetch direto.

### Carrinho

```
cartStore (Zustand + persist → localStorage 'alpha_cart')
  state:   { items: ItemCarrinho[] }
  actions: addItem(produto, variacao?) | removeItem(cartKey) | changeQty(cartKey, delta) | clear()

addItem:
  → gera cartKey = prodId + '::' + variacaoId (ou prodId se sem variação)
  → verifica limite de estoque
  → persiste automaticamente via middleware
```

### Checkout (lazy)

```
Usuário clica "Finalizar compra"
  → React.lazy carrega CheckoutModal chunk (~primeiro acesso: ~200ms)
  → loadMercadoPago() injeta <script> sdk.mercadopago.com/js/v2 se ainda não carregado
  → initCardForm(amount) monta iframes MP

submitOrder()
  PIX:      gerarPayloadPix(valor, txid) → QRCode.toCanvas() → PixPayment
  Cartão:   getCardToken() → sb.from('pedidos').insert()
  Retirada: sb.from('pedidos').insert({ status: 'novo' })
  → sucesso: cart.clear() + tela de confirmação
```

### Modal de produto `?p=ID`

```
App.tsx → useSearchParams() detecta ?p=ID
        → abre ProductModal
        → sb.from('produtos').select('descricao,...').eq('id', id).single()
Edge Function og-product: inalterada, continua respondendo a ?p=ID para OG tags
```

---

## vercel.json

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)\\.(jpg|png|webp|svg|ico|woff2)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

O rewrite `/api/(.*)` protege a Edge Function `og-product` do fallback SPA.

---

## Acessibilidade

- Todos os `<div onclick>` → `<button type="button">` (39 ocorrências no original)
- Modais: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, fechar com `Esc`
- Ícones sem texto: `aria-label` em `FloatingWhatsApp`, botão carrinho, botões fechar
- Cor dourado `#c9a961`: passa WCAG AA para texto grande (ratio ~5.8:1); sobe para `#d4b56a` onde texto < 14px

---

## SEO

- `public/robots.txt` — permite tudo, aponta para sitemap
- `public/sitemap.xml` — estático, atualizado manualmente (geração automática fora do escopo desta migração)
- JSON-LD `Organization` no `index.html` shell
- `<link rel="canonical" href="https://alphagalerie.com">` no shell
- Edge Function `og-product` inalterada

---

## Variáveis de ambiente

| Variável | Origem no HTML atual |
|---|---|
| `VITE_SUPABASE_URL` | `const SUPABASE_URL` (linha 2210) |
| `VITE_SUPABASE_ANON_KEY` | `const SUPABASE_KEY` (linha 2211) |
| `VITE_MP_PUBLIC_KEY` | `const MP_PUBLIC_KEY` (linha 2213) |
| `VITE_PIX_KEY` | `const PIX_KEY` (linha 2215) |
| `VITE_PIX_NAME` | `const PIX_NAME` (linha 2216) |
| `VITE_PIX_CITY` | `const PIX_CITY` (linha 2217) |
| `VITE_WHATSAPP_NUMBER` | `const WHATSAPP_NUMBER` (linha 2212) |

---

## Fases de execução

| Fase | Entrega | Checkpoint |
|---|---|---|
| 0 | Auditoria segurança (RLS Supabase confirmado, key = anon ✓) | Bloqueante — já verificado |
| 1 | Setup Vite + deps + vercel.json + .env | Preview Vercel sobe (tela em branco OK) |
| 2 | tokens.css + global.css extraídos | Estilos base visíveis no preview |
| 3 | Header + Footer + ProductGrid + CartDrawer + Home | Catálogo navegável no preview |
| 4 | CheckoutModal + PixPayment + CardPayment (lazy) | Fluxo completo de compra no preview |
| 5 | ProductModal (?p=ID) + robots.txt + sitemap.xml + JSON-LD | Compartilhamento OG funciona |
| 6 | A11y: buttons, focus trap, aria-labels + Lighthouse ≥ 90 | Lighthouse local passa |
| 7 | Merge para main + deploy produção | Smoke test em alphagalerie.com |

---

## Critérios de aceite

1. `npm run build` passa sem erros; chunk inicial < 60 KB gzip
2. Lighthouse local: Performance ≥ 90, Acessibilidade ≥ 95, SEO ≥ 95
3. Smoke test: home → adicionar produto → carrinho → checkout → PIX gera QR → MP abre
4. Network tab: Supabase e MP SDK **ausentes** no first paint da home
5. Segunda visita: assets servidos do cache (`200 from disk cache` ou `304`)
6. CLS < 0.1
7. Mobile 375px: sem scroll horizontal, botões ≥ 44×44 px
8. `?p=123` compartilhado no WhatsApp mostra OG da imagem correta
