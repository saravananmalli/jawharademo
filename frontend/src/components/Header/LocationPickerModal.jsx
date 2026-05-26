import { useState, useEffect, useRef } from 'react';
import './LocationPickerModal.scss';

const UAE_LOCATIONS = [
  { city: 'Dubai',          country: 'UAE' },
  { city: 'Abu Dhabi',      country: 'UAE' },
  { city: 'Sharjah',        country: 'UAE' },
  { city: 'Ajman',          country: 'UAE' },
  { city: 'Ras Al Khaimah', country: 'UAE' },
  { city: 'Fujairah',       country: 'UAE' },
  { city: 'Umm Al Quwain',  country: 'UAE' },
  { city: 'Al Ain',         country: 'UAE' },
];

export default function LocationPickerModal({ currentLocation, onSelect, onDetect, detecting, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = UAE_LOCATIONS.filter(loc =>
    loc.city.toLowerCase().includes(query.toLowerCase())
  );

  const handleDetect = () => {
    onDetect();
    onClose();
  };

  const handleSelect = (loc) => {
    onSelect({ ...loc, display: loc.city });
    onClose();
  };

  return (
    <div className="loc-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="loc-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Select delivery location"
      >
        <div className="loc-modal__header">
          <div className="loc-modal__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Delivery Location
          </div>
          <button className="loc-modal__close" onClick={onClose} aria-label="Close location picker">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="loc-modal__body">
          <button
            className="loc-modal__detect-btn"
            onClick={handleDetect}
            disabled={detecting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            {detecting ? 'Detecting your location…' : 'Use my current location'}
          </button>

          <div className="loc-modal__or">
            <span>or choose a city</span>
          </div>

          <div className="loc-modal__search-wrap">
            <svg className="loc-modal__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              className="loc-modal__search"
              type="text"
              placeholder="Search cities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search cities"
            />
            {query && (
              <button className="loc-modal__search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <ul className="loc-modal__list" role="listbox" aria-label="UAE cities">
            {filtered.length === 0 && (
              <li className="loc-modal__empty">No cities found</li>
            )}
            {filtered.map((loc) => {
              const isActive = currentLocation?.city === loc.city;
              return (
                <li key={loc.city} role="option" aria-selected={isActive}>
                  <button
                    className={`loc-modal__list-item${isActive ? ' active' : ''}`}
                    onClick={() => handleSelect(loc)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loc-modal__list-pin">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="loc-modal__list-city">{loc.city}</span>
                    <span className="loc-modal__list-country">{loc.country}</span>
                    {isActive && (
                      <svg className="loc-modal__list-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
