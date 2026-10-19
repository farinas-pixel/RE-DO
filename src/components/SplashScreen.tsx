import React, { useState, useEffect } from 'react';
import { CrystalOrb } from '@/components/CrystalOrb';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(onComplete, 400);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleEnter = () => {
    setIsFading(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div className={`splash-screen-container figma-screen-01 ${isFading ? 'fade-out' : ''}`} onClick={handleEnter}>
      {/* Background radial glow */}
      <div className="splash-lighting-glow" />

      <div className="splash-content-stack">
        {/* Real 3D Crystal Orb */}
        <div className="splash-orb-frame">
          <CrystalOrb size={280} interactive={true} />
        </div>

        {/* Brand identity matching Screen 01 */}
        <div className="splash-brand-block">
          <h1 className="splash-brand-title">RE:DO</h1>
          <p className="splash-tagline-practice">Practice Today</p>
          <p className="splash-tagline-grow">Grow Tomorrow</p>
        </div>

        {/* Ambient progress line */}
        <div className="splash-progress-track">
          <div className="splash-progress-fill" />
        </div>
      </div>
    </div>
  );
};
