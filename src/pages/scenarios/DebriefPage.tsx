/**
 * DebriefPage — Screen Type #12: Debrief
 * Displays:
 * - Back button & Screen title: "Debrief"
 * - Overall Performance Radial Progress Card (85% - Great progress!)
 * - Strengths List (Clear communication, Good structure, Confident tone)
 * - Growth Areas List (Manage filler words, Be more concise, Handle objections faster)
 * - "Next Session →" Action button
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const DebriefPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="debrief-page figma-screen-12">
      {/* Header */}
      <div className="figma-screen-header">
        <button className="back-nav-arrow" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Debrief</h2>
        </div>
        <div className="header-placeholder-action" />
      </div>

      {/* Main Glass Debrief Card matching Screen 12 */}
      <div className="debrief-glass-container">
        {/* Overall Performance Section with Radial Dial */}
        <div className="debrief-score-section">
          <span className="section-label-dim">Overall Performance</span>
          <div className="score-dial-row">
            <div className="score-circular-dial">
              <svg width="88" height="88" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#dialGrad)"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset="39.6"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="dial-value-center">
                <span className="dial-num">85%</span>
              </div>
            </div>
            <div className="score-dial-comment">
              <h4 className="comment-headline">Great progress!</h4>
              <p className="comment-sub">You exceeded the benchmark for conversational clarity.</p>
            </div>
          </div>
        </div>

        {/* Strengths Checklist matching Screen 12 */}
        <div className="debrief-rubric-block">
          <div className="rubric-header strengths-head">
            <span className="icon">🛡️</span>
            <h4>Strengths</h4>
          </div>
          <ul className="rubric-items-list">
            <li>
              <span className="bullet-check">✓</span>
              <span>Clear communication</span>
            </li>
            <li>
              <span className="bullet-check">✓</span>
              <span>Good structure</span>
            </li>
            <li>
              <span className="bullet-check">✓</span>
              <span>Confident tone</span>
            </li>
          </ul>
        </div>

        {/* Growth Areas Checklist matching Screen 12 */}
        <div className="debrief-rubric-block">
          <div className="rubric-header growth-head">
            <span className="icon">🎯</span>
            <h4>Growth Areas</h4>
          </div>
          <ul className="rubric-items-list">
            <li>
              <span className="bullet-growth">✓</span>
              <span>Manage filler words</span>
            </li>
            <li>
              <span className="bullet-growth">✓</span>
              <span>Be more concise</span>
            </li>
            <li>
              <span className="bullet-growth">✓</span>
              <span>Handle objections faster</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Action */}
      <div className="debrief-footer-action">
        <button
          className="btn-figma-primary"
          onClick={() => navigate('/scenarios')}
        >
          Next Session →
        </button>
      </div>
    </div>
  );
};
