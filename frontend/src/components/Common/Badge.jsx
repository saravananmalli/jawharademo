import { memo } from 'react';
import './Badge.scss';

/**
 * Shared Badge — product labels (new, sale, limited, hot).
 * Reusable across storefront, admin product list, mobile.
 */
function Badge({ label, variant = 'sale' }) {
  if (!label) return null;
  return (
    <span className={`ui-badge ui-badge--${variant}`}>
      {label}
    </span>
  );
}

export default memo(Badge);
