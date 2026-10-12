import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const MainNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/hub', label: '3D Hub', icon: '🔮' },
    { path: '/scenarios', label: 'Scenario Universe', icon: '🌌' },
    { path: '/progress', label: 'Progress Journey', icon: '📈' },
    { path: '/memory-vault', label: 'Memory & Vault', icon: '🛡️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <header className="global-app-header">
      <div className="header-brand-block">
        <Link to="/hub" className="redo-brand-link">
          <span className="brand-logo-text">RE:DO</span>
          <span className="brand-tagline-mini">Experience it before you face it</span>
        </Link>
      </div>

      <nav className="header-nav-menu" aria-label="Main application destinations">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`header-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {isActive && <span className="nav-active-pip" />}
            </Link>
          );
        })}
      </nav>

      <div className="header-user-block">
        <Link to="/settings" className="user-avatar-pill" title="Account profile">
          <span className="avatar-initials">
            {user?.email?.substring(0, 2).toUpperCase() || 'JD'}
          </span>
          <span className="user-presence-dot" />
        </Link>
      </div>
    </header>
  );
};
