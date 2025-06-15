
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/workspace';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider - user:', user, 'loading:', loading);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Carregando perfil para userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        // Não lançar erro, apenas logar e continuar
        setProfile(null);
        return;
      }
      
      if (data) {
        // Garantir que preferences seja um objeto com as propriedades corretas
        const preferences = data.preferences && typeof data.preferences === 'object' 
          ? data.preferences as any
          : { notifications: true, email_alerts: true, theme: 'light' };

        setProfile({
          ...data,
          preferences: {
            notifications: preferences.notifications ?? true,
            email_alerts: preferences.email_alerts ?? true,
            theme: preferences.theme ?? 'light'
          }
        });
        console.log('Perfil carregado com sucesso:', data);
      } else {
        console.log('Nenhum perfil encontrado para o usuário');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect - configurando listeners');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            loadProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setLoading(false);
          return;
        }

        console.log('Sessão existente encontrada:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []);

  // Garantir que loading seja definido como false após carregar o perfil
  useEffect(() => {
    if (user && profile !== undefined) {
      setLoading(false);
    } else if (!user) {
      setLoading(false);
    }
  }, [user, profile]);

  const signIn = async (email: string, password: string) => {
    console.log('Iniciando signIn para:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('Resultado signIn:', error ? 'erro' : 'sucesso');
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('Iniciando signUp para:', email);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined
      }
    });
    console.log('Resultado signUp:', error ? 'erro' : 'sucesso');
    return { error };
  };

  const signOut = async () => {
    console.log('Fazendo signOut');
    
    // Limpar o estado imediatamente
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Limpar localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    try {
      // Tentar logout do Supabase
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('Erro no signOut do Supabase:', error);
      // Continuar mesmo com erro
    }
    
    console.log('SignOut concluído');
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;
    
    setProfile(prev => prev ? { ...prev, ...data } : null);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
