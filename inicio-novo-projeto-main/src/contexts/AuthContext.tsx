
import React, { createContext, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/workspace';
import { cleanupAuthState } from '@/utils/authCleanup';
import { useAuthState } from '@/hooks/useAuthState';
import { useProfileManager } from '@/hooks/useProfileManager';
import { useAuthActions } from '@/hooks/useAuthActions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  forceReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    user, setUser, 
    session, setSession, 
    profile, setProfile, 
    loading, setLoading 
  } = useAuthState();

  const { loadUserData, updateProfile: updateUserProfile } = useProfileManager({ 
    setProfile, 
    setLoading 
  });

  const { signIn, signUp, signOut, forceReset } = useAuthActions();

  console.log('AuthProvider render - user:', user?.id, 'profile:', profile?.id, 'loading:', loading);

  useEffect(() => {
    console.log('AuthProvider useEffect - setting up listeners');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer Supabase calls and prevent deadlocks
          setTimeout(() => {
            loadUserData(
              session.user.id, 
              session.user.email!, 
              session.user.user_metadata
            );
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
          
          // Clean up on sign out
          if (event === 'SIGNED_OUT') {
            cleanupAuthState();
          }
        }
      }
    );

    // Initialize auth
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          cleanupAuthState();
          setLoading(false);
          return;
        }

        console.log('Existing session found:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer data loading
          setTimeout(() => {
            loadUserData(
              session.user.id, 
              session.user.email!, 
              session.user.user_metadata
            );
          }, 0);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        cleanupAuthState();
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, [loadUserData, setUser, setSession, setProfile, setLoading]);

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    await updateUserProfile(user.id, data);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    forceReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
