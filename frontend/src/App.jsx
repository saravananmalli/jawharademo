import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { DeliverySettingsProvider } from './context/DeliverySettingsContext';
import Header from './components/Header/Header';
import CategoryMenu from './components/Navigation/CategoryMenu';
import Footer from './components/Footer/Footer';
import PageLoader from './components/Common/PageLoader';
import ProtectedRoute from './components/Common/ProtectedRoute';
import AdminGuard from './pages/admin/AdminGuard';
import ChatAgent from './components/ChatAgent/ChatAgent';
import './styles/main.scss';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const Home              = lazy(() => import('./pages/Home'));
const Category          = lazy(() => import('./pages/Category'));
const ProductDetail     = lazy(() => import('./pages/ProductDetail'));
const Cart              = lazy(() => import('./pages/Cart'));
const Wishlist          = lazy(() => import('./pages/Wishlist'));
const SearchResults     = lazy(() => import('./pages/SearchResults'));
const NotFound          = lazy(() => import('./pages/NotFound'));
const Login             = lazy(() => import('./pages/Login'));
const Register          = lazy(() => import('./pages/Register'));
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'));
const Checkout          = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Account           = lazy(() => import('./pages/Account'));
const BrandPage         = lazy(() => import('./pages/BrandPage'));
const CollectionPage    = lazy(() => import('./pages/CollectionPage'));
const AllReviews        = lazy(() => import('./pages/AllReviews'));
const OfferPage         = lazy(() => import('./pages/OfferPage'));

// Admin pages
const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard      = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts  = lazy(() => import('./pages/admin/Products'));
const ProductForm    = lazy(() => import('./pages/admin/ProductForm'));
const AdminOrders    = lazy(() => import('./pages/admin/Orders'));
const AdminCustomers = lazy(() => import('./pages/admin/Users'));
const Analytics      = lazy(() => import('./pages/admin/Analytics'));
const Categories     = lazy(() => import('./pages/admin/Categories'));
const Brands         = lazy(() => import('./pages/admin/Brands'));
const Reviews        = lazy(() => import('./pages/admin/Reviews'));
const Banners           = lazy(() => import('./pages/admin/Banners'));
const Offers            = lazy(() => import('./pages/admin/Offers'));
const Settings          = lazy(() => import('./pages/admin/Settings'));
const MobileOnboarding  = lazy(() => import('./pages/admin/MobileOnboarding'));
const MobileHomeBanner  = lazy(() => import('./pages/admin/MobileHomeBanner'));
const MobileDashboard   = lazy(() => import('./pages/admin/MobileDashboard'));

function Layout({ children }) {
  return (
    <>
      <Header />
      <CategoryMenu />
      <div id="main-content">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </div>
      <Footer />
      <ChatAgent />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <DeliverySettingsProvider>
        <LanguageProvider>
          <CartProvider>
            <WishlistProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public customer routes */}
                  <Route path="/"                element={<Layout><Home /></Layout>} />
                  <Route path="/category/:slug"  element={<Layout><Category /></Layout>} />
                  <Route path="/brand/:slug"      element={<Layout><BrandPage /></Layout>} />
                  <Route path="/collection/:slug" element={<Layout><CollectionPage /></Layout>} />
                  <Route path="/reviews"         element={<Layout><AllReviews /></Layout>} />
                  <Route path="/offer/active"    element={<Layout><OfferPage /></Layout>} />
                  <Route path="/product/:id"     element={<Layout><ProductDetail /></Layout>} />
                  <Route path="/cart"            element={<Layout><Cart /></Layout>} />
                  <Route path="/search"          element={<Layout><SearchResults /></Layout>} />

                  {/* Auth pages — full-screen, no Header/Footer */}
                  <Route path="/login"           element={<Login />} />
                  <Route path="/register"        element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Protected customer routes */}
                  <Route path="/wishlist" element={
                    <Layout>
                      <ProtectedRoute><Wishlist /></ProtectedRoute>
                    </Layout>
                  } />
                  <Route path="/checkout" element={
                    <Layout>
                      <ProtectedRoute><Checkout /></ProtectedRoute>
                    </Layout>
                  } />
                  <Route path="/order-confirmation/:id" element={
                    <Layout>
                      <ProtectedRoute><OrderConfirmation /></ProtectedRoute>
                    </Layout>
                  } />
                  <Route path="/account" element={
                    <Layout>
                      <ProtectedRoute><Account /></ProtectedRoute>
                    </Layout>
                  } />

                  {/* Admin routes — no Header/Footer, MUI ThemeProvider inside AdminLayout */}
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminLayout />
                      </AdminGuard>
                    }
                  >
                    <Route index                       element={<Dashboard />} />
                    <Route path="analytics"            element={<Analytics />} />
                    <Route path="products"             element={<AdminProducts />} />
                    <Route path="products/add"         element={<ProductForm />} />
                    <Route path="products/:id/edit"    element={<ProductForm />} />
                    <Route path="categories"           element={<Categories />} />
                    <Route path="brands"               element={<Brands />} />
                    <Route path="orders"               element={<AdminOrders />} />
                    <Route path="customers"            element={<AdminCustomers />} />
                    <Route path="reviews"              element={<Reviews />} />
                    <Route path="banners"              element={<Banners />} />
                    <Route path="offers"               element={<Offers />} />
                    <Route path="settings"             element={<Settings />} />
                    <Route path="mobile/dashboard"     element={<MobileDashboard />} />
                    <Route path="mobile/onboarding"    element={<MobileOnboarding />} />
                    <Route path="mobile/home-banner"   element={<MobileHomeBanner />} />
                  </Route>

                  <Route path="*" element={<Layout><NotFound /></Layout>} />
                </Routes>
              </Suspense>
            </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
        </DeliverySettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
