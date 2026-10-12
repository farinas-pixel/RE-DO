import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, signOut, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [ttsVoice, setTtsVoice] = useState('English (Female)');
  const [reducedMotion, setReducedMotion] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await resetPassword(user.email);
    if (error) {
      setPasswordStatus('Error: ' + error.message);
    } else {
      setPasswordStatus('Password reset email sent! Check your inbox.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <span className="badge category-badge">System Preferences</span>
        <h1 className="settings-title">Application Settings</h1>
        <p className="settings-sub">
          Manage your account credentials, voice preferences, accessibility features, and session defaults.
        </p>
      </header>

      <section className="settings-matrix">
        {/* Account Details */}
        <div className="settings-card">
          <h3>Account Credentials</h3>
          <div className="setting-row">
            <span>Signed-in Email:</span>
            <strong>{user?.email || 'N/A'}</strong>
          </div>
          <div className="setting-row">
            <span>User Unique ID:</span>
            <code>{user?.id || 'N/A'}</code>
          </div>

          {passwordStatus && (
            <div className="setting-alert" role="alert">
              {passwordStatus}
            </div>
          )}

          <div className="setting-actions-row">
            <button className="btn btn-outline" onClick={handlePasswordReset}>
              Send Password Reset Email
            </button>
            <button className="btn btn-outline signout-btn" onClick={handleSignOut}>
              Sign Out of RE:DO
            </button>
          </div>
        </div>

        {/* Voice & Audio Preferences */}
        <div className="settings-card">
          <h3>Speech & Audio Modalities</h3>
          <div className="setting-row">
            <span>Speech Synthesis Persona:</span>
            <select
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
              className="settings-select"
            >
              <option value="English (Female)">English (Natural Female - Maya Sharma)</option>
              <option value="English (Male)">English (Natural Male - Daniel Carter)</option>
              <option value="System Default">Browser System Default</option>
            </select>
          </div>
          <div className="setting-row">
            <span>Speech Recognition Engine:</span>
            <strong>Native Web Speech API (en-US)</strong>
          </div>
        </div>

        {/* Accessibility & Visual Settings */}
        <div className="settings-card">
          <h3>Accessibility & Performance</h3>
          <div className="setting-row">
            <span>Reduced Motion Preference:</span>
            <button
              className={`toggle-pill ${reducedMotion ? 'active' : ''}`}
              onClick={() => setReducedMotion(!reducedMotion)}
            >
              {reducedMotion ? 'Enabled (No 3D Parallax)' : 'Disabled (Full Cinematic)'}
            </button>
          </div>
          <div className="setting-row">
            <span>Theme:</span>
            <strong>Midnight Navy Glass (Default)</strong>
          </div>
        </div>
      </section>
    </div>
  );
};
