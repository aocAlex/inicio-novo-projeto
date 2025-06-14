
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { Client, CreateClientData, UpdateClientData, ClientFilters } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

export const useClients = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async (filters?: ClientFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('clients')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.client_type) {
        query = query.eq('client_type', filters.client_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Cast the data to proper Client types
      const typedClients: Client[] = (data || []).map(client => ({
        ...client,
        client_type: client.client_type as 'individual' | 'company',
        status: client.status as 'lead' | 'prospect' | 'active' | 'inactive' | 'archived',
        address: client.address as Client['address'],
        custom_fields: client.custom_fields as Client['custom_fields'],
        tags: client.tags as string[]
      }));

      setClients(typedClients);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (clientData: CreateClientData): Promise<Client | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          workspace_id: currentWorkspace.id,
          lead_score: 0,
          status: clientData.status || 'lead',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newClient: Client = {
        ...data,
        client_type: data.client_type as 'individual' | 'company',
        status: data.status as 'lead' | 'prospect' | 'active' | 'inactive' | 'archived',
        address: data.address as Client['address'],
        custom_fields: data.custom_fields as Client['custom_fields'],
        tags: data.tags as string[]
      };

      setClients(prev => [newClient, ...prev]);

      toast({
        title: "Cliente criado",
        description: `${newClient.name} foi adicionado com sucesso.`,
      });

      return newClient;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao criar cliente",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id: string, clientData: UpdateClientData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clients')
        .update({
          ...clientData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedClient: Client = {
        ...data,
        client_type: data.client_type as 'individual' | 'company',
        status: data.status as 'lead' | 'prospect' | 'active' | 'inactive' | 'archived',
        address: data.address as Client['address'],
        custom_fields: data.custom_fields as Client['custom_fields'],
        tags: data.tags as string[]
      };

      setClients(prev => 
        prev.map(client => 
          client.id === id ? updatedClient : client
        )
      );

      toast({
        title: "Cliente atualizado",
        description: `${updatedClient.name} foi atualizado com sucesso.`,
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao atualizar cliente",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setClients(prev => prev.filter(client => client.id !== id));

      toast({
        title: "Cliente removido",
        description: "Cliente foi removido com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover cliente",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getClient = async (id: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Client;
    } catch (err: any) {
      console.error('Error getting client:', err);
      return null;
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadClients();
    }
  }, [currentWorkspace]);

  return {
    clients,
    isLoading,
    error,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    getClient,
  };
};
