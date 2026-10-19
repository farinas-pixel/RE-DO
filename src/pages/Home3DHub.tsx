import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CrystalOrb } from '@/components/CrystalOrb';
import { getScenarios, DEFAULT_SCENARIOS } from '@/services/sessionService';
import type { Scenario } from '@/types/database';

export const Home3DHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [loading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const scenRes = await getScenarios();
      if (scenRes.data && scenRes.data.length > 0) {
        setScenarios(scenRes.data);
      }
    };
    fetchData();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Farinas';
  const initialLetter = displayName.substring(0, 2).toUpperCase() || 'FA';

  const dailyChallengeScenario = scenarios.find(
    (s) => s.title.includes('Negotiation') || s.title.includes('Conflict')
  ) || scenarios[0];

  if (loading) {
    return (
      <div className="hub-3d-page">
        <div className="hub-hero-stage">
          <div className="cinematic-spinner" />
          <p>Connecting to RE:DO Simulation Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-3d-page figma-screen-04">
      {/* Top Bar matching Screen 04: Sparkle + RE:DO on Left, Avatar on Right */}
      <div className="figma-top-bar">
        <div className="figma-brand-title">
          <span className="brand-sparkle-glyph">✨</span>
          <span className="brand-name-bold">RE:DO</span>
        </div>
        <Link to="/profile" className="figma-avatar-circle" title="Profile">
          <span>{initialLetter}</span>
          <span className="avatar-online-dot" />
        </Link>
      </div>

      {/* Greeting Header */}
      <div className="figma-greeting-block">
        <h2 className="figma-greeting-title">Good morning, {displayName}</h2>
        <p className="figma-greeting-sub">Small steps create big changes</p>
      </div>

      {/* Signature 3D Liquid Crystal Orb Showcase */}
      <div className="figma-orb-stage">
        <div className="figma-orb-glow-backdrop" />
        <CrystalOrb size={260} interactive={true} />
      </div>

      {/* Today's Challenge Floating Capsule Card */}
      <div className="figma-challenge-card">
        <div className="challenge-card-info">
          <span className="challenge-label-caps">Today's Challenge</span>
          <h4 className="challenge-headline">Speak with confidence</h4>
        </div>
        <button
          className="btn-challenge-pill"
          onClick={() => {
            if (dailyChallengeScenario) {
              navigate(`/scenarios/${dailyChallengeScenario.id}`);
            } else {
              navigate('/scenarios');
            }
          }}
        >
          Start Now
        </button>
      </div>

      {/* Quick Actions Grid matching Screen 04 */}
      <div className="figma-quick-actions-section">
        <h3 className="section-title-muted">Quick Actions</h3>
        <div className="quick-actions-grid-4">
          <button className="quick-action-item" onClick={() => navigate('/scenarios')}>
            <div className="quick-action-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" fill="var(--dream-pink)" />
                <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-25 12 12)" />
                <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(25 12 12)" />
              </svg>
            </div>
            <span className="quick-action-label">Scenarios</span>
          </button>

          <button className="quick-action-item" onClick={() => navigate('/progress')}>
            <div className="quick-action-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="14" width="4" height="7" rx="1" fill="var(--dream-pink)" />
                <rect x="10" y="9" width="4" height="12" rx="1" fill="var(--dream-pink)" />
                <rect x="17" y="4" width="4" height="17" rx="1" fill="var(--dream-pink)" />
              </svg>
            </div>
            <span className="quick-action-label">Progress</span>
          </button>

          <button className="quick-action-item" onClick={() => navigate('/memory-vault')}>
            <div className="quick-action-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path d="M7 8h10M7 12h10M7 16h6" />
              </svg>
            </div>
            <span className="quick-action-label">Memory</span>
          </button>

          <button className="quick-action-item" onClick={() => navigate('/settings')}>
            <div className="quick-action-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span className="quick-action-label">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
