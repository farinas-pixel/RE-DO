/**
 * DecisionBranchesPage — Screen Type #10: Decision Branches
 * Displays:
 * - Back button & Screen title: "Choose Your Path" / "How would you respond?"
 * - Branch options with letters (A, B, C):
 *   A. Stay calm and ask for clarification
 *   B. Explain your perspective firmly
 *   C. Apologize and agree without discussion
 * - Active selection glow indicator
 * - "Continue →" action button leading to Session Complete
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const DecisionBranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState<'A' | 'B' | 'C'>('B');

  const branches = [
    {
      id: 'A' as const,
      num: '1.',
      text: 'Stay calm and ask for clarification',
      desc: 'De-escalate emotional friction and uncover hidden motives.',
    },
    {
      id: 'B' as const,
      num: '2.',
      text: 'Explain your perspective firmly',
      desc: 'Stand behind your data while maintaining professional composure.',
    },
    {
      id: 'C' as const,
      num: '3.',
      text: 'Apologize and agree without discussion',
      desc: 'Concede ground quickly to preserve stakeholder rapport.',
    },
  ];

  const handleContinue = () => {
    navigate('/session-complete', { state: { chosenBranch: selectedBranch } });
  };

  return (
    <div className="decision-branches-page figma-screen-10">
      {/* Header matching Screen 10 */}
      <div className="figma-screen-header">
        <button className="back-nav-arrow" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Choose Your Path</h2>
          <p className="screen-subtitle-muted">How would you respond?</p>
        </div>
        <div className="header-placeholder-action" />
      </div>

      {/* Decision Option Cards */}
      <div className="decision-options-stack">
        {branches.map((b) => {
          const isSelected = selectedBranch === b.id;
          return (
            <div
              key={b.id}
              className={`decision-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedBranch(b.id)}
            >
              <div className="option-letter-badge">
                <span className="letter">{b.id}.</span>
              </div>
              <div className="option-text-group">
                <h4 className="option-main-text">{b.text}</h4>
                <p className="option-sub-desc">{b.desc}</p>
              </div>
              <div className="option-radio-indicator">
                {isSelected && <span className="radio-dot-glow" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button matching Screen 10 */}
      <div className="decision-footer-action">
        <button className="btn-figma-primary" onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
};
