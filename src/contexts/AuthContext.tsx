import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Profile } from '../lib/supabase';

interface UserProfile extends Profile {
  email?: string;
  email_confirmed_at?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  pendingVerificationEmail: string | null;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (
    email: string,
    password: string,
    userData?: { full_name?: string }
  ) => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);
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

  // Manual profile creation function
  const createUserProfile = useCallback(
    async (
      userId: string,
      userData: { full_name?: string; email?: string }
    ) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username:
              userData.email?.split('@')[0] || `user_${userId.slice(0, 8)}`, // Generate username from email
            email: userData.email,
            full_name: userData.full_name || '',
            role: 'user',
          })
          .select()
          .single();

        if (error) {
          console.error('Manual profile creation error:', error);
          throw error;
        }

        return data;
      } catch (err) {
        console.error('Failed to create profile manually:', err);
        throw new Error('Failed to create user profile');
      }
    },
    []
  );

  const fetchUserProfile = useCallback(
    async (userId: string, authUser?: any): Promise<UserProfile> => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);

          // If profile doesn't exist, create it manually
          if (error.code === 'PGRST116') {
            console.log('Profile not found, creating manually...');
            const newProfile = await createUserProfile(userId, {
              full_name: authUser?.user_metadata?.full_name || '',
              email: authUser?.email || '',
            });

            const combinedProfile: UserProfile = {
              ...newProfile,
              email: authUser?.email || newProfile.email,
              email_confirmed_at: authUser?.email_confirmed_at,
            };

            return combinedProfile;
          }

          throw error;
        }

        // Combine profile data with auth user data
        const combinedProfile: UserProfile = {
          ...data,
          email: authUser?.email || data.email,
          email_confirmed_at:
            authUser?.email_confirmed_at || data.email_confirmed_at,
        };

        return combinedProfile;
      } finally {
        setProfileLoading(false);
      }
    },
    [createUserProfile]
  );

  const verifySession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      return (
        !error &&
        session?.user &&
        (session.expires_at ? session.expires_at * 1000 > Date.now() : true)
      );
    } catch (err) {
      console.error('Session verification error:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          return;
        }

        if (session?.user && mounted) {
          try {
            const profile = await fetchUserProfile(
              session.user.id,
              session.user
            );
            setUser(profile);
          } catch (profileError) {
            console.error(
              'Profile fetch failed during initialization:',
              profileError
            );
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (!mounted) return;

      if (session?.user) {
        try {
          const profile = await fetchUserProfile(session.user.id, session.user);
          setUser(profile);

          // Only redirect on SIGNED_IN event, not on TOKEN_REFRESHED
          if (event === 'SIGNED_IN') {
            if (profile.role === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else {
              navigate('/profile', { replace: true });
            }
          }
        } catch (err) {
          console.error('Profile fetch failed after auth change:', err);
          await supabase.auth.signOut();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login', { replace: true });
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate, fetchUserProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user: authUser, session },
          error: authError,
        } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (authError) throw authError;
        if (!authUser || !session) throw new Error('Authentication failed');

        if (!authUser.email_confirmed_at) {
          setPendingVerificationEmail(authUser.email || email);
          throw new Error(
            'Please verify your email first. Check your inbox or request a new verification link.'
          );
        }

        const profile = await fetchUserProfile(authUser.id, authUser);
        setUser(profile);
        setPendingVerificationEmail(null);
        return profile;
      } catch (err) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile, handleError]
  );

  const resendVerificationEmail = useCallback(
    async (email?: string) => {
      try {
        setLoading(true);
        const emailToVerify = email || pendingVerificationEmail;

        if (!emailToVerify) {
          throw new Error('No email found for verification');
        }

        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: emailToVerify,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        });

        if (error) throw error;

        toast.success('New verification email sent. Please check your inbox.');
        setPendingVerificationEmail(emailToVerify);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [handleError, pendingVerificationEmail]
  );

  // TRIGGER-FREE SIGNUP - Creates user and profile manually
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      userData: { full_name?: string } = {}
    ) => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting signup process...');

        // Step 1: Create the auth user WITHOUT triggering profile creation
        const {
          data: { user: newUser },
          error: signUpError,
        } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          if (signUpError.message.includes('already registered')) {
            throw new Error('An account with this email already exists');
          }
          throw signUpError;
        }

        if (!newUser) {
          throw new Error('Registration failed - no user returned');
        }

        console.log('User created successfully:', newUser.id);

        // Step 2: Manually create the profile (bypassing trigger)
        try {
          await createUserProfile(newUser.id, {
            full_name: userData.full_name || '',
            email: email,
          });
          console.log('Profile created successfully');
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          // Don't fail the whole process - profile can be created later
        }

        setPendingVerificationEmail(email);
        toast.success(
          'Registration successful! Please check your email to verify your account.'
        );
        navigate('/login', { replace: true });
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [navigate, handleError, createUserProfile]
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setPendingVerificationEmail(null);
      toast.success('Signed out successfully');
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('User not authenticated');

      try {
        setProfileLoading(true);

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.user_id)
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Update failed');

        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        toast.success('Profile updated successfully');
        return updatedUser;
      } catch (err) {
        return handleError(err);
      } finally {
        setProfileLoading(false);
      }
    },
    [user, handleError]
  );

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
