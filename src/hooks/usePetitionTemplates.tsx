
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PetitionTemplate, CreateTemplateData, UpdateTemplateData, PetitionFilters } from '@/types/petition';

export const usePetitionTemplates = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PetitionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async (filters?: PetitionFilters) => {
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
      if (filters?.is_shared !== undefined) {
        query = query.eq('is_shared', filters.is_shared);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setTemplates((data || []).map(template => ({
        ...template,
        category: template.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
      })));
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: CreateTemplateData): Promise<PetitionTemplate | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data: template, error: templateError } = await supabase
        .from('petition_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category || 'civil',
          template_content: templateData.template_content,
          is_shared: templateData.is_shared || false,
          webhook_url: templateData.webhook_url,
          webhook_enabled: templateData.webhook_enabled || false,
          workspace_id: currentWorkspace.id,
        })
        .select()
        .single();

      if (templateError) {
        throw templateError;
      }

      const templateWithCategory = {
        ...template,
        category: template.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
      };

      setTemplates(prev => [templateWithCategory, ...prev]);

      toast({
        title: "Template criado",
        description: `${template.name} foi criado com sucesso.`,
      });

      return templateWithCategory;
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
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedTemplate = {
        ...data,
        category: data.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
      };

      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
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

  const getTemplate = async (id: string): Promise<PetitionTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('petition_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        category: data.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
      };
    } catch (err: any) {
      console.error('Error getting template:', err);
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
