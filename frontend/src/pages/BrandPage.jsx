import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPackage, FiSliders } from 'react-icons/fi';
import ProductGrid from '../components/Products/ProductGrid';
import FilterSidebar, { EMPTY_FILTERS, applyFilters } from '../components/Filters/FilterSidebar';
import api from '../services/api';
import './BrandPage.scss';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
];

export default function BrandPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();

  const [brand,           setBrand]           = useState(null);
  const [baseProducts,    setBaseProducts]    = useState([]);
  const [sidebarFilters,  setSidebarFilters]  = useState(EMPTY_FILTERS);
  const [loading,         setLoading]         = useState(true);
  const [brandLoading,    setBrandLoading]    = useState(true);
  const [notFound,        setNotFound]        = useState(false);
  const [sort,            setSort]            = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch brand metadata
  useEffect(() => {
    setBrandLoading(true);
    setNotFound(false);
    api.get(`/brands/${slug}`)
      .then(({ data }) => {
        setBrand(data.data);
        document.title = data.data.seoTitle || `${data.data.name} | Jawhara Jewelry`;
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setBrandLoading(false));

    return () => { document.title = 'Jawhara Jewelry'; };
  }, [slug]);

  // Fetch brand products
  useEffect(() => {
    setLoading(true);
    api.get(`/brands/${slug}/products?limit=200`)
      .then(({ data }) => setBaseProducts(data.data || []))
      .catch(() => setBaseProducts([]))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reset filters on slug change
  useEffect(() => {
    setSidebarFilters(EMPTY_FILTERS);
    setSort('default');
  }, [slug]);

  const displayProducts = useMemo(() => {
    let result = applyFilters(baseProducts || [], sidebarFilters || EMPTY_FILTERS);

    if      (sort === 'price-asc')  result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sort === 'rating')     result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest')     result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [baseProducts, sidebarFilters, sort]);

  if (notFound) {
    return (
      <main className="brand-page brand-page--not-found">
        <div className="container">
          <FiPackage className="brand-page__empty-icon" />
          <h2>Brand not found</h2>
          <p>The brand you're looking for doesn't exist or has been removed.</p>
          <button className="brand-page__empty-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="brand-page">

      {/* ── Brand Banner ───────────────────────────────────────────── */}
      {!brandLoading && brand?.banner && (
        <div
          className="brand-page__banner"
          style={{ backgroundImage: `url(${brand.banner})` }}
          aria-label={`${brand.name} banner`}
        />
      )}

      {/* ── Brand Hero ─────────────────────────────────────────────── */}
      <div className="brand-page__hero">
        <div className="container brand-page__hero-inner">
          {brand?.logo && (
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="brand-page__logo"
            />
          )}
          <div className="brand-page__hero-text">
            {brandLoading
              ? <div className="brand-page__skeleton brand-page__skeleton--title" />
              : <h1 className="brand-page__name">{brand?.name}</h1>
            }
            {brand?.description && (
              <p className="brand-page__description">{brand.description}</p>
            )}
            <p className="brand-page__count">
              {loading
                ? 'Loading products…'
                : `${displayProducts.length} product${displayProducts.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sidebar + Products ──────────────────────────────────────── */}
      <div className="container">
        <div className="brand-page__body">

          <FilterSidebar
            allProducts={baseProducts}
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            isMobileOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />

          <div className="brand-page__main">

            {/* Toolbar */}
            <div className="brand-page__toolbar">
              <button
                className="brand-page__filter-btn"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FiSliders />
                Filters
              </button>

              <div className="brand-page__sort">
                <label htmlFor="brand-sort-select">Sort by:</label>
                <select
                  id="brand-sort-select"
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
              <div className="brand-page__empty">
                <FiPackage className="brand-page__empty-icon" />
                <h3>No products found</h3>
                <p>Try adjusting your filters or browse all products.</p>
                <button
                  className="brand-page__empty-btn"
                  onClick={() => navigate('/category/all')}
                >
                  Browse All Products
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
