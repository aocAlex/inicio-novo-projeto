
import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomFieldDefinition } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

export const useCustomFields = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomFields = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (queryError) {
        throw queryError;
      }

      setCustomFields(data || []);

    } catch (err: any) {
      console.error('Error loading custom fields:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  const createCustomField = useCallback(async (fieldData: Omit<CustomFieldDefinition, 'id' | 'workspace_id' | 'created_at'>) => {
    if (!currentWorkspace) {
      throw new Error('Workspace não selecionada');
    }

    try {
      setError(null);

      const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert({
          workspace_id: currentWorkspace.id,
          ...fieldData
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCustomFields(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      
      toast({
        title: "Campo criado",
        description: "Campo personalizado criado com sucesso.",
      });

      return data;

    } catch (err: any) {
      console.error('Error creating custom field:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao criar campo personalizado.",
        variant: "destructive",
      });
      throw err;
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  return {
    customFields,
    isLoading,
    error,
    loadCustomFields,
    createCustomField
  };
};
