
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
  const [initialized, setInitialized] = useState(false);

  console.log('WorkspaceProvider render - user:', user?.id, 'initialized:', initialized, 'isLoading:', isLoading);

  const loadWorkspaces = useCallback(async () => {
    if (!user || initialized) {
      console.log('Skipping loadWorkspaces - no user or already initialized');
      return;
    }

    console.log('Loading workspaces for user:', user.id);
    
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
      console.log('Found workspaces:', userWorkspaces.length);
      
      setWorkspaces(userWorkspaces);
      setInitialized(true);

      // Auto-select first workspace if none selected
      if (userWorkspaces.length > 0 && !currentWorkspace) {
        const targetWorkspaceId = profile?.current_workspace_id || userWorkspaces[0].id;
        const targetWorkspace = userWorkspaces.find(w => w.id === targetWorkspaceId) || userWorkspaces[0];
        
        console.log('Auto-selecting workspace:', targetWorkspace.id);
        setCurrentWorkspace(targetWorkspace);
        
        // Find member data for this workspace
        const memberInfo = memberData?.find(m => m.workspace_id === targetWorkspace.id);
        if (memberInfo && profile) {
          const memberWithProfile: WorkspaceMember = {
            id: memberInfo.id,
            workspace_id: memberInfo.workspace_id,
            user_id: memberInfo.user_id,
            role: ['owner', 'admin', 'editor', 'viewer'].includes(memberInfo.role) 
              ? memberInfo.role as 'owner' | 'admin' | 'editor' | 'viewer'
              : 'viewer',
            permissions: memberInfo.permissions && typeof memberInfo.permissions === 'object' && !Array.isArray(memberInfo.permissions)
              ? memberInfo.permissions as Record<string, any>
              : {},
            status: ['active', 'pending', 'suspended'].includes(memberInfo.status) 
              ? memberInfo.status as 'active' | 'pending' | 'suspended'
              : 'active',
            last_activity: memberInfo.last_activity,
            created_at: memberInfo.created_at,
            profile: {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            }
          };
          setCurrentMember(memberWithProfile);
        }
      }

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
  }, [user, initialized, currentWorkspace, profile, toast]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user || !profile) return;

    console.log('Switching to workspace:', workspaceId);

    try {
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;

      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      setCurrentWorkspace(workspaceData);
      
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
        profile: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        }
      };
      
      setCurrentMember(memberWithProfile);

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

      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Refresh workspaces list
      setInitialized(false);

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
    setInitialized(false);
  }, []);

  // Simple effect - only run when user and profile are available and not initialized
  useEffect(() => {
    console.log('WorkspaceProvider useEffect - user:', !!user, 'profile:', !!profile, 'initialized:', initialized);
    
    if (user && profile && !initialized) {
      loadWorkspaces();
    } else if (!user) {
      // Reset when user logs out
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setCurrentMember(null);
      setIsLoading(false);
      setInitialized(false);
    }
  }, [user, profile, initialized, loadWorkspaces]);

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
