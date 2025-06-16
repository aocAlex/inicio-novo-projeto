
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/workspace';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('useAuthState - user:', user?.id, 'profile:', profile?.id, 'loading:', loading);

  return {
    user,
    setUser,
    session,
    setSession,
    profile,
    setProfile,
    loading,
    setLoading
  };
};
