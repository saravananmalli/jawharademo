import { memo } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import './Rating.scss';

/**
 * Shared Rating — renders star icons for any numeric rating 0-5.
 * Used on ProductCard, ProductDetail, Reviews. Reusable across apps.
 */
function Rating({ value = 0, count, size = 'sm', showCount = true }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (value >= i + 1) return 'full';
    if (value >= i + 0.5) return 'half';
    return 'empty';
  });

  return (
    <div className={`rating rating--${size}`} aria-label={`${value} out of 5 stars`}>
      <span className="rating__stars">
        {stars.map((type, i) => {
          if (type === 'full') return <FaStar key={i} />;
          if (type === 'half') return <FaStarHalfAlt key={i} />;
          return <FaRegStar key={i} />;
        })}
      </span>
      {showCount && count !== undefined && (
        <span className="rating__count">({count})</span>
      )}
    </div>
  );
}

export default memo(Rating);
