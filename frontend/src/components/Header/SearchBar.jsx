import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { formatPrice } from '../../utils/formatPrice';
import './SearchBar.scss';

const TRENDING_CATEGORIES = [
  { id: 'related',      label: 'Related',       flag: null,           sort: 'newest' },
  { id: 'latest',       label: 'Latest Design', flag: null,           sort: 'newest' },
  { id: 'bestsellers',  label: 'Best Seller',   flag: 'Best Seller',  sort: 'rating' },
  { id: 'trending',     label: 'Trending',      flag: 'Trending',     sort: 'newest' },
  { id: 'new-arrivals', label: 'New Arrivals',  flag: 'New Arrivals', sort: 'newest' },
];

const PLACEHOLDER_KEYWORDS = [
  'Ring', 'Pendant', 'Necklace', 'Bracelet', 'Earrings',
  'Diamond Ring', 'Gold Necklace', 'Wedding Ring', 'Kids Jewellery',
];

// Build left-side text suggestions from the query + product results
function buildSearchSuggestions(query, results) {
  const q = query.trim();
  const ql = q.toLowerCase();
  const seen = new Set();
  const out = [];

  const add = (text) => {
    const tl = text.toLowerCase().trim();
    if (tl && !seen.has(tl) && out.length < 6) { seen.add(tl); out.push(text.trim()); }
  };

  add(q);                                                          // exact query
  [...new Set(results.map(r => r.category).filter(Boolean))]      // category names from results
    .forEach(c => add(c));
  if (!ql.endsWith('s')) add(q + 's');                            // plural variant
  else if (ql.length > 2) add(q.slice(0, -1));                    // singular variant
  ['Diamond', 'Gold', 'White Gold', 'Rose Gold', 'Pearl'].forEach(m => {
    if (!ql.includes(m.toLowerCase())) add(`${m} ${q}`);          // material combos
  });

  return out;
}

