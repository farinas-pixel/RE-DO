/**
 * GuidedSetupModal Component
 *
 * Implements the 6-stage deliberate configuration sequence:
 * 1. Scenario Briefing: Situation, stakes, user role, counterpart role.
 * 2. Counterpart Profile: Communication style, motivations, and testing focus.
 * 3. Difficulty Selection: Beginner (guided feedback), Intermediate (realistic pace), Advanced (unforgiving pushback).
 * 4. Practice Mode: Text Roleplay vs. Voice Dictation (with native Web Speech check).
 * 5. Coaching Preference: Active Tutor (in-session strategic hints & corrections) vs. Pure Challenge Mode (uninterrupted trial).
 * 6. Start Rehearsal trigger with validation and anti-double-submission lock.
 */

import { useState } from 'react';
import type { Scenario, DifficultyLevel, PracticeMode } from '@/types/database';
import { getScenarioTheme } from '@/lib/scenarioThemes';
import { isSpeechRecognitionSupported } from '@/services/speechService';

export type CoachingPreference = 'guided' | 'challenge';

export interface SetupConfiguration {
  difficulty: DifficultyLevel;
  practiceMode: PracticeMode;
  coachingPreference: CoachingPreference;
}

interface GuidedSetupModalProps {
  scenario: Scenario;
  onClose: () => void;
  onStart: (config: SetupConfiguration) => Promise<void>;
  isStarting: boolean;
  startError: string | null;
}

const TOTAL_STEPS = 5;

