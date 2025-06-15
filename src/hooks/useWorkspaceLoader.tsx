
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

export const useWorkspaceLoader = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async (userId: string) => {
    console.log('Loading workspaces for user:', userId);
    
    try {
      setIsLoading(true);
      setError(null);
      
      // First, get the user's workspaces directly without complex joins
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, status, permissions, last_activity, created_at, id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError) {
        console.error('Error loading member data:', memberError);
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        console.log('No workspace memberships found');
        return { workspaces: [], memberData: [] };
      }

      // Get workspace details separately
      const workspaceIds = memberData.map(m => m.workspace_id);
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

      if (workspaceError) {
        console.error('Error loading workspace data:', workspaceError);
        throw workspaceError;
      }

      // Map the data together
      const enrichedMemberData = memberData.map(member => {
        const workspace = workspaceData?.find(w => w.id === member.workspace_id);
        return {
          ...member,
          workspace
        };
      }).filter(member => member.workspace);

      const userWorkspaces = enrichedMemberData.map(member => member.workspace).filter(Boolean);
      
      console.log('Found workspaces:', userWorkspaces.length);
      
      return { workspaces: userWorkspaces, memberData: enrichedMemberData };

    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar workspaces",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    loadWorkspaces,
    isLoading,
    error,
    setIsLoading,
    setError
  };
};
