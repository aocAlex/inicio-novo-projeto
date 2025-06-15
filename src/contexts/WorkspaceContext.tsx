import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Workspace, WorkspaceMember, CreateWorkspaceData } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentMember, setCurrentMember] = useState<WorkspaceMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user) return;

    try {
      // Load workspace details
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;

      // Load member details
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      setCurrentWorkspace(workspaceData);
      
      // Create typed member object
      const memberWithProfile: WorkspaceMember = {
        id: memberData.id,
        workspace_id: memberData.workspace_id,
        user_id: memberData.user_id,
        role: ['owner', 'admin', 'editor', 'viewer'].includes(memberData.role) 
          ? memberData.role as 'owner' | 'admin' | 'editor' | 'viewer'
          : 'viewer',
        permissions: memberData.permissions && typeof memberData.permissions === 'object' && !Array.isArray(memberData.permissions)
          ? memberData.permissions as Record<string, any>
          : {},
        status: ['active', 'pending', 'suspended'].includes(memberData.status) 
          ? memberData.status as 'active' | 'pending' | 'suspended'
          : 'active',
        last_activity: memberData.last_activity,
        created_at: memberData.created_at,
        profile: profile ? {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        } : undefined
      };
      
      setCurrentMember(memberWithProfile);

      // Update profile's current workspace
      await supabase
        .from('profiles')
        .update({ current_workspace_id: workspaceId })
        .eq('id', user.id);

    } catch (error: any) {
      console.error('Error switching workspace:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Erro ao trocar workspace",
        variant: "destructive",
      });
    }
  }, [user, profile, toast]);

  const loadWorkspaces = useCallback(async () => {
    if (!user || hasInitialized) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) {
        throw memberError;
      }

      const userWorkspaces = memberData?.map(member => member.workspace).filter(Boolean) || [];
      setWorkspaces(userWorkspaces);

      // Set current workspace if none is set and we have workspaces
      if (userWorkspaces.length > 0 && !currentWorkspace) {
        const workspaceId = profile?.current_workspace_id || userWorkspaces[0].id;
        await switchWorkspace(workspaceId);
      }

      setHasInitialized(true);

    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar workspaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, hasInitialized, currentWorkspace, profile?.current_workspace_id, switchWorkspace, toast]);

  const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          ...data,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Refresh workspaces list
      await refreshWorkspaces();

      toast({
        title: "Sucesso",
        description: "Workspace criada com sucesso",
      });

      return workspaceData;
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar workspace",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateWorkspace = async (id: string, data: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(prev => prev ? { ...prev, ...data } : null);
      }
      
      setWorkspaces(prev => 
        prev.map(w => w.id === id ? { ...w, ...data } : w)
      );

      toast({
        title: "Sucesso",
        description: "Workspace atualizada com sucesso",
      });
    } catch (error: any) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar workspace",
        variant: "destructive",
      });
    }
  };

  const refreshWorkspaces = useCallback(async () => {
    setHasInitialized(false);
    await loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (user && profile !== undefined && !hasInitialized) {
      loadWorkspaces();
    } else if (!user) {
      // Reset state when user logs out
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setCurrentMember(null);
      setIsLoading(false);
      setHasInitialized(false);
    }
  }, [user, profile, hasInitialized, loadWorkspaces]);

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
