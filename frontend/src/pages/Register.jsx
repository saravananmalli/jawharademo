import { useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.scss';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Register() {
  const [form, setForm]           = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [errors, setErrors]       = useState({});
  const [error, setError]         = useState('');
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef            = useRef(null);
  const { register, updateProfile, loading } = useAuth();
  const navigate                  = useNavigate();
  const location                  = useLocation();

  const from = location.state?.from
    || new URLSearchParams(location.search).get('redirect')
    || '/account';

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const set = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (error) setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone && !/^[\d\s+\-()]{7,20}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await register(form.name, form.email, form.password, form.phone);
    if (result.success) {
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append('images', avatarFile);
          const token = localStorage.getItem('jawhara-token');
          const res = await axios.post(`${API_BASE}/upload/avatar`, formData, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          await updateProfile({ avatar: res.data.data.webp });
        } catch { /* non-fatal — account created, avatar skipped */ }
      }
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left brand panel ── */}
      <div className="auth-panel">
        <div className="auth-panel__diamond" aria-hidden="true" />
        <div className="auth-panel__content">
          <div className="auth-panel__brand">Jawhara</div>
          <div className="auth-panel__tagline">Luxury Jewellery</div>
          <p className="auth-panel__quote">
            "Crafted for those who appreciate the extraordinary. Join a world of timeless beauty."
          </p>
          <span className="auth-panel__quote-author">— Jawhara Collection</span>
        </div>
      </div>

      {/* ── Right form side ── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>Jawhara</h1>
            <p>Luxury Jewellery</p>
          </div>

          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Join Jawhara for exclusive access and offers</p>

          {error && <div className="auth-error">{error}</div>}

          {/* ── Avatar picker ── */}
          <div className="avatar-picker-wrap">
            <div className="avatar-picker" onClick={() => avatarInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" />
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
              <div className="avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
            </div>
            <span className="avatar-hint">
              {avatarPreview ? 'Tap to change photo' : 'Add profile photo (optional)'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name" name="name" type="text"
                  value={form.name} onChange={set}
                  placeholder="Sara Al Mansoori"
                  required autoComplete="name"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Mobile Number</label>
                <input
                  id="phone" name="phone" type="tel"
                  value={form.phone} onChange={set}
                  placeholder="+971 50 000 0000"
                  autoComplete="tel"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email" name="email" type="email"
                value={form.email} onChange={set}
                placeholder="you@example.com"
                required autoComplete="email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="input-wrap">
                  <input
                    id="password" name="password"
                    type={showPwd ? 'text' : 'password'}
                    value={form.password} onChange={set}
                    placeholder="Min 6 characters"
                    required autoComplete="new-password"
                    className={`has-suffix${errors.password ? ' error' : ''}`}
                  />
                  <button type="button" className="input-suffix" onClick={() => setShowPwd(v => !v)} aria-label="Toggle password">
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password *</label>
                <div className="input-wrap">
                  <input
                    id="confirm" name="confirm"
                    type={showConf ? 'text' : 'password'}
                    value={form.confirm} onChange={set}
                    placeholder="Repeat password"
                    required autoComplete="new-password"
                    className={`has-suffix${errors.confirm ? ' error' : ''}`}
                  />
                  <button type="button" className="input-suffix" onClick={() => setShowConf(v => !v)} aria-label="Toggle confirm password">
                    <EyeIcon open={showConf} />
                  </button>
                </div>
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
