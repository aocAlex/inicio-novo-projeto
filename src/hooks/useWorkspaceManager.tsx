
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, CreateWorkspaceData } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

export const useWorkspaceManager = () => {
  const { toast } = useToast();

  const createWorkspace = useCallback(async (data: CreateWorkspaceData, userId: string): Promise<Workspace> => {
    try {
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          ...data,
          owner_id: userId,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceData.id,
          user_id: userId,
          role: 'owner',
        });

      if (memberError) throw memberError;

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
  }, [toast]);

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);

      if (error) throw error;

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
      throw error;
    }
  }, [toast]);

  return {
    createWorkspace,
    updateWorkspace
  };
};
