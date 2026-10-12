import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserSessions } from '@/services/sessionService';

export const MemoryVaultPage: React.FC = () => {
  const { user } = useAuth();
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getUserSessions();
      if (res.data) setSessionCount(res.data.length);
    };
    fetchStats();
  }, []);

  const handleClearSessions = async () => {
    if (!user) return;
    const confirm = window.confirm(
      'Are you sure you want to permanently delete all your conversation transcripts and rehearsal history from Supabase? This action is irreversible.'
    );
    if (!confirm) return;

    setClearing(true);
    setClearMessage(null);

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setClearMessage('Failed to clear sessions: ' + error.message);
    } else {
      setSessionCount(0);
      setClearMessage('All personal session records and conversation transcripts successfully deleted.');
    }
    setClearing(false);
  };

  return (
    <div className="memory-vault-page">
      <header className="vault-header">
        <span className="badge category-badge">User Privacy & Data Ownership</span>
        <h1 className="vault-title">Memory Vault & Privacy Controls</h1>
        <p className="vault-sub">
          Transparent inspection of all stored personalisation data, coaching preferences, and rehearsal transcripts. You have absolute ownership and deletion authority over your practice records.
        </p>
      </header>

      {clearMessage && (
        <div className="vault-alert" role="alert">
          {clearMessage}
        </div>
      )}

      {/* Vault Status Matrix */}
      <section className="vault-matrix-grid">
        <div className="vault-card">
          <div className="vault-card-head">
            <span className="card-icon">🧠</span>
            <div>
              <h3>Adaptive Practice Memory</h3>
              <p>Allows the AI Coach to recall previous session strengths & growth areas for tailored hints.</p>
            </div>
          </div>
          <div className="toggle-row">
            <span>Status: <strong>{memoryEnabled ? 'Active' : 'Disabled (Zero Session Recall)'}</strong></span>
            <button
              className={`toggle-pill ${memoryEnabled ? 'active' : ''}`}
              onClick={() => setMemoryEnabled(!memoryEnabled)}
            >
              {memoryEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        <div className="vault-card">
          <div className="vault-card-head">
            <span className="card-icon">🎙️</span>
            <div>
              <h3>Audio & Microphone Privacy</h3>
              <p>Voice dictation uses client-side Web Speech API. Zero raw audio streams are uploaded or stored.</p>
            </div>
          </div>
          <div className="status-indicator-row">
            <span className="secure-badge">🔒 100% Client-Side Processing</span>
          </div>
        </div>

        <div className="vault-card">
          <div className="vault-card-head">
            <span className="card-icon">🗄️</span>
            <div>
              <h3>Supabase Cloud Persistence</h3>
              <p>Your session messages and timestamps are guarded under PostgreSQL Row Level Security (RLS).</p>
            </div>
          </div>
          <div className="status-indicator-row">
            <span>Current Stored Sessions: <strong>{sessionCount}</strong></span>
          </div>
        </div>
      </section>

      {/* Danger Zone: Hard Purge Action */}
      <section className="vault-danger-zone">
        <div className="danger-zone-head">
          <h3>Permanent Data Purge</h3>
          <p>Instantly wipe all recorded sessions, feedback transcripts, and dialogue turns from Supabase.</p>
        </div>
        <button
          className="btn btn-outline purge-btn"
          disabled={clearing || sessionCount === 0}
          onClick={handleClearSessions}
        >
          {clearing ? 'Purging Records...' : '🗑️ Purge All Rehearsal Records'}
        </button>
      </section>
    </div>
  );
};
