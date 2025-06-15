
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { DeadlineFilters } from '@/types/deadline';
import { convertSupabaseDataToDeadline } from './utils/dataConversion';

export const useDeadlinesQuery = (filters: DeadlineFilters) => {
  const { currentWorkspace } = useWorkspace();

  return useQuery({
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
          assigned_user:profiles!fk_deadlines_assigned_to(id, full_name, email),
          petition:petition_templates(id, name, category),
          petition_execution:petition_executions(id, created_at, filled_data)
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
      
      if (filters.start_date) {
        query = query.gte('due_date', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('due_date', filters.end_date);
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
      
      console.log('Dados brutos do Supabase:', data);
      
      // Converter os dados para o tipo Deadline
      const convertedData = (data || []).map(convertSupabaseDataToDeadline);
      
      console.log('Prazos convertidos:', convertedData);
      return convertedData;
    },
    enabled: !!currentWorkspace?.id,
  });
};
