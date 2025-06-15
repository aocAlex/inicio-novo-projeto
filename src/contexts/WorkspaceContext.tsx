import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Workspace, WorkspaceMember, CreateWorkspaceData } from '@/types/workspace';
import { useSimplifiedWorkspaceLoader } from '@/hooks/useSimplifiedWorkspaceLoader';
import { useWorkspaceManager } from '@/hooks/useWorkspaceManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isOwner: boolean;
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
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { loadUserWorkspaces } = useSimplifiedWorkspaceLoader();
  const { createWorkspace: createWorkspaceHook, updateWorkspace: updateWorkspaceHook } = useWorkspaceManager();

  console.log('WorkspaceProvider render - user:', !!user, 'authLoading:', authLoading, 'hasInitialized:', hasInitialized, 'currentWorkspace:', !!currentWorkspace);

  const initializeWorkspaces = useCallback(async () => {
    if (!user?.id || authLoading || hasInitialized) {
      console.log('Skipping initialization - conditions not met:', { 
        hasUser: !!user?.id, 
        authLoading,
        hasInitialized
      });
      return;
    }

    console.log('Starting workspace initialization for user:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      const { workspaces: userWorkspaces, membershipInfo } = await loadUserWorkspaces(user.id);
      
      console.log('Loaded workspaces:', userWorkspaces.length, userWorkspaces);
      setWorkspaces(userWorkspaces);

      if (userWorkspaces.length > 0) {
        // Selecionar workspace: preferir a atual do perfil, senão a primeira
        const targetWorkspaceId = profile?.current_workspace_id || userWorkspaces[0].id;
        const targetWorkspace = userWorkspaces.find(w => w.id === targetWorkspaceId) || userWorkspaces[0];
        
        console.log('Auto-selecting workspace:', targetWorkspace.id, targetWorkspace.name);
        setCurrentWorkspace(targetWorkspace);
        
        // Verificar se é owner
        const isWorkspaceOwner = targetWorkspace.owner_id === user.id;
        setIsOwner(isWorkspaceOwner);
        
        console.log('User is owner:', isWorkspaceOwner);

        // Atualizar workspace atual no perfil se necessário
        if (profile?.current_workspace_id !== targetWorkspace.id) {
          console.log('Updating current workspace in profile');
          await supabase
            .from('profiles')
            .update({ current_workspace_id: targetWorkspace.id })
            .eq('id', user.id);
        }
      } else {
        console.log('No workspaces found for user');
        setCurrentWorkspace(null);
        setIsOwner(false);
      }

      setHasInitialized(true);
      console.log('Workspace initialization completed successfully');
      
    } catch (error: any) {
      console.error('Error initializing workspaces:', error);
      setError(error?.message || 'Erro ao carregar workspaces');
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setIsOwner(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profile?.current_workspace_id, authLoading, hasInitialized, loadUserWorkspaces]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user?.id) return;

    try {
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (!workspace) {
        throw new Error('Workspace não encontrada');
      }

      setCurrentWorkspace(workspace);
      setIsOwner(workspace.owner_id === user.id);

      // Atualizar workspace atual no perfil
      await supabase
        .from('profiles')
        .update({ current_workspace_id: workspaceId })
        .eq('id', user.id);

      console.log('Switched to workspace:', workspaceId);
    } catch (error: any) {
      console.error('Error switching workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao trocar workspace",
        variant: "destructive",
      });
    }
  }, [user?.id, workspaces, toast]);

  const createWorkspace = useCallback(async (data: CreateWorkspaceData): Promise<Workspace> => {
    if (!user?.id) throw new Error('User not authenticated');

    const workspace = await createWorkspaceHook(data, user.id);
    
    // Recarregar workspaces
    setHasInitialized(false);
    
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
    setHasInitialized(false);
  }, []);

  // Initialize workspaces when conditions are met
  useEffect(() => {
    if (user?.id && !authLoading && !hasInitialized && !isLoading) {
      console.log('Initializing workspaces...');
      initializeWorkspaces();
    }
  }, [user?.id, authLoading, hasInitialized, isLoading, initializeWorkspaces]);

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      console.log('User logged out, resetting workspace state');
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setIsOwner(false);
      setHasInitialized(false);
      setIsLoading(false);
      setError(null);
    }
  }, [user]);

  const value = {
    currentWorkspace,
    workspaces,
    isOwner,
    isLoading,
    error,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    refreshWorkspaces,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
