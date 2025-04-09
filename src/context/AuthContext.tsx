import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  credits_used: number;
  is_premium: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  incrementCreditsUsed: () => Promise<boolean>;
  canGenerateMetadata: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canGenerateMetadata, setCanGenerateMetadata] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Don't fetch profile here to avoid race condition
        // Instead, defer with setTimeout
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check if user can generate metadata based on credits and premium status
    if (profile) {
      const canGenerate = profile.is_premium || profile.credits_used < 10;
      setCanGenerateMetadata(canGenerate);
    } else {
      setCanGenerateMetadata(false);
    }
  }, [profile]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Check if a user is already logged in elsewhere
  const checkActiveSession = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('Error checking active sessions:', error);
      }

      return !!data; // If data exists, user is already logged in
    } catch (error) {
      console.error('Error in checkActiveSession:', error);
      return false;
    }
  };

  // Set user as active in the database
  const setActiveSession = async (userId: string, email: string): Promise<void> => {
    try {
      const sessionId = session?.access_token.slice(-10) || Date.now().toString();
      const { error } = await supabase
        .from('active_sessions')
        .upsert({
          id: userId,
          email: email,
          session_id: sessionId,
          last_activity: new Date().toISOString()
        });

      if (error) {
        console.error('Error setting active session:', error);
      }
    } catch (error) {
      console.error('Error in setActiveSession:', error);
    }
  };

  // Remove user from active sessions
  const removeActiveSession = async (userId: string): Promise<void> => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error removing active session:', error);
      }
    } catch (error) {
      console.error('Error in removeActiveSession:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if the user is already logged in elsewhere
      const isActiveSession = await checkActiveSession(email);
      if (isActiveSession) {
        toast.error('This account is already logged in on another device or browser');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Set the user as active
      if (data.user) {
        await setActiveSession(data.user.id, email);
      }
      
      toast.success('Signed in successfully');
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Signed up successfully! Please check your email for verification.');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Remove the user from active sessions before signing out
      if (user) {
        await removeActiveSession(user.id);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  const incrementCreditsUsed = async (): Promise<boolean> => {
    if (!user || !profile) return false;
    
    // Premium users don't consume credits
    if (profile.is_premium) return true;
    
    // Free users with 10 or more credits used can't generate more
    if (profile.credits_used >= 10) {
      toast.error('You have reached your free limit. Please upgrade to premium.');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits_used: profile.credits_used + 1 })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      setProfile({
        ...profile,
        credits_used: profile.credits_used + 1
      });
      
      // Log the generation
      await supabase
        .from('image_metadata_generations')
        .insert({
          user_id: user.id,
          prompt: 'Image metadata generation'
        });
      
      return true;
    } catch (error) {
      console.error('Error incrementing credits:', error);
      toast.error('Failed to process your request. Please try again.');
      return false;
    }
  };

  // Add a heartbeat function to keep the session alive
  useEffect(() => {
    const updateSessionActivity = async () => {
      if (user && session) {
        await setActiveSession(user.id, user.email || '');
      }
    };

    // Update session activity every 5 minutes
    const intervalId = setInterval(updateSessionActivity, 5 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [user, session]);

  // Listen for window close or tab close to remove the active session
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        await removeActiveSession(user.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    incrementCreditsUsed,
    canGenerateMetadata
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
