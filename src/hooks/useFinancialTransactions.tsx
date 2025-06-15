
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { FinancialTransaction, CreateFinancialTransactionData, FinancialFilters } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';

export const useFinancialTransactions = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (filters?: FinancialFilters) => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          client:clients(id, name),
          process:processes(id, title, process_number),
          contract:financial_contracts(id, contract_type)
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
      if (filters?.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.payment_status) {
        query = query.eq('status', filters.payment_status);
      }
      if (filters?.date_from) {
        query = query.gte('due_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('due_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading financial transactions:', err);
      toast({
        title: "Erro ao carregar transações",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (transactionData: CreateFinancialTransactionData): Promise<FinancialTransaction | null> => {
    if (!currentWorkspace) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Calculate tax and net amount
      const taxAmount = (transactionData.amount * (transactionData.tax_percentage || 0)) / 100;
      const netAmount = transactionData.amount - taxAmount;

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...transactionData,
          workspace_id: currentWorkspace.id,
          tax_amount: taxAmount,
          net_amount: netAmount,
          status: transactionData.payment_date ? 'paid' : 'pending'
        })
        .select(`
          *,
          client:clients(id, name),
          process:processes(id, title, process_number),
          contract:financial_contracts(id, contract_type)
        `)
        .single();

      if (error) throw error;

      const newTransaction = data as FinancialTransaction;
      setTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: "Transação criada",
        description: "Transação registrada com sucesso.",
      });

      return newTransaction;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao criar transação",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<FinancialTransaction>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Recalculate tax and net amount if amount or tax_percentage changed
      if (updates.amount || updates.tax_percentage) {
        const transaction = transactions.find(t => t.id === id);
        if (transaction) {
          const amount = updates.amount || transaction.amount;
          const taxPercentage = updates.tax_percentage || transaction.tax_percentage || 0;
          updates.tax_amount = (amount * taxPercentage) / 100;
          updates.net_amount = amount - updates.tax_amount;
        }
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, name),
          process:processes(id, title, process_number),
          contract:financial_contracts(id, contract_type)
        `)
        .single();

      if (error) throw error;

      const updatedTransaction = data as FinancialTransaction;
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );

      toast({
        title: "Transação atualizada",
        description: "Transação atualizada com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao atualizar transação",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));

      toast({
        title: "Transação removida",
        description: "Transação removida com sucesso.",
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao remover transação",
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
      loadTransactions();
    }
  }, [currentWorkspace]);

  return {
    transactions,
    isLoading,
    error,
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
