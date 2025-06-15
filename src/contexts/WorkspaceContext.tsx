import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Workspace, WorkspaceMember, CreateWorkspaceData } from '@/types/workspace';
import { useWorkspaceLoader } from '@/hooks/useWorkspaceLoader';
import { useWorkspaceSwitcher } from '@/hooks/useWorkspaceSwitcher';
import { useWorkspaceManager } from '@/hooks/useWorkspaceManager';
import { createMemberWithProfile } from '@/utils/workspaceUtils';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  currentMember: WorkspaceMember | null;
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentMember, setCurrentMember] = useState<WorkspaceMember | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { loadWorkspaces, isLoading, error, setIsLoading } = useWorkspaceLoader();
  const { switchWorkspace: switchWorkspaceHook } = useWorkspaceSwitcher();
  const { createWorkspace: createWorkspaceHook, updateWorkspace: updateWorkspaceHook } = useWorkspaceManager();

  console.log('WorkspaceProvider render - user:', !!user, 'profile:', !!profile, 'initialized:', initialized, 'isLoading:', isLoading);

  const initializeWorkspaces = useCallback(async () => {
    if (!user?.id || !profile?.id) {
      console.log('Skipping initialization - missing user or profile:', { 
        hasUser: !!user?.id, 
        hasProfile: !!profile?.id 
      });
      return;
    }

    if (initialized) {
      console.log('Skipping initialization - already initialized');
      return;
    }

    console.log('Starting workspace initialization for user:', user.id);

    try {
      // Verificar se o profile do usuário ainda existe no banco
      const { data: profileExists, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileExists) {
        console.error('User profile not found in database:', user.id);
        // Forçar logout se o profile não existir
        await supabase.auth.signOut();
        return;
      }

      const { workspaces: userWorkspaces, memberData } = await loadWorkspaces(user.id);
      
      // Filtrar workspaces onde o usuário tem membership válido
      const validWorkspaces = userWorkspaces.filter(workspace => {
        const memberInfo = memberData?.find(m => m.workspace_id === workspace.id);
        return memberInfo && memberInfo.status === 'active';
      });

      setWorkspaces(validWorkspaces);

      if (validWorkspaces.length > 0 && !currentWorkspace) {
        const targetWorkspaceId = profile.current_workspace_id || validWorkspaces[0].id;
        const targetWorkspace = validWorkspaces.find(w => w.id === targetWorkspaceId) || validWorkspaces[0];
        
        console.log('Auto-selecting workspace:', targetWorkspace.id);
        setCurrentWorkspace(targetWorkspace);
        
        const memberInfo = memberData?.find(m => m.workspace_id === targetWorkspace.id);
        if (memberInfo) {
          const memberWithProfile = createMemberWithProfile(memberInfo, profile);
          setCurrentMember(memberWithProfile);
        }
      }

      setInitialized(true);
      console.log('Workspace initialization completed');
    } catch (error) {
      console.error('Error initializing workspaces:', error);
      // Em caso de erro, limpar estado e tentar logout
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setCurrentMember(null);
    }
  }, [user?.id, profile?.id, profile?.current_workspace_id, initialized, loadWorkspaces, currentWorkspace]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user?.id || !profile) return;

    try {
      const { workspace, member } = await switchWorkspaceHook(workspaceId, user.id, profile);
      setCurrentWorkspace(workspace);
      setCurrentMember(member);
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  }, [user?.id, profile, switchWorkspaceHook]);

  const createWorkspace = useCallback(async (data: CreateWorkspaceData): Promise<Workspace> => {
    if (!user?.id) throw new Error('User not authenticated');

    const workspace = await createWorkspaceHook(data, user.id);
    setInitialized(false); // Force re-initialization to load new workspace
    return workspace;
  }, [user?.id, createWorkspaceHook]);

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    await updateWorkspaceHook(id, data);
    
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(prev => prev ? { ...prev, ...data } : null);
    }
    
    setWorkspaces(prev => 
      prev.map(w => w.id === id ? { ...w, ...data } : w)
    );
  }, [updateWorkspaceHook, currentWorkspace?.id]);

  const refreshWorkspaces = useCallback(async () => {
    setInitialized(false);
  }, []);

  useEffect(() => {
    console.log('WorkspaceProvider useEffect - checking conditions:', {
      hasUser: !!user?.id,
      hasProfile: !!profile?.id,
      initialized,
      isLoading
    });

    if (user?.id && profile?.id && !initialized && !isLoading) {
      console.log('Conditions met, initializing workspaces...');
      initializeWorkspaces();
    }
  }, [user?.id, profile?.id, initialized, isLoading, initializeWorkspaces]);

  useEffect(() => {
    if (!user) {
      console.log('User logged out, resetting workspace state');
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setCurrentMember(null);
      setInitialized(false);
      setIsLoading(false);
    }
  }, [user, setIsLoading]);

  const value = {
    currentWorkspace,
    workspaces,
    currentMember,
    isLoading,
    error,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    refreshWorkspaces,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
