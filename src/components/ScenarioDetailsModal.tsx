/**
 * ScenarioDetailsModal — Dedicated Screen Type #06: Scenario Details
 * Displays situation description, objectives, counterpart personality,
 * difficulty tier, environmental context, and primary "Begin Rehearsal" action.
 */

import React from 'react';
import type { Scenario } from '@/types/database';
import { getScenarioTheme } from '@/lib/scenarioThemes';

interface ScenarioDetailsModalProps {
  scenario: Scenario | null;
  isOpen: boolean;
  onClose: () => void;
  onStartRehearsal: (scenario: Scenario) => void;
}

export const ScenarioDetailsModal: React.FC<ScenarioDetailsModalProps> = ({
  scenario,
  isOpen,
  onClose,
  onStartRehearsal,
}) => {
  if (!isOpen || !scenario) return null;

  const theme = getScenarioTheme(scenario.title);

  return (
    <div className="modal-backdrop-cinematic" onClick={onClose}>
      <div
        className="modal-container-glass scenario-details-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="scenario-details-title"
      >
        <div
          className="scenario-details-hero"
          style={{ background: theme.gradientBackground }}
        >
          <div className="hero-top-row">
            <span className="hero-cat-tag">{scenario.category}</span>
            <span className="hero-diff-tag">{scenario.difficulty}</span>
          </div>
          <div className="hero-symbol-glow">{theme.iconSymbol}</div>
          <button className="close-btn-round" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </div>

        <div className="scenario-details-body">
          <h2 id="scenario-details-title" className="details-title">
            {scenario.title}
          </h2>
          <p className="details-summary">{scenario.description}</p>

          <div className="details-meta-grid">
            <div className="meta-card">
              <span className="meta-icon">👤</span>
              <div>
                <span className="meta-label">Your Target Role</span>
                <strong>Senior Candidate / Presenter</strong>
              </div>
            </div>
            <div className="meta-card">
              <span className="meta-icon">👥</span>
              <div>
                <span className="meta-label">Counterpart Persona</span>
                <strong>{scenario.role}</strong>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3 className="section-title">🎯 Rehearsal Objectives</h3>
            <ul className="details-goals-list">
              {scenario.goals.map((goal, idx) => (
                <li key={idx} className="goal-row">
                  <span className="goal-check">✓</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="details-section">
            <h3 className="section-title">🧠 Pedagogical Guidance</h3>
            <p className="pedagogical-hint">
              Maya Sharma (AI Coach) will monitor your structure using the STAR framework
              and provide real-time tactical interventions when pressure spikes.
            </p>
          </div>

          <div className="details-action-bar">
            <button className="btn-secondary" onClick={onClose}>
              Back to Universe
            </button>
            <button
              className="btn-primary-luminous"
              onClick={() => onStartRehearsal(scenario)}
            >
              Configure & Enter Rehearsal ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
