
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { FinancialContract, CreateFinancialContractData, FinancialFilters } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';

export const useFinancialContracts = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<FinancialContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async (filters?: FinancialFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('financial_contracts')
        .select(`
          *,
          client:clients(id, name, email),
          process:processes(id, title, process_number),
          installments_list:financial_installments(*)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.process_id) {
        query = query.eq('process_id', filters.process_id);
      }
      if (filters?.contract_type) {
        query = query.eq('contract_type', filters.contract_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('start_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('end_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContracts(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading financial contracts:', err);
      toast({
        title: "Erro ao carregar contratos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createContract = async (contractData: CreateFinancialContractData): Promise<FinancialContract | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('financial_contracts')
        .insert({
          ...contractData,
          workspace_id: currentWorkspace.id,
          status: 'draft'
        })
        .select(`
          *,
          client:clients(id, name, email),
          process:processes(id, title, process_number)
        `)
        .single();

      if (error) throw error;

      const newContract = data as FinancialContract;
      setContracts(prev => [newContract, ...prev]);

      toast({
        title: "Contrato criado",
        description: "Contrato financeiro criado com sucesso.",
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

  const updateContract = async (id: string, updates: Partial<FinancialContract>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('financial_contracts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, name, email),
          process:processes(id, title, process_number)
        `)
        .single();

      if (error) throw error;

      const updatedContract = data as FinancialContract;
      setContracts(prev => 
        prev.map(contract => 
          contract.id === id ? updatedContract : contract
        )
      );

      toast({
        title: "Contrato atualizado",
        description: "Contrato atualizado com sucesso.",
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
        .from('financial_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContracts(prev => prev.filter(contract => contract.id !== id));

      toast({
        title: "Contrato removido",
        description: "Contrato removido com sucesso.",
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
  };
};
