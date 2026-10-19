/**
 * ScenarioDetailsModal — Dedicated Screen Type #06: Scenario Details
 * Displays situation description, objectives, counterpart personality,
 * difficulty tier, environmental context, and primary "Begin Rehearsal" action.
 */

import React from 'react';
import type { Scenario } from '@/types/database';

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

  return (
    <div className="modal-backdrop-cinematic" onClick={onClose}>
      <div
        className="modal-container-glass scenario-details-dialog figma-screen-06-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="scenario-details-title"
      >
        {/* Screen 06 Top Bar */}
        <div className="figma-screen-header details-modal-header">
          <button className="back-nav-arrow" onClick={onClose} aria-label="Back">
            ‹
          </button>
          <div className="screen-header-titles">
            <h2 className="screen-title-primary">Details</h2>
          </div>
          <button className="heart-icon-btn" aria-label="Favorite">
            ♡
          </button>
        </div>

        {/* Hero Photo Card */}
        <div className="details-hero-photo-container">
          <img
            src={`${import.meta.env.BASE_URL}workplace_meeting_ref.png`}
            alt={scenario.title}
            className="details-hero-photo"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Tag Pill Row */}
        <div className="details-tags-row">
          <span className="details-tag-pill active">Work</span>
          <span className="details-tag-pill">Social</span>
          <span className="details-tag-pill">{scenario.difficulty}</span>
          <span className="details-tag-pill">~15 mins</span>
        </div>

        <div className="scenario-details-body">
          <h2 id="scenario-details-title" className="details-title">
            {scenario.title}
          </h2>
          <p className="details-summary">{scenario.description}</p>

          {/* What you'll practice */}
          <div className="details-practice-checklist">
            <h3 className="checklist-heading">What you'll practice</h3>
            <ul className="details-goals-list">
              {scenario.goals.map((goal, idx) => (
                <li key={idx} className="goal-row">
                  <span className="goal-check">✓</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="details-action-bar">
            <button
              className="btn-primary-luminous start-setup-wide-btn"
              onClick={() => onStartRehearsal(scenario)}
            >
              Start Setup →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
