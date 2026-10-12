/**
 * SessionHistoryPage — Screen Type #16: Session History
 * Shows persisted sessions from Supabase with real timestamps,
 * completed status, counterpart details, review action, and scenario retry.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSessions } from '@/services/sessionService';
import type { Session } from '@/types/database';

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getUserSessions();
    if (err) {
      setError(err);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="history-page-root">
      <div className="page-header-row">
        <div>
          <span className="page-subtitle-pill">RECORDS & REPLAYS</span>
          <h1 className="page-title-luminous">Rehearsal History</h1>
          <p className="page-lead">
            Review past dialogues, inspection debriefs, and retry any intimidating situation.
          </p>
        </div>
        <button className="btn-primary-luminous" onClick={() => navigate('/scenarios')}>
          + New Rehearsal
        </button>
      </div>

      {loading ? (
        <div className="loading-card-glass">
          <div className="loading-spinner" />
          <p>Retrieving session logs from Supabase...</p>
        </div>
      ) : error ? (
        <div className="error-card-glass">
          <p>⚠️ {error}</p>
          <button className="btn-secondary" onClick={fetchHistory}>
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state-glass">
          <div className="empty-icon-crystal">📜</div>
          <h3>No Rehearsals Recorded Yet</h3>
          <p>Your completed and in-progress simulations will be archived here securely.</p>
          <button className="btn-primary-luminous" onClick={() => navigate('/scenarios')}>
            Explore Scenario Universe
          </button>
        </div>
      ) : (
        <div className="history-list-grid">
          {sessions.map((sess) => {
            const isCompleted = sess.status === 'completed';
            const dateStr = new Date(sess.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={sess.id} className="history-item-glass">
                <div className="item-status-col">
                  <span
                    className={`status-indicator-dot ${isCompleted ? 'completed' : 'in-progress'}`}
                  />
                  <span className="status-label">
                    {isCompleted ? 'Concluded' : 'In Progress'}
                  </span>
                </div>

                <div className="item-main-info">
                  <div className="item-title-row">
                    <strong className="item-role-title">{sess.role}</strong>
                    <span className="item-diff-badge">{sess.difficulty}</span>
                  </div>
                  <div className="item-meta-row">
                    <span>User Role: {sess.user_role}</span>
                    <span>•</span>
                    <span>Mode: {sess.practice_mode}</span>
                    <span>•</span>
                    <span>{dateStr}</span>
                  </div>
                </div>

                <div className="item-actions">
                  <button
                    className="btn-outline-small"
                    onClick={() => navigate(`/session/${sess.id}`)}
                  >
                    {isCompleted ? 'View Debrief & Replay' : 'Resume Session ➔'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
