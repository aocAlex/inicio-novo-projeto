import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Deadline, DeadlineFormData, DeadlineFilters } from '@/types/deadline';
import { format, isAfter, differenceInDays, addDays } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export const useDeadlines = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  // Buscar prazos
  const { data: rawDeadlines, isLoading, error } = useQuery({
    queryKey: ['deadlines', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      console.log('Fetching deadlines for workspace:', currentWorkspace.id);

      const { data, error } = await supabase
        .from('deadlines')
        .select(`
          *,
          process:processes (
            id,
            title,
            process_number
          ),
          client:clients (
            id,
            name
          ),
          assigned_user:profiles!deadlines_assigned_to_fkey (
            id,
            full_name,
            email
          ),
          petition:petition_templates!deadlines_petition_id_fkey (
            id,
            name,
            category
          ),
          petition_execution:petition_executions!deadlines_petition_execution_id_fkey (
            id,
            created_at,
            filled_data
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching deadlines:', error);
        throw error;
      }

      console.log('Fetched deadlines:', data);
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Atualizar estado local quando dados mudam
  useEffect(() => {
    if (rawDeadlines) {
      // Converter os dados do Supabase para o tipo Deadline
      const convertedDeadlines: Deadline[] = rawDeadlines.map((item: any) => ({
        ...item,
        deadline_type: item.deadline_type as 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado',
        status: item.status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CUMPRIDO' | 'PERDIDO' | 'SUSPENSO',
        priority: item.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        custom_fields: typeof item.custom_fields === 'object' && item.custom_fields !== null ? item.custom_fields : {}
      }));
      setDeadlines(convertedDeadlines);
    }
  }, [rawDeadlines]);

  // Criar prazo
  const createDeadlineMutation = useMutation({
    mutationFn: async (data: DeadlineFormData) => {
      if (!currentWorkspace?.id) throw new Error('Workspace não encontrado');

      console.log('Creating deadline:', data);

      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Usuário não autenticado');

      const deadlineData = {
        workspace_id: currentWorkspace.id,
        title: data.title,
        description: data.description,
        deadline_type: data.deadline_type,
        due_date: format(data.due_date, 'yyyy-MM-dd'),
        process_id: data.process_id || null,
        client_id: data.client_id || null,
        petition_id: data.petition_id || null,
        petition_execution_id: data.petition_execution_id || null,
        assigned_to: data.assigned_to || null,
        priority: data.priority,
        business_days_only: data.business_days_only,
        anticipation_days: data.anticipation_days,
        is_critical: data.is_critical,
        attachments: [],
        custom_fields: data.custom_fields || {},
        created_by: user.data.user.id
      };

      const { data: result, error } = await supabase
        .from('deadlines')
        .insert([deadlineData])
        .select(`
          *,
          process:processes (
            id,
            title,
            process_number
          ),
          client:clients (
            id,
            name
          ),
          assigned_user:profiles!deadlines_assigned_to_fkey (
            id,
            full_name,
            email
          ),
          petition:petition_templates!deadlines_petition_id_fkey (
            id,
            name,
            category
          ),
          petition_execution:petition_executions!deadlines_petition_execution_id_fkey (
            id,
            created_at,
            filled_data
          )
        `)
        .single();

      if (error) {
        console.error('Error creating deadline:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (newDeadline) => {
      // Converter para o tipo correto
      const convertedDeadline: Deadline = {
        ...newDeadline,
        deadline_type: newDeadline.deadline_type as 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado',
        status: newDeadline.status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CUMPRIDO' | 'PERDIDO' | 'SUSPENSO',
        priority: newDeadline.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        attachments: Array.isArray(newDeadline.attachments) ? newDeadline.attachments : [],
        custom_fields: typeof newDeadline.custom_fields === 'object' && newDeadline.custom_fields !== null ? newDeadline.custom_fields : {}
      };

      setDeadlines(prev => [...prev, convertedDeadline]);
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo criado com sucesso!'
      });
    },
    onError: (error) => {
      console.error('Error creating deadline:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar prazo. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Atualizar prazo
  const updateDeadlineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeadlineFormData> }) => {
      console.log('Updating deadline:', id, data);

      const updateData: any = { ...data };
      if (data.due_date) {
        updateData.due_date = format(data.due_date, 'yyyy-MM-dd');
      }

      const { data: result, error } = await supabase
        .from('deadlines')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          process:processes (
            id,
            title,
            process_number
          ),
          client:clients (
            id,
            name
          ),
          assigned_user:profiles!deadlines_assigned_to_fkey (
            id,
            full_name,
            email
          ),
          petition:petition_templates!deadlines_petition_id_fkey (
            id,
            name,
            category
          ),
          petition_execution:petition_executions!deadlines_petition_execution_id_fkey (
            id,
            created_at,
            filled_data
          )
        `)
        .single();

      if (error) {
        console.error('Error updating deadline:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (updatedDeadline) => {
      // Converter para o tipo correto
      const convertedDeadline: Deadline = {
        ...updatedDeadline,
        deadline_type: updatedDeadline.deadline_type as 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado',
        status: updatedDeadline.status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CUMPRIDO' | 'PERDIDO' | 'SUSPENSO',
        priority: updatedDeadline.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        attachments: Array.isArray(updatedDeadline.attachments) ? updatedDeadline.attachments : [],
        custom_fields: typeof updatedDeadline.custom_fields === 'object' && updatedDeadline.custom_fields !== null ? updatedDeadline.custom_fields : {}
      };

      setDeadlines(prev => 
        prev.map(deadline => 
          deadline.id === convertedDeadline.id ? convertedDeadline : deadline
        )
      );
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo atualizado com sucesso!'
      });
    },
    onError: (error) => {
      console.error('Error updating deadline:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar prazo. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Completar prazo
  const completeDeadlineMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      console.log('Completing deadline:', id, notes);

      const { data: result, error } = await supabase
        .from('deadlines')
        .update({
          status: 'CUMPRIDO',
          completed_date: format(new Date(), 'yyyy-MM-dd'),
          completion_notes: notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error completing deadline:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo marcado como cumprido!'
      });
    },
    onError: (error) => {
      console.error('Error completing deadline:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar prazo como cumprido. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Deletar prazo
  const deleteDeadlineMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting deadline:', id);

      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting deadline:', error);
        throw error;
      }

      return id;
    },
    onSuccess: (deletedId) => {
      setDeadlines(prev => prev.filter(deadline => deadline.id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Sucesso',
        description: 'Prazo excluído com sucesso!'
      });
    },
    onError: (error) => {
      console.error('Error deleting deadline:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir prazo. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Filtrar prazos
  const loadDeadlines = async (filters?: DeadlineFilters) => {
    // Esta função pode ser expandida para aplicar filtros do lado servidor
    queryClient.invalidateQueries({ queryKey: ['deadlines'] });
  };

  // Funções de utilidade
  const getUpcomingDeadlines = (days: number) => {
    const targetDate = addDays(new Date(), days);
    return deadlines.filter(deadline => {
      const dueDate = new Date(deadline.due_date);
      const today = new Date();
      return dueDate >= today && dueDate <= targetDate && deadline.status === 'PENDENTE';
    });
  };

  const getOverdueDeadlines = () => {
    const today = new Date();
    return deadlines.filter(deadline => {
      const dueDate = new Date(deadline.due_date);
      return isAfter(today, dueDate) && deadline.status === 'PENDENTE';
    });
  };

  return {
    deadlines,
    isLoading,
    error,
    createDeadline: (data: DeadlineFormData) => createDeadlineMutation.mutateAsync(data),
    updateDeadline: (id: string, data: Partial<DeadlineFormData>) => 
      updateDeadlineMutation.mutateAsync({ id, data }),
    completeDeadline: (id: string, notes?: string) => 
      completeDeadlineMutation.mutateAsync({ id, notes }),
    deleteDeadline: (id: string) => deleteDeadlineMutation.mutateAsync(id),
    loadDeadlines,
    getUpcomingDeadlines,
    getOverdueDeadlines
  };
};
