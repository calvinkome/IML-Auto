import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    Missing Supabase environment variables.
    Please ensure you have the following in your .env file:
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
  `);
}

// Create the Supabase client with enhanced configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      }
    }
  },
  db: {
    schema: 'public'
  },
});

// Type exports
export type { Database };
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

/**
 * Enhanced Supabase service with proper error handling and logging
 */
export const supabaseService = {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Profile fetch error:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        return null;
      }
      return data;
    } catch (error) {
      console.error('[Supabase] Unexpected error fetching profile:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Profile update error:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }
      return data;
    } catch (error) {
      console.error('[Supabase] Unexpected error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  /**
   * Update username with validation
   */
  async updateUsername(userId: string, newUsername: string): Promise<Profile> {
    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
      throw new Error('Username must be 3-20 lowercase letters, numbers, or underscores');
    }

    // Check if username exists
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('username', newUsername)
      .neq('id', userId);

    if (count && count > 0) {
      throw new Error('Username already taken');
    }

    return this.updateProfile(userId, { username: newUsername });
  },

  /**
   * Enhanced login with timeout handling
   */
  async signIn(email: string, password: string): Promise<{ user: any, session: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) {
        console.error('[Supabase] Login error:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }

      if (!data.session) {
        throw new Error('No session returned');
      }

      return data;
    } catch (error) {
      console.error('[Supabase] Login failed:', error);
      throw new Error('Login timeout. Please check your connection and try again.');
    }
  },

  /**
   * Create a new session
   */
  async createSession(userId: string): Promise<Session> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          expires_at: new Date(Date.now() + 86400000).toISOString() // 24 hours
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase] Session creation error:', error);
      throw new Error('Failed to create session');
    }
  },

  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(userId: string, limit = 50, page = 1): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase] Audit logs fetch error:', error);
      throw new Error('Failed to fetch audit logs');
    }
  },

  /**
   * Test Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[Supabase] Connection test failed:', error);
      return false;
    }
  },

  /**
   * Retry wrapper for operations
   */
  async withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.withRetry(operation, retries - 1);
    }
  }
};

// Subscribe to realtime updates (optional)
export function subscribeToProfileUpdates(userId: string, callback: (payload: any) => void) {
  return supabase.channel('profile_updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`
    }, callback)
    .subscribe();
}