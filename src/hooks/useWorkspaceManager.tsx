
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, CreateWorkspaceData } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

export const useWorkspaceManager = () => {
  const { toast } = useToast();

  const createWorkspace = useCallback(async (data: CreateWorkspaceData, userId: string): Promise<Workspace> => {
    try {
      console.log('=== DEBUG: Creating workspace ===');
      console.log('Workspace data:', { ...data, owner_id: userId });
      console.log('User ID:', userId);
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session user ID:', session?.user?.id);
      console.log('Session exists:', !!session);
      
      if (!session?.user) {
        console.error('❌ User not authenticated');
        throw new Error('Usuário não autenticado');
      }

      if (session.user.id !== userId) {
        console.error('❌ User ID mismatch:', { sessionUserId: session.user.id, providedUserId: userId });
        throw new Error('ID do usuário não confere com a sessão');
      }

      console.log('✅ User authentication verified');

      // Verificar quota antes de criar
      const { data: quotaData } = await supabase
        .from('user_workspace_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (quotaData) {
        if (quotaData.is_suspended) {
          throw new Error('Sua conta está suspensa. Entre em contato com o administrador.');
        }
        
        if (!quotaData.is_unlimited && quotaData.current_workspaces >= quotaData.max_workspaces) {
          throw new Error(`Você atingiu o limite de ${quotaData.max_workspaces} workspaces. Exclua uma workspace para criar uma nova.`);
        }
      }

      const insertData = {
        ...data,
        owner_id: userId,
      };

      console.log('Calling create_user_workspace RPC with data:', data); // Updated log

      const { data: workspaceData, error: workspaceError } = await supabase.rpc('create_user_workspace', {
        workspace_name: data.name,
        workspace_description: data.description,
        workspace_logo_url: data.logo_url,
      });

      if (workspaceError) {
        console.error('❌ Workspace creation RPC error:', { // Updated log
          code: workspaceError.code,
          message: workspaceError.message,
          details: workspaceError.details,
          hint: workspaceError.hint
        });
        throw workspaceError;
      }

      console.log('✅ Workspace created successfully:', workspaceData);

      toast({
        title: "Sucesso",
        description: "Workspace criada com sucesso",
      });

      return workspaceData;
    } catch (error: any) {
      console.error('❌ Error creating workspace:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });

      let userFacingMessage = "Erro ao criar workspace";

      // Check if it's the workspace limit error from the RPC
      if (error.code === "P0001" && error.message && error.message.includes("Workspace limit reached")) {
        // Extract the limit number from the message
        const match = error.message.match(/You can only create (\d+) workspaces/);
        const limit = match ? match[1] : 'X';
        userFacingMessage = `Limite de workspaces atingido. Você pode ter no máximo ${limit} workspaces. Contate o administrador para aumentar seu limite.`;
      } else if (error.message) {
        // Use the original error message if available and not the specific limit error
        userFacingMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: userFacingMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const updateWorkspace = useCallback(async (id: string, data: Partial<Workspace>) => {
    try {
      console.log('=== DEBUG: Updating workspace ===');
      console.log('Workspace ID:', id);
      console.log('Update data:', data);

      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('❌ Workspace update error:', error);
        throw error;
      }

      console.log('✅ Workspace updated successfully');

      toast({
        title: "Sucesso",
        description: "Workspace atualizada com sucesso",
      });
    } catch (error: any) {
      console.error('❌ Error updating workspace:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar workspace",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      console.log('=== DEBUG: Deleting workspace ===');
      console.log('Workspace ID to delete:', workspaceId);

      const { error } = await supabase.rpc('delete_workspace', { workspace_id_to_delete: workspaceId });

      if (error) {
        console.error('❌ Workspace deletion error:', error);
        throw error;
      }

      console.log('✅ Workspace deleted successfully');

      toast({
        title: "Sucesso",
        description: "Workspace deletada com sucesso",
      });

      // TODO: After successful deletion, check if the user has any remaining workspaces.
      // If no remaining workspaces, redirect to the public workspace or a default page (e.g., /auth).
      // This logic needs to be implemented here or triggered from the component.

    } catch (error: any) {
      console.error('❌ Error deleting workspace:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar workspace",
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
