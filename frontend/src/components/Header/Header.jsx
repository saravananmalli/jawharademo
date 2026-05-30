import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useMatch, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useDeliverySettings } from "../../context/DeliverySettingsContext";
import { cachedGet } from "../../services/api";
import SearchBar from "./SearchBar";
import LocationPickerModal from "./LocationPickerModal";
import "./Header.scss";

// ── Multi-level mobile menu data ──────────────────────────────
const MOBILE_MENU = [
  {
    id: "rings",
    label: "Rings",
    path: "/category/rings",
    children: [
      { label: "All Rings", path: "/category/rings" },
      { label: "Solitaire Rings", path: "/category/rings?filter=Solitaire+Rings" },
      { label: "Halo Rings", path: "/category/rings?filter=Halo+Rings" },
      { label: "Eternity Bands", path: "/category/rings?filter=Eternity+Bands" },
      { label: "Statement Rings", path: "/category/rings?filter=Statement+Rings" },
      { label: "Diamond Rings", path: "/category/rings?filter=Diamond" },
      { label: "Gold 18K Rings", path: "/category/rings?filter=Gold+18K" },
      { label: "White Gold Rings", path: "/category/rings?filter=White+Gold" },
    ],
  },
  {
    id: "earrings",
    label: "Earrings",
    path: "/category/earrings",
    children: [
      { label: "All Earrings", path: "/category/earrings" },
      { label: "Diamond Studs", path: "/category/earrings?filter=Diamond+Studs" },
      { label: "Gold Hoops", path: "/category/earrings?filter=Gold+Hoops" },
      { label: "Drop Earrings", path: "/category/earrings?filter=Drop+Earrings" },
      { label: "Chandelier", path: "/category/earrings?filter=Chandelier" },
      { label: "Jhumkas", path: "/category/earrings?filter=Jhumkas" },
      { label: "Pearl Earrings", path: "/category/earrings?filter=Pearl" },
    ],
  },
  {
    id: "necklaces",
    label: "Necklaces & Pendants",
    path: "/category/necklaces",
    children: [
      { label: "All Necklaces", path: "/category/necklaces" },
      { label: "Diamond Pendants", path: "/category/necklaces?filter=Diamond+Pendants" },
      { label: "Gold Chains", path: "/category/necklaces?filter=Gold+Chains" },
      { label: "Pearl Necklaces", path: "/category/necklaces?filter=Pearl+Necklaces" },
      { label: "Layered Sets", path: "/category/necklaces?filter=Layered+Sets" },
      { label: "Chokers", path: "/category/necklaces?filter=Chokers" },
    ],
  },
  {
    id: "bracelets",
    label: "Bracelets & Bangles",
    path: "/category/bracelets",
    children: [
      { label: "All Bracelets", path: "/category/bracelets" },
      { label: "Tennis Bracelets", path: "/category/bracelets?filter=Tennis+Bracelets" },
      { label: "Gold Bangles", path: "/category/bracelets?filter=Gold+Bangles" },
      { label: "Diamond Bangles", path: "/category/bracelets?filter=Diamond+Bangles" },
      { label: "Charm Bracelets", path: "/category/bracelets?filter=Charm+Bracelets" },
    ],
  },
];

const MOBILE_CATEGORIES = [
  { id: 'rings',          label: 'Rings',               icon: '/images/category/rings.png',          path: '/category/rings' },
  { id: 'earrings',       label: 'Earrings',            icon: '/images/category/earrings.png',       path: '/category/earrings' },
  { id: 'necklaces',      label: 'Necklaces & Pendants',icon: '/images/category/necklace.png',       path: '/category/necklaces' },
  { id: 'bracelets',      label: 'Bracelets & Bangles', icon: '/images/category/bracelet.png',       path: '/category/bracelets' },
  { id: 'wedding-rings',  label: 'Wedding Rings',       icon: '/images/category/wedding-rings.png',  path: '/category/wedding-rings' },
  { id: 'kids-jewellery', label: "Kids' Jewellery",     icon: '/images/category/kids-jewellery.png', path: '/category/kids-jewellery' },
  { id: 'all',            label: 'All Jewellery',       icon: '/images/category/all-products.png',   path: '/category/all' },
];

