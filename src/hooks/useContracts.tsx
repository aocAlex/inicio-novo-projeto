
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { Contract, CreateContractData, UpdateContractData, ContractFilters } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

export const useContracts = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async (filters?: ContractFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('contracts')
        .select(`
          *,
          client:clients(id, name, email),
          signers:contract_signers(
            id, name, email, status, signed_at, cpf, cnpj
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.search) {
        query = query.ilike('contract_name', `%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.contract_type) {
        query = query.ilike('contract_type', `%${filters.contract_type}%`);
      }
      if (filters?.signed_after) {
        query = query.gte('signed_at', filters.signed_after);
      }
      if (filters?.signed_before) {
        query = query.lte('signed_at', filters.signed_before);
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

      setContracts(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading contracts:', err);
      toast({
        title: "Erro ao carregar contratos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createContract = async (contractData: CreateContractData): Promise<Contract | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...contractData,
          workspace_id: currentWorkspace.id,
        })
        .select(`
          *,
          client:clients(id, name, email),
          signers:contract_signers(
            id, name, email, status, signed_at, cpf, cnpj
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      const newContract = data as Contract;
      setContracts(prev => [newContract, ...prev]);

      toast({
        title: "Contrato criado",
        description: `${newContract.contract_name} foi adicionado com sucesso.`,
      });

      return newContract;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao criar contrato",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateContract = async (id: string, contractData: UpdateContractData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contracts')
        .update({
          ...contractData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, name, email),
          signers:contract_signers(
            id, name, email, status, signed_at, cpf, cnpj
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      const updatedContract = data as Contract;
      setContracts(prev => 
        prev.map(contract => 
          contract.id === id ? updatedContract : contract
        )
      );

      toast({
        title: "Contrato atualizado",
        description: `${updatedContract.contract_name} foi atualizado com sucesso.`,
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao atualizar contrato",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContract = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('contracts')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setContracts(prev => prev.filter(contract => contract.id !== id));

      toast({
        title: "Contrato removido",
        description: "Contrato foi removido com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover contrato",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getContract = async (id: string): Promise<Contract | null> => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(id, name, email, phone, document_number),
          signers:contract_signers(*),
          history:contract_history(
            *,
            performed_by:profiles(id, full_name, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Contract;
    } catch (err: any) {
      console.error('Error getting contract:', err);
      return null;
    }
  };

  const linkClientToContract = async (contractId: string, clientId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          client_id: clientId,
          matched_by: 'manual',
          matching_confidence: 1.00,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) {
        throw error;
      }

      // Recarregar contratos
      await loadContracts();

      toast({
        title: "Cliente vinculado",
        description: "Cliente foi vinculado ao contrato com sucesso.",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Erro ao vincular cliente",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadContracts();
    }
  }, [currentWorkspace]);

  return {
    contracts,
    isLoading,
    error,
    loadContracts,
    createContract,
    updateContract,
    deleteContract,
    getContract,
    linkClientToContract,
  };
};
