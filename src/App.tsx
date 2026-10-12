/**
 * App — Root router & Providers with RE:DO Cockpit Architecture
 * Navigation Architecture:
 * 1. Home / 3D Hub (/hub)
 * 2. Scenario Universe (/scenarios)
 * 3. Rehearsal Room (/session/:sessionId)
 * 4. Progress Journey (/progress)
 * 5. Memory & Settings (/memory-vault, /settings)
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainNavigation } from '@/components/MainNavigation';
import { AndroidBottomBar } from '@/components/AndroidBottomBar';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingModal } from '@/components/OnboardingModal';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';
import { Home3DHub } from '@/pages/Home3DHub';
import { ScenarioCataloguePage } from '@/pages/scenarios/ScenarioCataloguePage';
import { LiveSessionPage } from '@/pages/scenarios/LiveSessionPage';
import { ProgressJourneyPage } from '@/pages/ProgressJourneyPage';
import { MemoryVaultPage } from '@/pages/MemoryVaultPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SessionHistoryPage } from '@/pages/SessionHistoryPage';
import { ProfileAccountPage } from '@/pages/ProfileAccountPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <Navigate to={user ? '/hub' : '/auth/login'} replace />;
}

/**
 * Layout wrapper that conditionally renders the MainNavigation
 * bar on authenticated dashboard pages.
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Hide global navbar inside live rehearsal room for distraction-free immersion
  const isRehearsalRoom = location.pathname.startsWith('/session/');

  return (
    <div className="app-viewport-root">
      {!isRehearsalRoom && <MainNavigation />}
      <div className="app-content-body">{children}</div>
      {!isRehearsalRoom && <AndroidBottomBar />}
      {showOnboarding && <OnboardingModal onDismiss={() => setShowOnboarding(false)} />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected Destination Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/hub"
              element={
                <AppLayout>
                  <Home3DHub />
                </AppLayout>
              }
            />
            <Route
              path="/scenarios"
              element={
                <AppLayout>
                  <ScenarioCataloguePage />
                </AppLayout>
              }
            />
            <Route
              path="/session/:sessionId"
              element={<LiveSessionPage />}
            />
            <Route
              path="/progress"
              element={
                <AppLayout>
                  <ProgressJourneyPage />
                </AppLayout>
              }
            />
            <Route
              path="/history"
              element={
                <AppLayout>
                  <SessionHistoryPage />
                </AppLayout>
              }
            />
            <Route
              path="/memory-vault"
              element={
                <AppLayout>
                  <MemoryVaultPage />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <AppLayout>
                  <ProfileAccountPage />
                </AppLayout>
              }
            />
            {/* Alias /dashboard to /hub */}
            <Route path="/dashboard" element={<Navigate to="/hub" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
