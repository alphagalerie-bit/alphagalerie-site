import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '../../store/cart';
import { useCheckout } from '../../hooks/useCheckout';
import { loadMercadoPago } from '../../lib/mercadopago';
import PixPayment from './PixPayment';
import CardPayment from './CardPayment';
import type { Pedido } from '../../types';

interface CheckoutModalProps {
  onClose: () => void;
}

type Step = 'form' | 'pix' | 'card' | 'success';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const { submitPedido } = useCheckout();

  const [step, setStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [txid, setTxid] = useState('');

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [entrega, setEntrega] = useState<'retirada' | 'delivery'>('retirada');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [complemento, setComplemento] = useState('');
  const [pagamento, setPagamento] = useState<'pix' | 'cartao' | 'pagar_retirada'>('pix');
  const [observacoes, setObservacoes] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mpInstance, setMpInstance] = useState<any>(null);

  const total = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);

  useEffect(() => {
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
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const dadosPedido: Pedido = {
      nome, telefone,
      email: email || undefined,
      cep: cep || undefined,
      endereco: endereco || undefined,
      bairro: bairro || undefined,
      cidade: cidade || undefined,
      estado: estado || undefined,
      complemento: complemento || undefined,
      pagamento, entrega,
      observacoes: observacoes || undefined,
      total,
      status: 'pendente',
      itens: items,
    };

    const result = await submitPedido(dadosPedido, items);
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error ?? 'Erro ao registrar pedido.');
      return;
    }

    setPedidoId(result.pedido?.id ?? null);
    const newTxid = `AG${Date.now()}`;
    setTxid(newTxid);

    if (pagamento === 'pix') {
      setStep('pix');
    } else if (pagamento === 'cartao') {
      try {
        const mp = await loadMercadoPago();
        setMpInstance(mp);
        setStep('card');
      } catch {
        setSubmitError('Não foi possível carregar o módulo de pagamento. Tente novamente.');
      }
    } else {
      clearCart();
      setStep('success');
    }
  }

  function handlePixClose() {
    clearCart();
    setStep('success');
  }

  function handleTokenReceived(_token: string, _paymentMethodId: string) {
    clearCart();
    setStep('success');
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const modalStyle: React.CSSProperties = {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: '#0a0a0a', border: '1px solid rgba(201,169,97,0.3)', borderRadius: 4,
    width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', zIndex: 301,
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem',
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem', background: '#111', border: '1px solid rgba(244,244,244,0.15)',
    borderRadius: 2, color: '#f4f4f4', fontSize: '0.875rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', color: 'rgba(244,244,244,0.6)', fontWeight: 500,
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }} onPointerDown={onClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Finalizar compra" style={modalStyle}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#f4f4f4', display: 'flex', zIndex: 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {step === 'form' && (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#c9a961', marginBottom: '0.35rem' }}>
              Finalizar Compra
            </h2>
            <p style={{ color: 'rgba(244,244,244,0.5)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Total: <strong style={{ color: '#f4f4f4' }}>{fmt(total)}</strong>
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <fieldset style={{ border: '1px solid rgba(244,244,244,0.1)', borderRadius: 2, padding: '0.875rem', marginBottom: '1rem' }}>
                <legend style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a961', padding: '0 0.35rem' }}>Seus dados</legend>
                <div style={fieldStyle}>
                  <label htmlFor="co_nome" style={labelStyle}>Nome completo *</label>
                  <input id="co_nome" type="text" required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label htmlFor="co_telefone" style={labelStyle}>Telefone / WhatsApp *</label>
                  <input id="co_telefone" type="tel" required value={telefone} onChange={(e) => setTelefone(maskTelefone(e.target.value))} autoComplete="tel" placeholder="(11) 99999-9999" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label htmlFor="co_email" style={labelStyle}>E-mail</label>
                  <input id="co_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={inputStyle} />
                </div>
              </fieldset>

              <fieldset style={{ border: '1px solid rgba(244,244,244,0.1)', borderRadius: 2, padding: '0.875rem', marginBottom: '1rem' }}>
                <legend style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a961', padding: '0 0.35rem' }}>Entrega</legend>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }} role="radiogroup" aria-label="Tipo de entrega">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#f4f4f4', fontSize: '0.875rem' }}>
                    <input type="radio" name="entrega" value="retirada" checked={entrega === 'retirada'} onChange={() => setEntrega('retirada')} />
                    Retirada
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#f4f4f4', fontSize: '0.875rem' }}>
                    <input type="radio" name="entrega" value="delivery" checked={entrega === 'delivery'} onChange={() => setEntrega('delivery')} />
                    Delivery
                  </label>
                </div>
                {entrega === 'delivery' && (
                  <>
                    <div style={fieldStyle}>
                      <label htmlFor="co_cep" style={labelStyle}>CEP</label>
                      <input id="co_cep" type="text" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" autoComplete="postal-code" style={{ ...inputStyle, maxWidth: 160 }} />
                    </div>
                    <div style={fieldStyle}>
                      <label htmlFor="co_endereco" style={labelStyle}>Endereço *</label>
                      <input id="co_endereco" type="text" required={entrega === 'delivery'} value={endereco} onChange={(e) => setEndereco(e.target.value)} autoComplete="street-address" style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label htmlFor="co_bairro" style={labelStyle}>Bairro</label>
                      <input id="co_bairro" type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ ...fieldStyle, flex: 1 }}>
                        <label htmlFor="co_cidade" style={labelStyle}>Cidade</label>
                        <input id="co_cidade" type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} autoComplete="address-level2" style={inputStyle} />
                      </div>
                      <div style={fieldStyle}>
                        <label htmlFor="co_estado" style={labelStyle}>UF</label>
                        <input id="co_estado" type="text" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} autoComplete="address-level1" style={{ ...inputStyle, width: 64 }} />
                      </div>
                    </div>
                    <div style={fieldStyle}>
                      <label htmlFor="co_complemento" style={labelStyle}>Complemento</label>
                      <input id="co_complemento" type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
              </fieldset>

              <fieldset style={{ border: '1px solid rgba(244,244,244,0.1)', borderRadius: 2, padding: '0.875rem', marginBottom: '1rem' }}>
                <legend style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c9a961', padding: '0 0.35rem' }}>Pagamento</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} role="radiogroup" aria-label="Forma de pagamento">
                  {(['pix', 'cartao', 'pagar_retirada'] as const).map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#f4f4f4', fontSize: '0.875rem' }}>
                      <input type="radio" name="pagamento" value={p} checked={pagamento === p} onChange={() => setPagamento(p)} />
                      {p === 'pix' ? 'PIX' : p === 'cartao' ? 'Cartão de crédito' : 'Pagar na retirada'}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div style={fieldStyle}>
                <label htmlFor="co_obs" style={labelStyle}>Observações</label>
                <textarea id="co_obs" rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma instrução especial?" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {submitError && (
                <p role="alert" style={{ color: '#e55', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                style={{
                  width: '100%', padding: '1rem', background: '#c9a961', border: 'none', borderRadius: 2,
                  cursor: isSubmitting ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.8rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Enviando...' : 'CONFIRMAR PEDIDO'}
              </button>
            </form>
          </div>
        )}

        {step === 'pix' && <PixPayment total={total} txid={txid} onClose={handlePixClose} />}

        {step === 'card' && mpInstance && (
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: '#c9a961', marginBottom: '0.5rem' }}>
              Pagamento com Cartão
            </h2>
            <p style={{ color: 'rgba(244,244,244,0.5)', marginBottom: '1rem' }}>Total: <strong style={{ color: '#f4f4f4' }}>{fmt(total)}</strong></p>
            <CardPayment amount={total} mp={mpInstance} onTokenReceived={handleTokenReceived} />
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#4caf50', marginBottom: '1rem' }} aria-hidden="true">✓</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', color: '#c9a961', marginBottom: '0.5rem' }}>
              Pedido confirmado!
            </h2>
            {pedidoId && <p style={{ color: 'rgba(244,244,244,0.6)', marginBottom: '0.75rem' }}>Pedido #{pedidoId}</p>}
            <p style={{ color: 'rgba(244,244,244,0.7)', marginBottom: '1.5rem' }}>
              Em breve entraremos em contato pelo WhatsApp para confirmar os detalhes.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.875rem 2rem', background: '#c9a961', border: 'none', borderRadius: 2, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000' }}
            >
              FECHAR
            </button>
          </div>
        )}
      </div>
    </>
  );
}
