import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/Products/ProductGrid';
import api from '../services/api';
import './SearchResults.scss';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/products?q=${encodeURIComponent(query)}&limit=50`)
      .then(({ data }) => { setProducts(data.data || []); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <main className="search-results-page">
      <div className="container">
        <div className="search-results-page__header">
          <h1>
            {query ? (
              <>Search results for <em>"{query}"</em></>
            ) : (
              'Search Products'
            )}
          </h1>
          {!loading && <p>{products.length} products found</p>}
        </div>
        <ProductGrid products={products} loading={loading} cols={4} />
      </div>
    </main>
  );
}
