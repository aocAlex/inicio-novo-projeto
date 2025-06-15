
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Template {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia';
  template_content: string;
  is_shared: boolean;
  execution_count: number;
  webhook_url: string | null;
  webhook_enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia';
  template_content: string;
  is_shared?: boolean;
  webhook_url?: string;
  webhook_enabled?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia';
  template_content?: string;
  is_shared?: boolean;
  webhook_url?: string;
  webhook_enabled?: boolean;
}

export const useTemplates = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async (filters?: { search?: string; category?: string }) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('petition_templates')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our Template interface
      const typedTemplates: Template[] = (data || []).map(template => ({
        id: template.id,
        workspace_id: template.workspace_id,
        name: template.name,
        description: template.description,
        category: template.category as Template['category'],
        template_content: template.template_content,
        is_shared: template.is_shared,
        execution_count: template.execution_count,
        webhook_url: template.webhook_url || null,
        webhook_enabled: template.webhook_enabled || false,
        created_by: template.created_by,
        created_at: template.created_at,
        updated_at: template.updated_at,
      }));
      
      setTemplates(typedTemplates);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: CreateTemplateData): Promise<Template | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('petition_templates')
        .insert({
          ...templateData,
          workspace_id: currentWorkspace.id,
          webhook_url: templateData.webhook_url || null,
          webhook_enabled: templateData.webhook_enabled || false,
        })
        .select('*')
        .single();

      if (error) throw error;

      const typedTemplate: Template = {
        id: data.id,
        workspace_id: data.workspace_id,
        name: data.name,
        description: data.description,
        category: data.category as Template['category'],
        template_content: data.template_content,
        is_shared: data.is_shared,
        execution_count: data.execution_count,
        webhook_url: data.webhook_url || null,
        webhook_enabled: data.webhook_enabled || false,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setTemplates(prev => [typedTemplate, ...prev]);
      toast({
        title: "Template criado",
        description: `${data.name} foi criado com sucesso.`,
      });

      return typedTemplate;
    } catch (err: any) {
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

  const updateTemplate = async (id: string, templateData: UpdateTemplateData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('petition_templates')
        .update({
          ...templateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      const typedTemplate: Template = {
        id: data.id,
        workspace_id: data.workspace_id,
        name: data.name,
        description: data.description,
        category: data.category as Template['category'],
        template_content: data.template_content,
        is_shared: data.is_shared,
        execution_count: data.execution_count,
        webhook_url: data.webhook_url || null,
        webhook_enabled: data.webhook_enabled || false,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? typedTemplate : template
        )
      );

      toast({
        title: "Template atualizado",
        description: `${data.name} foi atualizado com sucesso.`,
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
        .from('petition_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
  };
};
