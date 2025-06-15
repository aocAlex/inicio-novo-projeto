
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteDeadline = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Excluindo prazo:', id);

      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir prazo:', error);
        throw error;
      }

      console.log('Prazo excluído com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir prazo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir prazo',
        variant: 'destructive',
      });
    },
  });
};
