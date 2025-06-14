
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { PetitionExecution, CreateExecutionData, ExecutionFilters } from '@/types/petition';
import { useToast } from '@/hooks/use-toast';

export const usePetitionExecutions = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [executions, setExecutions] = useState<PetitionExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = async (filters?: ExecutionFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('petition_executions')
        .select(`
          *,
          template:petition_templates(id, name),
          process:processes(id, title, process_number),
          client:clients(id, name)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (filters?.template_id) {
        query = query.eq('template_id', filters.template_id);
      }
      if (filters?.process_id) {
        query = query.eq('process_id', filters.process_id);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.webhook_status) {
        query = query.eq('webhook_status', filters.webhook_status);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform the data to match our types
      const transformedData: PetitionExecution[] = (data || []).map(item => ({
        ...item,
        filled_data: typeof item.filled_data === 'object' ? item.filled_data as Record<string, any> : {},
        webhook_response: typeof item.webhook_response === 'object' ? item.webhook_response as Record<string, any> : {},
        webhook_status: (item.webhook_status || 'pending') as PetitionExecution['webhook_status'],
      }));

      setExecutions(transformedData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading executions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createExecution = async (executionData: CreateExecutionData): Promise<PetitionExecution | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('petition_executions')
        .insert({
          ...executionData,
          workspace_id: currentWorkspace.id,
        })
        .select(`
          *,
          template:petition_templates(id, name),
          process:processes(id, title, process_number),
          client:clients(id, name)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Transform the response to match our types
      const transformedData: PetitionExecution = {
        ...data,
        filled_data: typeof data.filled_data === 'object' ? data.filled_data as Record<string, any> : {},
        webhook_response: typeof data.webhook_response === 'object' ? data.webhook_response as Record<string, any> : {},
        webhook_status: (data.webhook_status || 'pending') as PetitionExecution['webhook_status'],
      };

      // Incrementar contador de execuções do template
      await supabase.rpc('increment_template_execution_count', {
        template_id: executionData.template_id
      });

      setExecutions(prev => [transformedData, ...prev]);

      // Se houver webhook_url, enviar para N8n
      if (executionData.webhook_url) {
        await sendToWebhook(transformedData.id, executionData.webhook_url, transformedData);
      }

      toast({
        title: "Petição executada",
        description: "Petição foi executada com sucesso.",
      });

      return transformedData;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao executar petição",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const sendToWebhook = async (executionId: string, webhookUrl: string, executionData: any) => {
    try {
      // Atualizar status para 'sent'
      await supabase
        .from('petition_executions')
        .update({
          webhook_status: 'sent',
          webhook_sent_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      // Fazer chamada para o webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          execution_id: executionId,
          template_name: executionData.template?.name,
          filled_data: executionData.filled_data,
          process: executionData.process,
          client: executionData.client,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        await supabase
          .from('petition_executions')
          .update({
            webhook_status: 'completed',
            webhook_completed_at: new Date().toISOString(),
            webhook_response: responseData,
          })
          .eq('id', executionId);

        toast({
          title: "Webhook enviado",
          description: "Dados enviados para N8n com sucesso.",
        });
      } else {
        throw new Error(responseData.message || 'Erro no webhook');
      }
    } catch (err: any) {
      console.error('Error sending webhook:', err);
      
      await supabase
        .from('petition_executions')
        .update({
          webhook_status: 'failed',
          webhook_response: { error: err.message },
        })
        .eq('id', executionId);

      // Incrementar retry count
      await supabase.rpc('increment_execution_retry_count', {
        execution_id: executionId
      });

      toast({
        title: "Erro no webhook",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const retryWebhook = async (executionId: string): Promise<boolean> => {
    try {
      const { data: execution, error } = await supabase
        .from('petition_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (error || !execution.webhook_url) {
        throw new Error('Execução não encontrada ou sem webhook');
      }

      const transformedExecution = {
        ...execution,
        filled_data: typeof execution.filled_data === 'object' ? execution.filled_data as Record<string, any> : {},
        webhook_response: typeof execution.webhook_response === 'object' ? execution.webhook_response as Record<string, any> : {},
        webhook_status: (execution.webhook_status || 'pending') as PetitionExecution['webhook_status'],
      };

      await sendToWebhook(executionId, execution.webhook_url, transformedExecution);
      await loadExecutions(); // Recarregar lista
      return true;
    } catch (err: any) {
      toast({
        title: "Erro ao reenviar webhook",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteExecution = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('petition_executions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setExecutions(prev => prev.filter(execution => execution.id !== id));

      toast({
        title: "Execução removida",
        description: "Execução foi removida com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover execução",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadExecutions();
    }
  }, [currentWorkspace]);

  return {
    executions,
    isLoading,
    error,
    loadExecutions,
    createExecution,
    retryWebhook,
    deleteExecution,
  };
};
