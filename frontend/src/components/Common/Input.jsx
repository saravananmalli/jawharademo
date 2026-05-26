import { memo, forwardRef } from 'react';
import './Input.scss';

/**
 * Shared Input — text, email, password, search fields.
 * forwardRef allows parent to control focus (e.g., search autofocus).
 */
const Input = forwardRef(function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  className = '',
  ...props
}, ref) {
  return (
    <div className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`}>
      {label && <label className="ui-input__label">{label}</label>}
      <div className="ui-input__wrap">
        {prefix && <span className="ui-input__affix ui-input__prefix">{prefix}</span>}
        <input ref={ref} className="ui-input__field" {...props} />
        {suffix && <span className="ui-input__affix ui-input__suffix">{suffix}</span>}
      </div>
      {error && <p className="ui-input__error">{error}</p>}
      {hint && !error && <p className="ui-input__hint">{hint}</p>}
    </div>
  );
});

export default memo(Input);
