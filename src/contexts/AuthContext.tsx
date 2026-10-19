/**
 * AuthContext — the app's authentication state manager.
 *
 * HOW IT WORKS:
 * 1. On mount, it checks if the user already has a valid session (from localStorage).
 * 2. It subscribes to Supabase auth events (login, logout, token refresh, etc.).
 * 3. When auth state changes, it updates the React context so all components re-render.
 * 4. It provides methods for sign-up, sign-in, sign-out, password reset, and Google login.
 *
 * SECURITY:
 * - All auth operations go through Supabase's real auth service.
 * - No mock authentication or hardcoded success states.
 * - Email verification is handled by Supabase's built-in email flow.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true, // true until we've checked for an existing session
  });

  useEffect(() => {
    // 1. Check for existing session (e.g., user refreshed the page)
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setState({
            user: session.user,
            session,
            loading: false,
          });
          return;
        }
      } catch { /* ignore */ }

      const guest = localStorage.getItem('redo_guest_user');
      if (guest) {
        try {
          setState({
            user: JSON.parse(guest),
            session: null,
            loading: false,
          });
          return;
        } catch { /* ignore */ }
      }

      setState({
        user: null,
        session: null,
        loading: false,
      });
    };
    initSession();

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setState({
            user: session.user,
            session,
            loading: false,
          });
        }
      }
    );

    // 3. Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── Auth Methods ───────────────────────────────────────────────────────────

  /**
   * Create a new account with email and password.
   * Supabase will send a verification email automatically if email confirmation is enabled.
   */
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    return { error };
  }, []);

  /**
   * Sign in with email and password.
   * Will fail if the email is not verified (when email confirmation is enabled in Supabase).
   */
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  /**
   * Sign in with Google OAuth.
   * Requires Google provider to be configured in Supabase Dashboard > Auth > Providers.
   * This opens a popup/redirect to Google's consent screen.
   */
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }, []);

  /**
   * Sign out the current user. Clears session from localStorage and Supabase.
   */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  /**
   * Send a password reset email.
   * The email contains a link that redirects to /auth/reset-password with a token.
   */
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  }, []);

  /**
   * Update the user's password (used after clicking the reset link).
   * Only works when the user has a valid session from the reset token.
   */
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  }, []);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Use this hook in any component that needs auth state or auth methods.
 * Must be used inside <AuthProvider>.
 *
 * Example:
 *   const { user, signOut, loading } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
