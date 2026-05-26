import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import { DirhamSymbol } from 'dirham/react';
import { getImageUrl } from '../utils/imageUrl';
import api from '../services/api';
import ReviewModal from '../components/Reviews/ReviewModal';
import './Account.scss';

const TAB_LIST = [
  { id: 'profile',   label: 'My Profile',      icon: UserIcon },
  { id: 'orders',    label: 'My Orders',        icon: OrderIcon },
  { id: 'reviews',   label: 'My Reviews',       icon: StarIcon },
  { id: 'wishlist',  label: 'Wishlist',         icon: HeartIcon },
  { id: 'addresses', label: 'Saved Addresses',  icon: LocationIcon },
  { id: 'security',  label: 'Security',         icon: LockIcon },
];

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function OrderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

const STATUS_STYLE = {
  pending:    { bg: '#fef3c7', color: '#b45309' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped:    { bg: '#e0e7ff', color: '#4338ca' },
  delivered:  { bg: '#d1fae5', color: '#065f46' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

/* ── Profile tab ─────────────────────────────────────────────────────────── */
function ProfileTab() {
  const { user, updateProfile, loading } = useAuth();
  const [form, setForm]   = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [flash, setFlash] = useState(null);
  const [dirty, setDirty] = useState(false);

  const set = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setDirty(true);
    setFlash(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const result = await updateProfile(form);
    setFlash(result.success
      ? { type: 'success', msg: 'Profile updated successfully.' }
      : { type: 'error', msg: result.message });
    if (result.success) setDirty(false);
  };

  return (
    <div className="account-section">
      <h2 className="account-section__title">My Profile</h2>

      <div className="account-avatar-row">
        <div className="account-avatar">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="account-avatar__name">{user?.name}</p>
          <p className="account-avatar__email">{user?.email}</p>
        </div>
      </div>

      {flash && (
        <div className={`account-flash account-flash--${flash.type}`}>{flash.msg}</div>
      )}

      <form onSubmit={handleSave} className="account-form">
        <div className="account-form__row">
          <div className="account-form__group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={set} placeholder="Your full name" />
          </div>
          <div className="account-form__group">
            <label>Mobile Number</label>
            <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="+971 50 000 0000" />
          </div>
        </div>
        <div className="account-form__group">
          <label>Email Address</label>
          <input value={user?.email || ''} disabled className="account-form__input--disabled" />
          <span className="account-form__hint">Email cannot be changed</span>
        </div>
        <button type="submit" className="account-btn" disabled={loading || !dirty}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

/* ── Orders tab ──────────────────────────────────────────────────────────── */
function OrdersTab({ onWriteReview }) {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [reviewedIds, setReviewedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get('/reviews/my-reviews'),
    ]).then(([ordersRes, reviewsRes]) => {
      setOrders(ordersRes.data.data || []);
      const ids = new Set((reviewsRes.data.data || []).map(r => r.product?._id || r.product));
      setReviewedIds(ids);
    }).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="account-loading"><div className="account-spinner" /></div>;

  if (!orders.length) {
    return (
      <div className="account-section">
        <h2 className="account-section__title">My Orders</h2>
        <div className="account-empty">
          <OrderIcon />
          <p>No orders yet.</p>
          <Link to="/" className="account-btn account-btn--outline">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="account-section">
      <h2 className="account-section__title">My Orders <span>({orders.length})</span></h2>
      <div className="account-orders">
        {orders.map(order => {
          const style = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
          const isDelivered = order.status === 'delivered';
          return (
            <div key={order._id} className="account-order-card">
              <div className="account-order-card__header">
                <div>
                  <p className="account-order-card__id">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="account-order-card__date">
                    {new Date(order.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="account-order-card__right">
                  <span className="account-order-card__status" style={{ background: style.bg, color: style.color }}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                  <p className="account-order-card__total"><DirhamSymbol size="0.85em" />{formatPrice(order.totalAmount)}</p>
                </div>
              </div>
              <div className="account-order-card__items">
                {(order.items || []).slice(0, 3).map((item, i) => (
                  <img
                    key={i}
                    src={getImageUrl(item.image) || `https://placehold.co/48x48/F5EFE6/C4A960?text=${encodeURIComponent((item.name || '?')[0])}`}
                    alt={item.name}
                    className="account-order-card__thumb"
                  />
                ))}
                {order.items?.length > 3 && (
                  <span className="account-order-card__more">+{order.items.length - 3}</span>
                )}
              </div>
              {isDelivered && (
                <div className="account-order-card__review-row">
                  {(order.items || []).map((item) => {
                    const pid = item.product?.toString();
                    const alreadyReviewed = reviewedIds.has(pid);
                    return (
                      <button
                        key={pid || item.name}
                        className={`account-order-card__review-btn ${alreadyReviewed ? 'reviewed' : ''}`}
                        disabled={alreadyReviewed}
                        onClick={() => !alreadyReviewed && onWriteReview({ productId: pid, name: item.name, image: item.image })}
                      >
                        {alreadyReviewed ? '✓ Reviewed' : `Review "${item.name}"`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Reviews tab ─────────────────────────────────────────────────────────── */
const REVIEW_STATUS_LABEL = { pending: 'Pending Approval', published: 'Published', hidden: 'Rejected' };
const REVIEW_STATUS_COLOR = { pending: '#b45309', published: '#065f46', hidden: '#991b1b' };
const REVIEW_STATUS_BG    = { pending: '#fef3c7', published: '#d1fae5', hidden: '#fee2e2' };

function ReviewsTab({ onWriteReview }) {
  const [pending,   setPending]   = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/reviews/pending-for-user'),
      api.get('/reviews/my-reviews'),
    ]).then(([p, s]) => {
      setPending(p.data.data || []);
      setSubmitted(s.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleWriteReview = (product) => {
    onWriteReview(product, load);
  };

  if (loading) return <div className="account-loading"><div className="account-spinner" /></div>;

  return (
    <div className="account-section">
      <h2 className="account-section__title">My Reviews</h2>

      {/* Pending — products awaiting a review */}
      {pending.length > 0 && (
        <div className="account-review-block">
          <h3 className="account-review-block__heading">
            Pending Reviews <span className="account-review-block__count">({pending.length})</span>
          </h3>
          <div className="account-review-pending-list">
            {pending.map(item => (
              <div key={item.productId} className="account-review-pending-card">
                <img
                  src={getImageUrl(item.image) || `https://placehold.co/56x56/F5EFE6/C4A960?text=${encodeURIComponent((item.name || '?')[0])}`}
                  alt={item.name}
                  className="account-review-pending-card__img"
                />
                <div className="account-review-pending-card__info">
                  <p className="account-review-pending-card__name">{item.name}</p>
                  <p className="account-review-pending-card__sub">Share your experience with this product</p>
                </div>
                <button
                  className="account-review-pending-card__btn"
                  onClick={() => handleWriteReview(item)}
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted reviews */}
      {submitted.length > 0 && (
        <div className="account-review-block">
          <h3 className="account-review-block__heading">
            Submitted Reviews <span className="account-review-block__count">({submitted.length})</span>
          </h3>
          <div className="account-review-submitted-list">
            {submitted.map(r => (
              <div key={r._id} className="account-review-submitted-card">
                <div className="account-review-submitted-card__top">
                  <div>
                    <p className="account-review-submitted-card__product">{r.product?.name || 'Product'}</p>
                    <div className="account-review-submitted-card__stars">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ color: n <= r.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="account-review-submitted-card__status"
                    style={{ background: REVIEW_STATUS_BG[r.status], color: REVIEW_STATUS_COLOR[r.status] }}
                  >
                    {REVIEW_STATUS_LABEL[r.status] || r.status}
                  </span>
                </div>
                {r.title && <p className="account-review-submitted-card__title">"{r.title}"</p>}
                <p className="account-review-submitted-card__text">{r.text}</p>
                <p className="account-review-submitted-card__date">
                  {new Date(r.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && submitted.length === 0 && (
        <div className="account-empty">
          <StarIcon />
          <p>No reviews yet. Orders marked as delivered will appear here.</p>
        </div>
      )}
    </div>
  );
}

/* ── Wishlist tab ────────────────────────────────────────────────────────── */
function WishlistTab() {
  return (
    <div className="account-section">
      <h2 className="account-section__title">Wishlist</h2>
      <div className="account-empty">
        <HeartIcon />
        <p>Your saved favourites</p>
        <Link to="/wishlist" className="account-btn">View Wishlist</Link>
      </div>
    </div>
  );
}

/* ── Addresses tab ───────────────────────────────────────────────────────── */
function AddressesTab() {
  return (
    <div className="account-section">
      <h2 className="account-section__title">Saved Addresses</h2>
      <div className="account-empty">
        <LocationIcon />
        <p>Addresses are saved at checkout for faster ordering.</p>
      </div>
    </div>
  );
}

/* ── Security tab ────────────────────────────────────────────────────────── */
function SecurityTab() {
  const { changePassword, loading } = useAuth();
  const [form, setForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [flash, setFlash] = useState(null);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const set = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setFlash(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setFlash({ type: 'error', msg: 'New passwords do not match' }); return;
    }
    if (form.newPassword.length < 6) {
      setFlash({ type: 'error', msg: 'New password must be at least 6 characters' }); return;
    }
    const result = await changePassword(form.currentPassword, form.newPassword);
    if (result.success) {
      setFlash({ type: 'success', msg: 'Password changed successfully.' });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } else {
      setFlash({ type: 'error', msg: result.message });
    }
  };

  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" className="account-eye-btn" onClick={onToggle} tabIndex={-1}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      }
    </button>
  );

  return (
    <div className="account-section">
      <h2 className="account-section__title">Security</h2>

      {flash && <div className={`account-flash account-flash--${flash.type}`}>{flash.msg}</div>}

      <form onSubmit={handleSubmit} className="account-form">
        <div className="account-form__group">
          <label>Current Password</label>
          <div className="account-form__input-wrap">
            <input name="currentPassword" type={showCur ? 'text' : 'password'}
              value={form.currentPassword} onChange={set} required placeholder="Enter current password" />
            <EyeBtn show={showCur} onToggle={() => setShowCur(v => !v)} />
          </div>
        </div>
        <div className="account-form__row">
          <div className="account-form__group">
            <label>New Password</label>
            <div className="account-form__input-wrap">
              <input name="newPassword" type={showNew ? 'text' : 'password'}
                value={form.newPassword} onChange={set} required placeholder="Min 6 characters" />
              <EyeBtn show={showNew} onToggle={() => setShowNew(v => !v)} />
            </div>
          </div>
          <div className="account-form__group">
            <label>Confirm New Password</label>
            <div className="account-form__input-wrap">
              <input name="confirm" type="password"
                value={form.confirm} onChange={set} required placeholder="Repeat new password" />
            </div>
          </div>
        </div>
        <button type="submit" className="account-btn" disabled={loading}>
          {loading ? 'Updating…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

/* ── Main Account page ───────────────────────────────────────────────────── */
export default function Account() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [tab, setTab]     = useState('profile');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Review modal state
  const [reviewProduct, setReviewProduct]   = useState(null);
  const [onReviewSuccess, setOnReviewSuccess] = useState(null);

  // Reminder banner — in-memory only, resets on every mount so it
  // reappears on refresh, re-login, or navigation. Only clears permanently
  // when reminderCount reaches 0 (all reviews submitted).
  const [reminderCount, setReminderCount]       = useState(0);
  const [reminderHidden, setReminderHidden]     = useState(false);

  useEffect(() => {
    api.get('/reviews/pending-for-user')
      .then(({ data }) => setReminderCount((data.data || []).length))
      .catch(() => {});
  }, []);

  const dismissReminder = () => setReminderHidden(true);

  const openReviewModal = (product, successCb) => {
    setReviewProduct(product);
    setOnReviewSuccess(() => successCb || null);
  };

  const handleReviewSuccess = () => {
    setReviewProduct(null);
    setReminderCount(c => Math.max(0, c - 1));
    if (onReviewSuccess) onReviewSuccess();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const TABS = {
    profile:   <ProfileTab />,
    orders:    <OrdersTab onWriteReview={openReviewModal} />,
    reviews:   <ReviewsTab onWriteReview={openReviewModal} />,
    wishlist:  <WishlistTab />,
    addresses: <AddressesTab />,
    security:  <SecurityTab />,
  };

  const currentTab = TAB_LIST.find(t => t.id === tab);

  return (
    <main className="account-page">
      <div className="container">
        <div className="account-layout">

          {/* ── Sidebar ── */}
          <aside className="account-sidebar">
            <div className="account-sidebar__profile">
              <div className="account-sidebar__avatar">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="account-sidebar__name">{user?.name}</p>
                <p className="account-sidebar__email">{user?.email}</p>
              </div>
            </div>

            <nav className="account-sidebar__nav">
              {TAB_LIST.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`account-sidebar__item ${tab === id ? 'active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
              <div className="account-sidebar__divider" />
              <button className="account-sidebar__item account-sidebar__item--logout" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* ── Mobile tab selector ── */}
          <div className="account-mobile-nav">
            <button
              className="account-mobile-nav__toggle"
              onClick={() => setMobileNavOpen(v => !v)}
            >
              <span className="account-mobile-nav__current">
                {currentTab && <currentTab.icon />}
                {currentTab?.label}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points={mobileNavOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
              </svg>
            </button>
            {mobileNavOpen && (
              <div className="account-mobile-nav__dropdown">
                {TAB_LIST.map(({ id, label, icon: Icon }) => (
                  <button key={id}
                    className={`account-mobile-nav__item ${tab === id ? 'active' : ''}`}
                    onClick={() => { setTab(id); setMobileNavOpen(false); }}>
                    <Icon /><span>{label}</span>
                  </button>
                ))}
                <button className="account-mobile-nav__item account-mobile-nav__item--logout" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Main content ── */}
          <div className="account-content">
            {/* Review reminder banner */}
            {!reminderHidden && reminderCount > 0 && (
              <div className="account-reminder">
                <div className="account-reminder__body">
                  <span className="account-reminder__icon">✍️</span>
                  <p className="account-reminder__text">
                    You have <strong>{reminderCount} product{reminderCount > 1 ? 's' : ''}</strong> waiting for your review!
                  </p>
                  <button
                    className="account-reminder__cta"
                    onClick={() => setTab('reviews')}
                  >
                    Write Review{reminderCount > 1 ? 's' : ''}
                  </button>
                </div>
                <button className="account-reminder__close" onClick={dismissReminder} aria-label="Dismiss">×</button>
              </div>
            )}
            {TABS[tab]}
          </div>
        </div>
      </div>

      {/* Review modal */}
      {reviewProduct && (
        <ReviewModal
          product={reviewProduct}
          onClose={() => setReviewProduct(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </main>
  );
}
