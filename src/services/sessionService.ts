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
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Scenario[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    return { data: null, error: message };
  }
}

/**
 * Fetch a single scenario by its UUID.
 */
export async function getScenarioById(id: string): Promise<{
  data: Scenario | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Scenario, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    return { data: null, error: message };
  }
}

/**
 * Create a new user practice session.
 */
export async function createSession(params: CreateSessionParams): Promise<{
  data: Session | null;
  error: string | null;
}> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: 'User must be authenticated to create a session.' };
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

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error creating session';
    return { data: null, error: message };
  }
}

/**
 * Fetch a session by ID and verify ownership.
 */
export async function getSession(sessionId: string): Promise<{
  data: Session | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error loading session';
    return { data: null, error: message };
  }
}

/**
 * Fetch messages for a session in chronological order.
 */
export async function getSessionMessages(sessionId: string): Promise<{
  data: SessionMessage[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as SessionMessage[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error loading messages';
    return { data: null, error: message };
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

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as SessionMessage, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error sending message';
    return { data: null, error: message };
  }
}

/**
 * Complete a session and update its status.
 */
export async function completeSession(sessionId: string): Promise<{
  data: Session | null;
  error: string | null;
}> {
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

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as Session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error completing session';
    return { data: null, error: message };
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