function HighlightMatch({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      <span className="search-overlay__suggestion-suffix">{text.slice(idx + query.length)}</span>
    </>
  );
}

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconClose = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function ProductRow({ product, isActive, query, onSelect, onEnter, onLeave }) {
  return (
    <div
      className={`search-overlay__suggestion${isActive ? ' active' : ''}`}
      role="option"
      aria-selected={isActive}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={(e) => { e.preventDefault(); onSelect(product); }}
    >
      <div className="search-overlay__suggestion-img">
        <img
          src={getImageUrl(product.images?.[0]) || ''}
          alt={product.name}
          onError={(e) => { e.currentTarget.src = '/icons/search.png'; }}
        />
      </div>
      <div className="search-overlay__suggestion-info">
        <span className="search-overlay__suggestion-name">
          <HighlightMatch text={product.name} query={query} />
        </span>
        <span className="search-overlay__suggestion-meta">
          <span className="search-overlay__suggestion-category">{product.category}</span>
          <span className="search-overlay__suggestion-dot">·</span>
          <span className="search-overlay__suggestion-price">AED {formatPrice(product.price)}</span>
          {(product.deliveryDate || product.arrivesBy) && (
            <>
              <span className="search-overlay__suggestion-dot">·</span>
              <span className="search-overlay__suggestion-delivery">
                {product.arrivesBy || product.deliveryDate}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('related');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [trendingCache, setTrendingCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const [phAnim, setPhAnim] = useState('idle');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const hasQuery = query.trim().length >= 1;

  const fetchTrending = useCallback(async (catId) => {
    const cat = TRENDING_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    const params = { limit: 5, sort: cat.sort };
    if (cat.flag) params.flag = cat.flag;
    try {
      const { data } = await api.get('/products/search', { params });
      setTrendingCache(prev => ({ ...prev, [catId]: data.data || [] }));
    } catch {
      setTrendingCache(prev => ({ ...prev, [catId]: [] }));
    }
  }, []);

  const fetchSearch = useCallback((q) => {
    if (!q.trim()) { setSearchResults([]); setLoading(false); return; }
    setLoading(true);
    api.get('/products/search', { params: { q: q.trim(), limit: 5 } })
      .then(({ data }) => setSearchResults(data.data || []))
      .catch(() => setSearchResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open && !trendingCache[activeCategory]) fetchTrending(activeCategory);
  }, [open, activeCategory, trendingCache, fetchTrending]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (hasQuery) {
      debounceRef.current = setTimeout(() => fetchSearch(query), 300);
    } else {
      setSearchResults([]);
      setLoading(false);
    }
    return () => clearTimeout(debounceRef.current);
  }, [query, hasQuery, fetchSearch]);

  const trendingProducts = trendingCache[activeCategory] || [];

  const openOverlay = () => {
    setOpen(true);
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const closeOverlay = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery('');
    setSearchResults([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeOverlay(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeOverlay]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (open) return;
    let exitTimer, idleTimer;
    const id = setInterval(() => {
      setPhAnim('exit');
      exitTimer = setTimeout(() => {
        setPhIdx(i => (i + 1) % PLACEHOLDER_KEYWORDS.length);
        setPhAnim('enter');
        idleTimer = setTimeout(() => setPhAnim('idle'), 750);
      }, 620);
    }, 3200);
    return () => { clearInterval(id); clearTimeout(exitTimer); clearTimeout(idleTimer); };
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (hasQuery && activeIndex >= 0 && searchResults[activeIndex]) {
        handleSelect(searchResults[activeIndex]);
      } else {
        handleSearch();
      }
    }
  };

  const handleSelect = (product) => {
    closeOverlay();
    navigate(`/product/${product._id}`);
  };

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    closeOverlay();
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    setActiveIndex(-1);
    if (!trendingCache[catId]) fetchTrending(catId);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* ── Header trigger (desktop) ── */}
      <div className="search-bar">
        <div className="search-bar__form" role="button" tabIndex={0} onClick={openOverlay} onKeyDown={(e) => e.key === 'Enter' && openOverlay()}>
          <div className="search-bar__input-area">
            <input
              className="search-bar__input"
              type="text"
              placeholder=""
              value={query}
              readOnly
              onFocus={openOverlay}
              aria-label="Open search"
            />
            {!query && (
              <div className="search-bar__anim-ph" aria-hidden="true">
                <span className="search-bar__anim-prefix">Search for </span>
                <span className={`search-bar__anim-kw search-bar__anim-kw--${phAnim}`}>
                  &ldquo;{PLACEHOLDER_KEYWORDS[phIdx]}&rdquo;
                </span>
              </div>
            )}
          </div>
          <button
            className="search-bar__btn"
            onClick={(e) => { e.stopPropagation(); openOverlay(); }}
            aria-label="Search"
            tabIndex={-1}
          >
            <img src="/icons/search.png" alt="search" />
          </button>
        </div>
      </div>

      {/* ── Full-width search overlay ── */}
      {open && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
          <div className="search-overlay__backdrop" onClick={closeOverlay} aria-hidden="true" />

          <div className="search-overlay__panel">
            {/* Input row */}
            <div className="search-overlay__input-row">
              <div className="search-overlay__input-wrap">
                <span className="search-overlay__input-icon"><IconSearch /></span>
                <input
                  ref={inputRef}
                  className="search-overlay__input"
                  type="text"
                  placeholder="Search jewellery..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
                  onKeyDown={handleKeyDown}
                  aria-label="Search jewellery"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button className="search-overlay__clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear">
                    <IconClose size={15} />
                  </button>
                )}
              </div>

              <button className="search-overlay__search-btn" onClick={() => handleSearch()} aria-label="Search">
                <img src="/icons/search.png" alt="search" />
              </button>

              <button className="search-overlay__close" onClick={closeOverlay} aria-label="Close search">
                <IconClose size={22} />
              </button>
            </div>

            {/* ── Content area ── */}
            <div className="search-overlay__content">

              {hasQuery ? (
                /* ── QUERY STATE: suggestions left + products right ── */
                <>
                  {/* Left – text keyword suggestions */}
                  <div className="search-overlay__results-left">
                    <p className="search-overlay__col-label">Suggestions</p>
                    {buildSearchSuggestions(query, searchResults).map((sugg, i) => (
                      <button
                        key={i}
                        className="search-overlay__text-sugg"
                        onMouseDown={(e) => { e.preventDefault(); handleSearch(sugg); }}
                      >
                        <span className="search-overlay__text-sugg-icon"><IconSearch /></span>
                        <HighlightMatch text={sugg} query={query} />
                      </button>
                    ))}
                  </div>

                  <div className="search-overlay__divider" />

                  {/* Right – product results */}
                  <div className="search-overlay__results-right">
                    <p className="search-overlay__col-label">Products</p>
                    <div className="search-overlay__suggestions" role="listbox">
                      {loading && <p className="search-overlay__loading">Searching…</p>}
                      {!loading && searchResults.length > 0 && searchResults.map((product, i) => (
                        <ProductRow
                          key={product._id}
                          product={product}
                          isActive={activeIndex === i}
                          query={query}
                          onSelect={handleSelect}
                          onEnter={() => setActiveIndex(i)}
                          onLeave={() => setActiveIndex(-1)}
                        />
                      ))}
                      {!loading && searchResults.length === 0 && (
                        <p className="search-overlay__no-results">No results found for &ldquo;{query}&rdquo;</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ── DEFAULT STATE: trending categories left + products right ── */
                <>
                  <div className="search-overlay__categories">
                    <p className="search-overlay__trending-label">Trending:</p>
                    {TRENDING_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        className={`search-overlay__cat-item${activeCategory === cat.id ? ' active' : ''}`}
                        onClick={() => handleCategoryClick(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="search-overlay__divider" />
                  <div className="search-overlay__suggestions" role="listbox">
                    {loading && <p className="search-overlay__loading">Searching…</p>}
                    {!loading && trendingProducts.length > 0 && trendingProducts.map((product, i) => (
                      <ProductRow
                        key={product._id}
                        product={product}
                        isActive={activeIndex === i}
                        query={query}
                        onSelect={handleSelect}
                        onEnter={() => setActiveIndex(i)}
                        onLeave={() => setActiveIndex(-1)}
                      />
                    ))}
                    {!loading && trendingProducts.length === 0 && (
                      <p className="search-overlay__no-results">No products available</p>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* ── Bottom search footer (query state only) ── */}
            {hasQuery && (
              <button
                className="search-overlay__search-footer"
                onMouseDown={(e) => { e.preventDefault(); handleSearch(); }}
              >
                <span>Search for &ldquo;{query}&rdquo;</span>
                <span className="search-overlay__search-footer-arrow"><IconArrow /></span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
