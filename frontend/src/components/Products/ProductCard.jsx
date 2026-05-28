import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Badge from '../Common/Badge';
import Rating from '../Common/Rating';
import PriceDisplay from '../Common/PriceDisplay';
import { getImageUrl } from '../../utils/imageUrl';
import './ProductCard.scss';

function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);
  const isBestSeller = product.badge === 'bestseller';

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  }, [addItem, product]);

  const handleWishlist = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  }, [toggle, product]);

  const primaryImage = getImageUrl(product.images?.[0]) ||
    `https://placehold.co/400x400/F5EFE6/C4A960?text=${encodeURIComponent(product.name)}`;
  const secondaryImage = getImageUrl(product.images?.[1]);

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      {/* Image */}
      <div className="product-card__image">
        {isBestSeller ? (
          <span className="product-card__best-seller">Best Seller</span>
        ) : product.badge && (
          <span className="product-card__badge">
            <Badge label={product.badge} variant={product.badge} />
          </span>
        )}
        <button
          className={`product-card__wishlist ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? <FaHeart /> : <FiHeart />}
        </button>
        <img
          className="product-card__img product-card__img--primary"
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          width="400"
          height="400"
        />
        {secondaryImage && (
          <img
            className="product-card__img product-card__img--secondary"
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            loading="lazy"
            width="400"
            height="400"
          />
        )}
        <button
          className="product-card__cart-btn"
          onClick={handleAddToCart}
          aria-label="Add to cart"
        >
          <FiShoppingBag />
        </button>
      </div>

      {/* Body */}
      <div className="product-card__body">
        <PriceDisplay
          price={product.price}
          originalPrice={product.originalPrice}
          discount={product.discount}
          size="sm"
        />
        
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__meta">
          {product.reviewCount > 0 && (
            <Rating value={product.rating} count={product.reviewCount} size="sm" />
          )}
          {product.arrivesBy && (
            <span className="product-card__delivery">
              Delivered {product.arrivesBy}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
