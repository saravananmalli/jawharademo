import { useState, useEffect, useCallback } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaSearch, FaTimes } from 'react-icons/fa';
import ReviewCard from '../components/Common/ReviewCard';
import api from '../services/api';
import './AllReviews.scss';

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Latest' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest',  label: 'Lowest Rating' },
  { value: 'helpful', label: 'Most Helpful' },
];

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
  { value: '1', label: '1+ Stars' },
];

function StarDisplay({ rating }) {
  return (
    <span className="star-display">
      {Array.from({ length: 5 }, (_, i) => {
        if (rating >= i + 1) return <FaStar key={i} />;
        if (rating >= i + 0.5) return <FaStarHalfAlt key={i} />;
        return <FaRegStar key={i} />;
      })}
    </span>
  );
}

export default function AllReviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rating, setRating] = useState('');
  const [product, setProduct] = useState('');
  const [sort, setSort] = useState('newest');

  // fetch product list for filter dropdown
  useEffect(() => {
    api.get('/products?limit=100&sort=newest')
      .then(res => setProducts(res.data.data || []))
      .catch(() => {});
  }, []);

  const buildParams = useCallback((currentPage) => {
    const params = { page: currentPage, limit: 12, sort };
    if (search) params.q = search;
    if (rating) params.rating = rating;
    if (product) params.product = product;
    return params;
  }, [search, rating, product, sort]);

  // Initial / filter change load
  useEffect(() => {
    setLoading(true);
    setPage(1);
    api.get('/reviews', { params: buildParams(1) })
      .then(res => {
        setReviews(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, rating, product, sort, buildParams]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    api.get('/reviews', { params: buildParams(nextPage) })
      .then(res => {
        setReviews(prev => [...prev, ...(res.data.data || [])]);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <main className="all-reviews">
      <div className="all-reviews__hero">
        <div className="container">
          <h1 className="all-reviews__hero-title">Customer Reviews</h1>
          {total > 0 && (
            <p className="all-reviews__hero-sub">
              {total} verified reviews
              {avgRating && (
                <>
                  {' · '}
                  <StarDisplay rating={Number(avgRating)} />
                  <span className="all-reviews__avg">{avgRating} avg</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="container">
        {/* Filter bar */}
        <div className="all-reviews__filters">
          <form className="all-reviews__search" onSubmit={handleSearchSubmit}>
            <FaSearch className="all-reviews__search-icon" />
            <input
              type="text"
              placeholder="Search reviews…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="all-reviews__search-input"
            />
            {searchInput && (
              <button type="button" className="all-reviews__search-clear" onClick={clearSearch}>
                <FaTimes />
              </button>
            )}
          </form>

          <select
            className="all-reviews__select"
            value={rating}
            onChange={e => setRating(e.target.value)}
          >
            {RATING_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="all-reviews__select"
            value={product}
            onChange={e => setProduct(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          <select
            className="all-reviews__select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="all-reviews__count">
            Showing {reviews.length} of {total} reviews
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="all-reviews__loading">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="all-reviews__empty">
            <p>No reviews found matching your filters.</p>
            <button
              className="all-reviews__reset-btn"
              onClick={() => { setSearch(''); setSearchInput(''); setRating(''); setProduct(''); setSort('newest'); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="all-reviews__grid">
            {reviews.map(review => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && page < pages && (
          <div className="all-reviews__load-more">
            <button
              className="all-reviews__load-btn"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load More Reviews'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
