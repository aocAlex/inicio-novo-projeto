
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DeadlineFormData } from '@/types/deadline';

export const useUpdateDeadline = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeadlineFormData> }) => {
      console.log('Atualizando prazo:', id, data);

      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Converter due_date para string se for Date
      if (data.due_date instanceof Date) {
        updateData.due_date = data.due_date.toISOString().split('T')[0];
      }

      // Remover attachments do update pois não conseguimos lidar com File[]
      delete updateData.attachments;

      const { data: result, error } = await supabase
        .from('deadlines')
        .update(updateData)
        .eq('id', id)
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
        console.error('Erro ao atualizar prazo:', error);
        throw error;
      }

      console.log('Prazo atualizado com sucesso:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar prazo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar prazo',
        variant: 'destructive',
      });
    },
  });
};
