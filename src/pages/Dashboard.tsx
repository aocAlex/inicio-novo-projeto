
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PetitionChart } from '@/components/dashboard/PetitionChart';
import { RecentPetitions } from '@/components/dashboard/RecentPetitions';
import { TemplateUsageCard } from '@/components/dashboard/TemplateUsageCard';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const Dashboard = () => {
  const { currentWorkspace } = useWorkspace();
  const { 
    metrics, 
    recentPetitions, 
    chartData, 
    isLoading, 
    error, 
    refresh 
  } = useDashboardMetrics();

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Selecione uma workspace para ver o dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Erro ao carregar dados do dashboard</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Visão geral das atividades de {currentWorkspace.name}
          </p>
        </div>
        <Button onClick={refresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Petições Hoje"
          value={metrics?.petitions.today || 0}
          description="Petições criadas hoje"
          icon={FileText}
          color="blue"
        />
        
        <MetricCard
          title="Petições Este Mês"
          value={metrics?.petitions.thisMonth || 0}
          description="Total do mês atual"
          icon={CheckCircle}
          color="green"
        />
        
        <MetricCard
          title="Taxa de Sucesso"
          value={`${metrics?.petitions.successRate || 0}%`}
          description="Webhooks bem-sucedidos"
          icon={CheckCircle}
          color="green"
        />
        
        <MetricCard
          title="Membros Ativos"
          value={metrics?.members.total || 0}
          description={`${metrics?.members.activeToday || 0} ativos hoje`}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Petições */}
        <div className="lg:col-span-2">
          <PetitionChart data={chartData} isLoading={isLoading} />
        </div>
        
        {/* Templates Mais Usados */}
        <TemplateUsageCard 
          templates={metrics?.templates.mostUsed || []} 
          isLoading={isLoading} 
        />
        
        {/* Petições Recentes */}
        <RecentPetitions 
          petitions={recentPetitions} 
          isLoading={isLoading} 
        />
      </div>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total de Templates"
          value={metrics?.templates.total || 0}
          description="Templates disponíveis"
          icon={FileText}
          color="yellow"
        />
        
        <MetricCard
          title="Webhooks Enviados"
          value={metrics?.webhooks.totalSent || 0}
          description="Últimos 30 dias"
          icon={Clock}
          color="blue"
        />
        
        <MetricCard
          title="Tempo Médio"
          value={`${metrics?.webhooks.averageResponseTime || 0}s`}
          description="Processamento de webhooks"
          icon={Clock}
          color="purple"
        />
      </div>
    </div>
  );
};
