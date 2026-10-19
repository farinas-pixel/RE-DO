import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CinematicScene } from '@/components/CinematicScene';
import { DEFAULT_SCENARIOS } from '@/services/sessionService';
import { generateContextualTurn } from '@/lib/practiceEngine';
import { isSpeechSynthesisSupported, speakText } from '@/services/speechService';
import type { Scenario, SessionMessage } from '@/types/database';

export const LandingPage3D: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);

  // Scene 2: Interactive AI Tutor state
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Hi there! I'm Maya, your personal AI rehearsal coach. What situation are you preparing for today, or what's on your mind?",
    },
  ]);
  const [tutorStatus, setTutorStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  // Scene 3 & 4: Selected Scenario for live rehearsal
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(DEFAULT_SCENARIOS[0]);
  const [rehearsalMessages, setRehearsalMessages] = useState<SessionMessage[]>([]);
  const [rehearsalInput, setRehearsalInput] = useState('');

  // Monitor Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const current = window.scrollY / totalScroll;
        setScrollProgress(Math.min(1, Math.max(0, current)));

        const sectionIdx = Math.min(5, Math.floor((window.scrollY + window.innerHeight * 0.4) / window.innerHeight));
        setCurrentSection(sectionIdx);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Tutor Message Submission
  const handleSendTutorMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorInput.trim() || tutorStatus === 'thinking') return;

    const userText = tutorInput.trim();
    setTutorInput('');
    setTutorMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setTutorStatus('thinking');

    // Contextual pedagogical response
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('interview') || lower.includes('job') || lower.includes('hire')) {
        reply = "Interviews can feel intimidating when the panel tests unexpected depth. I recommend rehearsing our 'Compensation & Promotion Negotiation' or 'Workplace Meeting' scenarios to master structured STAR answers.";
      } else if (lower.includes('meeting') || lower.includes('manager') || lower.includes('boss')) {
        reply = "Handling pushback from leadership requires maintaining composure while asserting your data. Let's practice the 'Workplace Meeting: Handling Pushback' scenario.";
      } else if (lower.includes('anxiety') || lower.includes('nervous') || lower.includes('fear')) {
        reply = "It's completely natural to feel nervous. RE:DO gives you a judgment-free space to speak your thoughts aloud until they feel second nature. Would you like to start with a gentle practice round?";
      } else {
        reply = `I hear you. The best way to build confidence is by experiencing it before you face it. You can select any scenario below to start an interactive roleplay session with me.`;
      }

      setTutorMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setTutorStatus('speaking');

      if (isSpeechSynthesisSupported()) {
        speakText(reply, () => setTutorStatus('idle'));
      } else {
        setTimeout(() => setTutorStatus('idle'), 2500);
      }
    }, 650);
  };

  // Launch Rehearsal within Scene 4
  const handleStartRehearsal = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setRehearsalMessages([
      {
        id: 'starter-1',
        session_id: 'local-rehearsal',
        sender: 'assistant',
        content: scenario.starter_prompts[0],
        metadata: { role: scenario.role },
        created_at: new Date().toISOString(),
      },
    ]);

    // Scroll to rehearsal section
    const rehearsalElem = document.getElementById('scene-rehearsal');
    if (rehearsalElem) {
      rehearsalElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Rehearsal turn submission
  const handleSendRehearsal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rehearsalInput.trim()) return;

    const text = rehearsalInput.trim();
    setRehearsalInput('');

    const newMsg: SessionMessage = {
      id: `user-${Date.now()}`,
      session_id: 'local-rehearsal',
      sender: 'user',
      content: text,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    setRehearsalMessages((prev) => [...prev, newMsg]);

    const turnRes = generateContextualTurn({
      scenarioTitle: selectedScenario.title,
      counterpartRole: selectedScenario.role,
      userRole: selectedScenario.user_role,
      difficulty: selectedScenario.difficulty,
      userMessage: text,
      turnIndex: rehearsalMessages.length + 1,
      goals: selectedScenario.goals,
      coachingPreference: 'guided',
    });

    setTimeout(() => {
      const replyMsg: SessionMessage = {
        id: `assistant-${Date.now()}`,
        session_id: 'local-rehearsal',
        sender: 'assistant',
        content: turnRes.counterpartResponse,
        metadata: { role: selectedScenario.role, tutorObservation: turnRes.tutorObservation },
        created_at: new Date().toISOString(),
      };
      setRehearsalMessages((prev) => [...prev, replyMsg]);
      speakText(turnRes.counterpartResponse);
    }, 600);
  };

  // Primary Start Action
  const handleStartRedo = () => {
    if (user) {
      navigate('/hub');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="cinematic-website-root">
      {/* Fixed Fullscreen 3D Background & Crystal Orb Canvas */}
      <CinematicScene scrollProgress={scrollProgress} currentSection={currentSection} />

      {/* Primary Reference Requirement: Crystal-Clear Glass Enclosure Frame around the Website */}
      <div className="crystal-glass-enclosure-frame" aria-hidden="true">
        <div className="glass-frame-glow-corner top-left" />
        <div className="glass-frame-glow-corner top-right" />
        <div className="glass-frame-glow-corner bottom-left" />
        <div className="glass-frame-glow-corner bottom-right" />
      </div>

      {/* Top Floating Glass Navigation */}
      <header className="cinematic-site-nav">
        <div className="cinematic-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-gem-symbol">✦</span>
          <span className="brand-logo-text">RE:DO</span>
        </div>
        <nav className="cinematic-nav-links">
          <a href="#scene-hero">Crystal World</a>
          <a href="#scene-tutor">AI Tutor</a>
          <a href="#scene-universe">Universe</a>
          <a href="#scene-rehearsal">Rehearsal</a>
          <a href="#scene-progress">Progress</a>
        </nav>
        <div className="cinematic-nav-actions">
          <button className="btn-nav-glass" onClick={() => navigate(user ? '/hub' : '/auth/login')}>
            {user ? 'Open Dashboard' : 'Sign In'}
          </button>
          <button className="btn-nav-luminous" onClick={handleStartRedo}>
            Start RE:DO
          </button>
        </div>
      </header>

      {/* SCENE 1: Crystal World (Hero) */}
      <section id="scene-hero" className="cinematic-scene-section hero-scene-framed">
        <div className="hero-framed-cluster">
          <div className="hero-top-stage">
            <div className="hero-brand-pill">
              <span className="pill-pulse-dot" />
              <span>3D-FIRST CINEMATIC REHEARSAL</span>
            </div>
            <h1 className="hero-main-title">
              <span className="hero-title-light">Experience it</span>
              <span className="hero-title-gradient">before you face it.</span>
            </h1>
            <p className="hero-subtext">
              Master interviews, high-stakes negotiations, and difficult conversations in a safe, fearless space.
            </p>
          </div>

          {/* Spatial stage where the large centered 3D crystal orb floats in clean negative space */}
          <div className="hero-orb-framing-zone" />

          <div className="hero-bottom-stage">
            <div className="hero-btn-row">
              <button
                className="btn-luminous-hero"
                onClick={() => {
                  const el = document.getElementById('scene-tutor');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore RE:DO ↓
              </button>
              <button className="btn-ghost-hero" onClick={handleStartRedo}>
                Launch App →
              </button>
            </div>
            <div className="hero-trust-badge">
              <span>✦ Hyper-realistic Voice Simulations</span>
              <span className="trust-sep">•</span>
              <span>Safe Fearless Space</span>
              <span className="trust-sep">•</span>
              <span>Web &amp; Mobile</span>
            </div>
          </div>
        </div>
      </section>

      {/* SCENE 2: AI Tutor Room */}
      <section id="scene-tutor" className="cinematic-scene-section scene-layout-split right-aligned">
        <div className="scene-glass-panel tutor-panel">
          <div className="panel-badge">
            <span>SCENE 02</span>
            <span className="badge-sep">•</span>
            <span>PEDAGOGICAL COMPANION</span>
          </div>
          <h2 className="panel-headline">Meet Maya Sharma</h2>
          <p className="panel-description">
            Your empathetic AI mentor engineered to diagnose speaking anxiety, guide structured responses,
            and provide real-time tactical advice during critical moments.
          </p>

          {!isTutorOpen ? (
            <div className="tutor-trigger-card" onClick={() => setIsTutorOpen(true)}>
              <div className="tutor-avatar-preview">
                <img src={`${import.meta.env.BASE_URL}ai_tutor_character.png`} alt="Maya Sharma" className="tutor-img-thumb" />
                <span className="tutor-online-glow" />
              </div>
              <div className="tutor-card-meta">
                <h4 className="tutor-card-name">Maya Sharma (Senior Coach)</h4>
                <p className="tutor-card-hint">“Click to start an introductory conversation...”</p>
              </div>
              <button className="btn-open-tutor">Chat Now →</button>
            </div>
          ) : (
            <div className="tutor-live-dialogue-box">
              <div className="tutor-feed-scroll">
                {tutorMessages.map((msg, i) => (
                  <div key={i} className={`tutor-chat-row ${msg.role}`}>
                    <div className="tutor-chat-bubble">
                      <span className="bubble-speaker">{msg.role === 'assistant' ? 'Maya' : 'You'}</span>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {tutorStatus === 'thinking' && (
                  <div className="tutor-thinking-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                )}
              </div>

              <form onSubmit={handleSendTutorMessage} className="tutor-input-row">
                <input
                  type="text"
                  placeholder="Share a situation you'd like to practice..."
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                />
                <button type="submit" className="btn-send-tutor" disabled={!tutorInput.trim()}>
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* SCENE 3: Scenario Universe */}
      <section id="scene-universe" className="cinematic-scene-section scene-layout-split left-aligned">
        <div className="scene-glass-panel universe-panel">
          <div className="panel-badge">
            <span>SCENE 03</span>
            <span className="badge-sep">•</span>
            <span>HIGH-STAKES SIMULATIONS</span>
          </div>
          <h2 className="panel-headline">The Scenario Universe</h2>
          <p className="panel-description">
            Choose from authentic workplace, academic, and interpersonal simulations. Each environment features
            dynamic counterpart personalities and adaptive pushback.
          </p>

          <div className="scenarios-preview-stack">
            {DEFAULT_SCENARIOS.slice(0, 3).map((scen) => (
              <div key={scen.id} className="scenario-item-card">
                <div className="scen-badge-row">
                  <span className="scen-category-tag">{scen.category}</span>
                  <span className={`scen-diff-tag ${scen.difficulty.toLowerCase()}`}>{scen.difficulty}</span>
                </div>
                <h4 className="scen-card-title">{scen.title}</h4>
                <p className="scen-card-desc">{scen.description}</p>
                <div className="scen-card-footer">
                  <span className="scen-role-text">Counterpart: <strong>{scen.role}</strong></span>
                  <button className="btn-scen-practice" onClick={() => handleStartRehearsal(scen)}>
                    Start Practice →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCENE 4: Rehearsal Room */}
      <section id="scene-rehearsal" className="cinematic-scene-section scene-layout-split right-aligned">
        <div className="scene-glass-panel rehearsal-panel">
          <div className="panel-badge">
            <span>SCENE 04</span>
            <span className="badge-sep">•</span>
            <span>LIVE INTERACTIVE REHEARSAL</span>
          </div>
          <h2 className="panel-headline">{selectedScenario.title}</h2>
          <p className="panel-description">
            Practice in real-time against {selectedScenario.role}. Receive instant pedagogical observations and
            speech-to-text transcription.
          </p>

          <div className="rehearsal-interactive-chamber">
            <div className="chamber-feed">
              {rehearsalMessages.map((m) => (
                <div key={m.id} className={`chamber-turn ${m.sender}`}>
                  <div className="chamber-bubble">
                    <span className="speaker-label">{m.sender === 'assistant' ? selectedScenario.role : 'You'}</span>
                    <p>{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendRehearsal} className="chamber-input-bar">
              <input
                type="text"
                placeholder={`Respond to ${selectedScenario.role}...`}
                value={rehearsalInput}
                onChange={(e) => setRehearsalInput(e.target.value)}
              />
              <button type="submit" className="btn-chamber-send" disabled={!rehearsalInput.trim()}>
                Submit Turn
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SCENE 5: Feedback and Progress */}
      <section id="scene-progress" className="cinematic-scene-section scene-layout-split left-aligned">
        <div className="scene-glass-panel progress-panel">
          <div className="panel-badge">
            <span>SCENE 05</span>
            <span className="badge-sep">•</span>
            <span>ANALYTICS & SKILL MASTERY</span>
          </div>
          <h2 className="panel-headline">Feedback & Progress</h2>
          <p className="panel-description">
            Continuous evaluation anchored in the STAR framework. Track Clarity, Structure, Composure,
            and Listening across all verified attempts.
          </p>

          <div className="progress-metrics-grid">
            <div className="metric-glass-card">
              <span className="metric-score">85%</span>
              <span className="metric-label">Benchmark Clarity</span>
            </div>
            <div className="metric-glass-card">
              <span className="metric-score">12</span>
              <span className="metric-label">Completed Sessions</span>
            </div>
            <div className="metric-glass-card">
              <span className="metric-score">4.8</span>
              <span className="metric-label">Composure Rating</span>
            </div>
          </div>

          <div className="progress-insights-box">
            <h4>Pedagogical Strengths:</h4>
            <ul>
              <li>✓ Clear assertiveness without aggressive pushback</li>
              <li>✓ Structured presentation of qualitative and quantitative outcomes</li>
              <li>✓ High conversational resilience under cross-examination</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SCENE 6: Final CTA */}
      <section id="scene-cta" className="cinematic-scene-section cta-scene">
        <div className="cta-glass-card">
          <span className="cta-allura-script">Experience it before you face it.</span>
          <h2 className="cta-headline">Ready to Conquer High-Stakes Conversations?</h2>
          <p className="cta-subtext">
            Join thousands practicing interviews, negotiations, and leadership scenarios with RE:DO's
            fearless 3D AI companion.
          </p>
          <div className="cta-btn-wrapper">
            <button className="btn-cta-giant" onClick={handleStartRedo}>
              Start RE:DO Now →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
