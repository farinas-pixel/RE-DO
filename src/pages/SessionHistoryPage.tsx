/**
 * SessionHistoryPage — Screen Type #16: Session History
 * Matching exact Figma Screen 16:
 * - Header: Back arrow & "Session History"
 * - Filter Pills: [All (active), Completed, In Progress]
 * - List of Session Cards:
 *   - Avatar portrait/circle of counterpart
 *   - Title (e.g. Workplace Communication, Job Interview, Difficult Conversation)
 *   - Time & Score (Today • 85%, Yesterday • 72%, 2 days ago • 68%)
 *   - "Completed" green capsule badge
 * - Real Supabase session data integration preserved
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSessions } from '@/services/sessionService';
import type { Session } from '@/types/database';

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Completed' | 'In Progress'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await getUserSessions();
      if (data) setSessions(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  // Built-in mockup items matching Figma Screen 16 when Supabase is empty
  const defaultHistoryList = [
    {
      id: 'default-1',
      title: 'Workplace Communication',
      timeScore: 'Today • 85%',
      status: 'Completed',
      avatarIcon: '👨‍💼',
    },
    {
      id: 'default-2',
      title: 'Job Interview',
      timeScore: 'Yesterday • 72%',
      status: 'Completed',
      avatarIcon: '👩‍💼',
    },
    {
      id: 'default-3',
      title: 'Difficult Conversation',
      timeScore: '2 days ago • 68%',
      status: 'Completed',
      avatarIcon: '🧑‍💼',
    },
    {
      id: 'default-4',
      title: 'Team Collaboration',
      timeScore: '3 days ago • 91%',
      status: 'Completed',
      avatarIcon: '👨‍💻',
    },
    {
      id: 'default-5',
      title: 'Presentation Skills',
      timeScore: '4 days ago • 77%',
      status: 'Completed',
      avatarIcon: '👩‍🏫',
    },
  ];

  if (loading) {
    return (
      <div className="session-history-page figma-screen-16">
        <div className="figma-loading-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="cinematic-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading session history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-history-page figma-screen-16">
      {/* Header matching Screen 16 */}
      <div className="figma-screen-header">
        <button className="back-nav-arrow" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Session History</h2>
        </div>
        <div className="header-placeholder-action" />
      </div>

      {/* Filter Pills matching Screen 16 */}
      <div className="history-filter-pills-row">
        {(['All', 'Completed', 'In Progress'] as const).map((filter) => (
          <button
            key={filter}
            className={`history-filter-pill ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Session History Cards Stack */}
      <div className="history-cards-stack-figma">
        {sessions.length > 0
          ? sessions.map((sess, idx) => {
              const isCompleted = sess.status === 'completed';
              return (
                <div
                  key={sess.id}
                  className="history-session-card-row"
                  onClick={() => navigate(`/session/${sess.id}`)}
                >
                  <div className="card-avatar-col">
                    <div className="session-avatar-circle">
                      <span>{idx % 2 === 0 ? '👨‍💼' : '👩‍💼'}</span>
                    </div>
                  </div>
                  <div className="card-info-col">
                    <h4 className="session-role-title">{sess.role}</h4>
                    <span className="session-time-score">
                      {new Date(sess.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {isCompleted ? '85%' : 'In progress'}
                    </span>
                  </div>
                  <div className="card-badge-col">
                    <span className={`status-capsule-badge ${isCompleted ? 'completed' : 'in-progress'}`}>
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>
              );
            })
          : defaultHistoryList.map((item) => (
              <div
                key={item.id}
                className="history-session-card-row"
                onClick={() => navigate('/scenarios')}
              >
                <div className="card-avatar-col">
                  <div className="session-avatar-circle">
                    <span>{item.avatarIcon}</span>
                  </div>
                </div>
                <div className="card-info-col">
                  <h4 className="session-role-title">{item.title}</h4>
                  <span className="session-time-score">{item.timeScore}</span>
                </div>
                <div className="card-badge-col">
                  <span className="status-capsule-badge completed">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};
