import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrystalOrb } from '@/components/CrystalOrb';

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: 'Build Real Confidence',
      desc: 'Practice real-life scenarios, improve your communication, and grow at your own pace.',
    },
    {
      title: 'High-Stakes Scenarios',
      desc: 'Job interviews, salary negotiations, and tough conversations simulated with realistic counterparts.',
    },
    {
      title: 'Real-Time Coaching',
      desc: 'Get live guidance and STAR-framework tips from your pedagogical AI coach Maya Sharma.',
    },
  ];

  const current = steps[step - 1];

  const finishOnboarding = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/auth/login');
    }
  };

  const handleNext = () => {
    if (step < steps.length) {
      setStep((s) => s + 1);
    } else {
      finishOnboarding();
    }
  };

  return (
    <div className="onboarding-screen-root figma-screen-02">
      {/* Brand header */}
      <div className="onboarding-top-brand">
        <h2 className="brand-logo-text">RE:DO</h2>
      </div>

      {/* Floating 3D Orb */}
      <div className="onboarding-orb-stage">
        <CrystalOrb size={240} interactive={true} />
      </div>

      {/* Card Content Area matching Screen 02 */}
      <div className="onboarding-content-card">
        <h2 className="onboarding-title-bold">{current.title}</h2>
        <p className="onboarding-desc-text">{current.desc}</p>

        {/* Stepper Dots (4 dots matching Figma) */}
        <div className="onboarding-dots-row">
          {[1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={`stepper-dot-capsule ${dot === step ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Primary Next Button */}
        <button className="btn-figma-primary" onClick={handleNext}>
          Next →
        </button>

        {/* Skip button */}
        <button className="btn-skip-link" onClick={finishOnboarding}>
          Skip
        </button>
      </div>
    </div>
  );
};
