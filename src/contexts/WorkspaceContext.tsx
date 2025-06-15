
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
  const [hasInitialized, setHasInitialized] = useState(false);

  const { loadWorkspaces, isLoading, error, setIsLoading } = useWorkspaceLoader();
  const { switchWorkspace: switchWorkspaceHook } = useWorkspaceSwitcher();
  const { createWorkspace: createWorkspaceHook, updateWorkspace: updateWorkspaceHook } = useWorkspaceManager();

  console.log('WorkspaceProvider render - user:', user?.id, 'hasInitialized:', hasInitialized, 'isLoading:', isLoading);

  const initializeWorkspaces = useCallback(async () => {
    if (!user || !profile || hasInitialized) {
      console.log('Skipping initialization - conditions not met');
      return;
    }

    try {
      const { workspaces: userWorkspaces, memberData } = await loadWorkspaces(user.id);
      setWorkspaces(userWorkspaces);
      setHasInitialized(true);

      // Auto-select first workspace if none selected
      if (userWorkspaces.length > 0 && !currentWorkspace) {
        const targetWorkspaceId = profile?.current_workspace_id || userWorkspaces[0].id;
        const targetWorkspace = userWorkspaces.find(w => w.id === targetWorkspaceId) || userWorkspaces[0];
        
        console.log('Auto-selecting workspace:', targetWorkspace.id);
        setCurrentWorkspace(targetWorkspace);
        
        // Find member data for this workspace
        const memberInfo = memberData?.find(m => m.workspace_id === targetWorkspace.id);
        if (memberInfo && profile) {
          const memberWithProfile = createMemberWithProfile(memberInfo, profile);
          setCurrentMember(memberWithProfile);
        }
      }
    } catch (error) {
      console.error('Error initializing workspaces:', error);
    }
  }, [user, profile, hasInitialized, loadWorkspaces, currentWorkspace]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user || !profile) return;

    try {
      const { workspace, member } = await switchWorkspaceHook(workspaceId, user.id, profile);
      setCurrentWorkspace(workspace);
      setCurrentMember(member);
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  }, [user, profile, switchWorkspaceHook]);

  const createWorkspace = useCallback(async (data: CreateWorkspaceData): Promise<Workspace> => {
    if (!user) throw new Error('User not authenticated');

    const workspace = await createWorkspaceHook(data, user.id);
    // Refresh workspaces list
    setHasInitialized(false);
    return workspace;
  }, [user, createWorkspaceHook]);

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    await updateWorkspaceHook(id, data);
    
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(prev => prev ? { ...prev, ...data } : null);
    }
    
    setWorkspaces(prev => 
      prev.map(w => w.id === id ? { ...w, ...data } : w)
    );
  }, [updateWorkspaceHook, currentWorkspace]);

  const refreshWorkspaces = useCallback(async () => {
    setHasInitialized(false);
  }, []);

  // Initialize workspaces when user and profile are available
  useEffect(() => {
    console.log('WorkspaceProvider useEffect - user:', !!user, 'profile:', !!profile, 'hasInitialized:', hasInitialized);
    
    if (user && profile && !hasInitialized) {
      initializeWorkspaces();
    } else if (!user) {
      // Reset when user logs out
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setCurrentMember(null);
      setIsLoading(false);
      setHasInitialized(false);
    }
  }, [user, profile, hasInitialized, initializeWorkspaces, setIsLoading]);

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
