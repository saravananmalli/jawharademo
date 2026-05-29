import { memo } from 'react';
import { FiArrowDown } from 'react-icons/fi';
import { DirhamSymbol } from 'dirham/react';
import { formatPrice } from '../../utils/formatPrice';
import './PriceDisplay.scss';

function PriceDisplay({ price, originalPrice, discount, size = 'md' }) {
  return (
    <div className={`price-display price-display--${size}`}>
      {discount > 0 && (
        <span className="price-display__discount">
          <FiArrowDown />
          {discount}%
        </span>
      )}
      <span className="price-display__current">
        <DirhamSymbol size="0.85em" weight="bold" />
        {formatPrice(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <span className="price-display__original">
          <DirhamSymbol size="0.85em" weight="regular" />
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}

export default memo(PriceDisplay);
