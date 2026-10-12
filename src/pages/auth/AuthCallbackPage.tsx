/**
 * AuthCallbackPage — handles OAuth redirects (e.g., Google login).
 *
 * When the user logs in with Google, Supabase redirects back to this page.
 * The Supabase client automatically extracts the token from the URL hash
 * and creates a session. This page just shows a loading state while that happens,
 * then redirects to the dashboard.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
    // If not loading and no user, the auth failed — redirect to login
    if (!loading && !user) {
      // Wait a moment for the auth state to settle (token extraction is async)
      const timer = setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">RE:DO</h1>
        </div>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Completing sign in...</p>
        </div>
      </div>
    </div>
  );
}
