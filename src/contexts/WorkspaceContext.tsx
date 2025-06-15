
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useWorkspaceLoader } from '@/hooks/useWorkspaceLoader';
import { useWorkspaceManager } from '@/hooks/useWorkspaceManager';
import { useWorkspaceQuota } from '@/hooks/useWorkspaceQuota';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember, CreateWorkspaceData } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  memberData: WorkspaceMember[];
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceData) => Promise<void>;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { loadWorkspaces, error: loaderError } = useWorkspaceLoader();
  const { createWorkspace: createWorkspaceManager } = useWorkspaceManager();
  
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberData, setMemberData] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is owner of current workspace
  const isOwner = currentWorkspace?.owner_id === user?.id;

  const refreshWorkspaces = useCallback(async () => {
    if (!user?.id || !user?.email) {
      console.log('🔄 WorkspaceContext - No user data for refresh');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 WorkspaceContext - Refreshing workspaces for user:', user.id);
      
      const { workspaces: loadedWorkspaces, memberData: loadedMemberData } = await loadWorkspaces(user.id, user.email);
      
      setWorkspaces(loadedWorkspaces);
      setMemberData(loadedMemberData);
      
      // Get current workspace from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.current_workspace_id) {
        const workspace = loadedWorkspaces.find(w => w.id === profile.current_workspace_id);
        if (workspace) {
          setCurrentWorkspace(workspace);
        } else {
          // If current workspace not found, set to first available
          if (loadedWorkspaces.length > 0) {
            await switchWorkspace(loadedWorkspaces[0].id);
          }
        }
      } else if (loadedWorkspaces.length > 0) {
        // No current workspace set, use first available
        await switchWorkspace(loadedWorkspaces[0].id);
      }
      
      console.log('✅ WorkspaceContext - Workspaces refreshed successfully');
      
    } catch (error: any) {
      console.error('❌ WorkspaceContext - Error refreshing workspaces:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, loadWorkspaces]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 WorkspaceContext - Switching to workspace:', workspaceId);
      
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (!workspace) {
        throw new Error('Workspace não encontrada');
      }
      
      // Update current workspace in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_workspace_id: workspaceId })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setCurrentWorkspace(workspace);
      
      console.log('✅ WorkspaceContext - Workspace switched successfully');
      
    } catch (error: any) {
      console.error('❌ WorkspaceContext - Error switching workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao trocar workspace",
        variant: "destructive",
      });
    }
  }, [workspaces, user?.id, toast]);

  const createWorkspace = useCallback(async (data: CreateWorkspaceData) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 WorkspaceContext - Creating workspace');
      
      const newWorkspace = await createWorkspaceManager(data, user.id);
      
      // Refresh workspaces to get updated list and quota
      await refreshWorkspaces();
      
      // Switch to the new workspace
      await switchWorkspace(newWorkspace.id);
      
      console.log('✅ WorkspaceContext - Workspace created and switched successfully');
      
    } catch (error: any) {
      console.error('❌ WorkspaceContext - Error creating workspace:', error);
      throw error;
    }
  }, [user?.id, createWorkspaceManager, refreshWorkspaces, switchWorkspace]);

  // Load workspaces on user change
  useEffect(() => {
    if (user?.id && user?.email) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setMemberData([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
    }
  }, [user?.id, user?.email, refreshWorkspaces]);

  // Update error from loader
  useEffect(() => {
    if (loaderError) {
      setError(loaderError);
    }
  }, [loaderError]);

  const contextValue: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    memberData,
    isOwner,
    isLoading,
    error,
    switchWorkspace,
    createWorkspace,
    refreshWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};
