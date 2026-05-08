// src/lib/mercadopago.ts
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mpInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadMercadoPago(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (mpInstance) {
      resolve(mpInstance);
      return;
    }
    if (window.MercadoPago) {
      mpInstance = new window.MercadoPago(
        import.meta.env.VITE_MP_PUBLIC_KEY,
        { locale: 'pt-BR' }
      );
      resolve(mpInstance);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      mpInstance = new window.MercadoPago(
        import.meta.env.VITE_MP_PUBLIC_KEY,
        { locale: 'pt-BR' }
      );
      resolve(mpInstance);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
