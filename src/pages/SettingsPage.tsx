/**
 * SettingsPage — Screen Type #15: Settings & Safety
 * Matching exact Figma Screen 15:
 * - Header: Back arrow & "Settings & Safety"
 * - AI Persona Card: Friendly Coach portrait + "Friendly Coach" with "Change" button
 * - Accessibility Section:
 *   - Reduced Motion + toggle
 *   - Text Size (Normal dropdown/indicator)
 *   - High Contrast + toggle
 * - Safety Controls Section:
 *   - Data Privacy with "Manage" button
 *   - Secure Mode + toggle
 * - Real user settings and toggles preserved
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [aiPersona, setAiPersona] = useState('Friendly Coach');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textSize, setTextSize] = useState('Normal');
  const [highContrast, setHighContrast] = useState(false);
  const [secureMode, setSecureMode] = useState(true);

  return (
    <div className="settings-page figma-screen-15">
      {/* Header matching Screen 15 */}
      <div className="figma-screen-header">
        <button className="back-nav-arrow" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Settings & Safety</h2>
        </div>
        <div className="header-placeholder-action" />
      </div>

      <div className="settings-scroll-content">
        {/* AI Persona Card */}
        <div className="settings-section-card">
          <span className="section-label-tiny">AI Persona</span>
          <div className="ai-persona-row">
            <div className="persona-info-left">
              <div className="persona-avatar-circle">
                <span>👩‍💼</span>
              </div>
              <strong className="persona-name">{aiPersona}</strong>
            </div>
            <button
              className="btn-change-capsule"
              onClick={() =>
                setAiPersona(aiPersona === 'Friendly Coach' ? 'Direct Challenger' : 'Friendly Coach')
              }
            >
              Change
            </button>
          </div>
        </div>

        {/* Accessibility Section */}
        <div className="settings-section-card">
          <span className="section-label-tiny">Accessibility</span>
          <div className="settings-items-list">
            {/* Reduced Motion */}
            <div className="settings-item-row">
              <div className="item-label-group">
                <span className="item-icon">⚙️</span>
                <span>Reduced Motion</span>
              </div>
              <label className="switch-toggle-wrap">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={() => setReducedMotion(!reducedMotion)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Text Size */}
            <div className="settings-item-row">
              <div className="item-label-group">
                <span className="item-icon">🔤</span>
                <span>Text Size</span>
              </div>
              <select
                className="select-text-size"
                value={textSize}
                onChange={(e) => setTextSize(e.target.value)}
              >
                <option value="Small">Small</option>
                <option value="Normal">Normal</option>
                <option value="Large">Large</option>
              </select>
            </div>

            {/* High Contrast */}
            <div className="settings-item-row">
              <div className="item-label-group">
                <span className="item-icon">👁️</span>
                <span>High Contrast</span>
              </div>
              <label className="switch-toggle-wrap">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={() => setHighContrast(!highContrast)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Safety Controls Section */}
        <div className="settings-section-card">
          <span className="section-label-tiny">Safety Controls</span>
          <div className="settings-items-list">
            {/* Data Privacy */}
            <div className="settings-item-row">
              <div className="item-label-group">
                <span className="item-icon">🛡️</span>
                <span>Data Privacy</span>
              </div>
              <button
                className="btn-manage-capsule-sm"
                onClick={() => navigate('/memory-vault')}
              >
                Manage
              </button>
            </div>

            {/* Secure Mode */}
            <div className="settings-item-row">
              <div className="item-label-group">
                <span className="item-icon">🔒</span>
                <span>Secure Mode</span>
              </div>
              <label className="switch-toggle-wrap">
                <input
                  type="checkbox"
                  checked={secureMode}
                  onChange={() => setSecureMode(!secureMode)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
