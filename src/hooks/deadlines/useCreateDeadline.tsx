
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { DeadlineFormData } from '@/types/deadline';

export const useCreateDeadline = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeadlineFormData) => {
      if (!currentWorkspace?.id || !user?.id) {
        throw new Error('Workspace ou usuário não encontrado');
      }

      console.log('Criando prazo:', data);
      console.log('User ID:', user.id);
      console.log('Workspace ID:', currentWorkspace.id);

      // Verificar se o perfil do usuário existe
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileCheck) {
        console.error('Perfil do usuário não encontrado:', profileError);
        throw new Error('Perfil do usuário não encontrado. Entre em contato com o administrador.');
      }

      const deadlineData = {
        title: data.title,
        description: data.description,
        deadline_type: data.deadline_type,
        due_date: data.due_date.toISOString().split('T')[0],
        priority: data.priority,
        status: data.status || 'PENDENTE' as const,
        is_critical: data.is_critical || false,
        business_days_only: data.business_days_only ?? true,
        anticipation_days: data.anticipation_days || 7,
        process_id: data.process_id || null,
        client_id: data.client_id || null,
        assigned_to: data.assigned_to || null,
        petition_id: data.petition_id || null,
        petition_execution_id: data.petition_execution_id || null,
        attachments: [],
        custom_fields: data.custom_fields || {},
        workspace_id: currentWorkspace.id,
        created_by: user.id,
      };

      console.log('Dados do prazo a serem inseridos:', deadlineData);

      const { data: result, error } = await supabase
        .from('deadlines')
        .insert(deadlineData)
        .select(`
          *,
          process:processes!fk_deadlines_process_id(id, title, process_number),
          client:clients!fk_deadlines_client_id(id, name),
          assigned_user:profiles!fk_deadlines_assigned_to(id, full_name, email),
          petition:petition_templates!deadlines_petition_id_fkey(id, name, category),
          petition_execution:petition_executions!deadlines_petition_execution_id_fkey(id, created_at, filled_data)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar prazo:', error);
        if (error.code === '23503' && error.message.includes('deadlines_created_by_fkey')) {
          throw new Error('Erro de permissão: seu perfil não foi encontrado. Entre em contato com o administrador.');
        }
        throw error;
      }

      console.log('Prazo criado com sucesso:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo criado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar prazo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar prazo',
        variant: 'destructive',
      });
    },
  });
};
