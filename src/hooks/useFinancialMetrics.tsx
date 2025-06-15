
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
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

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Current month revenue
      const { data: currentRevenue } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'paid')
        .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      // Previous month revenue
      const { data: previousRevenue } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'paid')
        .gte('payment_date', `${previousYear}-${previousMonth.toString().padStart(2, '0')}-01`)
        .lt('payment_date', `${previousYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      // Total to receive (today, 7 days, 30 days)
      const today = now.toISOString().split('T')[0];
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: toReceiveToday } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'pending')
        .eq('due_date', today);

      const { data: toReceive7Days } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'pending')
        .lte('due_date', next7Days);

      const { data: toReceive30Days } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'pending')
        .lte('due_date', next30Days);

      // Current month expenses
      const { data: currentExpenses } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'expense')
        .eq('status', 'paid')
        .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      // Overdue amount
      const { data: overdueTransactions } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'overdue');

      // Active contracts
      const { data: activeContracts } = await supabase
        .from('financial_contracts')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      // Pending payments
      const { data: pendingPayments } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .eq('transaction_type', 'income')
        .eq('status', 'pending');

      // Calculate metrics
      const currentMonthRevenue = currentRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const previousMonthRevenue = previousRevenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const currentMonthExpenses = currentExpenses?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const profitMargin = currentMonthRevenue > 0 ? ((currentMonthRevenue - currentMonthExpenses) / currentMonthRevenue) * 100 : 0;

      const calculatedMetrics: FinancialDashboardMetrics = {
        current_month_revenue: currentMonthRevenue,
        previous_month_revenue: previousMonthRevenue,
        total_to_receive_today: toReceiveToday?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        total_to_receive_7_days: toReceive7Days?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        total_to_receive_30_days: toReceive30Days?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        total_expenses_month: currentMonthExpenses,
        profit_margin: profitMargin,
        overdue_amount: overdueTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        active_contracts: activeContracts?.length || 0,
        pending_payments: pendingPayments?.length || 0,
      };

      setMetrics(calculatedMetrics);
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
      // Get next 6 months projection
      const projections: CashFlowProjection[] = [];
      const today = new Date();
      
      for (let i = 0; i < 6; i++) {
        const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
        
        const monthStart = projectionDate.toISOString().split('T')[0];
        const monthEnd = nextMonth.toISOString().split('T')[0];

        // Projected income from installments and contracts
        const { data: projectedIncome } = await supabase
          .from('financial_installments')
          .select('amount')
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'pending')
          .gte('due_date', monthStart)
          .lt('due_date', monthEnd);

        // Projected expenses (estimated based on historical data)
        const { data: historicalExpenses } = await supabase
          .from('financial_transactions')
          .select('amount')
          .eq('workspace_id', currentWorkspace.id)
          .eq('transaction_type', 'expense')
          .gte('created_at', new Date(projectionDate.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString());

        const avgMonthlyExpenses = historicalExpenses?.length 
          ? historicalExpenses.reduce((sum, t) => sum + (t.amount || 0), 0) / 12 
          : 0;

        const income = projectedIncome?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
        const expenses = avgMonthlyExpenses;
        const netFlow = income - expenses;
        const accumulatedBalance = i === 0 ? netFlow : (projections[i - 1]?.accumulated_balance || 0) + netFlow;

        projections.push({
          date: monthStart,
          projected_income: income,
          projected_expenses: expenses,
          net_flow: netFlow,
          accumulated_balance: accumulatedBalance
        });
      }

      setCashFlow(projections);
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
