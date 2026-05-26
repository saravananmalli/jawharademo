import { memo } from 'react';
import './QuantityControl.scss';

/**
 * Shared QuantityControl — increment/decrement with min/max bounds.
 * Used on ProductDetail, Cart, and future mobile app.
 */
function QuantityControl({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="qty-ctrl" role="group" aria-label="Quantity">
      <button
        className="qty-ctrl__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="qty-ctrl__value" aria-live="polite">{value}</span>
      <button
        className="qty-ctrl__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default memo(QuantityControl);
