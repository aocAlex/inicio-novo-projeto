
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

export const useSimplifiedWorkspaceLoader = () => {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const loadUserWorkspaces = useCallback(async (userId: string) => {
    console.log('Loading workspaces for user:', userId);
    
    try {
      setError(null);
      
      // Buscar workspaces onde o usuário é owner
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId);

      if (ownedError) {
        console.error('Error loading owned workspaces:', ownedError);
        throw ownedError;
      }

      // Buscar workspaces onde o usuário é membro
      const { data: membershipData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          invited_by,
          joined_at,
          created_at,
          updated_at,
          workspace:workspaces(*)
        `)
        .eq('user_id', userId);

      if (memberError) {
        console.error('Error loading member workspaces:', memberError);
        throw memberError;
      }

      console.log('Owned workspaces:', ownedWorkspaces);
      console.log('Member workspaces:', membershipData);

      // Combinar workspaces owned + member
      const allWorkspaces: Workspace[] = [...(ownedWorkspaces || [])];
      
      // Adicionar workspaces onde é membro
      if (membershipData) {
        membershipData.forEach(membership => {
          if (membership.workspace && !allWorkspaces.find(w => w.id === membership.workspace.id)) {
            allWorkspaces.push(membership.workspace);
          }
        });
      }

      console.log('Total workspaces found:', allWorkspaces.length);
      
      // Criar dados de membership para cada workspace
      const membershipInfo = allWorkspaces.map(workspace => {
        // Verificar se é owner
        const isOwner = workspace.owner_id === userId;
        
        if (isOwner) {
          return {
            id: `owner-${workspace.id}`,
            workspace_id: workspace.id,
            user_id: userId,
            invited_by: null,
            joined_at: workspace.created_at,
            created_at: workspace.created_at,
            updated_at: workspace.updated_at,
            isOwner: true
          };
        }
        
        // É membro - buscar dados do membership
        const memberInfo = membershipData?.find(m => m.workspace_id === workspace.id);
        return {
          id: `member-${workspace.id}`,
          workspace_id: workspace.id,
          user_id: userId,
          invited_by: memberInfo?.invited_by,
          joined_at: memberInfo?.joined_at || workspace.created_at,
          created_at: memberInfo?.created_at || workspace.created_at,
          updated_at: memberInfo?.updated_at || workspace.updated_at,
          isOwner: false
        };
      });

      return { 
        workspaces: allWorkspaces, 
        membershipInfo 
      };

    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Erro ao carregar workspaces: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    loadUserWorkspaces,
    error,
    setError
  };
};
