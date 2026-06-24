import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiPackage, FiSliders, FiTag, FiGift, FiStar, FiTrendingUp, FiSunrise, FiShoppingBag } from 'react-icons/fi';
import ProductGrid from '../components/Products/ProductGrid';
import FilterSidebar, { EMPTY_FILTERS, applyFilters } from '../components/Filters/FilterSidebar';
import { FLAG_COLLECTIONS, slugToFlag, slugToLabel } from '../utils/filterConstants';
import api from '../services/api';
import './CollectionPage.scss';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
];

// Metadata for material/stone browsing pages (/collection/all?metal=gold etc.)
const MATERIAL_META = {
  gold:     { label: 'Gold Jewellery',      description: '' },
  'white gold': { label: 'White Gold Jewellery', description: '' },
  'rose gold':  { label: 'Rose Gold Jewellery',  description: '' },
  diamond:  { label: 'Diamond Jewellery',   description: '' },
  pearl:    { label: 'Pearl Jewellery',     description: '' },
  silver:   { label: 'Silver Jewellery',    description: '' },
  emerald:  { label: 'Emerald Jewellery',   description: '' },
  ruby:     { label: 'Ruby Jewellery',      description: '' },
  sapphire: { label: 'Sapphire Jewellery',  description: '' },
  platinum: { label: 'Platinum Jewellery',  description: '' },
};

const COLLECTION_META = {
  'today-deals':  { icon: FiTag,       description: 'Shop today\'s exclusive deals — hand-picked discounts updated daily.' },
  'gifting':      { icon: FiGift,      description: 'Curated jewellery pieces that make perfect gifts for every occasion.' },
  'new-arrivals': { icon: FiSunrise,   description: 'Fresh designs just landed — be the first to own the latest styles.' },
  'best-seller':  { icon: FiStar,      description: 'Our most-loved pieces, chosen by thousands of happy customers.' },
  'trending':     { icon: FiTrendingUp, description: 'What everyone is wearing right now — stay ahead of the trend.' },
};

export default function CollectionPage() {
  const { slug }          = useParams();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();

  // Material browsing: /collection/all?metal=gold or ?stone=diamond
  const isAllCollection = slug === 'all';
  const metalParam = searchParams.get('metal')?.toLowerCase() || null;
  const stoneParam = searchParams.get('stone')?.toLowerCase() || null;
  const materialKey = metalParam || stoneParam || null;
  const materialMeta = materialKey ? (MATERIAL_META[materialKey] ?? null) : null;

  // Flag-based collection (today-deals, gifting, etc.)
  const flagName  = isAllCollection ? null : slugToFlag(slug);
  const pageLabel = isAllCollection
    ? (materialMeta?.label ?? (materialKey ? `${materialKey.charAt(0).toUpperCase()}${materialKey.slice(1)} Jewellery` : 'All Products'))
    : (slugToLabel(slug) ?? slug);
  const meta      = isAllCollection ? {} : (COLLECTION_META[slug] || {});
  const IconComp  = meta.icon || FiShoppingBag;

  const PAGE_SIZE = 24;
  const [baseProducts,     setBaseProducts]    = useState([]);
  const [sidebarFilters,   setSidebarFilters]  = useState(EMPTY_FILTERS);
  const [loading,          setLoading]         = useState(false);
  const [sort,             setSort]            = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleCount,     setVisibleCount]    = useState(PAGE_SIZE);

  const isValidSlug = isAllCollection ? Boolean(materialKey) : Boolean(flagName);

  useEffect(() => {
    if (!isValidSlug) { setLoading(false); return; }

    const controller = new AbortController();
    document.title = `${pageLabel} | Jawhara Jewellery`;
    setLoading(true);

    let apiUrl;
    if (isAllCollection && materialKey) {
      const qs = new URLSearchParams({ limit: 300 });
      if (metalParam) qs.set('metal', metalParam);
      if (stoneParam) qs.set('stone', stoneParam);
      apiUrl = `/products?${qs}`;
    } else {
      apiUrl = `/products?flag=${encodeURIComponent(flagName)}&limit=300`;
    }

    api.get(apiUrl, { signal: controller.signal })
      .then(({ data }) => setBaseProducts(data.data || []))
      .catch((err) => { if (err.code !== 'ERR_CANCELED') setBaseProducts([]); })
      .finally(() => setLoading(false));

    return () => { controller.abort(); document.title = 'Jawhara Jewellery'; };
  }, [slug, metalParam, stoneParam, isAllCollection, flagName, materialKey, pageLabel, isValidSlug]);

  useEffect(() => {
    setSidebarFilters(EMPTY_FILTERS);
    setSort('default');
  }, [slug, metalParam, stoneParam]);

  const displayProducts = useMemo(() => {
    let result = applyFilters(baseProducts || [], sidebarFilters || EMPTY_FILTERS);

    if      (sort === 'price-asc')  result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sort === 'rating')     result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest')     result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [baseProducts, sidebarFilters, sort]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [displayProducts]);

  const loadMore = useCallback(() => setVisibleCount(c => c + PAGE_SIZE), []);
  const visibleProducts = displayProducts.slice(0, visibleCount);

  if (!isValidSlug) {
    return (
      <main className="collection-page collection-page--not-found">
        <div className="container">
          <FiPackage className="collection-page__empty-icon" />
          <h2>Collection not found</h2>
          <p>This collection page doesn't exist.</p>
          <div className="collection-page__not-found-links">
            <p>Available collections:</p>
            <ul>
              {FLAG_COLLECTIONS.map(c => (
                <li key={c.slug}>
                  <Link to={`/collection/${c.slug}`}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <button className="collection-page__empty-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="collection-page">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="collection-page__hero">
        <div className="container">
          {isAllCollection ? (
            // Material pages (Gold, Diamond, Pearl…) — flat, like category header
            <>
              <h1 className="collection-page__title">{pageLabel}</h1>
              {materialMeta?.description && (
                <p className="collection-page__subtitle">{materialMeta.description}</p>
              )}
              <p className="collection-page__count">
                {loading ? 'Loading…' : `${displayProducts.length} product${displayProducts.length !== 1 ? 's' : ''} found`}
              </p>
            </>
          ) : (
            // Flag pages (Today's Deals, Gifting…) — icon on the left
            <div className="collection-page__hero-inner">
              <span className="collection-page__hero-icon">
                <IconComp />
              </span>
              <div>
                <h1 className="collection-page__title">{pageLabel}</h1>
                {meta.description && (
                  <p className="collection-page__subtitle">{meta.description}</p>
                )}
                <p className="collection-page__count">
                  {loading ? 'Loading…' : `${displayProducts.length} product${displayProducts.length !== 1 ? 's' : ''} found`}
                </p>
              </div>
            </div>
          )}
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
                <label htmlFor="collection-sort">Sort by:</label>
                <select
                  id="collection-sort"
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
                <h3>No products in this collection yet</h3>
                <p>Check back soon, or browse all products.</p>
                <button
                  className="collection-page__empty-btn"
                  onClick={() => navigate('/category/all')}
                >
                  Browse All Products
                </button>
              </div>
            ) : (
              <>
                <ProductGrid products={visibleProducts} loading={loading && baseProducts.length === 0} cols={4} />
                {!loading && visibleCount < displayProducts.length && (
                  <div className="collection-page__load-more">
                    <button className="collection-page__load-more-btn" onClick={loadMore}>
                      Load More ({displayProducts.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
