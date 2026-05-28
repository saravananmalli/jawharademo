import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiPackage, FiSliders } from 'react-icons/fi';
import ProductGrid from '../components/Products/ProductGrid';
import FilterSidebar, { EMPTY_FILTERS, applyFilters } from '../components/Filters/FilterSidebar';
import api from '../services/api';
import './Category.scss';
import './SearchResults.scss';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
];

export default function SearchResults() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const query           = searchParams.get('q') || '';

  const [baseProducts,     setBaseProducts]     = useState([]);
  const [sidebarFilters,   setSidebarFilters]   = useState(EMPTY_FILTERS);
  const [loading,          setLoading]          = useState(true);
  const [sort,             setSort]             = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSidebarFilters(EMPTY_FILTERS);
    setSort('default');
    if (!query) { setBaseProducts([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/products?q=${encodeURIComponent(query)}&limit=200`)
      .then(({ data }) => setBaseProducts(data.data || []))
      .catch(() => setBaseProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  const displayProducts = useMemo(() => {
    let result = applyFilters(baseProducts, sidebarFilters);
    if      (sort === 'price-asc')  result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sort === 'rating')     result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest')     result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [baseProducts, sidebarFilters, sort]);

  return (
    <main className="category-page">

      {/* ── Page header ── */}
      <div className="category-page__header">
        <div className="container">
          <h1 className="category-page__title search-results-page__title">
            {query ? <>Results for <em>&ldquo;{query}&rdquo;</em></> : 'Search Products'}
          </h1>
          <p className="category-page__count">
            {loading ? 'Loading…' : `${displayProducts.length} product${displayProducts.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      {/* ── Sidebar + main content ── */}
      <div className="container">
        <div className="category-page__body">

          <FilterSidebar
            allProducts={baseProducts}
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            isMobileOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />

          <div className="category-page__main">

            {/* Toolbar */}
            <div className="category-page__toolbar">
              <button
                className="category-page__filter-btn"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
              >
                <FiSliders />
                Filters
              </button>

              <div className="category-page__sort">
                <label htmlFor="sr-sort-select">Sort by:</label>
                <select
                  id="sr-sort-select"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid or empty state */}
            {!loading && displayProducts.length === 0 ? (
              <div className="category-page__empty">
                <FiPackage className="category-page__empty-icon" />
                <h3>No products found</h3>
                <p>
                  {query
                    ? `No results for "${query}". Try a different search term or browse all products.`
                    : 'Try searching for a product above.'}
                </p>
                <button
                  className="category-page__empty-btn"
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
