
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

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;

    try {
      // Load workspace details
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;

      // Load member details without trying to join profiles
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      setCurrentWorkspace(workspaceData);
      
      // Garantir que o role seja válido
      const validRole = ['owner', 'admin', 'editor', 'viewer'].includes(memberData.role) 
        ? memberData.role as 'owner' | 'admin' | 'editor' | 'viewer'
        : 'viewer';
      
      // Garantir que permissions seja um objeto válido
      const permissions = memberData.permissions && typeof memberData.permissions === 'object' && !Array.isArray(memberData.permissions)
        ? memberData.permissions as Record<string, any>
        : {};
      
      // Garantir que status seja válido
      const validStatus = ['active', 'pending', 'suspended'].includes(memberData.status) 
        ? memberData.status as 'active' | 'pending' | 'suspended'
        : 'active';
      
      // Create a properly typed member object using profile data from AuthContext
      const memberWithProfile: WorkspaceMember = {
        id: memberData.id,
        workspace_id: memberData.workspace_id,
        user_id: memberData.user_id,
        role: validRole,
        permissions,
        status: validStatus,
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
  };

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      console.log('LoadWorkspaces: Não há usuário logado');
      setIsLoading(false);
      return;
    }

    try {
      console.log('LoadWorkspaces: Iniciando carregamento para usuário:', user.id);
      setIsLoading(true);
      setError(null);
      
      // Load user's workspaces
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) {
        console.error('Erro ao carregar workspace_members:', memberError);
        throw memberError;
      }

      console.log('LoadWorkspaces: Dados de membros carregados:', memberData);

      const userWorkspaces = memberData?.map(member => member.workspace).filter(Boolean) || [];
      setWorkspaces(userWorkspaces);
      console.log('LoadWorkspaces: Workspaces definidas:', userWorkspaces);

      // Set current workspace
      let currentWorkspaceId = profile?.current_workspace_id;
      
      if (!currentWorkspaceId && userWorkspaces.length > 0) {
        currentWorkspaceId = userWorkspaces[0].id;
        console.log('LoadWorkspaces: Usando primeira workspace como padrão:', currentWorkspaceId);
      }

      if (currentWorkspaceId) {
        console.log('LoadWorkspaces: Trocando para workspace:', currentWorkspaceId);
        await switchWorkspace(currentWorkspaceId);
      } else {
        console.log('LoadWorkspaces: Nenhuma workspace disponível');
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
      console.log('LoadWorkspaces: Finalizando carregamento');
      setIsLoading(false);
    }
  }, [user]); // Removido profile e toast da dependência para evitar loop

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
      await loadWorkspaces();

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

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  useEffect(() => {
    console.log('WorkspaceProvider useEffect - user:', user?.id, 'profile loaded:', !!profile);
    
    if (user && profile !== undefined) {
      // Só carregar workspaces quando tanto user quanto profile estiverem definidos
      loadWorkspaces();
    } else if (!user) {
      // Se não há user, limpar tudo
      setCurrentWorkspace(null);
      setWorkspaces([]);
      setCurrentMember(null);
      setIsLoading(false);
    }
  }, [user, profile, loadWorkspaces]);

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
