import React, { useState } from 'react';

interface OnboardingModalProps {
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onDismiss }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      icon: '🛡️',
      title: 'Practice Before High-Stakes Reality',
      desc: 'Whether confronting an engineering VP, negotiating compensation, or pitching venture partners—rehearse your articulation in an atmospheric simulation chamber first.',
    },
    {
      icon: '👥',
      title: 'Adaptive Opposing Counterparts',
      desc: 'Face realistic personas with specific objectives, pressure levels, and skepticism. Calibrate between Beginner, Intermediate, and Advanced difficulty.',
    },
    {
      icon: '🧠',
      title: 'On-Demand Pedagogical AI Coach',
      desc: 'Maya Sharma, your AI Coach, sits alongside your dialogue, providing live STAR model pointers, contextual hints, and exemplar responses without interrupting your flow.',
    },
    {
      icon: '🔒',
      title: 'Zero Data Harvesting & Strict Memory Control',
      desc: 'All speech recognition processes in-browser. Your memory vault is fully manageable—view, edit, or purge conversation records anytime.',
    },
  ];

  const currentData = steps[step - 1];

  return (
    <div className="modal-backdrop" onClick={onDismiss}>
      <div className="modal-card onboarding-card" onClick={(e) => e.stopPropagation()}>
        <div className="onboarding-stepper">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`stepper-dot ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-body">
          <div className="onboarding-icon-ring">{currentData.icon}</div>
          <h2 className="onboarding-title">{currentData.title}</h2>
          <p className="onboarding-desc">{currentData.desc}</p>
        </div>

        <div className="onboarding-actions">
          <button className="btn btn-outline" onClick={onDismiss}>
            Skip Briefing
          </button>
          {step < steps.length ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
              Continue ({step}/{steps.length}) →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onDismiss}>
              Launch RE:DO →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
