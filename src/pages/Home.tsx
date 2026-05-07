import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnnouncementBar from '../components/AnnouncementBar';
import HeroSection from '../components/HeroSection';
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
      <AnnouncementBar />
      <Header onOpenCart={() => setCartOpen(true)} />

      <HeroSection />

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
