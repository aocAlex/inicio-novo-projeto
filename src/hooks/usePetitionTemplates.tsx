
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { PetitionTemplate, TemplateField, CreateTemplateData, UpdateTemplateData, PetitionFilters } from '@/types/petition';
import { useToast } from '@/hooks/use-toast';

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

      setTemplates(data || []);
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
          ...templateData,
          workspace_id: currentWorkspace.id,
          category: templateData.category || 'civil',
        })
        .select()
        .single();

      if (templateError) {
        throw templateError;
      }

      // Criar campos do template se fornecidos
      if (templateData.fields && templateData.fields.length > 0) {
        const fieldsToInsert = templateData.fields.map(field => ({
          ...field,
          template_id: template.id,
        }));

        const { error: fieldsError } = await supabase
          .from('template_fields')
          .insert(fieldsToInsert);

        if (fieldsError) {
          console.error('Error creating template fields:', fieldsError);
        }
      }

      setTemplates(prev => [template, ...prev]);

      toast({
        title: "Template criado",
        description: `${template.name} foi criado com sucesso.`,
      });

      return template;
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

      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? data : template
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

      return data;
    } catch (err: any) {
      console.error('Error getting template:', err);
      return null;
    }
  };

  const getTemplateFields = async (templateId: string): Promise<TemplateField[]> => {
    try {
      const { data, error } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error('Error getting template fields:', err);
      return [];
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
    getTemplateFields,
  };
};
