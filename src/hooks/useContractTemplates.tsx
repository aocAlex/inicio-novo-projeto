
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContractTemplate {
  id: string;
  workspace_id: string;
  template_name: string;
  contract_name: string;
  contract_type?: string;
  contract_value?: number;
  default_status: 'pending' | 'signed' | 'rejected' | 'expired';
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContractTemplateData {
  template_name: string;
  contract_name: string;
  contract_type?: string;
  contract_value?: number;
  default_status: 'pending' | 'signed' | 'rejected' | 'expired';
  notes?: string;
}

export interface UpdateContractTemplateData {
  template_name?: string;
  contract_name?: string;
  contract_type?: string;
  contract_value?: number;
  default_status?: 'pending' | 'signed' | 'rejected' | 'expired';
  notes?: string;
  is_active?: boolean;
}

export const useContractTemplates = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading contract templates:', err);
      toast({
        title: "Erro ao carregar templates",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: CreateContractTemplateData): Promise<ContractTemplate | null> => {
    if (!currentWorkspace) {
      toast({
        title: "Erro",
        description: "Nenhuma workspace selecionada",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          ...templateData,
          workspace_id: currentWorkspace.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTemplate: ContractTemplate = data;
      setTemplates(prev => [newTemplate, ...prev]);

      toast({
        title: "Template criado",
        description: `Template "${newTemplate.template_name}" foi criado com sucesso.`,
      });

      return newTemplate;
    } catch (err: any) {
      console.error('Error creating contract template:', err);
      setError(err.message);
      toast({
        title: "Erro ao criar template",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, templateData: UpdateContractTemplateData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contract_templates')
        .update({
          ...templateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedTemplate: ContractTemplate = data;

      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      );

      toast({
        title: "Template atualizado",
        description: `Template "${updatedTemplate.template_name}" foi atualizado com sucesso.`,
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao atualizar template",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTemplates(prev => prev.filter(template => template.id !== id));

      toast({
        title: "Template removido",
        description: "Template foi removido com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover template",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplate = async (id: string): Promise<ContractTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Error getting contract template:', err);
      return null;
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadTemplates();
    }
  }, [currentWorkspace]);

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
  };
};
