
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceMember, WorkspaceInvitation } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

export const useWorkspaceMembers = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async (workspaceId: string) => {
    try {
      setLoading(true);
      
      const { data: membersData, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profile:profiles!workspace_members_user_id_fkey(
            id, email, full_name, avatar_url
          )
        `)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      return membersData as (WorkspaceMember & { profile: any })[];
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addMember = useCallback(async (workspaceId: string, email: string, invitedBy: string) => {
    try {
      setLoading(true);

      // Verificar se o usuário existe
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError) {
        // Usuário não existe, criar convite
        const { error: inviteError } = await supabase
          .from('workspace_invitations')
          .insert({
            workspace_id: workspaceId,
            email: email,
            invited_by: invitedBy
          });

        if (inviteError) throw inviteError;

        toast({
          title: "Convite enviado",
          description: `Convite enviado para ${email}`,
        });
        return 'invited';
      } else {
        // Usuário existe, adicionar direto como membro
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            user_id: userData.id,
            invited_by: invitedBy
          });

        if (memberError) throw memberError;

        toast({
          title: "Membro adicionado",
          description: `${email} foi adicionado à workspace`,
        });
        return 'added';
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "Membro foi removido da workspace",
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadInvitations = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');

      if (error) throw error;

      return data as WorkspaceInvitation[];
    } catch (error: any) {
      console.error('Error loading invitations:', error);
      return [];
    }
  }, []);

  const cancelInvitation = useCallback(async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Convite cancelado",
        description: "Convite foi cancelado",
      });
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    loading,
    loadMembers,
    addMember,
    removeMember,
    loadInvitations,
    cancelInvitation
  };
};
