/**
 * LiveSessionPage — RE:DO Cockpit 3-Region Immersive Rehearsal Room
 *
 * Implements exact visual alignment with RE:DO Cockpit reference (media_1791787107927_f8ab9ec0.jpg):
 * 1. Top Bar: RE:DO wordmark, tagline, active room pill, progress tab, user avatar.
 * 2. Left Region (Scenario & Objectives):
 *    - Environmental thumbnail card with category & difficulty tags.
 *    - Scenario title & summary.
 *    - Role matrix (Your Role, Counterpart Role).
 *    - Interactive Practice Goals checklist with checkmarks.
 *    - Session Mode status card (Guided Rehearsal).
 *    - Bottom Voice & Audio toggle controls.
 * 3. Centre Region (AI Coach Stage):
 *    - Prominent AI Coach card ("Maya Sharma - Your AI Coach").
 *    - Status pills: Listening / Thinking / Speaking.
 *    - Realistic coach avatar portrait.
 *    - Coach guidance bubble.
 * 4. Right Region (Roleplay Partner Stage):
 *    - Prominent Partner card ("Daniel Carter - Property Manager / Counterpart").
 *    - Live status & audio wave indicator.
 *    - Live objectives counter (e.g. "2/3 completed").
 *    - Quick Action buttons ("Ask for a Hint", "Give me an Example", "Repeat Explanation").
 * 5. Bottom Dialogue Area:
 *    - Conversation / Objectives / Notes tabs.
 *    - Dialogue history stream with Coach avatars, User bubbles, and timestamps.
 *    - Message input form with Mic dictation button, Send arrow button, and End Session button.
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getSession,
  getSessionMessages,
  addSessionMessage,
  completeSession,
  getScenarioById,
} from '@/services/sessionService';
import type { Session, SessionMessage, Scenario } from '@/types/database';
import {
  generateContextualTurn,
  generatePostSessionReport,
  type RehearsalFeedbackReport,
  type TutorHint,
} from '@/lib/practiceEngine';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
} from '@/services/speechService';
import { AndroidBottomBar } from '@/components/AndroidBottomBar';

export function LiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Input states
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Branching Decision state
  const [decisionStage, setDecisionStage] = useState<number | null>(null);

  // Tutor states
  const [activeHint, setActiveHint] = useState<TutorHint | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [coachSpeechBubble, setCoachSpeechBubble] = useState<string>(
    "Hi there! I'm Maya, your AI coach. I'll guide you through this rehearsal, give you strategic tips, and provide feedback at the end."
  );
  const [postSessionReport, setPostSessionReport] = useState<RehearsalFeedbackReport | null>(null);

  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessionData = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    // 1. Fetch Session
    const { data: sessionData, error: sessionErr } = await getSession(sessionId);
    if (sessionErr || !sessionData) {
      setError(sessionErr || 'Session not found or access unauthorized.');
      setLoading(false);
      return;
    }
    setSession(sessionData);

    // 2. Fetch Scenario details if linked
    if (sessionData.scenario_id) {
      const { data: scenData } = await getScenarioById(sessionData.scenario_id);
      if (scenData) setScenario(scenData);
    }

    // 3. Fetch Messages
    const { data: msgs, error: msgsErr } = await getSessionMessages(sessionId);
    if (msgsErr) {
      setError(msgsErr);
    } else {
      setMessages(msgs || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSessionData();
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice Recognition Toggle
  const toggleRecording = () => {
    setVoiceError(null);

    if (isRecording) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch { /* ignore */ }
      }
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceError('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    const recognizer = createSpeechRecognizer({
      onResult: (result) => {
        setInputText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${result.transcript}` : result.transcript;
        });
      },
      onError: (err) => {
        setVoiceError(err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
      onStart: () => {
        setIsRecording(true);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Could not initialize microphone.';
        setVoiceError(msg);
        setIsRecording(false);
      }
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speakText(text, () => {
      setIsSpeaking(false);
    });
  };

  const handleRequestHint = () => {
    if (!scenario || !session) return;
    const userMsgCount = messages.filter((m) => m.sender === 'user').length + 1;
    const turnResult = generateContextualTurn({
      scenarioTitle: scenario.title,
      counterpartRole: session.role,
      userRole: session.user_role,
      difficulty: session.difficulty,
      userMessage: inputText || 'Evaluating strategic position',
      turnIndex: userMsgCount,
      goals: scenario.goals,
      coachingPreference: 'guided',
    });

    if (turnResult.tutorHint) {
      setActiveHint(turnResult.tutorHint);
      setCoachSpeechBubble(turnResult.tutorHint.strategy);
      setShowHintModal(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !sessionId || !session) return;

    if (isRecording && recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch { /* ignore */ }
      setIsRecording(false);
    }

    const userText = inputText.trim();
    setInputText('');
    setSending(true);
    setSendError(null);

    // 1. Persist user message to Supabase
    const { data: userMsg, error: userMsgErr } = await addSessionMessage(
      sessionId,
      'user',
      userText
    );

    if (userMsgErr || !userMsg) {
      setSendError(userMsgErr || 'Failed to submit message to Supabase.');
      setInputText(userText);
      setSending(false);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);

    // 2. Count prior user turns
    const userTurnCount = messages.filter((m) => m.sender === 'user').length + 1;

    // 3. Generate contextual counterpart turn & Coach observation
    const turnResult = generateContextualTurn({
      scenarioTitle: scenario?.title || 'Practice Scenario',
      counterpartRole: session.role,
      userRole: session.user_role,
      difficulty: session.difficulty,
      userMessage: userText,
      turnIndex: userTurnCount,
      goals: scenario?.goals || [],
      coachingPreference: 'guided',
    });

    // Update AI Coach speech bubble with constructive live coaching
    if (turnResult.tutorObservation) {
      setCoachSpeechBubble(turnResult.tutorObservation.replace(/^Tutor Note:\s*/, ''));
    }

    // Trigger branching decision on turn 2
    if (userTurnCount === 2) {
      setDecisionStage(1);
    }

    // 4. Persist counterpart response
    const { data: counterpartMsg, error: cpErr } = await addSessionMessage(
      sessionId,
      'assistant',
      turnResult.counterpartResponse,
      {
        role: session.role,
        isAiGenerated: false,
        tutorObservation: turnResult.tutorObservation,
      }
    );

    if (cpErr) {
      setSendError('Failed to record response turn: ' + cpErr);
    } else if (counterpartMsg) {
      setMessages((prev) => [...prev, counterpartMsg]);
      if (autoSpeak) {
        handleSpeak(counterpartMsg.content);
      }
    }

    setSending(false);
  };

  const handleBranchChoice = (choiceText: string) => {
    setInputText(choiceText);
    setDecisionStage(null);
  };

  const handleCompleteSession = async () => {
    if (!sessionId || !session || !scenario) return;
    const confirmFinish = window.confirm(
      'Are you ready to complete this rehearsal session and generate your comprehensive performance report?'
    );
    if (!confirmFinish) return;

    setIsFinishing(true);
    stopSpeaking();

    // 1. Mark completed in Supabase
    const { data: completedSess, error: compErr } = await completeSession(sessionId);

    if (compErr) {
      alert('Error updating session status in Supabase: ' + compErr);
      setIsFinishing(false);
      return;
    }

    if (completedSess) {
      setSession(completedSess);
      // 2. Generate comprehensive post-session report from actual user messages
      const userMsgs = messages.filter((m) => m.sender === 'user').map((m) => m.content);
      const report = generatePostSessionReport({
        scenarioTitle: scenario.title,
        role: session.role,
        difficulty: session.difficulty,
        goals: scenario.goals,
        userMessages: userMsgs,
      });
      setPostSessionReport(report);
    }

    setIsFinishing(false);
  };

  if (loading) {
    return (
      <div className="rehearsal-room-loading">
        <div className="cinematic-spinner" />
        <p>Initializing RE:DO Simulation Cockpit...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="rehearsal-room-error-box">
        <div className="catalogue-alert error">
          <h3>Simulation Chamber Disconnected</h3>
          <p>{error || 'Unable to access rehearsal session.'}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={loadSessionData}>
              Retry Connection
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/scenarios')}>
              Return to Universe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rehearsal-room-page figma-screen-08">
      {/* Header matching Screen 08 */}
      <header className="figma-screen-header">
        <button
          className="back-nav-arrow"
          onClick={() => navigate('/scenarios')}
          aria-label="Back to Scenarios"
        >
          ‹
        </button>
        <div className="screen-header-titles">
          <h2 className="screen-title-primary">Rehearsal Room</h2>
          <p className="screen-subtitle-muted">
            {scenario?.category || 'Workplace Communication'}
          </p>
        </div>
        <button
          className="menu-nav-dots"
          onClick={handleRequestHint}
          aria-label="AI Coach Hints"
          title="Coach Advice"
        >
          ⋮
        </button>
      </header>

      {/* Status Pill: Glowing dot + Listening... / Thinking... / Speaking... / Ready */}
      <div className="rehearsal-status-strip">
        <div
          className={`rehearsal-status-pill ${
            isRecording ? 'recording' : sending ? 'thinking' : isSpeaking ? 'speaking' : ''
          }`}
        >
          <span className="live-status-dot" />
          <span className="status-label-text">
            {isRecording
              ? 'Listening...'
              : sending
              ? 'Thinking...'
              : isSpeaking
              ? 'Speaking...'
              : 'Listening...'}
          </span>
        </div>
      </div>

      {/* AI Tutor Stage: Rounded glass card displaying /ai_tutor_character.png */}
      <div className="ai-tutor-main-card">
        <div className="ai-tutor-portrait-frame">
          <img
            src="/ai_tutor_character.png"
            alt="AI Coach"
            className="ai-tutor-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/nexa_ref.png';
            }}
          />
          <div className="ai-tutor-shimmer-ring" />
        </div>

        {/* Subtitle / Speech Bubble: "Take your time. I'm listening." */}
        <div className="ai-tutor-speech-bubble">
          <p className="bubble-text">
            {coachSpeechBubble || "Take your time. I'm listening."}
          </p>
        </div>
      </div>

      {/* Dialogue Stream */}
      <div className="rehearsal-dialogue-stream">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`dialogue-bubble-row ${isUser ? 'user-turn' : 'counterpart-turn'}`}
            >
              <div className="dialogue-bubble">
                <div className="bubble-meta">
                  <span className="bubble-speaker-tag">
                    {isUser ? 'You' : session.role}
                  </span>
                  <span className="bubble-time">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="bubble-content-text">{msg.content}</p>
                {!isUser && isSpeechSynthesisSupported() && (
                  <button
                    type="button"
                    className="mini-speak-btn"
                    onClick={() => handleSpeak(msg.content)}
                  >
                    🗣️ Read Aloud
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Branching Decision Choice */}
        {decisionStage === 1 && (
          <div className="decision-branch-prompt-card">
            <span className="branch-badge">⚡ Decision Branch</span>
            <p className="branch-title">Choose your tactical response:</p>
            <div className="branch-btns-group">
              <button
                className="branch-option-btn"
                onClick={() =>
                  handleBranchChoice(
                    'I understand the concern. To mitigate risk, we established automated canary rollouts and benchmarked our rollback procedures.'
                  )
                }
              >
                Option A: De-escalate with canary benchmarks
              </button>
              <button
                className="branch-option-btn"
                onClick={() =>
                  handleBranchChoice(
                    'Our architecture prioritizes immediate performance wins over legacy caution.'
                  )
                }
              >
                Option B: Assertive velocity defense
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Notices */}
      {voiceError && <div className="tray-alert error" style={{ padding: '0.35rem 0.75rem', color: '#f87171', fontSize: '0.75rem', textAlign: 'center' }}>⚠️ {voiceError}</div>}
      {sendError && <div className="tray-alert error" style={{ padding: '0.35rem 0.75rem', color: '#f87171', fontSize: '0.75rem', textAlign: 'center' }}>⚠️ {sendError}</div>}

      {/* Quick Text Input Form */}
      {session.status === 'in_progress' && (
        <form onSubmit={handleSendMessage} className="rehearsal-quick-input-bar">
          <input
            type="text"
            placeholder={
              isRecording
                ? 'Listening to speech... (speak now)'
                : 'Type your message or use mic below...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="rehearsal-send-btn"
            disabled={sending || !inputText.trim()}
            aria-label="Send message"
          >
            ➔
          </button>
        </form>
      )}

      {/* Bottom Floating Controls: Round Pause, Mic, End buttons */}
      <div className="rehearsal-bottom-controls-row">
        {/* Pause Button */}
        <button
          type="button"
          className="rehearsal-circle-btn pause-btn"
          onClick={() => {
            if (isSpeaking) stopSpeaking();
            if (isRecording) toggleRecording();
          }}
          title="Pause"
          aria-label="Pause session"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="2" />
            <rect x="14" y="4" width="4" height="16" rx="2" />
          </svg>
        </button>

        {/* Center Round Purple Mic Button */}
        <button
          type="button"
          className={`rehearsal-circle-btn mic-btn-primary ${
            isRecording ? 'is-recording-pulsing' : ''
          }`}
          onClick={toggleRecording}
          title={isRecording ? 'Stop Recording' : 'Voice Input'}
          aria-label="Toggle Microphone"
        >
          <span className="mic-outer-ring" />
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>

        {/* End Session Button */}
        <button
          type="button"
          className="rehearsal-circle-btn end-btn"
          onClick={handleCompleteSession}
          disabled={isFinishing}
          title="End Rehearsal"
          aria-label="End Rehearsal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="3" />
          </svg>
        </button>
      </div>

      {/* 5-Tab Android Navigation Bar */}
      <AndroidBottomBar />

      {/* Tutor Hint Modal */}
      {showHintModal && activeHint && (
        <div className="modal-backdrop" onClick={() => setShowHintModal(false)}>
          <div className="modal-card tutor-hint-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💡 AI Coach Strategic Advice</h3>
              <button className="close-btn" onClick={() => setShowHintModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="hint-section">
                <span className="hint-label">Strategic Focus</span>
                <p>{activeHint.strategy}</p>
              </div>
              <div className="hint-section">
                <span className="hint-label">Recommended Response Framework</span>
                <p><strong>{activeHint.recommendedFramework}</strong></p>
              </div>
              <div className="hint-section">
                <span className="hint-label">Suggested Articulation Anchor</span>
                <blockquote className="starter-quote">{activeHint.suggestedOpeningPhrase}</blockquote>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!inputText) setInputText(activeHint.suggestedOpeningPhrase.replace(/^"|"$/g, ''));
                  setShowHintModal(false);
                }}
              >
                Use Suggestion & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Session Performance Report Modal */}
      {postSessionReport && (
        <div className="modal-backdrop" onClick={() => setPostSessionReport(null)}>
          <div className="modal-card report-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge category-badge">Rehearsal Debrief</span>
                <h3>{postSessionReport.overallScoreEstimate}</h3>
              </div>
              <button className="close-btn" onClick={() => setPostSessionReport(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body report-body-scroll">
              <p className="report-summary">{postSessionReport.summary}</p>

              <div className="report-section">
                <h4 className="report-subheading text-success">Verified Strengths</h4>
                <ul className="report-checklist">
                  {postSessionReport.strengths.map((s, idx) => (
                    <li key={idx}>✅ {s}</li>
                  ))}
                </ul>
              </div>

              <div className="report-section">
                <h4 className="report-subheading text-warning">Growth Opportunities</h4>
                <ul className="report-checklist">
                  {postSessionReport.growthAreas.map((g, idx) => (
                    <li key={idx}>🎯 {g}</li>
                  ))}
                </ul>
              </div>

              <div className="report-section">
                <h4 className="report-subheading">Scenario Objective Alignment</h4>
                <div className="goal-coverage-grid">
                  {postSessionReport.goalCoverage.map((gc, idx) => (
                    <div key={idx} className="goal-coverage-row">
                      <span>{gc.goal}</span>
                      <span className={`status-pill ${gc.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {gc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="report-section recommendation-box">
                <h4 className="report-subheading">Tutor Actionable Recommendation</h4>
                <p>{postSessionReport.actionableRecommendation}</p>
              </div>

              <div className="report-section exemplar-box">
                <h4 className="report-subheading">Exemplar Articulation Model</h4>
                <blockquote>{postSessionReport.sampleExemplarResponse}</blockquote>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => navigate('/progress')}>
                View Progress Evolution
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/scenarios')}>
                Rehearse Another Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
