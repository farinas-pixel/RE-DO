/**
 * LoginPage — Screen Type #03: Login / Sign Up
 * Matching exact Figma Screen 03:
 * - RE:DO brand header with ambient glow
 * - "Welcome Back" / "Sign in to continue your journey"
 * - Floating glass form card with Email or Username input and Password with reveal eye toggle
 * - Gradient "Sign In" button
 * - "Forgot password?"
 * - "or continue with" Google and Apple icon buttons
 * - "Don't have an account? Sign Up"
 * - Real Supabase authentication preserved
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/hub';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <div className="auth-page figma-screen-03">
      {/* Ambient background glow */}
      <div className="auth-ambient-glow" />

      {/* Brand Header */}
      <div className="auth-brand-header">
        <h1 className="auth-logo-text">RE:DO</h1>
      </div>

      {/* Welcome Card matching Screen 03 */}
      <div className="auth-glass-card">
        <div className="auth-welcome-text">
          <h2 className="welcome-title">Welcome Back</h2>
          <p className="welcome-subtitle">Sign in to continue your journey</p>
        </div>

        {error && (
          <div className="auth-error-pill" role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="figma-auth-form">
          <div className="figma-input-group">
            <label htmlFor="email">Email or Username</label>
            <div className="input-field-wrap">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="figma-input-group">
            <label htmlFor="password">Password</label>
            <div className="input-field-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-figma-signin" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="forgot-pass-wrap">
            <Link to="/auth/forgot-password" className="forgot-pass-link">
              Forgot password?
            </Link>
          </div>

          <div className="auth-or-divider">
            <span className="divider-line" />
            <span className="divider-text">or continue with</span>
            <span className="divider-line" />
          </div>

          <div className="social-login-row">
            <button
              type="button"
              className="social-icon-btn google-btn"
              onClick={handleGoogleLogin}
              title="Continue with Google"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            <button
              type="button"
              className="social-icon-btn apple-btn"
              onClick={() => setError('Apple Sign In requires an Apple Developer account.')}
              title="Continue with Apple"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.65-.8 1.1-1.92.98-3.04-.95.04-2.1.63-2.77 1.43-.59.68-1.11 1.8-1.01 2.88 1.06.08 2.14-.54 2.8-1.27z"/>
              </svg>
            </button>
          </div>
        </form>

        <div className="auth-signup-prompt">
          <span>Don't have an account? </span>
          <Link to="/auth/register" className="signup-link">
            Sign Up
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
          <button
            type="button"
            className="guest-login-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px dashed rgba(244, 114, 182, 0.45)',
              borderRadius: '999px',
              color: '#f472b6',
              padding: '0.4rem 1.15rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => {
              const demoUser = {
                id: 'demo-guest-user',
                email: 'farinas.mumtaj@redo.app',
                user_metadata: { display_name: 'Farinas Mumtaj H' },
              };
              localStorage.setItem('redo_guest_user', JSON.stringify(demoUser));
              window.location.href = '/hub';
            }}
          >
            ✨ Quick Demo: Enter as Farinas Mumtaj H
          </button>
        </div>
      </div>
    </div>
  );
}
