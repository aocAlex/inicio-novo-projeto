
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToast } from '@/hooks/use-toast';
import { Deadline, DeadlineFormData, DeadlineFilters } from '@/types/deadline';
import { isAfter, subDays } from 'date-fns';

export const useDeadlines = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DeadlineFilters>({});

  const {
    data: deadlines = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['deadlines', currentWorkspace?.id, filters],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      console.log('Carregando prazos para workspace:', currentWorkspace.id);
      
      let query = supabase
        .from('deadlines')
        .select(`
          *,
          process:processes!fk_deadlines_process_id(id, title, process_number),
          client:clients!fk_deadlines_client_id(id, name),
          assigned_user:profiles!fk_deadlines_assigned_to(id, full_name),
          petition:petition_templates(id, name),
          petition_execution:petition_executions(id)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('due_date', { ascending: true });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.deadline_type) {
        query = query.eq('deadline_type', filters.deadline_type);
      }
      
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      
      if (filters.process_id) {
        query = query.eq('process_id', filters.process_id);
      }
      
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      
      if (filters.date_range?.from) {
        query = query.gte('due_date', filters.date_range.from);
      }
      
      if (filters.date_range?.to) {
        query = query.lte('due_date', filters.date_range.to);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao carregar prazos:', error);
        throw error;
      }
      
      console.log('Prazos carregados:', data);
      return data as Deadline[];
    },
    enabled: !!currentWorkspace?.id,
  });

  const createDeadlineMutation = useMutation({
    mutationFn: async (data: DeadlineFormData) => {
      if (!currentWorkspace?.id || !user?.id) {
        throw new Error('Workspace ou usuário não encontrado');
      }

      console.log('Criando prazo:', data);

      const deadlineData = {
        title: data.title,
        description: data.description,
        deadline_type: data.deadline_type,
        due_date: data.due_date,
        priority: data.priority,
        status: data.status || 'PENDENTE',
        is_critical: data.is_critical || false,
        business_days_only: data.business_days_only ?? true,
        anticipation_days: data.anticipation_days || 7,
        process_id: data.process_id || null,
        client_id: data.client_id || null,
        assigned_to: data.assigned_to || null,
        petition_id: data.petition_id || null,
        petition_execution_id: data.petition_execution_id || null,
        attachments: data.attachments || [],
        custom_fields: data.custom_fields || {},
        workspace_id: currentWorkspace.id,
        created_by: user.id,
      };

      const { data: result, error } = await supabase
        .from('deadlines')
        .insert(deadlineData)
        .select(`
          *,
          process:processes!fk_deadlines_process_id(id, title, process_number),
          client:clients!fk_deadlines_client_id(id, name),
          assigned_user:profiles!fk_deadlines_assigned_to(id, full_name),
          petition:petition_templates(id, name),
          petition_execution:petition_executions(id)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar prazo:', error);
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

  const updateDeadlineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeadlineFormData> }) => {
      console.log('Atualizando prazo:', id, data);

      const { data: result, error } = await supabase
        .from('deadlines')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          process:processes!fk_deadlines_process_id(id, title, process_number),
          client:clients!fk_deadlines_client_id(id, name),
          assigned_user:profiles!fk_deadlines_assigned_to(id, full_name),
          petition:petition_templates(id, name),
          petition_execution:petition_executions(id)
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

  const completeDeadlineMutation = useMutation({
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
          assigned_user:profiles!fk_deadlines_assigned_to(id, full_name),
          petition:petition_templates(id, name),
          petition_execution:petition_executions(id)
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

  const deleteDeadlineMutation = useMutation({
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

  // Funções auxiliares
  const getUpcomingDeadlines = (days: number = 7) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    
    return deadlines.filter(deadline => {
      const dueDate = new Date(deadline.due_date);
      return dueDate <= targetDate && deadline.status === 'PENDENTE';
    });
  };

  const getOverdueDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return deadlines.filter(deadline => {
      const dueDate = new Date(deadline.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return isAfter(today, dueDate) && deadline.status === 'PENDENTE';
    });
  };

  const loadDeadlines = (newFilters?: DeadlineFilters) => {
    if (newFilters) {
      setFilters(newFilters);
    }
    refetch();
  };

  return {
    deadlines,
    isLoading,
    error,
    createDeadline: createDeadlineMutation.mutateAsync,
    updateDeadline: (id: string, data: Partial<DeadlineFormData>) => 
      updateDeadlineMutation.mutateAsync({ id, data }),
    completeDeadline: (id: string, notes?: string) => 
      completeDeadlineMutation.mutateAsync({ id, notes }),
    deleteDeadline: deleteDeadlineMutation.mutateAsync,
    getUpcomingDeadlines,
    getOverdueDeadlines,
    loadDeadlines,
    refetch,
  };
};