export function GuidedSetupModal({
  scenario,
  onClose,
  onStart,
  isStarting,
  startError,
}: GuidedSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(scenario.difficulty);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('text');
  const [coachingPreference, setCoachingPreference] = useState<CoachingPreference>('guided');

  const theme = getScenarioTheme(scenario.title);
  const hasVoiceSupport = isSpeechRecognitionSupported();

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleLaunch = async () => {
    await onStart({
      difficulty,
      practiceMode,
      coachingPreference,
    });
  };

  return (
    <div className="modal-backdrop" onClick={() => !isStarting && onClose()} role="dialog" aria-modal="true">
      <div
        className="modal-card cinematic-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderTop: `2px solid ${theme.accentColor}`,
          boxShadow: `0 24px 64px -12px rgba(0,0,0,0.8), 0 0 32px -4px ${theme.glowColor}`,
        }}
      >
        {/* Header / Stepper */}
        <div className="modal-header">
          <div className="stepper-progress-wrap">
            <div className="stepper-meta">
              <span className="stepper-phase-pill" style={{ color: theme.accentColor, borderColor: theme.accentColor }}>
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <span className="stepper-title-pill">
                {currentStep === 1 && 'Scenario Briefing'}
                {currentStep === 2 && 'Counterpart Profile'}
                {currentStep === 3 && 'Difficulty Calibration'}
                {currentStep === 4 && 'Input & Audio Mode'}
                {currentStep === 5 && 'Tutor Coaching Preference'}
              </span>
            </div>
            <div className="stepper-bar-track">
              <div
                className="stepper-bar-fill"
                style={{
                  width: `${(currentStep / TOTAL_STEPS) * 100}%`,
                  background: theme.accentColor,
                }}
              />
            </div>
          </div>
          <button
            className="close-btn"
            disabled={isStarting}
            onClick={onClose}
            aria-label="Close setup modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Body Stages */}
        <div className="modal-body cinematic-modal-body">
          {startError && (
            <div className="auth-error" role="alert">
              <strong>Initialization Error:</strong> {startError}
            </div>
          )}

          {/* STEP 1: Scenario Briefing */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="scenario-badge-row">
                <span className="badge category-badge">{scenario.category}</span>
                <span className="badge environment-badge">{theme.environmentBadge}</span>
              </div>
              <h3 className="briefing-title">{scenario.title}</h3>
              <p className="briefing-context">{scenario.description}</p>

              <div className="briefing-roles-panel">
                <div className="role-chip counterpart-chip">
                  <span className="chip-tag">Speaking With</span>
                  <strong>{scenario.role}</strong>
                </div>
                <div className="role-chip user-chip">
                  <span className="chip-tag">Your Identity</span>
                  <strong>{scenario.user_role}</strong>
                </div>
              </div>

              <div className="objectives-panel">
                <h4 className="panel-subheading">Core Rehearsal Goals</h4>
                <ul className="goals-checklist">
                  {scenario.goals.map((g, idx) => (
                    <li key={idx}>
                      <span className="check-bullet" style={{ color: theme.accentColor }}>✓</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: Counterpart Profile */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="counterpart-hero-card" style={{ background: theme.gradientBackground }}>
                <div className="counterpart-avatar-ring" style={{ borderColor: theme.accentColor }}>
                  <span className="avatar-icon">{theme.iconSymbol}</span>
                </div>
                <div className="counterpart-details">
                  <span className="archetype-label">Roleplay Persona</span>
                  <h3 className="counterpart-name">{scenario.role}</h3>
                  <p className="counterpart-desc">{theme.counterpartArchetype}</p>
                </div>
              </div>

              <div className="instructions-callout">
                <h4 className="panel-subheading">Counterpart Behavioral Context</h4>
                <p>{scenario.scenario_instructions}</p>
              </div>

              {scenario.starter_prompts && scenario.starter_prompts.length > 0 && (
                <div className="starter-preview">
                  <span className="preview-label">Opening Dialogue Anchor:</span>
                  <blockquote className="starter-quote">"{scenario.starter_prompts[0]}"</blockquote>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Difficulty Calibration */}
          {currentStep === 3 && (
            <div className="step-content">
              <h3 className="section-title">Calibrate Pressure & Pacing</h3>
              <p className="section-desc">
                Choose the behavioral scrutiny level of your counterpart during this rehearsal.
              </p>

              <div className="selectable-cards-grid">
                {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((lvl) => {
                  const isSelected = difficulty === lvl;
                  return (
                    <div
                      key={lvl}
                      className={`selectable-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setDifficulty(lvl)}
                      style={{
                        borderColor: isSelected ? theme.accentColor : undefined,
                      }}
                    >
                      <div className="card-radio-indicator">
                        <span className={`custom-radio ${isSelected ? 'active' : ''}`} style={{ borderColor: isSelected ? theme.accentColor : undefined }}>
                          {isSelected && <span className="custom-radio-dot" style={{ background: theme.accentColor }} />}
                        </span>
                        <strong className="level-title">{lvl}</strong>
                      </div>
                      <p className="level-desc">
                        {lvl === 'Beginner' && 'Forgiving pacing, receptive counter-arguments, and structured prompt questions.'}
                        {lvl === 'Intermediate' && 'Realistic scrutiny, counter-questions on trade-offs, and professional skepticism.'}
                        {lvl === 'Advanced' && 'High-stakes pressure, rapid interruptions for vague answers, and uncompromising standards.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Input & Audio Mode */}
          {currentStep === 4 && (
            <div className="step-content">
              <h3 className="section-title">Select Interaction Modality</h3>
              <p className="section-desc">
                Choose how you want to articulate responses during your live roleplay session.
              </p>

              <div className="selectable-cards-grid">
                <div
                  className={`selectable-card ${practiceMode === 'text' ? 'selected' : ''}`}
                  onClick={() => setPracticeMode('text')}
                  style={{ borderColor: practiceMode === 'text' ? theme.accentColor : undefined }}
                >
                  <div className="card-radio-indicator">
                    <span className={`custom-radio ${practiceMode === 'text' ? 'active' : ''}`}>
                      {practiceMode === 'text' && <span className="custom-radio-dot" style={{ background: theme.accentColor }} />}
                    </span>
                    <strong className="level-title">⌨️ Text Rehearsal</strong>
                  </div>
                  <p className="level-desc">
                    Type deliberate, structured thoughts with keyboard input. Ideal for careful drafting and quiet environments.
                  </p>
                </div>

                <div
                  className={`selectable-card ${practiceMode === 'voice' ? 'selected' : ''} ${!hasVoiceSupport ? 'disabled' : ''}`}
                  onClick={() => hasVoiceSupport && setPracticeMode('voice')}
                  style={{ borderColor: practiceMode === 'voice' ? theme.accentColor : undefined }}
                >
                  <div className="card-radio-indicator">
                    <span className={`custom-radio ${practiceMode === 'voice' ? 'active' : ''}`}>
                      {practiceMode === 'voice' && <span className="custom-radio-dot" style={{ background: theme.accentColor }} />}
                    </span>
                    <strong className="level-title">🎙️ Native Voice Input</strong>
                  </div>
                  <p className="level-desc">
                    Speak aloud with real-time SpeechRecognition dictation. Speech converts to editable text before sending.
                  </p>
                  {!hasVoiceSupport && (
                    <span className="unsupported-pill">Unavailable on this browser engine</span>
                  )}
                </div>
              </div>

              <div className="system-transparency-note">
                🔒 <strong>Privacy Guarantee:</strong> All voice dictation runs locally via your browser engine. Zero raw audio recordings are stored or transmitted.
              </div>
            </div>
          )}

          {/* STEP 5: Coaching Preference */}
          {currentStep === 5 && (
            <div className="step-content">
              <h3 className="section-title">AI Tutor Coaching Preference</h3>
              <p className="section-desc">
                Choose how the RE:DO pedagogical engine assists you during active roleplay.
              </p>

              <div className="selectable-cards-grid">
                <div
                  className={`selectable-card ${coachingPreference === 'guided' ? 'selected' : ''}`}
                  onClick={() => setCoachingPreference('guided')}
                  style={{ borderColor: coachingPreference === 'guided' ? theme.accentColor : undefined }}
                >
                  <div className="card-radio-indicator">
                    <span className={`custom-radio ${coachingPreference === 'guided' ? 'active' : ''}`}>
                      {coachingPreference === 'guided' && <span className="custom-radio-dot" style={{ background: theme.accentColor }} />}
                    </span>
                    <strong className="level-title">🧠 Guided Rehearsal (Recommended)</strong>
                  </div>
                  <p className="level-desc">
                    The Tutor provides on-demand strategic hints, STAR framework reminders, and actionable follow-up analysis alongside counterpart speech.
                  </p>
                </div>

                <div
                  className={`selectable-card ${coachingPreference === 'challenge' ? 'selected' : ''}`}
                  onClick={() => setCoachingPreference('challenge')}
                  style={{ borderColor: coachingPreference === 'challenge' ? theme.accentColor : undefined }}
                >
                  <div className="card-radio-indicator">
                    <span className={`custom-radio ${coachingPreference === 'challenge' ? 'active' : ''}`}>
                      {coachingPreference === 'challenge' && <span className="custom-radio-dot" style={{ background: theme.accentColor }} />}
                    </span>
                    <strong className="level-title">⚔️ Pure Challenge Mode</strong>
                  </div>
                  <p className="level-desc">
                    Zero hints or interruptions during the dialogue. Face your counterpart under realistic pressure; full feedback generates upon completion.
                  </p>
                </div>
              </div>

              <div className="ready-summary-box" style={{ borderColor: theme.accentColor }}>
                <span className="summary-title">Ready to Enter Rehearsal</span>
                <p>
                  You are entering <strong>"{scenario.title}"</strong> as <strong>{scenario.user_role}</strong> facing <strong>{scenario.role}</strong> at <strong>{difficulty}</strong> difficulty.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="modal-actions cinematic-modal-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isStarting}
              onClick={handlePrev}
            >
              ← Back
            </button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: theme.accentColor, borderColor: theme.accentColor }}
              onClick={handleNext}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary launch-session-btn"
              disabled={isStarting}
              style={{
                background: theme.accentColor,
                boxShadow: `0 0 20px -2px ${theme.glowColor}`,
              }}
              onClick={handleLaunch}
            >
              {isStarting ? 'Initiating Simulation Chamber...' : '⚡ Launch Rehearsal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
