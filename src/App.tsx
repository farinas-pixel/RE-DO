/**
 * App — Root router & Providers with RE:DO Cockpit Architecture
 * Accurately implements all 17 Figma Screen Types:
 * 01. Splash (/splash, or initial)
 * 02. Onboarding (/onboarding)
 * 03. Login / Sign Up (/auth/login, /auth/register)
 * 04. Home / 3D Hub (/hub)
 * 05. Scenario Universe (/scenarios)
 * 06. Scenario Details (/scenario/:scenarioId/details)
 * 07. Guided Setup (/scenario/:scenarioId/setup)
 * 08. Rehearsal Room (/session/:sessionId)
 * 09. Voice Practice (/voice-practice)
 * 10. Decision Branches (/decision-branches)
 * 11. Session Complete (/session-complete)
 * 12. Debrief (/debrief)
 * 13. Progress Journey (/progress)
 * 14. Memory Vault (/memory-vault)
 * 15. Settings & Safety (/settings)
 * 16. Session History (/history)
 * 17. Profile & Account (/profile)
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainNavigation } from '@/components/MainNavigation';
import { AndroidBottomBar } from '@/components/AndroidBottomBar';
import { SplashScreen } from '@/components/SplashScreen';

// Pages
import { OnboardingScreen } from '@/pages/OnboardingScreen';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';
import { Home3DHub } from '@/pages/Home3DHub';
import { ScenarioCataloguePage } from '@/pages/scenarios/ScenarioCataloguePage';
import { LiveSessionPage } from '@/pages/scenarios/LiveSessionPage';
import { VoicePracticePage } from '@/pages/scenarios/VoicePracticePage';
import { DecisionBranchesPage } from '@/pages/scenarios/DecisionBranchesPage';
import { SessionCompletePage } from '@/pages/scenarios/SessionCompletePage';
import { DebriefPage } from '@/pages/scenarios/DebriefPage';
import { ProgressJourneyPage } from '@/pages/ProgressJourneyPage';
import { MemoryVaultPage } from '@/pages/MemoryVaultPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SessionHistoryPage } from '@/pages/SessionHistoryPage';
import { ProfileAccountPage } from '@/pages/ProfileAccountPage';
import { LandingPage3D } from '@/pages/LandingPage3D';

function RootRedirect() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="cinematic-spinner" />
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => {
      setShowSplash(false);
      setShowOnboarding(true);
    }} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return <Navigate to={user ? '/hub' : '/auth/login'} replace />;
}

/**
 * Layout wrapper that conditionally renders the MainNavigation
 * and AndroidBottomBar on authenticated dashboard pages.
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Hide global navbar inside live rehearsal room or voice practice for pure immersion
  const isRehearsalRoom =
    location.pathname.startsWith('/session/') ||
    location.pathname === '/voice-practice' ||
    location.pathname === '/decision-branches' ||
    location.pathname === '/session-complete';

  return (
    <div className="app-viewport-root">
      {!isRehearsalRoom && <MainNavigation />}
      <div className="app-content-body">{children}</div>
      {!isRehearsalRoom && <AndroidBottomBar />}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Cinematic 3D Website Homepage */}
          <Route path="/" element={<LandingPage3D />} />
          <Route path="/home" element={<LandingPage3D />} />

          {/* Public Authentication routes & Screens 01, 02, 03 */}
          <Route path="/app" element={<RootRedirect />} />
          <Route path="/splash" element={<SplashScreen onComplete={() => {}} />} />
          <Route path="/onboarding" element={<OnboardingScreen onComplete={() => {}} />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected Destination Routes: Screens 04 to 17 */}
          <Route element={<ProtectedRoute />}>
            {/* 04. Home / 3D Hub */}
            <Route
              path="/hub"
              element={
                <AppLayout>
                  <Home3DHub />
                </AppLayout>
              }
            />

            {/* 05. Scenario Universe */}
            <Route
              path="/scenarios"
              element={
                <AppLayout>
                  <ScenarioCataloguePage />
                </AppLayout>
              }
            />

            {/* 08. Rehearsal Room */}
            <Route
              path="/session/:sessionId"
              element={<LiveSessionPage />}
            />

            {/* 09. Voice Practice */}
            <Route
              path="/voice-practice"
              element={<VoicePracticePage />}
            />

            {/* 10. Decision Branches */}
            <Route
              path="/decision-branches"
              element={<DecisionBranchesPage />}
            />

            {/* 11. Session Complete */}
            <Route
              path="/session-complete"
              element={<SessionCompletePage />}
            />

            {/* 12. Debrief */}
            <Route
              path="/debrief"
              element={
                <AppLayout>
                  <DebriefPage />
                </AppLayout>
              }
            />

            {/* 13. Progress Journey */}
            <Route
              path="/progress"
              element={
                <AppLayout>
                  <ProgressJourneyPage />
                </AppLayout>
              }
            />

            {/* 14. Memory Vault */}
            <Route
              path="/memory-vault"
              element={
                <AppLayout>
                  <MemoryVaultPage />
                </AppLayout>
              }
            />

            {/* 15. Settings & Safety */}
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              }
            />

            {/* 16. Session History */}
            <Route
              path="/history"
              element={
                <AppLayout>
                  <SessionHistoryPage />
                </AppLayout>
              }
            />

            {/* 17. Profile & Account */}
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
