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

  const createProfileIfNotExists = async (userId: string, userEmail: string, fullName?: string) => {
    try {
      console.log('Verificando se perfil existe para userId:', userId);
      
      // Primeiro, tentar buscar o perfil existente
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar perfil existente:', fetchError);
      }

      if (existingProfile) {
        console.log('Perfil já existe:', existingProfile);
        return existingProfile;
      }

      // Se não existe, criar um novo perfil
      console.log('Criando novo perfil para usuário:', userId);
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          full_name: fullName || null,
          preferences: {
            notifications: true,
            email_alerts: true,
            theme: 'light'
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar perfil:', createError);
        throw createError;
      }

      console.log('Novo perfil criado:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('Erro no createProfileIfNotExists:', error);
      throw error;
    }
  };

  const loadProfile = async (userId: string, userEmail: string, metadata?: any) => {
    try {
      console.log('Carregando perfil para userId:', userId);
      
      // Tentar buscar o perfil existente primeiro
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
      }
      
      let profileData = data;

      // Se não encontrou o perfil, criar um novo
      if (!profileData) {
        console.log('Perfil não encontrado, criando novo...');
        profileData = await createProfileIfNotExists(userId, userEmail, metadata?.full_name);
      }

      if (profileData) {
        // Garantir que preferences seja um objeto com as propriedades corretas
        const preferences = profileData.preferences && typeof profileData.preferences === 'object' 
          ? profileData.preferences as any
          : { notifications: true, email_alerts: true, theme: 'light' };

        setProfile({
          ...profileData,
          preferences: {
            notifications: preferences.notifications ?? true,
            email_alerts: preferences.email_alerts ?? true,
            theme: preferences.theme ?? 'light'
          }
        });
        console.log('Perfil carregado/criado com sucesso:', profileData);
      } else {
        console.log('Nenhum perfil encontrado ou criado');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading/creating profile:', error);
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
            loadProfile(
              session.user.id, 
              session.user.email!, 
              session.user.user_metadata
            );
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
          await loadProfile(
            session.user.id, 
            session.user.email!, 
            session.user.user_metadata
          );
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
