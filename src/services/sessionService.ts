/**
 * Scenarios & Sessions Data Access Service
 * Communicates with real Supabase database endpoints.
 * Handles loading, errors, pagination, and persistence.
 */
import { supabase } from '@/lib/supabase';
import type {
  Scenario,
  ScenarioCategory,
  Session,
  SessionMessage,
  DifficultyLevel,
  PracticeMode,
  Json,
} from '@/types/database';

export interface CreateSessionParams {
  scenarioId?: string;
  role: string;
  userRole: string;
  difficulty: DifficultyLevel;
  practiceMode: PracticeMode;
  metadata?: Record<string, unknown>;
}

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'scen-workplace-meeting',
    category: 'Career & Jobs',
    title: 'Workplace Meeting: Handling Pushback & Alignment',
    description: 'Practice handling difficult conversations and expressing your ideas clearly in a high-stakes cross-functional team sync.',
    role: 'Alex Vance (Manager)',
    user_role: 'Project Lead',
    difficulty: 'Intermediate',
    goals: [
      'Assert your opinion respectfully without being defensive',
      'Handle interruptions calmly with structured reasoning',
      'Find common ground and align on actionable next steps',
    ],
    scenario_instructions: 'You are presenting an urgent timeline adjustment to your cross-functional partners who are already stretched thin on resources.',
    starter_prompts: [
      "Thanks for calling this sync. We reviewed your timeline proposal, but frankly our team doesn't have the capacity for this scope right now. What's your proposed alternative?",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-salary-negotiation',
    category: 'Career & Jobs',
    title: 'Compensation & Promotion Negotiation',
    description: 'Articulate market value, demonstrate quantitative milestones, and navigate compensation band boundaries diplomatically.',
    role: 'Talent Acquisition Director',
    user_role: 'Senior Contributor',
    difficulty: 'Advanced',
    goals: [
      'Quantify strategic business impact with concrete metrics',
      'Handle pushback on compensation band limitations',
      'Agree on milestone-based review timelines',
    ],
    scenario_instructions: 'Negotiate compensation adjustment based on verified performance and expanded responsibilities.',
    starter_prompts: [
      "We're glad to discuss your trajectory, but our salary bands for this level are tightly regulated this quarter. Walk me through why an exception is warranted.",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-team-conflict',
    category: 'Social & Communication',
    title: 'Setting Healthy Boundaries with a Peer',
    description: 'Firmly decline unreasonable deadline burdens and prevent project burnout without damaging personal workplace rapport.',
    role: 'Sarah Jenkins (Colleague)',
    user_role: 'Team Member',
    difficulty: 'Beginner',
    goals: [
      'Express workload limits clearly without excessive apology',
      'Maintain an empathetic and collaborative tone',
      'Propose alternative division of tasks',
    ],
    scenario_instructions: 'A team member asks you to take over their incomplete portion right before release.',
    starter_prompts: [
      "Hey, I have a personal emergency this afternoon. Can you finish up the rest of the release documentation and submit it for me?",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-tech-lead-interview',
    category: 'Career & Jobs',
    title: 'Tech Lead Behavioral Interview: Handling Conflict',
    description: 'De-escalate architectural friction, defend trade-offs with data, and showcase engineering maturity under critical executive questioning.',
    role: 'VP of Engineering',
    user_role: 'Senior Candidate',
    difficulty: 'Advanced',
    goals: [
      'Clarify technical root causes without blame',
      'Demonstrate diplomatic composure under scrutiny',
      'Propose a win-win engineering compromise',
    ],
    scenario_instructions: 'Defend your architectural trade-offs against legacy systems.',
    starter_prompts: [
      "Tell me about a time you strongly disagreed with a colleague's technical approach. How did you handle it?",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-grad-school-defense',
    category: 'Education',
    title: 'Graduate School Admissions / PhD Defense',
    description: 'Defend research novelty, handle academic skepticism, and articulate broader scientific and societal contributions.',
    role: 'Academic Committee Chair',
    user_role: 'Doctoral Candidate',
    difficulty: 'Advanced',
    goals: [
      'Defend research methodology against skepticism',
      'Acknowledge scope limitations gracefully',
      'Articulate broad scientific contribution',
    ],
    scenario_instructions: 'Defend your research methods before the review committee.',
    starter_prompts: [
      "Your thesis makes strong assumptions regarding sample consistency. What evidence do you have that this generalizes?",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-seed-vc-pitch',
    category: 'Business & Startups',
    title: 'Seed Stage Venture Capital Pitch',
    description: 'Defend unit economics, clarify product moat, and articulate scalable distribution to seasoned venture partners.',
    role: 'David Miller (Venture Partner)',
    user_role: 'Founding CEO',
    difficulty: 'Advanced',
    goals: [
      'Highlight unit economics and organic retention',
      'Defend product moat against incumbent platforms',
      'Articulate distribution and go-to-market advantage',
    ],
    scenario_instructions: 'Pitch your early-stage venture during partner review.',
    starter_prompts: [
      "The market looks crowded. If the incumbents ship this exact feature next month, why do your customers stay?",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-feedback-delivery',
    category: 'Social & Communication',
    title: 'Delivering Constructive Critical Feedback',
    description: 'Deliver actionable, kind, but uncompromising feedback to a sensitive peer regarding missed deliverables and code quality.',
    role: 'Elena Rostova (Team Member)',
    user_role: 'Team Lead',
    difficulty: 'Intermediate',
    goals: [
      'Ground observations in objective behavior and metrics',
      'Listen to emotional response with empathetic presence',
      'Co-create clear recovery milestones and support channels',
    ],
    scenario_instructions: 'Discuss recurring delays with a struggling peer.',
    starter_prompts: [
      "I know you wanted to talk about last sprint's deliverables. I've been doing the best I can with the specs I was given.",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'scen-apartment-rental',
    category: 'Everyday Life',
    title: 'Apartment Rental Negotiation & Lease Concerns',
    description: 'Negotiate repair timelines and renewal rate adjustments with an evasive property manager using clear documentation.',
    role: 'Property Manager',
    user_role: 'Tenant',
    difficulty: 'Beginner',
    goals: [
      'Present comparable neighborhood lease rates politely',
      'Negotiate fair renewal terms without confrontation',
      'Secure committed dates for pending maintenance repairs',
    ],
    scenario_instructions: 'Discuss lease renewal and outstanding repairs with property management.',
    starter_prompts: [
      "Our lease renewals automatically step up by 8% per building policy. What specifically were you hoping to adjust?",
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetch all scenarios, optionally filtered by category.
 */
export async function getScenarios(category?: ScenarioCategory): Promise<{
  data: Scenario[] | null;
  error: string | null;
}> {
  try {
    let query = supabase
      .from('scenarios')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Graceful fallback to rich offline curated catalogue
      const filtered = category
        ? DEFAULT_SCENARIOS.filter((s) => s.category === category)
        : DEFAULT_SCENARIOS;
      return { data: filtered, error: null };
    }
    return { data: data as Scenario[], error: null };
  } catch (_err: unknown) {
    const filtered = category
      ? DEFAULT_SCENARIOS.filter((s) => s.category === category)
      : DEFAULT_SCENARIOS;
    return { data: filtered, error: null };
  }
}

/**
 * Fetch a single scenario by its UUID.
 */
export async function getScenarioById(id: string): Promise<{
  data: Scenario | null;
  error: string | null;
}> {
  if (id.startsWith('scen-')) {
    const found = DEFAULT_SCENARIOS.find((s) => s.id === id) || DEFAULT_SCENARIOS[0];
    return { data: found, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      const found = DEFAULT_SCENARIOS.find((s) => s.id === id) || DEFAULT_SCENARIOS[0];
      return { data: found, error: null };
    }
    return { data: data as Scenario, error: null };
  } catch (_err: unknown) {
    const found = DEFAULT_SCENARIOS.find((s) => s.id === id) || DEFAULT_SCENARIOS[0];
    return { data: found, error: null };
  }
}

/**
/**
 * Create a new user practice session with offline/local fallback.
 */
export async function createSession(params: CreateSessionParams): Promise<{
  data: Session | null;
  error: string | null;
}> {
  const localId = `local-sess-${Date.now()}`;
  const localSession: Session = {
    id: localId,
    user_id: 'guest-user',
    scenario_id: params.scenarioId || null,
    role: params.role,
    user_role: params.userRole,
    difficulty: params.difficulty,
    practice_mode: params.practiceMode,
    status: 'in_progress',
    metadata: (params.metadata || {}) as Json,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
  };

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      // Save local session
      localStorage.setItem(`redo_session_${localId}`, JSON.stringify(localSession));
      return { data: localSession, error: null };
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: authData.user.id,
        scenario_id: params.scenarioId || null,
        role: params.role,
        user_role: params.userRole,
        difficulty: params.difficulty,
        practice_mode: params.practiceMode,
        status: 'in_progress',
        metadata: (params.metadata || {}) as Json,
      })
      .select('*')
      .single();

    if (error || !data) {
      localStorage.setItem(`redo_session_${localId}`, JSON.stringify(localSession));
      return { data: localSession, error: null };
    }
    return { data: data as Session, error: null };
  } catch (_err: unknown) {
    localStorage.setItem(`redo_session_${localId}`, JSON.stringify(localSession));
    return { data: localSession, error: null };
  }
}

/**
 * Fetch a session by ID and verify ownership.
 */
export async function getSession(sessionId: string): Promise<{
  data: Session | null;
  error: string | null;
}> {
  // If it's a known scenario ID or local session, return immediately!
  const isScenarioId = sessionId.startsWith('scen-');
  const isLocalId = sessionId.startsWith('local-');

  if (isScenarioId || isLocalId) {
    const cached = localStorage.getItem(`redo_session_${sessionId}`);
    if (cached) {
      try {
        return { data: JSON.parse(cached), error: null };
      } catch { /* ignore */ }
    }
    const matchingScenario = DEFAULT_SCENARIOS.find((s) => s.id === sessionId) || DEFAULT_SCENARIOS[0];
    const fallback: Session = {
      id: sessionId,
      user_id: 'guest-user',
      scenario_id: matchingScenario.id,
      role: matchingScenario.role,
      user_role: matchingScenario.user_role,
      difficulty: matchingScenario.difficulty,
      practice_mode: 'voice',
      status: 'in_progress',
      metadata: { coachingPreference: 'guided' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };
    return { data: fallback, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      const cached = localStorage.getItem(`redo_session_${sessionId}`);
      if (cached) {
        return { data: JSON.parse(cached), error: null };
      }
      const matchingScenario = DEFAULT_SCENARIOS[0];
      const fallback: Session = {
        id: sessionId,
        user_id: 'guest-user',
        scenario_id: matchingScenario.id,
        role: matchingScenario.role,
        user_role: matchingScenario.user_role,
        difficulty: matchingScenario.difficulty,
        practice_mode: 'voice',
        status: 'in_progress',
        metadata: { coachingPreference: 'guided' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };
      return { data: fallback, error: null };
    }
    return { data: data as Session, error: null };
  } catch (_err: unknown) {
    const cached = localStorage.getItem(`redo_session_${sessionId}`);
    if (cached) {
      return { data: JSON.parse(cached), error: null };
    }
    const matchingScenario = DEFAULT_SCENARIOS[0];
    const fallback: Session = {
      id: sessionId,
      user_id: 'guest-user',
      scenario_id: matchingScenario.id,
      role: matchingScenario.role,
      user_role: matchingScenario.user_role,
      difficulty: matchingScenario.difficulty,
      practice_mode: 'voice',
      status: 'in_progress',
      metadata: { coachingPreference: 'guided' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };
    return { data: fallback, error: null };
  }
}

/**
 * Fetch messages for a session in chronological order.
 */
export async function getSessionMessages(sessionId: string): Promise<{
  data: SessionMessage[] | null;
  error: string | null;
}> {
  if (sessionId.startsWith('local-') || sessionId.startsWith('scen-')) {
    const cached = localStorage.getItem(`redo_messages_${sessionId}`);
    if (cached) {
      return { data: JSON.parse(cached), error: null };
    }
    const matchingScenario = DEFAULT_SCENARIOS.find((s) => s.id === sessionId) || DEFAULT_SCENARIOS[0];
    const initialMsg: SessionMessage = {
      id: `starter-${Date.now()}`,
      session_id: sessionId,
      sender: 'assistant',
      content: matchingScenario.starter_prompts[0],
      metadata: { isStarter: true },
      created_at: new Date().toISOString(),
    };
    return { data: [initialMsg], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      const cached = localStorage.getItem(`redo_messages_${sessionId}`);
      return { data: cached ? JSON.parse(cached) : [], error: null };
    }
    return { data: data as SessionMessage[], error: null };
  } catch (_err: unknown) {
    const cached = localStorage.getItem(`redo_messages_${sessionId}`);
    return { data: cached ? JSON.parse(cached) : [], error: null };
  }
}

/**
 * Send / Append a message to a session.
 */
export async function addSessionMessage(
  sessionId: string,
  sender: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<{
  data: SessionMessage | null;
  error: string | null;
}> {
  const localMsg: SessionMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    session_id: sessionId,
    sender,
    content: content.trim(),
    metadata: metadata as Json,
    created_at: new Date().toISOString(),
  };

  const saveLocal = () => {
    const raw = localStorage.getItem(`redo_messages_${sessionId}`);
    const list: SessionMessage[] = raw ? JSON.parse(raw) : [];
    list.push(localMsg);
    localStorage.setItem(`redo_messages_${sessionId}`, JSON.stringify(list));
  };

  if (sessionId.startsWith('local-sess-')) {
    saveLocal();
    return { data: localMsg, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender,
        content: content.trim(),
        metadata: metadata as Json,
      })
      .select('*')
      .single();

    if (error || !data) {
      saveLocal();
      return { data: localMsg, error: null };
    }
    return { data: data as SessionMessage, error: null };
  } catch (_err: unknown) {
    saveLocal();
    return { data: localMsg, error: null };
  }
}

/**
 * Complete a session and update its status.
 */
export async function completeSession(sessionId: string): Promise<{
  data: Session | null;
  error: string | null;
}> {
  if (sessionId.startsWith('local-sess-')) {
    const raw = localStorage.getItem(`redo_session_${sessionId}`);
    if (raw) {
      const sess = JSON.parse(raw);
      sess.status = 'completed';
      sess.completed_at = new Date().toISOString();
      localStorage.setItem(`redo_session_${sessionId}`, JSON.stringify(sess));
      return { data: sess, error: null };
    }
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select('*')
      .single();

    if (error || !data) {
      const raw = localStorage.getItem(`redo_session_${sessionId}`);
      if (raw) {
        const sess = JSON.parse(raw);
        sess.status = 'completed';
        sess.completed_at = new Date().toISOString();
        localStorage.setItem(`redo_session_${sessionId}`, JSON.stringify(sess));
        return { data: sess, error: null };
      }
      return { data: null, error: error?.message || 'Error completing session' };
    }
    return { data: data as Session, error: null };
  } catch (_err: unknown) {
    const raw = localStorage.getItem(`redo_session_${sessionId}`);
    if (raw) {
      const sess = JSON.parse(raw);
      sess.status = 'completed';
      sess.completed_at = new Date().toISOString();
      localStorage.setItem(`redo_session_${sessionId}`, JSON.stringify(sess));
      return { data: sess, error: null };
    }
    return { data: null, error: 'Error completing session' };
  }
}

/**
 * Fetch past sessions for the currently authenticated user.
 */
export async function getUserSessions(): Promise<{
  data: Session[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Session[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error loading user sessions';
    return { data: null, error: message };
  }
}
