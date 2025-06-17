
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCompleteDeadline = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      console.log('Marcando prazo como cumprido:', id);

      const { data: result, error } = await supabase
        .from('deadlines')
        .update({
          status: 'CUMPRIDO',
          completed_date: new Date().toISOString().split('T')[0],
          completion_notes: notes,
          updated_at: new Date().toISOString(),
        })
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
        console.error('Erro ao marcar prazo como cumprido:', error);
        throw error;
      }

      console.log('Prazo marcado como cumprido:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo marcado como cumprido!',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao marcar prazo como cumprido:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao marcar prazo como cumprido',
        variant: 'destructive',
      });
    },
  });
};
