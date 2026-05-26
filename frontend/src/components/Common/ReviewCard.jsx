import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import './ReviewCard.scss';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ReviewCard({ review }) {
  const { userName, name, location, avatar, verified, rating, title, text, timeAgo, createdAt, product } = review;
  const displayName = userName || name || 'Customer';
  const initial = displayName[0]?.toUpperCase();

  const stars = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return 'full';
    if (rating >= i + 0.5) return 'half';
    return 'empty';
  });

  const productId = product?._id || product?.id;
  const productImage = product?.images?.[0] || product?.image;
  const dateDisplay = timeAgo || formatDate(createdAt);

  return (
    <div className="review-card">
      <div className="review-card__header">
        <div className="review-card__avatar">
          {avatar
            ? <img src={avatar} alt={displayName} />
            : <span>{initial}</span>
          }
        </div>
        <div className="review-card__meta">
          <p className="review-card__identity">
            <span className="review-card__name">{displayName}</span>
            {location && <span className="review-card__location">({location})</span>}
          </p>
          {verified && (
            <span className="review-card__verified">Verified Purchase</span>
          )}
        </div>
      </div>

      <div className="review-card__rating">
        <span className="review-card__stars">
          {stars.map((type, i) => {
            if (type === 'full')  return <FaStar key={i} />;
            if (type === 'half')  return <FaStarHalfAlt key={i} />;
            return <FaRegStar key={i} />;
          })}
        </span>
        <span className="review-card__rating-num">{rating}</span>
      </div>

      {title && <p className="review-card__title">{title}</p>}

      <p className="review-card__text">{text}</p>

      {dateDisplay && <p className="review-card__time">{dateDisplay}</p>}

      {product && productId && (
        <Link to={`/product/${productId}`} className="review-card__product">
          {productImage && (
            <img
              src={productImage}
              alt={product.name}
              className="review-card__product-img"
            />
          )}
          <span className="review-card__product-name">{product.name}</span>
        </Link>
      )}
    </div>
  );
}

export default memo(ReviewCard);
