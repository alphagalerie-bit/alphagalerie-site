import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Produto, Variacao } from '../types';

const PAGE_SIZE = 24;

export interface ProductsPage {
  produtos: Produto[];
  total: number;
  page: number;
}

async function fetchProducts(
  categoryId: number | null,
  page: number,
  search: string
): Promise<ProductsPage> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('produtos')
    .select('id,nome,marca,preco,preco_pix,categoria_id,subcategoria,estoque,ativo,destaque,imagem_url', { count: 'exact' })
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .order('id')
    .range(from, to);

  if (categoryId !== null) {
    query = query.eq('categoria_id', categoryId);
  }

  if (search.trim()) {
    query = query.or(`nome.ilike.%${search.trim()}%,marca.ilike.%${search.trim()}%`);
  }

  const { data: produtosRaw, error: produtosError, count } = await query;

  if (produtosError) throw new Error(produtosError.message);

  const produtos = (produtosRaw ?? []) as Omit<Produto, '_variacoes'>[];
  if (produtos.length === 0) return { produtos: [], total: count ?? 0, page };

  // Busca variações apenas dos produtos desta página (máx PAGE_SIZE ids)
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

  const produtosComVariacoes = produtos.map((p) => ({
    ...p,
    _variacoes: variacoesByProduto[p.id] ?? [],
  })) as Produto[];

  return { produtos: produtosComVariacoes, total: count ?? 0, page };
}

export function useProducts(
  categoryId: number | null,
  page = 0,
  search = ''
) {
  return useQuery<ProductsPage>({
    queryKey: ['produtos', categoryId, page, search],
    queryFn: () => fetchProducts(categoryId, page, search),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
