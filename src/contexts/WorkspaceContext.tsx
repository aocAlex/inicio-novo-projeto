
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Workspace, WorkspaceMember, CreateWorkspaceData } from '@/types/workspace';
import { useWorkspaceLoader } from '@/hooks/useWorkspaceLoader';
import { useWorkspaceSwitcher } from '@/hooks/useWorkspaceSwitcher';
import { useWorkspaceManager } from '@/hooks/useWorkspaceManager';
import { createMemberWithProfile } from '@/utils/workspaceUtils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { loadWorkspaces } = useWorkspaceLoader();
  const { switchWorkspace: switchWorkspaceHook } = useWorkspaceSwitcher();
  const { createWorkspace: createWorkspaceHook, updateWorkspace: updateWorkspaceHook } = useWorkspaceManager();

  console.log('WorkspaceProvider render - user:', !!user, 'profile:', !!profile, 'hasInitialized:', hasInitialized, 'isLoading:', isLoading);

  const initializeWorkspaces = useCallback(async () => {
    if (!user?.id || !profile?.id || !user?.email || hasInitialized) {
      console.log('Skipping initialization - conditions not met:', { 
        hasUser: !!user?.id, 
        hasProfile: !!profile?.id,
        hasEmail: !!user?.email,
        hasInitialized
      });
      return;
    }

    console.log('Starting workspace initialization for user:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      // Load workspaces with automatic creation if none exist
      const { workspaces: userWorkspaces, memberData } = await loadWorkspaces(user.id, user.email);
      
      // Filter valid workspaces
      const validWorkspaces = userWorkspaces.filter(workspace => {
        const memberInfo = memberData?.find(m => m.workspace_id === workspace.id);
        return memberInfo && memberInfo.status === 'active';
      });

      setWorkspaces(validWorkspaces);

      if (validWorkspaces.length > 0) {
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

      setHasInitialized(true);
      console.log('Workspace initialization completed successfully');
      
    } catch (error) {
      console.error('Error initializing workspaces:', error);
      setError(error?.message || 'Erro ao carregar workspaces');
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setCurrentMember(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, profile?.id, profile?.current_workspace_id, hasInitialized, loadWorkspaces]);

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
    setHasInitialized(false); // Force re-initialization
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
    if (user?.id && profile?.id && user?.email && !hasInitialized && !isLoading) {
      console.log('Conditions met, initializing workspaces...');
      initializeWorkspaces();
    }
  }, [user?.id, user?.email, profile?.id, hasInitialized, isLoading, initializeWorkspaces]);

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      console.log('User logged out, resetting workspace state');
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setCurrentMember(null);
      setHasInitialized(false);
      setIsLoading(false);
      setError(null);
    }
  }, [user]);

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
