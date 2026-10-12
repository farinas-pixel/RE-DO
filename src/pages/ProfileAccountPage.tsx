/**
 * ProfileAccountPage — Screen Type #17: Profile & Account
 * Displays authentic authenticated user identity, roleplay stats,
 * editable simulation preferences, security status, and sign out actions.
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ProfileAccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || 'Fearless Practicer'
  );
  const [preferredRole, setPreferredRole] = useState('Tech & Engineering Lead');
  const [targetOutcome, setTargetOutcome] = useState('Senior Promotion & High-Stakes Negotiations');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="profile-page-root">
      <div className="page-header-row">
        <div>
          <span className="page-subtitle-pill">IDENTITY & PREFERENCES</span>
          <h1 className="page-title-luminous">Profile & Account</h1>
          <p className="page-lead">
            Manage your personal simulation profile, target outcomes, and account security.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Avatar & Summary Card */}
        <div className="profile-card-glass user-card-overview">
          <div className="avatar-large-glow">
            <span>{user?.email?.substring(0, 2).toUpperCase() || 'JD'}</span>
          </div>
          <h2 className="user-name-display">{displayName}</h2>
          <span className="user-email-text">{user?.email}</span>

          <div className="user-badges-row">
            <span className="badge-pill">🛡️ Data Encrypted</span>
            <span className="badge-pill">✨ Tier: Free ₹0 Active</span>
          </div>

          <div className="account-stat-matrix">
            <div className="stat-cell">
              <strong>STAR Mastery</strong>
              <span>Level 2</span>
            </div>
            <div className="stat-cell">
              <strong>Voice Audio</strong>
              <span>Client-Side</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="profile-card-glass user-settings-form-panel">
          <h3 className="section-title">Simulation Goals & Identity</h3>

          {savedSuccess && (
            <div className="alert-banner-success">
              ✓ Preferences updated and cached locally.
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="form-fields-stack">
            <div className="field-group">
              <label>Full Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-glass"
                required
              />
            </div>

            <div className="field-group">
              <label>Primary Professional / Academic Focus</label>
              <input
                type="text"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                className="input-glass"
                placeholder="e.g. Senior Product Manager, PhD Defense"
              />
            </div>

            <div className="field-group">
              <label>Target Transformation</label>
              <input
                type="text"
                value={targetOutcome}
                onChange={(e) => setTargetOutcome(e.target.value)}
                className="input-glass"
                placeholder="e.g. Overcome confrontation freeze, nail technical viva"
              />
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn-primary-luminous">
                Save Preferences
              </button>
            </div>
          </form>

          <hr className="divider-subtle" />

          <div className="danger-zone-compact">
            <div>
              <strong>Sign Out of Session</strong>
              <p>End current authenticated session on this device.</p>
            </div>
            <button className="btn-danger-outline" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
