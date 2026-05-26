import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiSliders, FiTag } from 'react-icons/fi';
import ProductGrid from '../components/Products/ProductGrid';
import FilterSidebar, { EMPTY_FILTERS, applyFilters } from '../components/Filters/FilterSidebar';
import { cachedGet } from '../services/api';
import './CollectionPage.scss';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
];

export default function OfferPage() {
  const navigate = useNavigate();

  const [offer,           setOffer]           = useState(null);
  const [baseProducts,    setBaseProducts]    = useState([]);
  const [sidebarFilters,  setSidebarFilters]  = useState(EMPTY_FILTERS);
  const [loading,         setLoading]         = useState(true);
  const [sort,            setSort]            = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    cachedGet('/offers/active', { ttl: 60_000 })
      .then(({ data }) => {
        const o = data.data;
        if (!o) { setLoading(false); return; }
        setOffer(o);
        setBaseProducts(o.products || []);
        document.title = `${o.title} | Jawhara Jewelry`;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { document.title = 'Jawhara Jewelry'; };
  }, []);

  const displayProducts = useMemo(() => {
    let result = applyFilters(baseProducts || [], sidebarFilters || EMPTY_FILTERS);
    if      (sort === 'price-asc')  result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sort === 'rating')     result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest')     result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [baseProducts, sidebarFilters, sort]);

  // No active offer
  if (!loading && !offer) {
    return (
      <main className="collection-page collection-page--not-found">
        <div className="container">
          <FiPackage className="collection-page__empty-icon" />
          <h2>No active offer right now</h2>
          <p>Check back soon for our next limited-time promotion.</p>
          <button className="collection-page__empty-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const pageTitle = offer?.title || 'Limited-Time Jewellery Offers';
  const subtitle  = offer?.subtitle || '';

  return (
    <main className="collection-page">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="collection-page__hero" style={{ '--accent': '#967123' }}>
        <div className="container collection-page__hero-inner">
          <span className="collection-page__hero-icon">
            <FiTag />
          </span>
          <div>
            <h1 className="collection-page__title">{pageTitle}</h1>
            {subtitle && (
              <p className="collection-page__subtitle">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Product count ─────────────────────────────────────────── */}
      <div className="collection-page__subheader">
        <div className="container">
          <p className="collection-page__count">
            {loading
              ? 'Loading products…'
              : `${displayProducts.length} product${displayProducts.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      {/* ── Sidebar + Products ────────────────────────────────────── */}
      <div className="container">
        <div className="collection-page__body">

          <FilterSidebar
            allProducts={baseProducts}
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            isMobileOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />

          <div className="collection-page__main">

            {/* Toolbar */}
            <div className="collection-page__toolbar">
              <button
                className="collection-page__filter-btn"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FiSliders />
                Filters
              </button>

              <div className="collection-page__sort">
                <label htmlFor="offer-sort">Sort by:</label>
                <select
                  id="offer-sort"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product grid or empty state */}
            {!loading && displayProducts.length === 0 ? (
              <div className="collection-page__empty">
                <FiPackage className="collection-page__empty-icon" />
                <h3>No products match your filters</h3>
                <p>Try clearing some filters to see more items.</p>
                <button
                  className="collection-page__empty-btn"
                  onClick={() => setSidebarFilters(EMPTY_FILTERS)}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <ProductGrid products={displayProducts} loading={loading} cols={4} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
