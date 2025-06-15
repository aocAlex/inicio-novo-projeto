
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';

export const useAuthActions = () => {
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Starting signIn for:', email);
    
    // Clean state before attempting login
    cleanupAuthState();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('SignIn result:', error ? 'error' : 'success');
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    console.log('Starting signUp for:', email);
    
    // Clean state before attempting signup
    cleanupAuthState();
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined
      }
    });
    
    console.log('SignUp result:', error ? 'error' : 'success');
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    console.log('Signing out');
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('Error during signOut:', error);
    }
    
    cleanupAuthState();
    console.log('SignOut completed');
  }, []);

  const forceReset = useCallback(async () => {
    console.log('Force resetting authentication');
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('Error during force reset:', error);
    }
    
    cleanupAuthState();
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
  }, []);

  return {
    signIn,
    signUp,
    signOut,
    forceReset
  };
};
