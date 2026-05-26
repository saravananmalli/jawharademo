import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './ReviewModal.scss';

const UAE_LOCATIONS = [
  {
    group: 'Emirates',
    options: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
  },
  {
    group: 'Areas',
    options: ['Marina', 'Jumeirah', 'Business Bay', 'Silicon Oasis', 'Yas Island'],
  },
];

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewModal({ product, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    userName: user?.name || '',
    location: '',
    rating: 0,
    title: '',
    text: '',
    verified: true,
  });
  const [hover, setHover]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating)    { setError('Please select a star rating'); return; }
    if (!form.location)  { setError('Please select your location'); return; }
    if (!form.text.trim()) { setError('Review text is required'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', {
        productId: product.productId || product._id,
        userName:  form.userName,
        location:  form.location,
        rating:    form.rating,
        title:     form.title,
        text:      form.text,
        verified:  form.verified,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeRating = hover || form.rating;

  return (
    <div className="rv-overlay" onClick={handleOverlayClick}>
      <div className="rv-modal" role="dialog" aria-modal="true" aria-labelledby="rv-title">
        <button className="rv-close" onClick={onClose} aria-label="Close">×</button>

        <div className="rv-header">
          <h3 className="rv-title" id="rv-title">Write a Review</h3>
          <p className="rv-product-name">{product.name}</p>
        </div>

        {error && <div className="rv-error">{error}</div>}

        <form onSubmit={handleSubmit} className="rv-form" noValidate>

          {/* Star rating */}
          <div className="rv-group rv-group--stars">
            <label>Your Rating <span className="rv-required">*</span></label>
            <div className="rv-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`rv-star ${n <= activeRating ? 'rv-star--active' : ''}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => set('rating', n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
              {activeRating > 0 && (
                <span className="rv-star-label">{STAR_LABELS[activeRating]}</span>
              )}
            </div>
          </div>

          {/* Two-column row: name + location */}
          <div className="rv-row">
            <div className="rv-group">
              <label htmlFor="rv-name">Customer Name <span className="rv-required">*</span></label>
              <input
                id="rv-name"
                value={form.userName}
                onChange={e => set('userName', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="rv-group">
              <label htmlFor="rv-location">Location <span className="rv-required">*</span></label>
              <select
                id="rv-location"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                required
              >
                <option value="">Select location</option>
                {UAE_LOCATIONS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Review title */}
          <div className="rv-group">
            <label htmlFor="rv-title-input">Review Title</label>
            <input
              id="rv-title-input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Summarize your experience in one line"
            />
          </div>

          {/* Review text */}
          <div className="rv-group">
            <label htmlFor="rv-text">Your Review <span className="rv-required">*</span></label>
            <textarea
              id="rv-text"
              value={form.text}
              onChange={e => set('text', e.target.value)}
              placeholder="Share the details of your experience with this product…"
              rows={4}
              required
            />
          </div>

          {/* Verified purchase */}
          <label className="rv-checkbox">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={e => set('verified', e.target.checked)}
            />
            <span className="rv-checkbox__checkmark" />
            Verified Purchase
          </label>

          <div className="rv-footer">
            <button type="button" className="rv-btn rv-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rv-btn rv-btn--submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
