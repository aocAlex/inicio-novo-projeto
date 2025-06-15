
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
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

      // Mock data until database tables are created
      await new Promise(resolve => setTimeout(resolve, 500));
      setTransactions([]);

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

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Transação criada",
        description: "Transação registrada com sucesso.",
      });

      return null;
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

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));

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

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));

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
