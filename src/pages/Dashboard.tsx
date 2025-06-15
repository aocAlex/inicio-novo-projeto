
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { currentWorkspace } = useWorkspace();
  const { metrics, isLoading, error, refresh } = useDashboardData();
  const navigate = useNavigate();

  // Mock de atividades recentes - posteriormente pode vir de uma API
  const recentActivities = [
    {
      id: '1',
      type: 'client' as const,
      title: 'Novo cliente cadastrado',
      description: 'João Silva adicionado ao CRM',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'process' as const,
      title: 'Processo atualizado',
      description: 'Status alterado para "Em andamento"',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'petition' as const,
      title: 'Petição executada',
      description: 'Template "Ação de Cobrança" processado',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'success' as const,
    },
    {
      id: '4',
      type: 'template' as const,
      title: 'Template criado',
      description: 'Novo template "Contestação" disponível',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ];

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
    <div className="space-y-6 p-6">
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
      {metrics && (
        <DashboardCards metrics={metrics} isLoading={isLoading} />
      )}

      {/* Seção Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        <RecentActivity 
          activities={recentActivities} 
          isLoading={isLoading} 
        />
        
        {/* Ações Rápidas */}
        <QuickActions
          onCreateClient={() => navigate('/clients')}
          onCreateProcess={() => navigate('/processes')}
          onCreateTemplate={() => navigate('/templates')}
          onExecutePetition={() => navigate('/petitions')}
        />
      </div>
    </div>
  );
};
