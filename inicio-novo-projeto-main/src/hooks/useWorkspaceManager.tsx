
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

      console.log('Final insert data:', insertData);

      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .insert(insertData)
        .select()
        .single();

      if (workspaceError) {
        console.error('❌ Workspace creation error:', {
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
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar workspace",
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

  return {
    createWorkspace,
    updateWorkspace
  };
};