const SIMPLE_LINKS = [
  { label: "Gifting",       path: "/collection/gifting"      },
  { label: "New Arrivals",  path: "/collection/new-arrivals" },
  { label: "Best Sellers",  path: "/collection/best-seller"  },
  { label: "Trending",      path: "/collection/trending"     },
];

// ── Reusable SVG icons ────────────────────────────────────────
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function Header() {
  const { toggleLanguage, language } = useLanguage();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isProductPage = useMatch("/product/:id");

  const navActive = (paths) => paths.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));

  const { location, detecting, saveLocation, detect } = useDeliverySettings();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSub, setActiveSub] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const userMenuRef = useRef(null);

  // Fetch active brands once for the Collections sub-panel
  useEffect(() => {
    cachedGet('/brands', { params: { active: 'true' }, ttl: 300_000 })
      .then(res => setBrands(res.data.data || []))
      .catch(() => {});
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUserClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setUserMenuOpen(v => !v);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setActiveSub(null);
  };

  const handleNav = (path) => {
    closeMenu();
    navigate(path);
  };

  const openSub = (item) => setActiveSub(item);
  const closeSub = () => setActiveSub(null);

  return (
    <>
      <header className="header">

        {/* ── DESKTOP HEADER (unchanged) ── */}
        <div className="header__inner">

          <div className="header__left">
            <Link to="/" className="header__logo">
              <img src="/jawhara-logo.png" alt="Jawhara Jewellery" />
            </Link>
            <button
              className="header__delivery"
              onClick={() => setLocationModalOpen(true)}
              aria-label="Change delivery location"
            >
              <img src="/icons/location.png" alt="location" className="header__delivery-icon" />
              <div className="header__delivery-text">
                <span>Delivery To</span>
                <strong>{detecting ? 'Detecting…' : `${location.city}${location.country ? `, ${location.country}` : ''}`}</strong>
              </div>
              <svg className="header__delivery-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div className="header__search">
            <SearchBar />
          </div>

          <div className="header__actions">
            <button className="header__action-btn header__action-btn--pill" aria-label="Store Locator">
              <img src="/icons/store.png" alt="store" className="header__icon" />
              <span className="label">Stores</span>
            </button>

            <button
              className="header__action-btn header__action-btn--pill"
              onClick={toggleLanguage}
              aria-label="Switch Language"
            >
              <img src="/icons/UAE.png" alt="UAE" className="header__icon header__icon--flag" />
              <span className="label">{language === "en" ? "العربية" : "English"}</span>
            </button>

            {/* User icon with dropdown */}
            <div className="header__user-wrap" ref={userMenuRef}>
              <button
                className={`header__action-btn header__action-btn--user ${isAuthenticated ? 'signed-in' : ''}`}
                onClick={handleUserClick}
                aria-label={isAuthenticated ? 'My Account' : 'Sign In'}
              >
                {isAuthenticated ? (
                  <span className="header__user-initial">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                ) : (
                  <img src="/icons/User.png" alt="user" className="header__icon" />
                )}
              </button>

              {isAuthenticated && userMenuOpen && (
                <div className="header__user-dropdown">
                  <div className="header__user-dropdown__header">
                    <span className="header__user-dropdown__name">{user?.name}</span>
                    <span className="header__user-dropdown__email">{user?.email}</span>
                  </div>
                  <div className="header__user-dropdown__items">
                    <button onClick={() => { navigate('/account'); setUserMenuOpen(false); }}>My Account</button>
                    <button onClick={() => { navigate('/account'); setUserMenuOpen(false); }}>My Orders</button>
                    <button onClick={() => { navigate('/wishlist'); setUserMenuOpen(false); }}>Wishlist</button>
                    <div className="header__user-dropdown__divider" />
                    <button className="header__user-dropdown__logout" onClick={handleLogout}>Sign Out</button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="header__action-btn"
              onClick={() => navigate("/wishlist")}
              aria-label="Wishlist"
            >
              <div className="header__icon-wrap">
                <img src="/icons/Heart.png" alt="wishlist" className="header__icon" />
                {wishlistCount > 0 && <span className="count-badge">{wishlistCount}</span>}
              </div>
            </button>

            <button
              className="header__action-btn"
              onClick={() => navigate("/cart")}
              aria-label="Cart"
            >
              <div className="header__icon-wrap">
                <img src="/icons/bag.png" alt="cart" className="header__icon" />
                {cartCount > 0 && <span className="count-badge">{cartCount}</span>}
              </div>
            </button>
          </div>

        </div>

        {/* ── MOBILE HEADER ── */}
        <div className="header__mobile">

          {/* Row 1: Hamburger | Centered Logo | Icons */}
          <div className="header__mobile-top">
            <button
              className="header__mobile-hamburger"
              aria-label="Open Menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="hamburger-lines">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            <Link to="/" className="header__mobile-logo">
              <img src="/jawhara-logo.png" alt="Jawhara Jewellery" />
            </Link>

            <div className="header__mobile-icons">
              <button
                className="header__mobile-icon-btn"
                aria-label="Search"
                onClick={() => navigate("/search")}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <button
                className="header__mobile-icon-btn"
                aria-label="Wishlist"
                onClick={() => navigate("/wishlist")}
              >
                <div className="header__icon-wrap">
                  <img src="/icons/Heart.png" alt="wishlist" />
                  {wishlistCount > 0 && <span className="count-badge">{wishlistCount}</span>}
                </div>
              </button>
            </div>
          </div>

          {/* Row 2: Location picker + Language */}
          <div className="header__mobile-location-bar">
            <button
              className="header__mobile-location"
              onClick={() => setLocationModalOpen(true)}
              aria-label="Change delivery location"
            >
              <img src="/icons/location.png" alt="location" />
              <div className="header__mobile-location-text">
                <span>Delivery To</span>
                <strong>{detecting ? '…' : `${location.city}${location.country ? `, ${location.country}` : ''}`}</strong>
              </div>
              <svg className="header__mobile-location-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <button
              className="header__mobile-lang-btn"
              onClick={toggleLanguage}
              aria-label="Switch Language"
            >
              <img src="/icons/UAE.png" alt="UAE" />
              <span>{language === "en" ? "العربية" : "English"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

        </div>

      </header>

      {/* ── MOBILE DRAWER BACKDROP ── */}
      <div
        className={`mobile-drawer-backdrop${menuOpen ? " open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* ── MOBILE DRAWER ── */}
      <aside className={`mobile-drawer${menuOpen ? " open" : ""}`} aria-label="Navigation Menu">

        {/* Drawer header — always visible */}
        <div className="mobile-drawer__header">
          <Link to="/" className="mobile-drawer__logo" onClick={closeMenu}>
            <img src="/jawhara-logo.png" alt="Jawhara Jewellery" />
          </Link>
          <button className="mobile-drawer__close" onClick={closeMenu} aria-label="Close Menu">
            <IconClose />
          </button>
        </div>

        {/* Sliding panels — root + sub side by side, clipped by overflow:hidden */}
        <div className={`mobile-drawer__panels${activeSub ? " show-sub" : ""}`}>

          {/* ── Root panel ── */}
          <div className="mobile-drawer__panel">
            <p className="mobile-drawer__section-label">Shop</p>
            {MOBILE_MENU.map((item) => (
              <button
                key={item.id}
                className="mobile-drawer__item mobile-drawer__item--parent"
                onClick={() => openSub(item)}
              >
                <span>{item.label}</span>
                <IconChevronRight />
              </button>
            ))}
            {brands.length > 0 && (
              <button
                className="mobile-drawer__item mobile-drawer__item--parent"
                onClick={() => openSub({
                  id: 'collections',
                  label: 'Collections',
                  path: '/category/all',
                  children: brands.map(b => ({ label: b.name, path: `/brand/${b.slug}` })),
                })}
              >
                <span>Collections</span>
                <IconChevronRight />
              </button>
            )}

            <div className="mobile-drawer__divider" />

            <p className="mobile-drawer__section-label">Explore</p>
            {SIMPLE_LINKS.map((link) => (
              <button
                key={link.path}
                className="mobile-drawer__item"
                onClick={() => handleNav(link.path)}
              >
                <span>{link.label}</span>
                <IconChevronRight />
              </button>
            ))}

            <div className="mobile-drawer__divider" />

            {isAuthenticated ? (
              <button className="mobile-drawer__item" onClick={() => handleNav("/account")}>
                <span>My Account — {user?.name}</span>
                <IconChevronRight />
              </button>
            ) : (
              <button className="mobile-drawer__item" onClick={() => handleNav("/login")}>
                <span>Sign In / Register</span>
                <IconChevronRight />
              </button>
            )}

            <button className="mobile-drawer__item" onClick={toggleLanguage}>
              <span className="mobile-drawer__lang-row">
                <img src="/icons/UAE.png" alt="UAE" />
                {language === "en" ? "العربية" : "English"}
              </span>
              <IconChevronRight />
            </button>
          </div>

          {/* ── Sub panel ── */}
          <div className="mobile-drawer__panel">
            {/* Sub-panel sticky header with back button */}
            <div className="mobile-drawer__sub-header">
              <button className="mobile-drawer__back" onClick={closeSub} aria-label="Back">
                <IconChevronLeft />
                <span>Back</span>
              </button>
              <span className="mobile-drawer__sub-title">{activeSub?.label}</span>
            </div>

            {/* View all shortcut */}
            {activeSub && (
              <button
                className="mobile-drawer__item mobile-drawer__item--view-all"
                onClick={() => handleNav(activeSub.path)}
              >
                <span>View All {activeSub.label}</span>
                <IconChevronRight />
              </button>
            )}

            <div className="mobile-drawer__divider" />

            {activeSub?.children?.map((child) => (
              <button
                key={child.path}
                className="mobile-drawer__item"
                onClick={() => handleNav(child.path)}
              >
                <span>{child.label}</span>
                <IconChevronRight />
              </button>
            ))}
          </div>

        </div>
      </aside>

      {/* ── LOCATION PICKER MODAL ── */}
      {locationModalOpen && (
        <LocationPickerModal
          currentLocation={location}
          onSelect={saveLocation}
          onDetect={detect}
          detecting={detecting}
          onClose={() => setLocationModalOpen(false)}
        />
      )}

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button className={`mobile-bottom-nav__item${navActive(['/']) ? ' mobile-bottom-nav__item--active' : ''}`} onClick={() => navigate("/")} aria-label="Home">
          <div className="header__icon-wrap">
            <img src="/icons/home.png" alt="Home" style={{ width: '26px', height: '26px' }} />
            <span className="label">Home</span>
          </div>
        </button>
        <button className={`mobile-bottom-nav__item${navActive(['/shop', '/category']) || mobileCatOpen ? ' mobile-bottom-nav__item--active' : ''}`} onClick={() => setMobileCatOpen(v => !v)} aria-label="Categories">
          <div className="header__icon-wrap">
            <img src="/icons/category.png" alt="Categories" style={{ width: '26px', height: '26px' }} />
            <span className="label">Categories</span>
          </div>
        </button>
        <button className={`mobile-bottom-nav__item${navActive(['/account']) ? ' mobile-bottom-nav__item--active' : ''}`} onClick={() => navigate("/account")} aria-label="Account">
          <div className="header__icon-wrap">
            <img src="/icons/User.png" alt="Account" style={{ width: '26px', height: '26px' }} />
            <span className="label">Account</span>
          </div>
        </button>
        <button className={`mobile-bottom-nav__item${navActive(['/cart']) ? ' mobile-bottom-nav__item--active' : ''}`} onClick={() => navigate("/cart")} aria-label="Cart">
          <div className="header__icon-wrap">
            <img src="/icons/bag.png" alt="Cart" style={{ width: '26px', height: '26px' }} />
            <span className="label">Cart</span>
            {cartCount > 0 && <span className="count-badge">{cartCount}</span>}
          </div>
        </button>
      </nav>

      {/* ── MOBILE CATEGORY DRAWER ── */}
      <div className={`mobile-cat-drawer${mobileCatOpen ? ' mobile-cat-drawer--open' : ''}`} onClick={() => setMobileCatOpen(false)} aria-hidden={!mobileCatOpen}>
        <div className="mobile-cat-drawer__panel" onClick={e => e.stopPropagation()}>
          <div className="mobile-cat-drawer__header">
            <span className="mobile-cat-drawer__title">Shop by Category</span>
            <button className="mobile-cat-drawer__close" onClick={() => setMobileCatOpen(false)} aria-label="Close">
              <IconClose />
            </button>
          </div>
          <div className="mobile-cat-drawer__grid">
            {MOBILE_CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={cat.path}
                className="mobile-cat-drawer__card"
                onClick={() => setMobileCatOpen(false)}
              >
                <div className="mobile-cat-drawer__card-img">
                  <img src={cat.icon} alt={cat.label} loading="lazy" />
                </div>
                <span className="mobile-cat-drawer__card-name">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
