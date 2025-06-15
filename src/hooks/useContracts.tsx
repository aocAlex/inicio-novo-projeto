
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { Contract, ContractSigner, CreateContractData, UpdateContractData, ContractFilters } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

export const useContracts = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformContractData = (data: any): Contract => {
    return {
      ...data,
      matched_by: data.matched_by as Contract['matched_by'],
      status: data.status as Contract['status'],
      extra_docs: Array.isArray(data.extra_docs) ? data.extra_docs : [],
      metadata: data.metadata || {},
      contract_answers: data.contract_answers || {},
      signers: (data.signers || []).map((signer: any) => ({
        ...signer,
        status: signer.status as ContractSigner['status'],
        resend_attempts: signer.resend_attempts || { whatsapp: 0, email: 0, sms: 0 }
      }))
    };
  };

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
          signers:contract_signers(*)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      // Apply filters
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

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedContracts: Contract[] = (data || []).map(transformContractData);
      setContracts(transformedContracts);
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
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newContract: Contract = transformContractData(data);
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
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedContract: Contract = transformContractData(data);

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

  const linkClient = async (contractId: string, clientId: string, matchedBy: Contract['matched_by'], confidence: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contracts')
        .update({
          client_id: clientId,
          matched_by: matchedBy,
          matching_confidence: confidence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .select(`
          *,
          client:clients(id, name, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      const updatedContract: Contract = transformContractData(data);

      setContracts(prev => 
        prev.map(contract => 
          contract.id === contractId ? updatedContract : contract
        )
      );

      toast({
        title: "Cliente vinculado",
        description: "Cliente foi vinculado ao contrato com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao vincular cliente",
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
          client:clients(id, name, email),
          signers:contract_signers(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return transformContractData(data);
    } catch (err: any) {
      console.error('Error getting contract:', err);
      return null;
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
    linkClient,
    getContract,
  };
};
