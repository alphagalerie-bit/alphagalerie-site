import { supabase } from '../lib/supabase';
import type { Pedido, ItemCarrinho } from '../types';

interface SubmitResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pedido?: any;
  error?: string;
}

function buildEnderecoTexto(dados: Pedido): string | null {
  const parts = [
    dados.endereco,
    dados.bairro,
    dados.cidade,
    dados.estado,
    dados.cep,
    dados.complemento,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function useCheckout() {
  async function submitPedido(
    dados: Pedido,
    itens: ItemCarrinho[]
  ): Promise<SubmitResult> {
    try {
      const subtotal = itens.reduce((acc, i) => acc + i.preco * i.qtd, 0);

      const numero = `AG${Date.now()}`;

      const payload = {
        numero,
        cliente_nome: dados.nome,
        cliente_whatsapp: dados.telefone,
        cliente_email: dados.email ?? null,
        cliente_endereco: buildEnderecoTexto(dados),
        forma_pagamento: dados.pagamento,
        tipo_entrega: dados.entrega,
        observacoes: dados.observacoes ?? null,
        subtotal,
        total: dados.total,
        status: dados.status ?? 'pendente',
      };

      const { data, error } = await supabase
        .from('pedidos')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Insert line items into pedido_itens (best-effort, non-blocking)
      if (data?.id && itens.length > 0) {
        const linhas = itens.map((item) => ({
          pedido_id: data.id,
          produto_id: item.id,
          produto_nome: item.nome,
          produto_codigo: item.codigo ?? null,
          quantidade: item.qtd,
          preco_unitario: item.preco,
          subtotal: item.preco * item.qtd,
          variacao_id: item.variacaoId ?? null,
        }));
        await supabase.from('pedido_itens').insert(linhas);
      }

      return { success: true, pedido: data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pedido.';
      console.error('[useCheckout] submitPedido error:', err);
      return { success: false, error: message };
    }
  }

  return { submitPedido };
}
