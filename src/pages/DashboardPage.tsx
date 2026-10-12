/**
 * DashboardPage
 * Central user hub:
 * - Shows user profile state & auth info.
 * - Displays quick action to browse Scenario Catalogue.
 * - Displays recent sessions history with status, role, and links to resume or review.
 */
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getUserSessions } from '@/services/sessionService';
import type { Profile, Session } from '@/types/database';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setProfileError(
          error.code === 'PGRST116'
            ? 'Profile record is pending initial generation from auth trigger.'
            : error.message
        );
      } else {
        setProfile(data);
      }
      setProfileLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Fetch user sessions
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      setSessionsLoading(true);
      const { data, error } = await getUserSessions();
      if (error) {
        setSessionsError(error);
      } else {
        setSessions(data || []);
      }
      setSessionsLoading(false);
    };

    fetchSessions();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="auth-logo">RE:DO</h1>
          <p className="auth-tagline">Experience it before you face it.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/scenarios')} className="btn btn-primary">
            Explore Scenarios
          </button>
          <button onClick={handleSignOut} className="btn btn-outline">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Welcome & Profile */}
        <div className="dashboard-card">
          <h2>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}!</h2>

          <div className="profile-info">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> <code>{user?.id}</code></p>
            <p>
              <strong>Email verified:</strong>{' '}
              {user?.email_confirmed_at ? '✅ Yes' : '⏳ Pending confirmation'}
            </p>
          </div>

          {profileLoading && <p className="profile-status">Loading profile...</p>}
          {profileError && (
            <div className="auth-error" style={{ marginTop: '1rem' }} role="alert">
              <strong>Profile notice:</strong> {profileError}
            </div>
          )}
        </div>

        {/* Quick Launch CTA */}
        <div className="dashboard-card cta-card">
          <div className="cta-content">
            <h3>Ready for your next rehearsal?</h3>
            <p>
              Choose from curated scenarios across Career & Jobs, Education, Startups, Social boundaries, and Everyday Life.
            </p>
          </div>
          <button onClick={() => navigate('/scenarios')} className="btn btn-primary">
            Browse Catalogue
          </button>
        </div>

        {/* Recent Rehearsal Sessions */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Your Practice Sessions</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {sessions.length} recorded
            </span>
          </div>

          {sessionsLoading && (
            <div className="loading-screen" style={{ minHeight: '120px' }}>
              <div className="loading-spinner" />
              <p>Loading sessions from Supabase...</p>
            </div>
          )}

          {sessionsError && (
            <div className="auth-error">
              <strong>Failed to load sessions:</strong> {sessionsError}
            </div>
          )}

          {!sessionsLoading && !sessionsError && sessions.length === 0 && (
            <div className="empty-sessions">
              <p>You haven't conducted any practice sessions yet.</p>
              <Link to="/scenarios" className="btn btn-outline" style={{ marginTop: '0.75rem' }}>
                Launch First Practice Session
              </Link>
            </div>
          )}

          {!sessionsLoading && !sessionsError && sessions.length > 0 && (
            <div className="session-history-list">
              {sessions.map((sess) => (
                <div key={sess.id} className="session-history-item">
                  <div className="session-history-details">
                    <strong>{sess.role}</strong>
                    <span className="session-history-sub">
                      As {sess.user_role} • {sess.difficulty} • {sess.practice_mode} mode
                    </span>
                    <span className="session-history-date">
                      {new Date(sess.created_at).toLocaleDateString()} at{' '}
                      {new Date(sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="session-history-actions">
                    <span className={`badge status-badge ${sess.status}`}>{sess.status}</span>
                    <button
                      className="btn btn-outline"
                      onClick={() => navigate(`/session/${sess.id}`)}
                    >
                      {sess.status === 'in_progress' ? 'Resume' : 'View Transcript'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
