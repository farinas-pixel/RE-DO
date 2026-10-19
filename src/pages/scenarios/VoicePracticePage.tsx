/**
 * VoicePracticePage — Screen Type #09: Voice Practice
 * Displays:
 * - Back button & Screen title: "Voice Practice" / "Speak naturally"
 * - Signature Luminous 3D Microphone Orb with animated soundwave rings
 * - Real-time Voice Audio Visualizer waves
 * - Listening status ("Listening... Tap to stop")
 * - Text Toggle button & End Session button
 * - Native Web Speech API integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from '@/services/speechService';

export const VoicePracticePage: React.FC = () => {
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError('Speech recognition is not supported on this browser. Use text input.');
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer({
      onResult: (res) => {
        setTranscript((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
      },
      onError: (err) => {
        setError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
      onStart: () => {
        setIsListening(true);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch {
        setIsListening(false);
      }
    }

    return () => {
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  const toggleMic = () => {
    if (isListening) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      setIsListening(false);
    } else {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.start();
          setIsListening(true);
        } catch { /* ignore */ }
      }
    }
  };

  return (
    <div className="voice-practice-page figma-screen-09">
      {/* Header matching Screen 09 */}
      <div className="figma-screen-header">
        <button className="back-nav-arrow" onClick={() => navigate(-1)}>
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Voice Practice</h2>
          <p className="screen-subtitle-muted">Speak naturally</p>
        </div>
        <div className="header-placeholder-action" />
      </div>

      {/* Central 3D Microphone Orb Stage */}
      <div className="voice-orb-stage">
        <div className={`voice-microphone-orb ${isListening ? 'listening-pulse' : ''}`} onClick={toggleMic}>
          <div className="voice-orb-glow" />
          <div className="voice-mic-core">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <div className="voice-orbit-rings">
            <span className="ring-1" />
            <span className="ring-2" />
          </div>
        </div>
      </div>

      {/* Dynamic Soundwave Visualizer */}
      <div className="soundwave-container">
        <div className={`soundwave-bars ${isListening ? 'active' : ''}`}>
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 7) * 0.1}s` }} />
          ))}
        </div>
        <div className="listening-prompt">
          <span className="listening-state-text">
            {isListening ? 'Listening...' : 'Tap mic to resume'}
          </span>
          <span className="listening-sub-hint">Tap to stop</span>
        </div>
      </div>

      {/* Captured Transcript Display */}
      {transcript && (
        <div className="voice-transcript-card">
          <p>{transcript}</p>
        </div>
      )}

      {error && (
        <div className="voice-error-card">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Action Buttons matching Screen 09 */}
      <div className="voice-actions-row">
        <button
          className="btn-text-mode"
          onClick={() => navigate('/scenarios')}
        >
          <span className="icon">💬</span>
          <span>Text</span>
        </button>

        <button
          className="btn-end-recording"
          onClick={() => navigate('/decision-branches')}
        >
          End
        </button>
      </div>
    </div>
  );
};
