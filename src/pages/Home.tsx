import { lazy, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVisita } from '../hooks/useVisita';
import { useCartStore } from '../store/cart';
import { useCategories } from '../hooks/useCategories';
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
  const [initialSearch, setInitialSearch] = useState('');
  const [initialSubcat, setInitialSubcat] = useState<string | null>(null);

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

  const { data: categorias = [] } = useCategories();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const sub = params.get('sub');
    const cat = params.get('cat');

    if (q) setInitialSearch(q);
    if (sub) setInitialSubcat(sub);

    if (cat || sub || q) {
      setTimeout(() => {
        document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catSlug = params.get('cat');
    if (catSlug && categorias.length > 0) {
      const match = categorias.find(
        (c) => c.slug === catSlug || c.nome.toLowerCase() === catSlug.toLowerCase()
      );
      if (match) setCategoryId(match.id);
    }
  }, [categorias]);

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
        <ProductGrid
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          initialSearch={initialSearch}
          initialSubcat={initialSubcat}
        />
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
