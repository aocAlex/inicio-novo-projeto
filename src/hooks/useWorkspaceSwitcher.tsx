
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export const useWorkspaceSwitcher = () => {
  const { toast } = useToast();

  const switchWorkspace = useCallback(async (
    workspaceId: string, 
    userId: string, 
    profile: Profile
  ): Promise<{ workspace: Workspace; member: WorkspaceMember }> => {
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
        .eq('user_id', userId)
        .single();

      if (memberError) throw memberError;

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

      await supabase
        .from('profiles')
        .update({ current_workspace_id: workspaceId })
        .eq('id', userId);

      return { workspace: workspaceData, member: memberWithProfile };

    } catch (error: any) {
      console.error('Error switching workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao trocar workspace",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return { switchWorkspace };
};
