
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TemplateField {
  id: string;
  template_id: string;
  field_key: string;
  field_title: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'email' | 'phone' | 'cpf' | 'cnpj';
  default_value: string | null;
  field_description: string;
  is_required: boolean;
  validation_rules: Record<string, any>;
  display_order: number;
  field_options: Record<string, any>;
  created_at: string;
}

export interface CreateFieldData {
  field_title: string;
  field_type: TemplateField['field_type'];
  default_value?: string;
  field_description: string;
  is_required?: boolean;
  validation_rules?: Record<string, any>;
  field_options?: Record<string, any>;
}

export const useTemplateFields = (templateId?: string) => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para gerar chave única a partir do título
  const generateFieldKey = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .substring(0, 50); // Limita tamanho
  };

  const loadFields = async () => {
    if (!templateId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      const transformedFields: TemplateField[] = (data || []).map(field => ({
        id: field.id,
        template_id: field.template_id,
        field_key: field.field_key,
        field_title: field.field_title,
        field_type: field.field_type as TemplateField['field_type'],
        default_value: field.default_value,
        field_description: field.field_description,
        is_required: field.is_required,
        validation_rules: typeof field.validation_rules === 'object' ? field.validation_rules as Record<string, any> : {},
        display_order: field.display_order,
        field_options: typeof field.field_options === 'object' ? field.field_options as Record<string, any> : {},
        created_at: field.created_at,
      }));

      setFields(transformedFields);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading template fields:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createField = async (fieldData: CreateFieldData): Promise<TemplateField | null> => {
    if (!templateId) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Gerar chave única
      let fieldKey = generateFieldKey(fieldData.field_title);
      
      // Verificar se a chave já existe e adicionar sufixo se necessário
      const existingFields = await supabase
        .from('template_fields')
        .select('field_key')
        .eq('template_id', templateId)
        .like('field_key', `${fieldKey}%`);

      if (existingFields.data && existingFields.data.length > 0) {
        let counter = 1;
        let newKey = fieldKey;
        while (existingFields.data.some(f => f.field_key === newKey)) {
          newKey = `${fieldKey}_${counter}`;
          counter++;
        }
        fieldKey = newKey;
      }

      // Calcular próxima ordem
      const { data: maxOrderData } = await supabase
        .from('template_fields')
        .select('display_order')
        .eq('template_id', templateId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].display_order || 0) + 1 
        : 1;

      const { data, error } = await supabase
        .from('template_fields')
        .insert({
          template_id: templateId,
          field_key: fieldKey,
          field_title: fieldData.field_title,
          field_type: fieldData.field_type,
          default_value: fieldData.default_value || null,
          field_description: fieldData.field_description,
          is_required: fieldData.is_required || false,
          validation_rules: fieldData.validation_rules || {},
          display_order: nextOrder,
          field_options: fieldData.field_options || {},
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newField: TemplateField = {
        id: data.id,
        template_id: data.template_id,
        field_key: data.field_key,
        field_title: data.field_title,
        field_type: data.field_type as TemplateField['field_type'],
        default_value: data.default_value,
        field_description: data.field_description,
        is_required: data.is_required,
        validation_rules: typeof data.validation_rules === 'object' ? data.validation_rules as Record<string, any> : {},
        display_order: data.display_order,
        field_options: typeof data.field_options === 'object' ? data.field_options as Record<string, any> : {},
        created_at: data.created_at,
      };

      setFields(prev => [...prev, newField].sort((a, b) => a.display_order - b.display_order));

      toast({
        title: "Campo criado",
        description: `Campo "${fieldData.field_title}" foi criado com sucesso.`,
      });

      return newField;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao criar campo",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = async (fieldId: string, fieldData: Partial<CreateFieldData>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('template_fields')
        .update({
          field_title: fieldData.field_title,
          default_value: fieldData.default_value || null,
          field_description: fieldData.field_description,
          is_required: fieldData.is_required,
          validation_rules: fieldData.validation_rules || {},
          field_options: fieldData.field_options || {},
        })
        .eq('id', fieldId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedField: TemplateField = {
        id: data.id,
        template_id: data.template_id,
        field_key: data.field_key,
        field_title: data.field_title,
        field_type: data.field_type as TemplateField['field_type'],
        default_value: data.default_value,
        field_description: data.field_description,
        is_required: data.is_required,
        validation_rules: typeof data.validation_rules === 'object' ? data.validation_rules as Record<string, any> : {},
        display_order: data.display_order,
        field_options: typeof data.field_options === 'object' ? data.field_options as Record<string, any> : {},
        created_at: data.created_at,
      };

      setFields(prev => 
        prev.map(field => 
          field.id === fieldId ? updatedField : field
        )
      );

      toast({
        title: "Campo atualizado",
        description: `Campo "${data.field_title}" foi atualizado com sucesso.`,
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao atualizar campo",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteField = async (fieldId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('template_fields')
        .delete()
        .eq('id', fieldId);

      if (error) {
        throw error;
      }

      setFields(prev => prev.filter(field => field.id !== fieldId));

      toast({
        title: "Campo removido",
        description: "Campo foi removido com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover campo",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reorderFields = async (reorderedFields: TemplateField[]): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Preparar updates com nova ordem
      const updates = reorderedFields.map((field, index) => ({
        id: field.id,
        display_order: index + 1,
      }));

      // Atualizar todos os campos
      for (const update of updates) {
        const { error } = await supabase
          .from('template_fields')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) {
          throw error;
        }
      }

      // Atualizar estado local
      const updatedFields = reorderedFields.map((field, index) => ({
        ...field,
        display_order: index + 1,
      }));

      setFields(updatedFields);

      toast({
        title: "Ordem atualizada",
        description: "A ordem dos campos foi atualizada com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao reordenar campos",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (templateId) {
      loadFields();
    }
  }, [templateId]);

  return {
    fields,
    isLoading,
    error,
    loadFields,
    createField,
    updateField,
    deleteField,
    reorderFields,
    generateFieldKey,
  };
};
