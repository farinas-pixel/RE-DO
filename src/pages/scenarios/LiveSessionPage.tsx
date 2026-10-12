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
import { getScenarioTheme } from '@/lib/scenarioThemes';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
} from '@/services/speechService';

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

  // Tabs in dialogue panel
  const [activeTab, setActiveTab] = useState<'conversation' | 'objectives' | 'notes'>('conversation');

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
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Session timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const theme = getScenarioTheme(scenario?.title || '');

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
  }, [messages, activeTab]);

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

  const handleGiveExample = () => {
    if (!scenario) return;
    const example = `Here is an exemplar articulation anchor you can adapt: "When evaluating this situation, I focused on tangible business continuity and scheduled an alignment review to resolve stakeholder friction."`;
    setCoachSpeechBubble(example);
    setInputText('When evaluating this situation, I focused on tangible business continuity and scheduled an alignment review...');
  };

  const handleRepeatExplanation = () => {
    if (!scenario) return;
    setCoachSpeechBubble(
      `Remember: You are facing ${scenario.role} as ${scenario.user_role}. Focus on achieving: "${scenario.goals[0] || 'Clear articulation'}" while keeping your composure.`
    );
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
    <div className="cockpit-viewport">
      {/* Cockpit Top Header */}
      <header className="cockpit-top-bar">
        <div className="cockpit-brand-group">
          <span className="brand-logo-text">RE:DO</span>
          <span className="brand-tagline-mini">Experience it before you face it.</span>
        </div>

        <div className="cockpit-top-nav">
          <button className="top-nav-pill active">
            <span className="pill-icon">🏛️</span> Rehearsal Room
          </button>
          <button className="top-nav-pill" onClick={() => navigate('/progress')}>
            <span className="pill-icon">📈</span> Progress
          </button>
          <div className="cockpit-user-avatar" onClick={() => navigate('/settings')} title="Settings">
            <span>JD</span>
            <span className="user-caret">▼</span>
          </div>
        </div>
      </header>

      {/* Main 3-Region Grid */}
      <div className="cockpit-grid-container">
        {/* ============================================================== */}
        {/* LEFT REGION: Scenario & Objectives                             */}
        {/* ============================================================== */}
        <aside className="cockpit-left-region">
          <button className="back-scenarios-btn" onClick={() => navigate('/scenarios')}>
            ← Back to Scenarios
          </button>

          {/* Scenario Overview Card */}
          <div className="cockpit-panel scenario-card-overview">
            <div
              className="scenario-env-image-box"
              style={{ background: theme.gradientBackground }}
            >
              <span className="env-badge">{scenario?.category}</span>
              <span className="diff-badge-pill">{session.difficulty}</span>
              <div className="env-icon-large">{theme.iconSymbol}</div>
            </div>

            <h2 className="scenario-title-text">{scenario?.title}</h2>
            <p className="scenario-summary-text">{scenario?.description}</p>

            <div className="role-identity-stack">
              <div className="identity-item">
                <span className="id-icon">👤</span>
                <div>
                  <span className="id-label">Your Role</span>
                  <strong className="id-val">{session.user_role}</strong>
                </div>
              </div>
              <div className="identity-item">
                <span className="id-icon">👥</span>
                <div>
                  <span className="id-label">Counterpart</span>
                  <strong className="id-val">{session.role}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Goals Checklist */}
          <div className="cockpit-panel practice-goals-panel">
            <h3 className="panel-heading-mini">🎯 Practice Goals</h3>
            <ul className="cockpit-goals-list">
              {scenario?.goals.map((goal, idx) => (
                <li key={idx} className="goal-item-row">
                  <span className="goal-check-circle">✓</span>
                  <span className="goal-item-text">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Session Mode Indicator */}
          <div className="cockpit-panel session-mode-card">
            <div className="mode-icon-box">⚡</div>
            <div className="mode-text-box">
              <span className="mode-label">Session Mode</span>
              <strong>Guided Rehearsal</strong>
              <p>Get AI tutor guidance, hints, and feedback</p>
            </div>
          </div>

          {/* Audio & TTS Controls Foot */}
          <div className="cockpit-panel audio-controls-panel">
            <div className="tts-switch-row">
              <div className="tts-label-group">
                <span className="tts-icon">🔊</span>
                <span>TTS Playback:</span>
              </div>
              <button
                className={`switch-pill ${autoSpeak ? 'active' : ''}`}
                onClick={() => {
                  if (autoSpeak) stopSpeaking();
                  setAutoSpeak(!autoSpeak);
                }}
              >
                {autoSpeak ? 'On' : 'Off'}
              </button>
            </div>
            <div className="voice-persona-select-row">
              <span className="speaker-icon">🗣️</span>
              <span className="voice-name">English (Natural Female)</span>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* CENTRE REGION: AI Coach Stage + Dialogue Viewport              */}
        {/* ============================================================== */}
        <main className="cockpit-centre-region">
          {/* AI Coach Stage Header Card */}
          <div className="cockpit-panel ai-coach-stage-card">
            <div className="coach-card-header">
              <div className="coach-id-group">
                <span className="coach-badge-icon">🧠</span>
                <div>
                  <strong>AI Coach</strong>
                  <span className="live-status-dot">● Online</span>
                </div>
              </div>

              <div className="coach-status-pills">
                <span className={`status-chip ${isRecording ? 'active' : ''}`}>
                  🎙️ Listening
                </span>
                <span className={`status-chip ${sending ? 'active' : ''}`}>
                  💭 Thinking
                </span>
                <span className={`status-chip ${isSpeaking ? 'active' : ''}`}>
                  🗣️ Speaking
                </span>
              </div>
            </div>

            <div className="coach-presence-row">
              <div className="coach-portrait-box">
                {/* Visual Avatar Portrait */}
                <div className="avatar-frame">
                  <img
                    src="/nexa_ref.png"
                    alt="Maya Sharma - AI Coach"
                    className="coach-img"
                    onError={(e) => {
                      // Graceful fallback to CSS avatar
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="coach-avatar-fallback">MS</div>
                </div>
                <div className="coach-nameplate">
                  <span className="coach-name">Maya Sharma</span>
                  <span className="coach-subtitle">Your AI Coach</span>
                </div>
              </div>

              {/* Dynamic Coach Speech Bubble */}
              <div className="coach-bubble-container">
                <div className="coach-bubble-body">
                  <p>{coachSpeechBubble}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dialogue Feed with Tabs */}
          <div className="cockpit-panel dialogue-panel">
            <div className="dialogue-tabs-bar">
              <div className="tab-buttons">
                <button
                  className={`tab-btn ${activeTab === 'conversation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('conversation')}
                >
                  Conversation
                </button>
                <button
                  className={`tab-btn ${activeTab === 'objectives' ? 'active' : ''}`}
                  onClick={() => setActiveTab('objectives')}
                >
                  Objectives
                </button>
                <button
                  className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes
                </button>
              </div>

              <div className="tutor-active-badge">
                <span className="sparkle">✨</span> Tutor Active
              </div>
            </div>

            {/* Conversation Messages Stream */}
            {activeTab === 'conversation' && (
              <div className="conversation-stream">
                {messages.length === 0 ? (
                  <div className="empty-stream-notice">
                    <p>No messages recorded yet. Deliver your introduction below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`cockpit-message-row ${isUser ? 'user-side' : 'counterpart-side'}`}
                      >
                        {!isUser && (
                          <div className="avatar-chip counterpart-chip">
                            <span>{session.role.substring(0, 2).toUpperCase()}</span>
                          </div>
                        )}

                        <div className="message-content-block">
                          <div className="message-meta-head">
                            <span className="speaker-label">
                              {isUser ? 'You' : session.role}
                            </span>
                            <span className="msg-timestamp">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="cockpit-bubble">
                            <p>{msg.content}</p>
                          </div>

                          {!isUser && isSpeechSynthesisSupported() && (
                            <button
                              type="button"
                              className="bubble-audio-btn"
                              onClick={() => handleSpeak(msg.content)}
                            >
                              🗣️ Read Aloud
                            </button>
                          )}
                        </div>

                        {isUser && (
                          <div className="avatar-chip user-chip">
                            <span>JD</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Choose Your Path Branching Decisions */}
                {decisionStage === 1 && (
                  <div className="branching-decision-box">
                    <span className="decision-prompt-badge">⚡ Choose Your Path: Branching Decision</span>
                    <p className="decision-context-text">
                      The counterpart is pressing you on technical risk. How do you respond?
                    </p>
                    <div className="decision-choices-grid">
                      <button
                        className="decision-choice-btn"
                        onClick={() =>
                          handleBranchChoice(
                            'I understand the concern. To mitigate risk, we established automated canary rollouts and benchmarked our rollback procedures to ensure zero customer downtime.'
                          )
                        }
                      >
                        Option A (De-escalation & Data): Address risk with canary benchmarks
                      </button>
                      <button
                        className="decision-choice-btn"
                        onClick={() =>
                          handleBranchChoice(
                            'Our architecture prioritizes immediate performance wins. Any minor downtime during migration is acceptable compared to our competitor latency lag.'
                          )
                        }
                      >
                        Option B (Assertive Defense): Prioritize speed over risk avoidance
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Objectives Tab Content */}
            {activeTab === 'objectives' && (
              <div className="objectives-tab-view">
                <h3>Live Objective Alignment</h3>
                <ul className="objectives-tab-list">
                  {scenario?.goals.map((g, i) => (
                    <li key={i} className="obj-tab-item">
                      <span className="obj-num">0{i + 1}</span>
                      <div>
                        <strong>{g}</strong>
                        <p>Evaluated on message completion and STAR model adherence.</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes Tab Content */}
            {activeTab === 'notes' && (
              <div className="notes-tab-view">
                <h3>Session Tactical Notes</h3>
                <p>Use this space to review key talking points or write mental anchors.</p>
                <textarea
                  className="notes-textarea"
                  placeholder="Draft your private notes here..."
                  rows={6}
                />
              </div>
            )}

            {/* Bottom Interaction Tray */}
            <div className="cockpit-input-tray">
              {voiceError && <div className="tray-alert error">⚠️ {voiceError}</div>}
              {sendError && <div className="tray-alert error">⚠️ {sendError}</div>}

              {session.status === 'in_progress' ? (
                <form onSubmit={handleSendMessage} className="tray-form">
                  <input
                    type="text"
                    placeholder={
                      isRecording
                        ? 'Listening to speech... Speak now.'
                        : 'Type your message or use the mic...'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sending}
                    autoFocus
                  />

                  {/* Microphone Toggle Button */}
                  <button
                    type="button"
                    className={`tray-mic-btn ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    disabled={sending}
                    title={isRecording ? 'Stop Recording' : 'Voice Dictation'}
                  >
                    {isRecording ? '🔴' : '🎙️'}
                  </button>

                  {/* Send Arrow Button */}
                  <button
                    type="submit"
                    className="tray-send-btn"
                    disabled={sending || !inputText.trim()}
                    title="Send turn"
                  >
                    ➔
                  </button>
                </form>
              ) : (
                <div className="rehearsal-concluded-strip">
                  <span>✅ Rehearsal Concluded — All records preserved in Supabase.</span>
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate('/scenarios')}
                  >
                    Start New Scenario
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ============================================================== */}
        {/* RIGHT REGION: Roleplay Partner Stage + Live Stats              */}
        {/* ============================================================== */}
        <aside className="cockpit-right-region">
          {/* Roleplay Partner Card */}
          <div className="cockpit-panel partner-stage-card">
            <div className="partner-card-header">
              <span className="partner-badge-icon">👥</span>
              <div>
                <strong>Roleplay Partner</strong>
                <span className="live-status-dot">● Live</span>
              </div>
            </div>

            <div className="partner-avatar-box">
              <div className="avatar-frame">
                <img
                  src="/redo_cockpit_ref.jpg"
                  alt={session.role}
                  className="partner-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="partner-avatar-fallback">
                  {session.role.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="partner-nameplate">
                <span className="partner-name">{session.role}</span>
                <span className="partner-subtitle">{scenario?.category}</span>
              </div>
            </div>

            <div className="partner-wave-container">
              <span className="wave-status-text">
                {isSpeaking ? 'Currently speaking...' : 'Listening attentively...'}
              </span>
              <div className={`audio-waveform-bars ${isSpeaking ? 'active' : ''}`}>
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          {/* Live Objectives Progress Card */}
          <div className="cockpit-panel live-objectives-card">
            <div className="objectives-head-row">
              <span className="obj-icon">🎯</span>
              <h4>Live Objectives</h4>
              <span className="obj-fraction">
                {Math.min(scenario?.goals.length || 3, messages.filter((m) => m.sender === 'user').length)}/
                {scenario?.goals.length || 3} completed
              </span>
            </div>

            <ul className="live-obj-checklist">
              {scenario?.goals.map((g, idx) => {
                const userTurnCount = messages.filter((m) => m.sender === 'user').length;
                const isCompleted = userTurnCount > idx;
                return (
                  <li key={idx} className="live-obj-row">
                    <span className={`circle-indicator ${isCompleted ? 'checked' : ''}`}>
                      {isCompleted ? '✓' : '○'}
                    </span>
                    <span className="live-obj-text">{g}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Actions Panel */}
          <div className="cockpit-panel quick-actions-panel">
            <h4 className="panel-subheading-mini">⚡ Quick Actions</h4>
            <div className="quick-actions-stack">
              <button className="quick-action-btn" onClick={handleRequestHint}>
                <span className="action-icon">💡</span>
                <span>Ask for a Hint</span>
              </button>
              <button className="quick-action-btn" onClick={handleGiveExample}>
                <span className="action-icon">📄</span>
                <span>Give me an Example</span>
              </button>
              <button className="quick-action-btn" onClick={handleRepeatExplanation}>
                <span className="action-icon">🔄</span>
                <span>Repeat Explanation</span>
              </button>
            </div>
          </div>

          {/* Bottom Timer & End Session Button */}
          <div className="cockpit-panel session-timer-card">
            <div className="timer-display">
              <span className="clock-icon">🕒</span>
              <span className="timer-text">Session Time {formatTimer(secondsElapsed)}</span>
            </div>

            {session.status === 'in_progress' && (
              <button
                className="end-session-action-btn"
                disabled={isFinishing}
                onClick={handleCompleteSession}
              >
                {isFinishing ? 'Analyzing...' : '🚪 End Session'}
              </button>
            )}
          </div>
        </aside>
      </div>

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
