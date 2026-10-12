import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CrystalOrb } from '@/components/CrystalOrb';
import { getScenarios, getUserSessions } from '@/services/sessionService';
import type { Scenario, Session } from '@/types/database';
import { getScenarioTheme } from '@/lib/scenarioThemes';

export const Home3DHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [scenRes, sessRes] = await Promise.all([
        getScenarios(),
        getUserSessions(),
      ]);
      if (scenRes.data) setScenarios(scenRes.data);
      if (sessRes.data) setSessions(sessRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const lastActiveSession = sessions.find((s) => s.status === 'in_progress');
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
    <div className="hub-3d-page">
      {/* Central Luminous Holographic Crystal Orb Showcase */}
      <section className="hub-hero-stage">
        <div className="hub-orb-anchor">
          <CrystalOrb size={300} interactive={true} />
        </div>

        <div className="hub-hero-text">
          <span className="hub-welcome-badge">
            ⚡ Welcome, {user?.email?.split('@')[0] || 'Practitioner'}
          </span>
          <h1 className="hub-hero-title">What would you like to practise today?</h1>
          <p className="hub-hero-subtitle">
            Select a high-stakes conversation scenario or step into Guided Calibration. Experience the friction before you face it in reality.
          </p>

          <div className="hub-cta-button-row">
            <button
              className="btn btn-primary hub-primary-btn"
              onClick={() => navigate('/scenarios')}
            >
              🌌 Explore Scenario Universe
            </button>
            {lastActiveSession ? (
              <button
                className="btn btn-outline hub-resume-btn"
                onClick={() => navigate(`/session/${lastActiveSession.id}`)}
              >
                ▶️ Resume Last Rehearsal
              </button>
            ) : (
              <button
                className="btn btn-outline"
                onClick={() => navigate('/scenarios')}
              >
                ⚡ Quick Start Simulation
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid: Daily Challenge + Resumable Session + Quick Actions */}
      <section className="hub-dashboard-matrix">
        {/* Daily Challenge Card */}
        {dailyChallengeScenario && (
          <div className="hub-card daily-challenge-card">
            <div className="card-top-tag">
              <span className="daily-icon">🎯</span>
              <span className="daily-label">Daily Curated Challenge</span>
            </div>
            <h3 className="challenge-title">{dailyChallengeScenario.title}</h3>
            <p className="challenge-desc">{dailyChallengeScenario.description}</p>
            <div className="challenge-meta">
              <span>Counterpart: <strong>{dailyChallengeScenario.role}</strong></span>
              <span>Difficulty: <strong>{dailyChallengeScenario.difficulty}</strong></span>
            </div>
            <button
              className="btn btn-primary challenge-start-btn"
              onClick={() => navigate('/scenarios')}
            >
              Accept Challenge Rehearsal →
            </button>
          </div>
        )}

        {/* Practice Stats Overview */}
        <div className="hub-card stats-overview-card">
          <div className="card-top-tag">
            <span className="daily-icon">📊</span>
            <span className="daily-label">Rehearsal Evolution</span>
          </div>
          <div className="stats-metric-row">
            <div className="metric-box">
              <span className="metric-number">{sessions.length}</span>
              <span className="metric-label">Completed Sessions</span>
            </div>
            <div className="metric-box">
              <span className="metric-number">
                {sessions.filter((s) => s.status === 'completed').length}
              </span>
              <span className="metric-label">Evaluated Transcripts</span>
            </div>
            <div className="metric-box">
              <span className="metric-number">10</span>
              <span className="metric-label">Universe Scenarios</span>
            </div>
          </div>
          <p className="metric-explainer">
            All session metrics derived from real database records in your Supabase vault.
          </p>
          <Link to="/progress" className="stats-link">
            View Skill Evolution Map →
          </Link>
        </div>
      </section>

      {/* Floating Curated Scenario Previews */}
      <section className="hub-curated-previews">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Featured Roleplay Chambers</h2>
            <p className="section-sub">Immediate access to critical interpersonal simulations</p>
          </div>
          <Link to="/scenarios" className="see-all-link">
            See all 10 scenarios →
          </Link>
        </div>

        <div className="curated-preview-grid">
          {scenarios.slice(0, 3).map((scenario) => {
            const theme = getScenarioTheme(scenario.title);
            return (
              <div
                key={scenario.id}
                className="curated-preview-card"
                style={{
                  background: theme.gradientBackground,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                onClick={() => navigate('/scenarios')}
              >
                <div className="preview-top">
                  <span className="badge category-badge">{scenario.category}</span>
                  <span className="preview-env">{theme.iconSymbol} {theme.environmentBadge}</span>
                </div>
                <h4 className="preview-title">{scenario.title}</h4>
                <p className="preview-desc">{scenario.description.slice(0, 110)}...</p>
                <div className="preview-role-foot">
                  <span>Speaking with: <strong>{scenario.role}</strong></span>
                  <span className="card-arrow">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
