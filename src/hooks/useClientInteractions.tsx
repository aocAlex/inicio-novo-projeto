
import { useState, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { ClientInteraction } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

export const useClientInteractions = (clientId?: string) => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInteractions = useCallback(async (targetClientId?: string) => {
    if (!currentWorkspace || (!clientId && !targetClientId)) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('client_interactions')
        .select(`
          *,
          creator:profiles!created_by(
            id,
            full_name,
            email
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('client_id', targetClientId || clientId)
        .order('interaction_date', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setInteractions(data || []);

    } catch (err: any) {
      console.error('Error loading interactions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, clientId]);

  const createInteraction = useCallback(async (interactionData: Omit<ClientInteraction, 'id' | 'workspace_id' | 'created_at' | 'created_by'>) => {
    if (!currentWorkspace) {
      throw new Error('Workspace não selecionada');
    }

    try {
      setError(null);

      const { data, error } = await supabase
        .from('client_interactions')
        .insert({
          workspace_id: currentWorkspace.id,
          ...interactionData
        })
        .select(`
          *,
          creator:profiles!created_by(
            id,
            full_name,
            email
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      setInteractions(prev => [data, ...prev]);
      
      toast({
        title: "Interação registrada",
        description: "Nova interação adicionada com sucesso.",
      });

      return data;

    } catch (err: any) {
      console.error('Error creating interaction:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao registrar interação.",
        variant: "destructive",
      });
      throw err;
    }
  }, [currentWorkspace, toast]);

  const updateInteraction = useCallback(async (id: string, updateData: Partial<ClientInteraction>) => {
    if (!currentWorkspace) {
      throw new Error('Workspace não selecionada');
    }

    try {
      setError(null);

      const { data, error } = await supabase
        .from('client_interactions')
        .update(updateData)
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id)
        .select(`
          *,
          creator:profiles!created_by(
            id,
            full_name,
            email
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      setInteractions(prev => prev.map(interaction => 
        interaction.id === id ? data : interaction
      ));
      
      toast({
        title: "Interação atualizada",
        description: "Interação atualizada com sucesso.",
      });

    } catch (err: any) {
      console.error('Error updating interaction:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao atualizar interação.",
        variant: "destructive",
      });
      throw err;
    }
  }, [currentWorkspace, toast]);

  const deleteInteraction = useCallback(async (id: string) => {
    if (!currentWorkspace) {
      throw new Error('Workspace não selecionada');
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('client_interactions')
        .delete()
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) {
        throw error;
      }

      setInteractions(prev => prev.filter(interaction => interaction.id !== id));
      
      toast({
        title: "Interação removida",
        description: "Interação removida com sucesso.",
      });

    } catch (err: any) {
      console.error('Error deleting interaction:', err);
      setError(err.message);
      toast({
        title: "Erro",
        description: "Erro ao remover interação.",
        variant: "destructive",
      });
      throw err;
    }
  }, [currentWorkspace, toast]);

  return {
    interactions,
    isLoading,
    error,
    loadInteractions,
    createInteraction,
    updateInteraction,
    deleteInteraction
  };
};
