/**
 * AndroidBottomBar — Portrait-first mobile navigation bar for RE:DO
 * Accurately styled with Figma vector iconography:
 * 1. 3D Hub (Luminous Crystal Orb icon)
 * 2. Universe (Atom / Orbit rings icon)
 * 3. Progress (Rising analytics bar chart icon)
 * 4. History (Chronological scroll / clock history icon)
 * 5. Profile (User avatar silhouette icon)
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const AndroidBottomBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/hub',
      label: '3D Hub',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <circle cx="12" cy="12" r="7.5" fill={active ? "rgba(244,114,182,0.25)" : "none"} />
          <ellipse cx="12" cy="12" rx="10" ry="4" strokeDasharray="1 1" />
          <circle cx="12" cy="12" r="3" fill={active ? "var(--dream-pink)" : "currentColor"} />
        </svg>
      ),
    },
    {
      path: '/scenarios',
      label: 'Universe',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <circle cx="12" cy="12" r="4" fill={active ? "var(--dream-pink)" : "none"} />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-25 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(25 12 12)" />
        </svg>
      ),
    },
    {
      path: '/progress',
      label: 'Progress',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <rect x="3" y="14" width="4" height="7" rx="1" fill={active ? "var(--dream-pink)" : "none"} />
          <rect x="10" y="9" width="4" height="12" rx="1" fill={active ? "var(--dream-pink)" : "none"} />
          <rect x="17" y="4" width="4" height="17" rx="1" fill={active ? "var(--dream-pink)" : "none"} />
        </svg>
      ),
    },
    {
      path: '/history',
      label: 'History',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" />
          <path d="M3.05 11a9 9 0 0 1 .5-2m-.5 2H6" />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" fill={active ? "var(--dream-pink)" : "none"} />
        </svg>
      ),
    },
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
                <span className="tab-icon-svg">{item.icon(isActive)}</span>
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
