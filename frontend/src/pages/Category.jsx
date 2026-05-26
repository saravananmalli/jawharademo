import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiPackage, FiSliders } from 'react-icons/fi';
import ProductGrid from '../components/Products/ProductGrid';
import FilterSidebar, { EMPTY_FILTERS, applyFilters } from '../components/Filters/FilterSidebar';
import api from '../services/api';
import './Category.scss';

// ── Category tab definitions ──────────────────────────────────────────────────

const CATEGORY_TABS = [
  { slug: 'all',       label: 'All Products' },
  { slug: 'rings',     label: 'Rings' },
  { slug: 'earrings',  label: 'Earrings' },
  { slug: 'necklaces', label: 'Necklaces & Pendants' },
  { slug: 'pendants',  label: 'Pendants' },
  { slug: 'bracelets', label: 'Bracelets' },
  { slug: 'gold',      label: 'Gold' },
  { slug: 'diamond',   label: 'Diamond' },
  { slug: 'pearl',     label: 'Pearl' },
  { slug: 'silver',    label: 'Silver' },
  { slug: 'wedding',   label: 'Wedding' },
];

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAed(str) {
  const s = (str || '').trim().toUpperCase().replace(/,/g, '');
  const n = s.endsWith('K') ? parseFloat(s) * 1000 : parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Extract minPrice / maxPrice from a filter string like "Under AED 1,000" or "AED 1,000 – AED 2,500".
// Returns an object with optional minPrice / maxPrice keys to append to the backend query.
function buildPriceParams(filter) {
  const f = (filter || '').trim();
  const underM = f.match(/^Under AED\s+([\d.,]+[Kk]?)$/i);
  if (underM) return { maxPrice: parseAed(underM[1]) };
  const aboveM = f.match(/^Above AED\s+([\d.,]+[Kk]?)$/i);
  if (aboveM) return { minPrice: parseAed(aboveM[1]) };
  const rangeM = f.match(/^AED\s+([\d.,]+[Kk]?)\s*[–\-]\s*(?:AED\s+)?([\d.,]+[Kk]?)$/i);
  if (rangeM) return { minPrice: parseAed(rangeM[1]), maxPrice: parseAed(rangeM[2]) };
  return {};
}

// Material slugs that represent metal/stone, not a product category.
// For these, the backend must receive ?metal= or ?stone= instead of ?category=.
const MATERIAL_SLUG_PARAMS = {
  gold:    { metal: 'gold' },
  diamond: { stone: 'diamond' },
  pearl:   { stone: 'pearl' },
  silver:  { metal: 'silver' },
};

const CATEGORY_WORDS = new Set([
  'rings', 'ring', 'earrings', 'earring',
  'necklaces', 'necklace', 'bracelets', 'bracelet',
]);

function matchesFilter(product, filter) {
  if (!filter || filter.toLowerCase() === 'new') return true;

  const f = filter.trim();

  const effectivePrice = product.salePrice ?? product.price;

  const underM = f.match(/^Under AED\s+([\d.,]+[Kk]?)$/i);
  if (underM) return effectivePrice < parseAed(underM[1]);

  const aboveM = f.match(/^Above AED\s+([\d.,]+[Kk]?)$/i);
  if (aboveM) return effectivePrice > parseAed(aboveM[1]);

  const rangeM = f.match(/^AED\s+([\d.,]+[Kk]?)\s*[–\-]\s*(?:AED\s+)?([\d.,]+[Kk]?)$/i);
  if (rangeM) {
    const min = parseAed(rangeM[1]);
    const max = parseAed(rangeM[2]);
    return effectivePrice >= min && effectivePrice <= max;
  }

  const metal    = (product.metal   || '').toLowerCase();
  const metalKt  = (product.metalKt || '').toLowerCase();
  const metalsArr = (product.metals || []).map(m => m.toLowerCase());

  if (/^gold\s+18k$/i.test(f))   return (metal === 'gold' || metalsArr.some(m => m.includes('gold'))) && metalKt === '18k';
  if (/^gold\s+22k$/i.test(f))   return (metal === 'gold' || metalsArr.some(m => m.includes('gold'))) && metalKt === '22k';
  if (/^white\s+gold$/i.test(f)) return metal === 'white gold' || metalsArr.some(m => m === 'white gold');
  if (/^rose\s+gold$/i.test(f))  return metal === 'rose gold'  || metalsArr.some(m => m === 'rose gold');
  if (/^silver$/i.test(f))       return metal === 'silver'     || metalsArr.some(m => m === 'silver');
  if (/^gold$/i.test(f))         return metal.includes('gold') || metalsArr.some(m => m.includes('gold'));

  const stone     = (product.stone  || '').toLowerCase();
  const stonesArr = (product.stones || []).map(s => s.toLowerCase());

  if (/^diamond$/i.test(f))  return stone.includes('diamond')  || stonesArr.some(s => s.includes('diamond'));
  if (/^pearl$/i.test(f))    return stone === 'pearl'           || stonesArr.some(s => s === 'pearl');
  if (/^emerald$/i.test(f))  return stone === 'emerald'         || stonesArr.some(s => s === 'emerald');
  if (/^ruby$/i.test(f))     return stone.includes('ruby')      || stonesArr.some(s => s.includes('ruby'));
  if (/^sapphire$/i.test(f)) return stone === 'sapphire'        || stonesArr.some(s => s === 'sapphire');

  const productText = [
    product.name,
    product.subcategory,
    product.metal,
    product.stone,
    product.collection,
    ...(product.tags     || []),
    ...(product.featured || []),
    ...(product.styles   || []),
    ...(product.metals   || []),
    ...(product.stones   || []),
  ].join(' ').toLowerCase();

  const keyWords = f.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1 && !CATEGORY_WORDS.has(w));

  if (keyWords.length === 0) return true;

  return keyWords.every(w =>
    productText.includes(w) ||
    (w.endsWith('s') && productText.includes(w.slice(0, -1)))
  );
}

