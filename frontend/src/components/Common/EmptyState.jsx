import { memo } from 'react';
import Button from './Button';
import './EmptyState.scss';

/**
 * Shared EmptyState — shown for empty cart, wishlist, search results.
 * Accepts any icon, title, description, and optional CTA button.
 */
function EmptyState({ icon, title, description, cta }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__desc">{description}</p>}
      {cta && (
        <Button variant="primary" size="md" onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}

export default memo(EmptyState);
