import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

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
      },
    },
  },
  db: {
    schema: 'public',
  },
});

// Type exports - Fixed to match your actual tables
export type { Database };
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

/**
 * Enhanced Supabase service with proper error handling and logging
 */
export const supabaseService = {
  /**
   * Get user profile by user_id (links to auth.users)
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId) // Fixed: use user_id instead of id
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Profile fetch error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('[Supabase] Unexpected error fetching profile:', error);
      return null;
    }
  },

  /**
   * Create profile after user signup
   */
  async createProfile(
    userId: string,
    profileData: {
      full_name?: string;
      role?: 'user' | 'admin';
    }
  ): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: profileData.full_name || '',
          role: profileData.role || 'user',
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Profile creation error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('[Supabase] Failed to create profile:', error);
      throw new Error('Failed to create user profile');
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId) // Fixed: use user_id
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Profile update error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('[Supabase] Unexpected error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  },

  /**
   * Enhanced login with proper error handling
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('[Supabase] Login error:', error);

        // Handle specific error types
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email or password is incorrect');
        } else if (error.message === 'Email not confirmed') {
          throw new Error('Please verify your email before logging in');
        } else {
          throw error;
        }
      }

      if (!data.session || !data.user) {
        throw new Error('No session returned from login');
      }

      return data;
    } catch (error) {
      console.error('[Supabase] Login failed:', error);
      throw error;
    }
  },

  /**
   * Enhanced signup with profile creation
   */
  async signUp(
    email: string,
    password: string,
    userData: {
      full_name?: string;
      role?: 'user' | 'admin';
    }
  ) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: userData.full_name || '',
            role: userData.role || 'user',
          },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        console.error('[Supabase] Signup error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      return data;
    } catch (error) {
      console.error('[Supabase] Signup failed:', error);
      throw error;
    }
  },

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);

      return !error;
    } catch (error) {
      console.error('[Supabase] Connection test failed:', error);
      return false;
    }
  },

  /**
   * Get current session
   */
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[Supabase] Session error:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('[Supabase] Failed to get session:', error);
      return null;
    }
  },
};

// Auth state change listener
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
