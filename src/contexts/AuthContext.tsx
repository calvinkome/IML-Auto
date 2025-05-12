import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at: string;
  email_confirmed_at: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  pendingVerificationEmail: string | null;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  clearError: () => void;
  resendVerificationEmail: (email?: string) => Promise<void>;
  isEmailVerified: () => boolean;
  setPendingVerificationEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearError = useCallback(() => setError(null), []);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Email or password is incorrect';
        case 'Email not confirmed':
          return 'Please verify your email before logging in';
        case 'User already exists':
          return 'An account with this email already exists';
        case 'Database error saving new user':
          return 'Registration service unavailable. Please try again later.';
        default:
          return error.message;
      }
    }
    return 'An unexpected error occurred';
  };

  const handleError = useCallback((err: unknown) => {
    const message = getErrorMessage(err);
    setError(message);
    toast.error(message);
    console.error('Auth Error:', err);
    throw err;
  }, []);

  const isEmailVerified = useCallback(() => {
    return !!user?.email_confirmed_at;
  }, [user]);

  const withRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    delayMs: number = 1000
  ): Promise<T> => {
    let attempts = 0;
    let lastError: unknown;

    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  }, []);

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    setProfileLoading(true);
    try {
      const { data, error } = await withRetry(() => 
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      );

      if (error || !data) {
        throw error || new Error('Profile not found');
      }

      return data;
    } finally {
      setProfileLoading(false);
    }
  }, [withRetry]);

  const verifySession = useCallback(async () => {
    try {
      const { data: { session }, error } = await withRetry(() => 
        supabase.auth.getSession()
      );
      return !error && session?.user && (session.expires_at ? session.expires_at * 1000 > Date.now() : true);
    } catch (err) {
      return false;
    }
  }, [withRetry]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const isAuthenticated = await verifySession();

        if (isAuthenticated) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const profile = await fetchUserProfile(session.user.id);
            setUser(profile);
          }
        }
      } catch (err) {
        handleError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            setUser(profile);
            if (event === 'SIGNED_IN') {
              navigate('/dashboard', { replace: true });
            }
          } catch (err) {
            handleError(err);
          }
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            navigate('/login', { replace: true });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate, fetchUserProfile, handleError, verifySession]);

  const signIn = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser, session }, error: authError } = 
        await withRetry(() => supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        }));

      if (authError) throw authError;
      if (!authUser || !session) throw new Error('Authentication failed');

      if (!authUser.email_confirmed_at) {
        setPendingVerificationEmail(authUser.email || email);
        throw new Error('Please verify your email first. Check your inbox or request a new verification link.');
      }

      const profile = await fetchUserProfile(authUser.id);
      setUser(profile);
      setPendingVerificationEmail(null);
      return profile;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, handleError, withRetry]);

  const resendVerificationEmail = useCallback(async (email?: string) => {
    try {
      setLoading(true);
      const emailToVerify = email || pendingVerificationEmail;
      
      if (!emailToVerify) {
        throw new Error('No email found for verification');
      }

      const { error } = await withRetry(() => 
        supabase.auth.resend({
          type: 'signup',
          email: emailToVerify,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        })
      );

      if (error) throw error;
      
      toast.success('New verification email sent. Please check your inbox.');
      setPendingVerificationEmail(emailToVerify);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError, pendingVerificationEmail, withRetry]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        throw new Error('Username must be 3-20 lowercase letters, numbers, or underscores');
      }

      // Check for existing user
      const { data: existingUser, error: lookupError } = await withRetry(() =>
        supabase
          .from('profiles')
          .select('id, email, username')
          .or(`username.eq.${username},email.eq.${email}`)
          .maybeSingle()
      );

      if (lookupError) throw lookupError;
      if (existingUser) {
        throw new Error(
          existingUser.email === email
            ? 'Email already in use'
            : 'Username already taken'
        );
      }

      // Attempt signup
      const { data: { user: newUser }, error: signUpError } = await withRetry(() =>
        supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        })
      );

      if (signUpError) throw signUpError;
      if (!newUser) throw new Error('Registration failed');

      // Verify profile creation
      await withRetry(async () => {
        const profile = await fetchUserProfile(newUser.id);
        if (!profile) throw new Error('Profile creation failed');
      }, 3);

      setPendingVerificationEmail(email);
      toast.success('Please check your email to verify your account');
      navigate('/login', { replace: true });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [navigate, handleError, fetchUserProfile, withRetry]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await withRetry(() => supabase.auth.signOut());
      if (error) throw error;
      setUser(null);
      setPendingVerificationEmail(null);
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError, withRetry]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setProfileLoading(true);
      const { data, error } = await withRetry(() =>
        supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single()
      );

      if (error) throw error;
      if (!data) throw new Error('Update failed');

      setUser(data);
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setProfileLoading(false);
    }
  }, [user, handleError, withRetry]);

  const value = {
    user,
    loading,
    profileLoading,
    error,
    pendingVerificationEmail,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
    resendVerificationEmail,
    isEmailVerified,
    setPendingVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};