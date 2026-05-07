// src/components/ProductGrid.tsx
import { useState, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cart';
import type { Produto, Variacao } from '../types';
import ProductCard from './ProductCard';
import VariacoesModal from './VariacoesModal';

interface ProductGridProps {
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(244,244,244,0.07)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1/1',
          background: 'linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ height: 12, width: '60%', background: '#222', borderRadius: 2 }} />
        <div style={{ height: 16, width: '80%', background: '#1e1e1e', borderRadius: 2 }} />
        <div style={{ height: 12, width: '40%', background: '#222', borderRadius: 2 }} />
      </div>
    </div>
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
    addItem(produto);
  }

  function handleSelectVariacao(produto: Produto, variacao: Variacao) {
    addItem(produto, variacao);
    setVariacoesTarget(null);
  }

  return (
    <section
      id="produtos"
      style={{ padding: '3rem 1.5rem', maxWidth: 1320, margin: '0 auto' }}
      aria-label="Produtos"
    >
      {/* Filtro de categorias */}
      <div
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
        role="group"
        aria-label="Filtrar por categoria"
      >
        <button
          type="button"
          onClick={() => { onCategoryChange(null); setActiveSubcat(null); }}
          style={{
            padding: '0.5rem 1.25rem',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            border: `1px solid ${categoryId === null ? '#c9a961' : 'rgba(244,244,244,0.15)'}`,
            background: categoryId === null ? 'rgba(201,169,97,0.1)' : 'transparent',
            color: categoryId === null ? '#c9a961' : 'rgba(244,244,244,0.6)',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          TODOS
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => { onCategoryChange(cat.id); setActiveSubcat(null); }}
            style={{
              padding: '0.5rem 1.25rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: `1px solid ${categoryId === cat.id ? '#c9a961' : 'rgba(244,244,244,0.15)'}`,
              background: categoryId === cat.id ? 'rgba(201,169,97,0.1)' : 'transparent',
              color: categoryId === cat.id ? '#c9a961' : 'rgba(244,244,244,0.6)',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            {cat.nome.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Filtro de subcategorias */}
      {subcategorias.length > 0 && (
        <div
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}
          role="group"
          aria-label="Filtrar por subcategoria"
        >
          <button
            type="button"
            onClick={() => setActiveSubcat(null)}
            style={{
              padding: '0.35rem 0.875rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              border: `1px solid ${activeSubcat === null ? 'rgba(201,169,97,0.5)' : 'rgba(244,244,244,0.1)'}`,
              background: 'transparent',
              color: activeSubcat === null ? '#c9a961' : 'rgba(244,244,244,0.45)',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            Todas
          </button>
          {subcategorias.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSubcat(s)}
              style={{
                padding: '0.35rem 0.875rem',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.1em',
                border: `1px solid ${activeSubcat === s ? 'rgba(201,169,97,0.5)' : 'rgba(244,244,244,0.1)'}`,
                background: 'transparent',
                color: activeSubcat === s ? '#c9a961' : 'rgba(244,244,244,0.45)',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div style={{ position: 'relative', marginBottom: '2rem', maxWidth: 400 }}>
        <svg
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(244,244,244,0.35)',
            pointerEvents: 'none',
          }}
          width="16"
          height="16"
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
        <label htmlFor="product-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Buscar produtos
        </label>
        <input
          id="product-search"
          type="search"
          placeholder="Buscar por nome ou marca..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem 0.625rem 2.5rem',
            background: '#111',
            border: '1px solid rgba(244,244,244,0.1)',
            color: '#f4f4f4',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            borderRadius: 2,
            outline: 'none',
          }}
        />
      </div>

      {/* Grid */}
      {loadingProdutos ? (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1.5rem' }}
          aria-busy="true"
          aria-label="Carregando produtos"
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div role="status" style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(244,244,244,0.4)', fontFamily: 'Inter, sans-serif' }}>
          Nenhum produto encontrado.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1.5rem' }}>
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
