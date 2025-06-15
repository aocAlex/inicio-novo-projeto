
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

  console.log('AuthProvider - user:', user?.id, 'profile:', profile?.id, 'loading:', loading);

  const parsePreferences = (preferences: any) => {
    const prefs = preferences && typeof preferences === 'object' 
      ? preferences 
      : { notifications: true, email_alerts: true, theme: 'light' };

    return {
      notifications: prefs.notifications ?? true,
      email_alerts: prefs.email_alerts ?? true,
      theme: (prefs.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark'
    };
  };

  const ensureProfileExists = async (userId: string, userEmail: string, metadata?: any): Promise<Profile | null> => {
    try {
      console.log('Garantindo que perfil existe para userId:', userId);
      
      // Primeiro, tentar buscar o perfil existente
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar perfil existente:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        console.log('Perfil já existe:', existingProfile.id);
        const convertedProfile: Profile = {
          ...existingProfile,
          preferences: parsePreferences(existingProfile.preferences)
        };
        return convertedProfile;
      }

      // Se não existe, criar um novo perfil
      console.log('Criando novo perfil para usuário:', userId);
      const profileData = {
        id: userId,
        email: userEmail,
        full_name: metadata?.full_name || null,
        preferences: {
          notifications: true,
          email_alerts: true,
          theme: 'light'
        }
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar perfil:', createError);
        // Se for erro de duplicata, tentar buscar novamente
        if (createError.code === '23505') {
          const { data: duplicateProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (duplicateProfile) {
            const convertedProfile: Profile = {
              ...duplicateProfile,
              preferences: parsePreferences(duplicateProfile.preferences)
            };
            return convertedProfile;
          }
        }
        throw createError;
      }

      console.log('Novo perfil criado com sucesso:', newProfile.id);
      const convertedProfile: Profile = {
        ...newProfile,
        preferences: parsePreferences(newProfile.preferences)
      };
      return convertedProfile;
    } catch (error) {
      console.error('Erro em ensureProfileExists:', error);
      return null;
    }
  };

  const loadUserData = async (userId: string, userEmail: string, metadata?: any) => {
    try {
      console.log('Carregando dados do usuário:', userId);
      
      const profileData = await ensureProfileExists(userId, userEmail, metadata);
      
      if (profileData) {
        setProfile(profileData);
        console.log('Perfil carregado com sucesso:', profileData.id);
      } else {
        console.error('Falha ao carregar/criar perfil');
        setProfile(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect - configurando listeners');
    
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Não definir loading como false ainda - aguardar carregamento do perfil
          await loadUserData(
            session.user.id, 
            session.user.email!, 
            session.user.user_metadata
          );
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente
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
          await loadUserData(
            session.user.id, 
            session.user.email!, 
            session.user.user_metadata
          );
        } else {
          setLoading(false);
        }
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

  const signIn = async (email: string, password: string) => {
    console.log('Iniciando signIn para:', email);
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
    }
    
    console.log('Resultado signIn:', error ? 'erro' : 'sucesso');
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('Iniciando signUp para:', email);
    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined
      }
    });
    
    if (error) {
      setLoading(false);
    }
    
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
