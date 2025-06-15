
import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Deadline, DeadlineFormData, DeadlineFilters } from '@/types/deadline';

export const useDeadlines = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeadlines = useCallback(async (filters?: DeadlineFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('deadlines')
        .select(`
          *,
          process:processes(id, title, process_number),
          client:clients(id, name),
          assigned_user:profiles!deadlines_assigned_to_fkey(id, full_name, email)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('due_date', { ascending: true });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.deadline_type) {
        query = query.eq('deadline_type', filters.deadline_type);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.process_id) {
        query = query.eq('process_id', filters.process_id);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.start_date) {
        query = query.gte('due_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('due_date', filters.end_date);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setDeadlines(data || []);

    } catch (err: any) {
      console.error('Error loading deadlines:', err);
      setError(err.message);
      toast({
        title: "Erro ao carregar prazos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, toast]);

  const createDeadline = useCallback(async (data: DeadlineFormData): Promise<Deadline | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: deadline, error } = await supabase
        .from('deadlines')
        .insert({
          workspace_id: currentWorkspace.id,
          title: data.title,
          description: data.description,
          deadline_type: data.deadline_type,
          due_date: data.due_date.toISOString().split('T')[0],
          process_id: data.process_id,
          client_id: data.client_id,
          assigned_to: data.assigned_to,
          priority: data.priority,
          business_days_only: data.business_days_only,
          anticipation_days: data.anticipation_days,
          is_critical: data.is_critical,
          custom_fields: data.custom_fields || {},
          created_by: user.user.id,
        })
        .select(`
          *,
          process:processes(id, title, process_number),
          client:clients(id, name),
          assigned_user:profiles!deadlines_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) throw error;

      // Adicionar histórico
      await supabase
        .from('deadline_history')
        .insert({
          deadline_id: deadline.id,
          workspace_id: currentWorkspace.id,
          action: 'created',
          new_values: deadline,
          performed_by: user.user.id,
        });

      setDeadlines(prev => [deadline, ...prev]);

      toast({
        title: "Prazo criado",
        description: `${deadline.title} foi criado com sucesso.`,
      });

      return deadline;

    } catch (err: any) {
      console.error('Error creating deadline:', err);
      setError(err.message);
      toast({
        title: "Erro ao criar prazo",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, toast]);

  const updateDeadline = useCallback(async (
    id: string, 
    data: Partial<DeadlineFormData>
  ): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      setIsLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Buscar dados atuais para histórico
      const { data: currentDeadline } = await supabase
        .from('deadlines')
        .select('*')
        .eq('id', id)
        .single();

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.deadline_type) updateData.deadline_type = data.deadline_type;
      if (data.due_date) updateData.due_date = data.due_date.toISOString().split('T')[0];
      if (data.process_id !== undefined) updateData.process_id = data.process_id;
      if (data.client_id !== undefined) updateData.client_id = data.client_id;
      if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
      if (data.priority) updateData.priority = data.priority;
      if (data.business_days_only !== undefined) updateData.business_days_only = data.business_days_only;
      if (data.anticipation_days !== undefined) updateData.anticipation_days = data.anticipation_days;
      if (data.is_critical !== undefined) updateData.is_critical = data.is_critical;
      if (data.custom_fields !== undefined) updateData.custom_fields = data.custom_fields;

      const { error } = await supabase
        .from('deadlines')
        .update(updateData)
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      // Adicionar histórico
      await supabase
        .from('deadline_history')
        .insert({
          deadline_id: id,
          workspace_id: currentWorkspace.id,
          action: 'updated',
          old_values: currentDeadline,
          new_values: updateData,
          performed_by: user.user.id,
        });

      // Recarregar lista
      await loadDeadlines();

      toast({
        title: "Prazo atualizado",
        description: "Prazo foi atualizado com sucesso.",
      });

      return true;

    } catch (err: any) {
      console.error('Error updating deadline:', err);
      setError(err.message);
      toast({
        title: "Erro ao atualizar prazo",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, toast, loadDeadlines]);

  const completeDeadline = useCallback(async (
    id: string,
    completionNotes?: string
  ): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('deadlines')
        .update({
          status: 'CUMPRIDO',
          completed_date: new Date().toISOString().split('T')[0],
          completion_notes: completionNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      // Adicionar histórico
      await supabase
        .from('deadline_history')
        .insert({
          deadline_id: id,
          workspace_id: currentWorkspace.id,
          action: 'completed',
          notes: completionNotes,
          performed_by: user.user.id,
        });

      await loadDeadlines();

      toast({
        title: "Prazo cumprido",
        description: "Prazo foi marcado como cumprido.",
      });

      return true;

    } catch (err: any) {
      console.error('Error completing deadline:', err);
      toast({
        title: "Erro ao marcar prazo como cumprido",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [currentWorkspace, toast, loadDeadlines]);

  const deleteDeadline = useCallback(async (id: string): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      setDeadlines(prev => prev.filter(deadline => deadline.id !== id));

      toast({
        title: "Prazo removido",
        description: "Prazo foi removido com sucesso.",
      });

      return true;

    } catch (err: any) {
      console.error('Error deleting deadline:', err);
      toast({
        title: "Erro ao remover prazo",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [currentWorkspace, toast]);

  const getUpcomingDeadlines = useCallback((days: number = 7): Deadline[] => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return deadlines.filter(deadline => {
      const dueDate = new Date(deadline.due_date);
      return dueDate >= today && dueDate <= futureDate && deadline.status === 'PENDENTE';
    });
  }, [deadlines]);

  const getOverdueDeadlines = useCallback((): Deadline[] => {
    const today = new Date();
    return deadlines.filter(deadline => {
      const dueDate = new Date(deadline.due_date);
      return dueDate < today && deadline.status === 'PENDENTE';
    });
  }, [deadlines]);

  useEffect(() => {
    if (currentWorkspace) {
      loadDeadlines();
    }
  }, [currentWorkspace, loadDeadlines]);

  return {
    deadlines,
    isLoading,
    error,
    loadDeadlines,
    createDeadline,
    updateDeadline,
    completeDeadline,
    deleteDeadline,
    getUpcomingDeadlines,
    getOverdueDeadlines,
  };
};
