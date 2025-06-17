
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PetitionExecution {
  id: string;
  workspace_id: string;
  template_id: string;
  process_id: string | null;
  client_id: string | null;
  filled_data: Record<string, any>;
  generated_content: string | null;
  final_document_url: string | null;
  webhook_url: string | null;
  webhook_status: 'pending' | 'sent' | 'completed' | 'failed';
  webhook_sent_at: string | null;
  webhook_completed_at: string | null;
  webhook_response: Record<string, any>;
  retry_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
  };
  process?: {
    id: string;
    title: string;
    process_number: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

export interface CreateExecutionData {
  template_id: string;
  process_id?: string;
  client_id?: string;
  filled_data: Record<string, any>;
  webhook_url?: string;
}

// Helper function to safely convert Json to Record<string, any>
const safeJsonToRecord = (json: any): Record<string, any> => {
  if (json === null || json === undefined) {
    return {};
  }
  if (typeof json === 'object' && !Array.isArray(json)) {
    return json as Record<string, any>;
  }
  return {};
};

// Helper function to safely cast webhook_status to the expected type
const safeWebhookStatus = (status: any): 'pending' | 'sent' | 'completed' | 'failed' => {
  if (status === 'pending' || status === 'sent' || status === 'completed' || status === 'failed') {
    return status;
  }
  return 'pending'; // Default fallback
};

export const usePetitions = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [executions, setExecutions] = useState<PetitionExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = async (filters?: { search?: string; status?: string }) => {
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

      if (filters?.status) {
        query = query.eq('webhook_status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: PetitionExecution[] = (data || []).map(item => ({
        ...item,
        filled_data: safeJsonToRecord(item.filled_data),
        webhook_response: safeJsonToRecord(item.webhook_response),
        webhook_status: safeWebhookStatus(item.webhook_status),
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

      if (error) throw error;

      // Incrementar contador de execuções do template
      await supabase.rpc('increment_template_execution_count', {
        template_id: executionData.template_id
      });

      // Transform the data to match our interface
      const transformedExecution: PetitionExecution = {
        ...data,
        filled_data: safeJsonToRecord(data.filled_data),
        webhook_response: safeJsonToRecord(data.webhook_response),
        webhook_status: safeWebhookStatus(data.webhook_status),
      };

      setExecutions(prev => [transformedExecution, ...prev]);

      // Se houver webhook_url, enviar para webhook
      if (executionData.webhook_url) {
        console.log('Enviando para webhook personalizado:', executionData.webhook_url)
        await sendToWebhook(transformedExecution.id, executionData.webhook_url, transformedExecution);
      } else {
        // Verificar se o template tem webhook configurado
        const { data: templateData } = await supabase
          .from('petition_templates')
          .select('webhook_url, webhook_enabled')
          .eq('id', executionData.template_id)
          .single()
        
        if (templateData?.webhook_url && templateData?.webhook_enabled) {
          console.log('Enviando para webhook do template:', templateData.webhook_url)
          await sendToWebhook(transformedExecution.id, templateData.webhook_url, transformedExecution);
        }
      }

      toast({
        title: "Petição executada",
        description: "Petição foi executada com sucesso.",
      });

      return transformedExecution;
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

  const sendToWebhook = async (executionId: string, webhookUrl: string, executionData: PetitionExecution) => {
    try {
      console.log('Iniciando envio para webhook:', webhookUrl)
      
      // Atualizar status para 'sent'
      await supabase
        .from('petition_executions')
        .update({
          webhook_status: 'sent',
          webhook_sent_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      // Buscar dados completos da execução
      const { data: fullExecution } = await supabase
        .from('petition_executions')
        .select(`
          *,
          template:petition_templates(id, name, category),
          process:processes(id, title, process_number),
          client:clients(id, name, email, phone, document_number)
        `)
        .eq('id', executionId)
        .single()

      const payload = {
        event: 'petition_executed',
        timestamp: new Date().toISOString(),
        execution_id: executionId,
        template: fullExecution?.template,
        process: fullExecution?.process,
        client: fullExecution?.client,
        filled_data: executionData.filled_data,
        generated_content: executionData.generated_content,
        workspace_id: executionData.workspace_id
      }

      console.log('Payload do webhook:', payload)

      // Fazer chamada para o webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LegalTemplate-Webhook/1.0'
        },
        body: JSON.stringify(payload),
      });

      console.log('Resposta do webhook:', response.status, response.statusText)

      if (response.ok) {
        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }

        await supabase
          .from('petition_executions')
          .update({
            webhook_status: 'completed',
            webhook_completed_at: new Date().toISOString(),
            webhook_response: {
              status: response.status,
              statusText: response.statusText,
              data: responseData
            },
          })
          .eq('id', executionId);

        console.log('Webhook enviado com sucesso')
        toast({
          title: "Webhook enviado",
          description: "Dados enviados para o webhook com sucesso.",
        });
      } else {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Erro ao enviar webhook:', err);
      
      await supabase
        .from('petition_executions')
        .update({
          webhook_status: 'failed',
          webhook_response: { 
            error: err.message,
            timestamp: new Date().toISOString()
          },
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

      const transformedExecution: PetitionExecution = {
        ...execution,
        filled_data: safeJsonToRecord(execution.filled_data),
        webhook_response: safeJsonToRecord(execution.webhook_response),
        webhook_status: safeWebhookStatus(execution.webhook_status),
      };

      await sendToWebhook(executionId, execution.webhook_url, transformedExecution);
      await loadExecutions();
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

      if (error) throw error;

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
