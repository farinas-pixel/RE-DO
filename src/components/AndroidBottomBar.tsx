/**
 * AndroidBottomBar — Portrait-first mobile navigation bar for RE:DO
 * Android-first touch targets (48px+), safe area inset support,
 * tactile haptic-inspired feedback, luminous Dream Pink & Crystal Violet active indicators.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const AndroidBottomBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/hub', label: '3D Hub', icon: '🔮' },
    { path: '/scenarios', label: 'Universe', icon: '🌌' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/history', label: 'History', icon: '📜' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="android-bottom-bar" aria-label="Mobile Navigation">
      <div className="bottom-bar-inner">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-bar-tab ${isActive ? 'active' : ''}`}
            >
              <div className="tab-icon-wrapper">
                <span className="tab-icon">{item.icon}</span>
                {isActive && <span className="tab-glow-indicator" />}
              </div>
              <span className="tab-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
