
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { FinancialDashboardMetrics, CashFlowProjection } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';

export const useFinancialMetrics = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowProjection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      // Mock data until database tables are created
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockMetrics: FinancialDashboardMetrics = {
        current_month_revenue: 25000,
        previous_month_revenue: 22000,
        total_to_receive_today: 5000,
        total_to_receive_7_days: 12000,
        total_to_receive_30_days: 35000,
        total_expenses_month: 8000,
        profit_margin: 68,
        overdue_amount: 2500,
        active_contracts: 15,
        pending_payments: 8,
      };

      setMetrics(mockMetrics);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading financial metrics:', err);
      toast({
        title: "Erro ao carregar métricas",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCashFlowProjection = async () => {
    if (!currentWorkspace) return;

    try {
      // Mock cash flow data
      const mockCashFlow: CashFlowProjection[] = [];
      const today = new Date();
      
      for (let i = 0; i < 6; i++) {
        const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthStart = projectionDate.toISOString().split('T')[0];
        
        mockCashFlow.push({
          date: monthStart,
          projected_income: 25000 + (Math.random() * 10000),
          projected_expenses: 8000 + (Math.random() * 3000),
          net_flow: 17000 + (Math.random() * 7000),
          accumulated_balance: (i + 1) * 17000
        });
      }

      setCashFlow(mockCashFlow);
    } catch (err: any) {
      console.error('Error loading cash flow projection:', err);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadMetrics();
      loadCashFlowProjection();
    }
  }, [currentWorkspace]);

  return {
    metrics,
    cashFlow,
    isLoading,
    error,
    loadMetrics,
    loadCashFlowProjection,
  };
};
