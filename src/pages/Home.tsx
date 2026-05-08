import { lazy, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVisita } from '../hooks/useVisita';
import { useCartStore } from '../store/cart';
import RecuperacaoPopup from '../components/RecuperacaoPopup';
import AnnouncementBar from '../components/AnnouncementBar';
import HeroSection from '../components/HeroSection';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import CartDrawer from '../components/CartDrawer';
import ProductModal from '../components/ProductModal';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Footer from '../components/Footer';
import HempSection from '../components/HempSection';

const CheckoutModal = lazy(() => import('../components/checkout/CheckoutModal'));

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  useVisita();

  const cartItems = useCartStore((s) => s.items);

  useEffect(() => {
    const popupShown = sessionStorage.getItem('ag_popup_shown');
    if (popupShown) return;

    function maybeShow() {
      if (cartItems.length > 0) return;
      if (sessionStorage.getItem('ag_popup_shown')) return;
      sessionStorage.setItem('ag_popup_shown', '1');
      setPopupOpen(true);
    }

    const timer = setTimeout(maybeShow, 90_000);

    function handleExitIntent(e: MouseEvent) {
      if (e.clientY <= 0) maybeShow();
    }
    document.addEventListener('mouseleave', handleExitIntent);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleExitIntent);
    };
  }, [cartItems.length]);

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
      <HempSection />
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

      {popupOpen && (
        <RecuperacaoPopup onClose={() => setPopupOpen(false)} />
      )}
    </>
  );
}
