export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ScenarioCategory =
  | 'Career & Jobs'
  | 'Education'
  | 'Business & Startups'
  | 'Social & Communication'
  | 'Everyday Life';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type PracticeMode = 'text' | 'voice' | 'camera_preview';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type MessageSender = 'user' | 'assistant' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scenarios: {
        Row: {
          id: string;
          category: ScenarioCategory;
          title: string;
          description: string;
          role: string;
          user_role: string;
          difficulty: DifficultyLevel;
          goals: string[];
          scenario_instructions: string;
          starter_prompts: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: ScenarioCategory;
          title: string;
          description: string;
          role: string;
          user_role: string;
          difficulty: DifficultyLevel;
          goals?: string[];
          scenario_instructions: string;
          starter_prompts?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: ScenarioCategory;
          title?: string;
          description?: string;
          role?: string;
          user_role?: string;
          difficulty?: DifficultyLevel;
          goals?: string[];
          scenario_instructions?: string;
          starter_prompts?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          scenario_id: string | null;
          role: string;
          user_role: string;
          difficulty: DifficultyLevel;
          practice_mode: PracticeMode;
          status: SessionStatus;
          metadata: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          scenario_id?: string | null;
          role: string;
          user_role: string;
          difficulty: DifficultyLevel;
          practice_mode: PracticeMode;
          status?: SessionStatus;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          scenario_id?: string | null;
          role?: string;
          user_role?: string;
          difficulty?: DifficultyLevel;
          practice_mode?: PracticeMode;
          status?: SessionStatus;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      session_messages: {
        Row: {
          id: string;
          session_id: string;
          sender: MessageSender;
          content: string;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          session_id: string;
          sender: MessageSender;
          content: string;
          created_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          session_id?: string;
          sender?: MessageSender;
          content?: string;
          created_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Scenario = Database['public']['Tables']['scenarios']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionMessage = Database['public']['Tables']['session_messages']['Row'];
