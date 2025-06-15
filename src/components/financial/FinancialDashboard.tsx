
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, FileText, Clock } from 'lucide-react';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { formatCurrency } from '@/utils/formatters';
import { RevenueChart } from './RevenueChart';
import { QuickActions } from './QuickActions';

export const FinancialDashboard = () => {
  const { metrics, isLoading } = useFinancialMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const revenueChange = metrics.previous_month_revenue > 0 
    ? ((metrics.current_month_revenue - metrics.previous_month_revenue) / metrics.previous_month_revenue) * 100 
    : 0;

  const metricCards = [
    {
      title: 'Receita do Mês',
      value: formatCurrency(metrics.current_month_revenue),
      change: revenueChange,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'A Receber Hoje',
      value: formatCurrency(metrics.total_to_receive_today),
      subtitle: 'Vencimentos',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'A Receber (30 dias)',
      value: formatCurrency(metrics.total_to_receive_30_days),
      subtitle: `${metrics.pending_payments} pendências`,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Despesas do Mês',
      value: formatCurrency(metrics.total_expenses_month),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Margem de Lucro',
      value: `${metrics.profit_margin.toFixed(1)}%`,
      icon: TrendingUp,
      color: metrics.profit_margin > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.profit_margin > 0 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'Em Atraso',
      value: formatCurrency(metrics.overdue_amount),
      subtitle: 'Inadimplência',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.change !== undefined && (
                  <p className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% vs mês anterior
                  </p>
                )}
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {metric.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos e Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};
