
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { usePetitions } from '@/hooks/usePetitions';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const Dashboard = () => {
  const { currentWorkspace } = useWorkspace();
  const { metrics, isLoading, error, refresh } = useDashboardData();
  const { executions } = usePetitions();
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Gerar atividades recentes baseadas em dados reais
  useEffect(() => {
    if (executions.length > 0) {
      const activities = executions.slice(0, 5).map((execution, index) => ({
        id: execution.id,
        type: 'petition' as const,
        title: 'Petição executada',
        description: `Template "${execution.template?.name || 'Desconhecido'}" processado`,
        timestamp: execution.created_at,
        status: execution.webhook_status === 'completed' ? 'success' as const : 
                execution.webhook_status === 'failed' ? 'failed' as const : 'pending' as const,
      }));
      setRecentActivities(activities);
    } else {
      // Mock de atividades se não houver execuções
      setRecentActivities([
        {
          id: '1',
          type: 'template' as const,
          title: 'Sistema inicializado',
          description: 'Dashboard pronto para uso',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [executions]);

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
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Visão geral das atividades de {currentWorkspace?.name}
            </p>
          </div>
          <Button onClick={refresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Métricas Principais */}
        {metrics ? (
          <div className="mb-6"> {/* Added mb-6 */}
            <DashboardCards metrics={metrics} isLoading={isLoading} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 mb-6"> {/* Added mb-6 */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Seção Inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
    </div>
  );
};
