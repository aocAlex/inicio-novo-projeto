
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
      
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError) {
        throw memberError;
      }

      const userWorkspaces = memberData?.map(member => member.workspace).filter(Boolean) || [];
      console.log('Found workspaces:', userWorkspaces.length);
      
      return { workspaces: userWorkspaces, memberData };

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
