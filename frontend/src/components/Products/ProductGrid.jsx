import { memo } from 'react';
import ProductCard from './ProductCard';
import './ProductGrid.scss';

const SKELETON_COUNT = 8;

// Extracted so it doesn't recreate on each ProductGrid render
const Skeleton = () => (
  <div className="product-skeleton">
    <div className="product-skeleton__image" />
    <div className="product-skeleton__body">
      <div className="product-skeleton__line" />
      <div className="product-skeleton__line product-skeleton__line--short" />
      <div className="product-skeleton__line product-skeleton__line--price" />
    </div>
  </div>
);

function ProductGrid({ products = [], loading = false, cols = 4 }) {
  if (loading) {
    return (
      <div className={`product-grid product-grid--cols-${cols}`}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="product-grid__empty">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <div className={`product-grid product-grid--cols-${cols}`}>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

export default memo(ProductGrid);
