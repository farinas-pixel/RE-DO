/**
 * Supabase Client — the single source of truth for all Supabase operations.
 *
 * WHY THIS FILE EXISTS:
 * - Creates ONE Supabase client instance shared across the entire app.
 * - Uses the anon key (safe for browsers — it only allows access that RLS permits).
 * - The service_role key is NEVER used in frontend code.
 *
 * SECURITY:
 * - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are embedded in the built JS bundle.
 *   This is intentional and safe because the anon key has no special privileges —
 *   Row Level Security (RLS) on the database controls what each user can access.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate at startup — fail loudly rather than silently
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Copy .env.example to .env and fill in your project URL and anon key.\n' +
    'Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so users stay logged in across page reloads
    persistSession: true,
    // Automatically refresh the JWT before it expires
    autoRefreshToken: true,
    // Listen for auth changes in other tabs (e.g., logout in one tab logs out all)
    detectSessionInUrl: true,
  },
});
