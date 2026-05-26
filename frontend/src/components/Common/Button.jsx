import { memo } from 'react';
import './Button.scss';

/**
 * Shared Button — used across storefront, admin, and mobile.
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | md | lg
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={[
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? 'btn--full' : '',
        loading ? 'btn--loading' : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span className={loading ? 'btn__label btn__label--hidden' : 'btn__label'}>
        {children}
      </span>
    </button>
  );
}

export default memo(Button);
