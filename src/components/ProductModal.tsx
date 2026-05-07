import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cart';
import type { Produto } from '../types';

interface ProductModalProps {
  produtoId: number | null;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

async function fetchProduto(id: number): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return { ...data, _variacoes: [] } as Produto;
}

export default function ProductModal({ produtoId, onClose }: ProductModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  const { data: produto, isLoading } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: () => fetchProduto(produtoId!),
    enabled: !!produtoId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!produtoId) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
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
  }, [produtoId, onClose]);

  if (!produtoId) return null;

  const shareUrl = `${window.location.origin}/?p=${produtoId}`;

  async function handleShare() {
    if (navigator.share && produto) {
      try {
        await navigator.share({ title: produto.nome, text: `${produto.nome} — Alpha Galerie`, url: shareUrl });
        return;
      } catch { /* fallthrough */ }
    }
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* silent */ }
  }

  function handleAddToCart() {
    if (!produto) return;
    addItem(produto);
    onClose();
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} onPointerDown={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={produto?.nome ?? 'Produto'}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#0a0a0a', border: '1px solid rgba(201,169,97,0.3)', borderRadius: 4,
          width: '90%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', zIndex: 301,
          padding: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#f4f4f4', display: 'flex' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {isLoading && (
          <div role="status" aria-live="polite" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(244,244,244,0.5)' }}>
            Carregando...
          </div>
        )}

        {!isLoading && produto && (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {produto.imagem_url && (
              <div style={{ flex: '0 0 auto' }}>
                <img src={produto.imagem_url} alt={produto.nome} style={{ width: 220, height: 220, objectFit: 'cover', borderRadius: 2 }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a961', margin: '0 0 0.25rem' }}>{produto.marca}</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#f4f4f4', margin: '0 0 0.75rem' }}>{produto.nome}</h2>
              {produto.descricao && (
                <p style={{ fontSize: '0.875rem', color: 'rgba(244,244,244,0.65)', lineHeight: 1.6, marginBottom: '1rem' }}>{produto.descricao}</p>
              )}
              <div style={{ marginBottom: '1rem' }}>
                {produto.preco_pix && (
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f4f4f4' }}>{fmt(produto.preco_pix)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(244,244,244,0.45)', marginLeft: '0.35rem' }}>no PIX</span>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: produto.preco_pix ? '1rem' : '1.25rem', fontWeight: produto.preco_pix ? 400 : 700, color: produto.preco_pix ? 'rgba(244,244,244,0.45)' : '#f4f4f4' }}>{fmt(produto.preco)}</span>
                  {produto.preco_pix && <span style={{ fontSize: '0.75rem', color: 'rgba(244,244,244,0.3)', marginLeft: '0.35rem' }}>no cartão</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!produto.ativo}
                  aria-label={`Adicionar ${produto.nome} ao carrinho`}
                  style={{
                    padding: '0.75rem 1.25rem', background: '#c9a961', border: 'none', borderRadius: 2,
                    cursor: produto.ativo ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.75rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000',
                    opacity: produto.ativo ? 1 : 0.4,
                  }}
                >
                  {produto.ativo ? 'Adicionar ao Carrinho' : 'Esgotado'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Compartilhar produto"
                  style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid rgba(201,169,97,0.4)', borderRadius: 2, cursor: 'pointer', color: '#c9a961', fontSize: '0.75rem', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Compartilhar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
