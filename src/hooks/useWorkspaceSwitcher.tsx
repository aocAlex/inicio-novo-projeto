
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

      // Check if user is owner or member
      let memberData = null;
      
      if (workspaceData.owner_id === userId) {
        // User is owner - create synthetic member data
        memberData = {
          id: `owner-${workspaceId}`,
          workspace_id: workspaceId,
          user_id: userId,
          invited_by: null,
          joined_at: workspaceData.created_at,
          created_at: workspaceData.created_at,
          updated_at: workspaceData.updated_at
        };
      } else {
        // User is member - get actual member data
        const { data: actualMemberData, error: memberError } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single();

        if (memberError) throw memberError;
        memberData = actualMemberData;
      }

      const memberWithProfile: WorkspaceMember = {
        id: memberData.id,
        workspace_id: memberData.workspace_id,
        user_id: memberData.user_id,
        invited_by: memberData.invited_by,
        joined_at: memberData.joined_at,
        created_at: memberData.created_at,
        updated_at: memberData.updated_at,
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
