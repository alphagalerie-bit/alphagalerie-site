import { useEffect, useRef } from 'react';

interface CardPaymentProps {
  amount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mp: any;
  onTokenReceived: (token: string, paymentMethodId: string) => void;
}

export default function CardPayment({ amount, mp, onTokenReceived }: CardPaymentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardFormRef = useRef<any>(null);

  useEffect(() => {
    if (!mp) return;
    const cardForm = mp.cardForm({
      amount: String(amount.toFixed(2)),
      autoMount: true,
      form: {
        id: 'cardFormInternal',
        cardNumber: { id: 'mp_card_number', placeholder: 'Número do cartão' },
        expirationDate: { id: 'mp_expiration_date', placeholder: 'MM/AA' },
        securityCode: { id: 'mp_security_code', placeholder: 'CVV' },
        cardholderName: { id: 'mp_cardholder_name', placeholder: 'Nome no cartão' },
        installments: { id: 'mp_installments' },
      },
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onFormMounted: (error: any) => {
          if (error) console.error('[CardPayment] onFormMounted error:', error);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCardTokenReceived: (error: any, token: any) => {
          if (error) { console.error('[CardPayment] token error:', error); return; }
          if (token) onTokenReceived(token.id, token.payment_method_id);
        },
      },
    });
    cardFormRef.current = cardForm;
    return () => {
      try { cardFormRef.current?.unmount(); } catch { /* ignore */ }
    };
  }, [mp, amount, onTokenReceived]);

  return (
    <form id="cardFormInternal" className="card-payment-form" noValidate>
      <div className="card-payment-field">
        <label htmlFor="mp_card_number">Número do cartão</label>
        <div id="mp_card_number" className="mp-field" />
      </div>
      <div className="card-payment-row">
        <div className="card-payment-field">
          <label htmlFor="mp_expiration_date">Validade</label>
          <div id="mp_expiration_date" className="mp-field" />
        </div>
        <div className="card-payment-field">
          <label htmlFor="mp_security_code">CVV</label>
          <div id="mp_security_code" className="mp-field" />
        </div>
      </div>
      <div className="card-payment-field">
        <label htmlFor="mp_cardholder_name">Nome no cartão</label>
        <div id="mp_cardholder_name" className="mp-field" />
      </div>
      <div className="card-payment-field">
        <label htmlFor="mp_installments">Parcelas</label>
        <div id="mp_installments" className="mp-field" />
      </div>
      <button type="submit" className="card-payment-submit" aria-label="Confirmar pagamento com cartão">
        Confirmar Pagamento
      </button>
    </form>
  );
}
