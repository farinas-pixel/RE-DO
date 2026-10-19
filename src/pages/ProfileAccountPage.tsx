/**
 * ProfileAccountPage — Screen Type #17: Profile & Account
 * Matching exact Figma Screen 17:
 * - Header: Back arrow & "Profile & Account"
 * - User Hero Card: Avatar portrait + "Farinas Mumtaj H" + "farinas94@gmail.com" + "Edit Profile" link
 * - Account Navigation Items Stack:
 *   - Personal Information >
 *   - Security >
 *   - Linked Accounts >
 *   - Help & Support >
 * - Sign Out Button
 * - Authentic Supabase authentication integration preserved
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProfileAccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || 'Farinas Mumtaj H'
  );

  const userEmail = user?.email || 'farinas94@gmail.com';
  const initialLetters = displayName.substring(0, 2).toUpperCase() || 'FM';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const navRows = [
    { label: 'Personal Information', icon: '👤', path: '/settings' },
    { label: 'Security', icon: '🔒', path: '/settings' },
    { label: 'Linked Accounts', icon: '🔗', path: '/settings' },
    { label: 'Help & Support', icon: '💬', path: '/settings' },
  ];

  return (
    <div className="profile-page-root figma-screen-17">
      {/* Header matching Screen 17 */}
      <div className="figma-screen-header">
        <button className="back-nav-arrow" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Profile & Account</h2>
        </div>
        <div className="header-placeholder-action" />
      </div>

      <div className="profile-scroll-content">
        {/* User Hero Glass Card */}
        <div className="profile-hero-glass-card">
          <div className="avatar-ring-glow">
            <span className="avatar-letters">{initialLetters}</span>
          </div>
          <div className="profile-hero-info">
            <h3 className="profile-display-name">{displayName}</h3>
            <span className="profile-email-text">{userEmail}</span>
            <button
              className="edit-profile-text-link"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Done Editing' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="profile-edit-box">
            <label>Update Display Name:</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-glass-edit"
            />
          </div>
        )}

        {/* Account Section List */}
        <div className="profile-account-section">
          <span className="section-label-tiny">Account</span>
          <div className="account-nav-list-card">
            {navRows.map((row, idx) => (
              <div
                key={idx}
                className="account-nav-row"
                onClick={() => navigate(row.path)}
              >
                <div className="row-left">
                  <span className="row-icon">{row.icon}</span>
                  <span className="row-label">{row.label}</span>
                </div>
                <span className="row-chevron">›</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out Button matching Screen 17 */}
        <div className="profile-signout-wrapper">
          <button className="btn-figma-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
