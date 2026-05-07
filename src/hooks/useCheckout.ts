// src/hooks/useCheckout.ts
import { supabase } from '../lib/supabase';
import type { Pedido, ItemCarrinho } from '../types';

interface SubmitResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pedido?: any;
  error?: string;
}

export function useCheckout() {
  async function submitPedido(
    dados: Pedido,
    itens: ItemCarrinho[]
  ): Promise<SubmitResult> {
    try {
      const payload = {
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email ?? null,
        cep: dados.cep ?? null,
        endereco: dados.endereco ?? null,
        bairro: dados.bairro ?? null,
        cidade: dados.cidade ?? null,
        estado: dados.estado ?? null,
        complemento: dados.complemento ?? null,
        pagamento: dados.pagamento,
        entrega: dados.entrega,
        observacoes: dados.observacoes ?? null,
        total: dados.total,
        status: dados.status ?? 'pendente',
        itens_snapshot: itens,
      };

      let { data, error } = await supabase
        .from('pedidos')
        .insert(payload)
        .select()
        .single();

      // Fallback: coluna itens_snapshot pode não existir
      if (error && error.message?.includes('itens_snapshot')) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { itens_snapshot: _dropped, ...payloadSemItens } = payload;
        const result = await supabase
          .from('pedidos')
          .insert(payloadSemItens)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      return { success: true, pedido: data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pedido.';
      console.error('[useCheckout] submitPedido error:', err);
      return { success: false, error: message };
    }
  }

  return { submitPedido };
}
