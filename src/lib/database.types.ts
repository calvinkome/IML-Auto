export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          role: 'admin' | 'staff' | 'user'
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          last_sign_in: string | null
        }
        Insert: {
          id: string
          username: string
          email: string
          role?: 'admin' | 'staff' | 'user'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_sign_in?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          role?: 'admin' | 'staff' | 'user'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_sign_in?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          refresh_token: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          refresh_token?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          refresh_token?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
          expires_at?: string
        }
      }
      auth_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string | null
          success: boolean
          attempt_count: number
          last_attempt: string
          blocked_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          ip_address?: string | null
          success?: boolean
          attempt_count?: number
          last_attempt?: string
          blocked_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string | null
          success?: boolean
          attempt_count?: number
          last_attempt?: string
          blocked_until?: string | null
          created_at?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          error_message: string
          error_detail: string | null
          error_context: string | null
          registration_context: Json | null
          stack_trace: string | null
          created_at: string
        }
        Insert: {
          id?: string
          error_message: string
          error_detail?: string | null
          error_context?: string | null
          registration_context?: Json | null
          stack_trace?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          error_message?: string
          error_detail?: string | null
          error_context?: string | null
          registration_context?: Json | null
          stack_trace?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'staff' | 'user'
    }
  }
}