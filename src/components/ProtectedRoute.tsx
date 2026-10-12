/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * HOW IT WORKS:
 * - If auth is loading (checking session), show a loading spinner.
 * - If no user is logged in, redirect to /auth/login.
 * - If user is logged in, render the child route.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL so we can redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
