
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { Process, ProcessClient, CreateProcessData, UpdateProcessData, ProcessFilters } from '@/types/process';
import { useToast } from '@/hooks/use-toast';

// Helper function to safely cast status to the expected type
const safeProcessStatus = (status: any): 'active' | 'pending' | 'suspended' | 'archived' => {
  if (status === 'active' || status === 'pending' || status === 'suspended' || status === 'archived') {
    return status;
  }
  return 'active'; // Default fallback
};

// Helper function to safely cast priority to the expected type
const safeProcessPriority = (priority: any): 'low' | 'medium' | 'high' | 'urgent' => {
  if (priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'urgent') {
    return priority;
  }
  return 'medium'; // Default fallback
};

export const useProcesses = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProcesses = async (filters?: ProcessFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('processes')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,process_number.ilike.%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.court) {
        query = query.ilike('court', `%${filters.court}%`);
      }
      if (filters?.assigned_lawyer) {
        query = query.eq('assigned_lawyer', filters.assigned_lawyer);
      }
      if (filters?.deadline_after) {
        query = query.gte('deadline_date', filters.deadline_after);
      }
      if (filters?.deadline_before) {
        query = query.lte('deadline_date', filters.deadline_before);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform the data to match our interface with proper type casting
      const typedProcesses: Process[] = (data || []).map(process => ({
        ...process,
        status: safeProcessStatus(process.status),
        priority: safeProcessPriority(process.priority),
      }));

      setProcesses(typedProcesses);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading processes:', err);
      toast({
        title: "Erro ao carregar processos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProcess = async (processData: CreateProcessData): Promise<Process | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('processes')
        .insert({
          ...processData,
          workspace_id: currentWorkspace.id,
          status: processData.status || 'active',
          priority: processData.priority || 'medium',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newProcess: Process = {
        ...data,
        status: safeProcessStatus(data.status),
        priority: safeProcessPriority(data.priority),
      };

      // Adicionar clientes ao processo se fornecidos
      if (processData.clients && processData.clients.length > 0) {
        const clientInserts = processData.clients.map(client => ({
          process_id: newProcess.id,
          client_id: client.client_id,
          role: client.role,
        }));

        const { error: clientError } = await supabase
          .from('process_clients')
          .insert(clientInserts);

        if (clientError) {
          console.error('Error adding clients to process:', clientError);
          
          // Se falhar ao adicionar clientes, remover o processo criado
          await supabase.from('processes').delete().eq('id', newProcess.id);
          
          toast({
            title: "Erro ao vincular clientes",
            description: "Não foi possível vincular os clientes ao processo. Tente novamente.",
            variant: "destructive",
          });
          
          return null;
        }
      }

      setProcesses(prev => [newProcess, ...prev]);

      toast({
        title: "Processo criado",
        description: `${newProcess.title} foi adicionado com sucesso.`,
      });

      return newProcess;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao criar processo",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProcess = async (id: string, processData: UpdateProcessData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('processes')
        .update({
          ...processData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedProcess: Process = {
        ...data,
        status: safeProcessStatus(data.status),
        priority: safeProcessPriority(data.priority),
      };

      setProcesses(prev => 
        prev.map(process => 
          process.id === id ? updatedProcess : process
        )
      );

      toast({
        title: "Processo atualizado",
        description: `${updatedProcess.title} foi atualizado com sucesso.`,
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao atualizar processo",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProcess = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setProcesses(prev => prev.filter(process => process.id !== id));

      toast({
        title: "Processo removido",
        description: "Processo foi removido com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover processo",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getProcess = async (id: string): Promise<Process | null> => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        status: safeProcessStatus(data.status),
        priority: safeProcessPriority(data.priority),
      } as Process;
    } catch (err: any) {
      console.error('Error getting process:', err);
      return null;
    }
  };

  const getProcessClients = async (processId: string): Promise<ProcessClient[]> => {
    try {
      const { data, error } = await supabase
        .from('process_clients')
        .select(`
          *,
          client:clients(id, name, email, phone, client_type)
        `)
        .eq('process_id', processId);

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        role: item.role as 'plaintiff' | 'defendant' | 'witness' | 'other',
        client: item.client ? {
          ...item.client,
          client_type: item.client.client_type as 'individual' | 'company',
        } : undefined,
      }));
    } catch (err: any) {
      console.error('Error getting process clients:', err);
      return [];
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadProcesses();
    }
  }, [currentWorkspace]);

  return {
    processes,
    isLoading,
    error,
    loadProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    getProcess,
    getProcessClients,
  };
};
