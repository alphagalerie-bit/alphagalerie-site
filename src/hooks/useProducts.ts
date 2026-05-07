import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Produto, Variacao } from '../types';

async function fetchProducts(categoryId: number): Promise<Produto[]> {
  const { data: produtosRaw, error: produtosError } = await supabase
    .from('produtos')
    .select('id,nome,marca,preco,preco_pix,categoria_id,subcategoria,estoque,ativo,destaque,imagem_url')
    .eq('ativo', true)
    .eq('categoria_id', categoryId);

  if (produtosError) throw new Error(produtosError.message);

  const produtos = (produtosRaw ?? []) as Omit<Produto, '_variacoes'>[];
  if (produtos.length === 0) return [];

  const ids = produtos.map((p) => p.id);

  const { data: variacoesRaw, error: variacoesError } = await supabase
    .from('produto_variacoes')
    .select('*')
    .in('produto_id', ids)
    .eq('ativo', true)
    .order('ordem')
    .order('id');

  if (variacoesError) throw new Error(variacoesError.message);

  const variacoes = (variacoesRaw ?? []) as Variacao[];

  const variacoesByProduto = variacoes.reduce<Record<number, Variacao[]>>(
    (acc, v) => {
      if (!acc[v.produto_id]) acc[v.produto_id] = [];
      acc[v.produto_id].push(v);
      return acc;
    },
    {}
  );

  return produtos.map((p) => ({
    ...p,
    _variacoes: variacoesByProduto[p.id] ?? [],
  })) as Produto[];
}

export function useProducts(categoryId: number | null) {
  return useQuery<Produto[]>({
    queryKey: ['produtos', categoryId],
    queryFn: () => fetchProducts(categoryId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!categoryId,
  });
}
