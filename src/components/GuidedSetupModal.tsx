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

const COUNTERPARTS = [
  {
    role: 'Alex Vance (Manager)',
    title: 'Manager',
    description: 'Direct, results-oriented, expects clear facts and structured reasoning.',
    avatar: '👔',
  },
  {
    role: 'Sarah Jenkins (Colleague)',
    title: 'Colleague',
    description: 'Collaborative and friendly, but protective of team workload and scope.',
    avatar: '👥',
  },
  {
    role: 'David Miller (Client)',
    title: 'Client',
    description: 'Demanding, cost-conscious, seeking immediate value and risk guarantees.',
    avatar: '💼',
  },
  {
    role: 'Elena Rostova (Team Member)',
    title: 'Team Member',
    description: 'Empathetic, values psychological safety, but sensitive to critical feedback.',
    avatar: '🤝',
  },
];

const TOTAL_STEPS = 4;

export function GuidedSetupModal({
  scenario,
  onClose,
  onStart,
  isStarting,
  startError,
}: GuidedSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCounterpart, setSelectedCounterpart] = useState(scenario.role || 'Alex Vance (Manager)');
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
    scenario.role = selectedCounterpart;
    await onStart({
      difficulty,
      practiceMode,
      coachingPreference,
    });
  };

  return (
    <div className="modal-backdrop-cinematic" onClick={() => !isStarting && onClose()} role="dialog" aria-modal="true">
      <div
        className="modal-container-glass cinematic-modal figma-screen-07-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderTop: `2px solid ${theme.accentColor}`,
          boxShadow: `0 24px 64px -12px rgba(0,0,0,0.8), 0 0 32px -4px ${theme.glowColor}`,
        }}
      >
        {/* Screen 07 Header with Stepper Dots */}
        <div className="figma-screen-header guided-setup-header">
          <button
            className="back-nav-arrow"
            onClick={currentStep > 1 ? handlePrev : onClose}
            aria-label="Back"
          >
            ‹
          </button>
          <div className="screen-header-titles">
            <h2 className="screen-title-primary">Guided Setup</h2>
          </div>
          <div className="header-stepper-dots">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`step-dot ${currentStep === step ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body Stages */}
        <div className="modal-body cinematic-modal-body">
          {startError && (
            <div className="auth-error" role="alert">
              <strong>Initialization Error:</strong> {startError}
            </div>
          )}

          {/* STEP 1: Choose your counterpart (Figma Screen 07) */}
          {currentStep === 1 && (
            <div className="step-content figma-screen-07-content">
              <h3 className="section-title">Choose your counterpart</h3>
              <p className="section-desc">
                Select who you will be interacting with during this practice session.
              </p>

              <div className="counterpart-selection-list">
                {COUNTERPARTS.map((cp) => {
                  const isSelected =
                    selectedCounterpart === cp.role ||
                    (selectedCounterpart.includes(cp.title) && !selectedCounterpart.includes('('));
                  return (
                    <div
                      key={cp.role}
                      className={`counterpart-select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedCounterpart(cp.role)}
                    >
                      <div className="cp-avatar-box">{cp.avatar}</div>
                      <div className="cp-info-box">
                        <strong className="cp-name">{cp.role}</strong>
                        <p className="cp-desc">{cp.description}</p>
                      </div>
                      <div className={`cp-radio-circle ${isSelected ? 'active' : ''}`}>
                        {isSelected && <span className="cp-radio-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Difficulty Calibration */}
          {currentStep === 2 && (
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

          {/* STEP 3: Input & Audio Mode */}
          {currentStep === 3 && (
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

          {/* STEP 4: Coaching Preference */}
          {currentStep === 4 && (
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
