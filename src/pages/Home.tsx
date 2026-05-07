import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import CartDrawer from '../components/CartDrawer';
import ProductModal from '../components/ProductModal';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Footer from '../components/Footer';

const CheckoutModal = lazy(() => import('../components/checkout/CheckoutModal'));

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const produtoIdParam = searchParams.get('p');
  const produtoId = produtoIdParam ? parseInt(produtoIdParam, 10) : null;

  function closeProductModal() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('p');
      return next;
    });
  }

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} />

      <section
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
          padding: '5rem 1.5rem 4rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(201,169,97,0.15)',
        }}
        aria-label="Bem-vindo à Alpha Galerie"
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#f4f4f4',
            margin: '0 0 0.75rem',
          }}
        >
          ALPHA GALERIE
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c9a961',
          }}
        >
          Headshop · Charutaria · Arguile · Lifestyle · Alphaville
        </p>
      </section>

      <main id="main-content">
        <ProductGrid categoryId={categoryId} onCategoryChange={setCategoryId} />
      </main>

      <Footer />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onOpenCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {checkoutOpen && (
        <Suspense fallback={null}>
          <CheckoutModal onClose={() => setCheckoutOpen(false)} />
        </Suspense>
      )}

      <ProductModal produtoId={produtoId} onClose={closeProductModal} />

      <FloatingWhatsApp />
    </>
  );
}
