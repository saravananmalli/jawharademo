import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.scss';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword }    = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setError('');
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-panel__diamond" aria-hidden="true" />
        <div className="auth-panel__content">
          <div className="auth-panel__brand">Jawhara</div>
          <div className="auth-panel__tagline">Luxury Jewellery</div>
          <p className="auth-panel__quote">
            "Your account is your gateway to exclusive collections and personalised experiences."
          </p>
          <span className="auth-panel__quote-author">— Jawhara Collection</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>Jawhara</h1>
            <p>Luxury Jewellery</p>
          </div>

          <Link to="/login" className="auth-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Sign In
          </Link>

          <h2 className="auth-title">Reset password</h2>
          <p className="auth-subtitle">
            Enter your registered email and we'll send you a reset link.
          </p>

          {error && <div className="auth-error">{error}</div>}

          {sent ? (
            <div className="auth-success">
              <strong>Check your inbox.</strong> If this email is registered, a reset link has been sent.
              You can close this page or <Link to="/login">return to sign in</Link>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email" type="email"
                  value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  required autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <><span className="auth-spinner" /> Sending…</> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="auth-switch">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
