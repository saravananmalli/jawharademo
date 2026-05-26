import { memo } from 'react';
import { DirhamSymbol } from 'dirham/react';
import { formatPrice } from '../../utils/formatPrice';
import './PriceDisplay.scss';

function PriceDisplay({ price, originalPrice, discount, size = 'md' }) {
  return (
    <div className={`price-display price-display--${size}`}>
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
      {discount > 0 && (
        <span className="price-display__discount">{discount}%</span>
      )}
    </div>
  );
}

export default memo(PriceDisplay);
