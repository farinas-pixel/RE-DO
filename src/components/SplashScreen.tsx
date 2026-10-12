import React, { useState } from 'react';
import { CrystalOrb } from '@/components/CrystalOrb';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);

  const handleEnter = () => {
    setIsFading(true);
    setTimeout(onComplete, 600);
  };

  return (
    <div className={`splash-screen-container ${isFading ? 'fade-out' : ''}`}>
      <div className="splash-lighting-glow" />
      <div className="splash-content-stack">
        <div className="splash-orb-frame">
          <CrystalOrb size={260} interactive={true} />
        </div>

        <div className="splash-brand-block">
          <span className="splash-script-tag">Experience it</span>
          <h1 className="splash-brand-title">RE:DO</h1>
          <p className="splash-tagline">Before you face it in real life.</p>
        </div>

        <p className="splash-subtext">
          High-fidelity conversation simulations, interview defenses, and strategic decisions in an immersive, safe environment.
        </p>

        <button className="btn btn-primary splash-launch-btn" onClick={handleEnter}>
          Enter Simulation Hub →
        </button>
      </div>
    </div>
  );
};
