/**
 * SessionCompletePage — Screen Type #11: Session Complete
 * Displays:
 * - 3D Luminous Crystalline Star / Octahedron Burst
 * - Headline: "Session Complete!" / "You did it, Farinas!"
 * - Metrics Card: Duration 12 min | Score 85%
 * - Inspirational Quote Card: "Progress isn't about being perfect. It's about showing up."
 * - "View Debrief →" action button leading to Screen 12: Debrief
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const SessionCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Farinas';

  return (
    <div className="session-complete-page figma-screen-11">
      {/* 3D Geometric Crystal Star Burst */}
      <div className="crystal-star-stage">
        <div className="crystal-star-glow" />
        <div className="crystal-star-gem">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
            {/* 8-pointed star crystal faceted geometry */}
            <path
              d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z"
              fill="url(#crystalGrad1)"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="1.5"
            />
            <path
              d="M50 20 L58 42 L80 50 L58 58 L50 80 L42 58 L20 50 L42 42 Z"
              fill="url(#crystalGrad2)"
              opacity="0.9"
            />
            <circle cx="50" cy="50" r="8" fill="#ffffff" filter="drop-shadow(0 0 12px #f472b6)" />
            <defs>
              <linearGradient id="crystalGrad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="crystalGrad2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="complete-headline-block">
        <h1 className="complete-title">Session Complete!</h1>
        <p className="complete-user-cheer">You did it, {displayName}!</p>
      </div>

      {/* Metrics Row (Duration 12 min | Score 85%) */}
      <div className="complete-metrics-row">
        <div className="complete-metric-card">
          <span className="metric-tag">Duration</span>
          <span className="metric-value">12 min</span>
        </div>
        <div className="complete-metric-card">
          <span className="metric-tag">Score</span>
          <span className="metric-value-score">85%</span>
        </div>
      </div>

      {/* Inspirational Quote Card */}
      <div className="complete-quote-card">
        <p className="quote-text">
          "Progress isn't about being perfect. It's about showing up."
        </p>
      </div>

      {/* Action Button matching Screen 11 */}
      <div className="complete-action-footer">
        <button
          className="btn-figma-primary"
          onClick={() => navigate('/debrief')}
        >
          View Debrief →
        </button>
      </div>
    </div>
  );
};