function matchesSlug(product, slug) {
  if (!slug || slug === 'all') return true;

  const s       = slug.toLowerCase();
  const cat     = (product.category || '').toLowerCase();
  const metal   = (product.metal    || '').toLowerCase();
  const stone   = (product.stone    || '').toLowerCase();
  const tags    = (product.tags     || []).map(t => t.toLowerCase());
  const metalsArr = (product.metals || []).map(m => m.toLowerCase());
  const stonesArr = (product.stones || []).map(s => s.toLowerCase());

  switch (s) {
    case 'rings':     return cat === 'rings';
    case 'earrings':  return cat === 'earrings';
    case 'necklaces': return cat.includes('necklace') || cat.includes('pendant');
    case 'pendants':  return cat.includes('pendant');
    case 'bracelets': return cat.includes('bracelet') || cat.includes('bangle');
    case 'gold':      return metal.includes('gold')      || metalsArr.some(m => m.includes('gold'));
    case 'diamond':   return stone.includes('diamond')   || stonesArr.some(s => s.includes('diamond'));
    case 'pearl':     return stone === 'pearl'            || stonesArr.some(s => s === 'pearl');
    case 'silver':    return metal === 'silver'           || metalsArr.some(m => m === 'silver');
    case 'wedding':   return tags.includes('wedding');
    case 'kids':      return tags.includes('kids');
    default:          return cat.includes(s.replace(/-/g, ' '));
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Category() {
  const { slug }       = useParams();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const [baseProducts,    setBaseProducts]    = useState([]);
  const [sidebarFilters,  setSidebarFilters]  = useState(EMPTY_FILTERS);
  const [loading,         setLoading]         = useState(true);
  const [sort,            setSort]            = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeSlug = slug || 'all';
  const filter     = searchParams.get('filter') || '';
  const priceMin   = searchParams.get('priceMin');
  const priceMax   = searchParams.get('priceMax');

  const activeTab = CATEGORY_TABS.find(t => t.slug === activeSlug);
  const pageTitle = filter && filter.toLowerCase() !== 'new'
    ? filter
    : (activeTab?.label ?? activeSlug.charAt(0).toUpperCase() + activeSlug.slice(1).replace(/-/g, ' '));

  // Load base products by slug + URL ?filter= param
  useEffect(() => {
    setLoading(true);

    // Prefer direct ?priceMin/priceMax URL params (from mega menu); fall back to
    // parsing the legacy ?filter= string for backward-compat with old bookmarks.
    const priceP = (priceMin || priceMax)
      ? { minPrice: priceMin ? Number(priceMin) : undefined, maxPrice: priceMax ? Number(priceMax) : undefined }
      : buildPriceParams(filter);

    // Necklaces page merges two separate backend categories
    if (activeSlug === 'necklaces') {
      const qs = new URLSearchParams({ limit: 200 });
      if (priceP.minPrice != null) qs.set('minPrice', priceP.minPrice);
      if (priceP.maxPrice != null) qs.set('maxPrice', priceP.maxPrice);
      Promise.all([
        api.get(`/products?category=Necklace&${qs}`),
        api.get(`/products?category=Pendant&${qs}`),
      ])
        .then(([neckRes, pendRes]) => {
          // Deduplicate by _id — a product whose category matches both regexes
          // (e.g. "Necklaces & Pendants") would otherwise appear twice.
          const seen = new Set();
          const all = [...(neckRes.data.data || []), ...(pendRes.data.data || [])]
            .filter(p => {
              if (seen.has(String(p._id))) return false;
              seen.add(String(p._id));
              return matchesSlug(p, 'necklaces') && matchesFilter(p, filter);
            });
          setBaseProducts(all);
        })
        .catch(() => setBaseProducts([]))
        .finally(() => setLoading(false));
      return;
    }

    // Pendants page: use singular "Pendant" so the backend regex /Pendant/i
    // matches both "Pendant" and "Pendants" stored in the DB.
    if (activeSlug === 'pendants') {
      const qs = new URLSearchParams({ category: 'Pendant', limit: 200 });
      if (priceP.minPrice != null) qs.set('minPrice', priceP.minPrice);
      if (priceP.maxPrice != null) qs.set('maxPrice', priceP.maxPrice);
      api.get(`/products?${qs}`)
        .then(({ data }) => {
          setBaseProducts(
            (data.data || []).filter(p => matchesSlug(p, 'pendants') && matchesFilter(p, filter))
          );
        })
        .catch(() => setBaseProducts([]))
        .finally(() => setLoading(false));
      return;
    }

    const params = new URLSearchParams({ limit: 200 });
    const materialParams = MATERIAL_SLUG_PARAMS[activeSlug];
    if (materialParams) {
      // gold/diamond/pearl/silver are metal or stone attributes, not categories.
      // Use the correct API param so the backend regex hits the right field.
      Object.entries(materialParams).forEach(([k, v]) => params.set(k, v));
    } else if (activeSlug && activeSlug !== 'all') {
      params.set('category', activeSlug);
    }
    if (priceP.minPrice != null) params.set('minPrice', priceP.minPrice);
    if (priceP.maxPrice != null) params.set('maxPrice', priceP.maxPrice);
    api.get(`/products?${params}`)
      .then(({ data }) => {
        const all = (data.data || []).filter(p => matchesSlug(p, activeSlug) && matchesFilter(p, filter));
        setBaseProducts(all);
      })
      .catch(() => setBaseProducts([]))
      .finally(() => setLoading(false));
  }, [activeSlug, filter, priceMin, priceMax]);

  // Reset sidebar filters and sort when the category/URL filter changes
  useEffect(() => {
    setSidebarFilters(EMPTY_FILTERS);
    setSort('default');
  }, [activeSlug, filter, priceMin, priceMax]);

  // Final display products: sidebar filters → sort
  const displayProducts = useMemo(() => {
    let result = applyFilters(baseProducts || [], sidebarFilters || EMPTY_FILTERS);

    if      (sort === 'price-asc')  result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    else if (sort === 'rating')     result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest')     result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (filter?.toLowerCase() === 'new') {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [baseProducts, sidebarFilters, sort, filter]);

  return (
    <main className="category-page">

      

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="category-page__header">
        <div className="container">
          <h1 className="category-page__title">{pageTitle}</h1>
          <p className="category-page__count">
            {loading
              ? 'Loading…'
              : `${displayProducts.length} product${displayProducts.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      {/* ── Necklaces / Pendants sub-type tabs ───────────────────── */}
      {(activeSlug === 'necklaces' || activeSlug === 'pendants') && (
        <div className="category-subtabs-bar">
          <div className="container">
            <div className="category-subtabs">
              <Link
                to="/category/necklaces"
                className={`category-subtab${activeSlug === 'necklaces' ? ' category-subtab--active' : ''}`}
              >
                All Necklaces & Pendants
              </Link>
              <Link
                to="/category/pendants"
                className={`category-subtab${activeSlug === 'pendants' ? ' category-subtab--active' : ''}`}
              >
                Pendants Only
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Category tab strip ────────────────────────────────────── */}
      {/* <div className="category-tabs-bar">
        <div className="container">
          <div className="category-tabs" role="tablist" aria-label="Browse by category">
            {CATEGORY_TABS.map(tab => (
              <Link
                key={tab.slug}
                to={`/category/${tab.slug}`}
                role="tab"
                aria-selected={tab.slug === activeSlug}
                className={`category-tab${tab.slug === activeSlug ? ' category-tab--active' : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div> */}

      {/* ── Sidebar + main content ────────────────────────────────── */}
      <div className="container">
        <div className="category-page__body">

          {/* Filter sidebar — desktop always visible, mobile as drawer */}
          <FilterSidebar
            allProducts={baseProducts}
            filters={sidebarFilters}
            onFiltersChange={setSidebarFilters}
            isMobileOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />

          {/* Main area */}
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
                <label htmlFor="sort-select">Sort by:</label>
                <select
                  id="sort-select"
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
              <div className="category-page__empty">
                <FiPackage className="category-page__empty-icon" />
                <h3>No products found</h3>
                <p>Try adjusting your filters or browse another category.</p>
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
