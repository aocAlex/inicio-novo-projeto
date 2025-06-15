
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuperAdminAnalytics } from '@/hooks/useSuperAdminAnalytics';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { 
  Building2, 
  Users, 
  Activity, 
  Zap,
  TrendingUp,
  Server,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const SuperAdminDashboard: React.FC = () => {
  const { metrics, workspaceAnalytics, isLoading } = useSuperAdminAnalytics();
  const { superAdminData } = useSuperAdmin();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const metricCards = [
    {
      title: 'Total de Workspaces',
      value: metrics.totalWorkspaces,
      subtitle: `${metrics.activeWorkspaces} ativas`,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Usuários Totais',
      value: metrics.totalUsers,
      subtitle: `${metrics.activeUsers} ativos`,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Execuções Totais',
      value: metrics.totalExecutions,
      subtitle: 'Templates executados',
      icon: Zap,
      color: 'text-purple-600',
    },
    {
      title: 'Uptime do Sistema',
      value: `${metrics.systemUptime}%`,
      subtitle: 'Últimos 30 dias',
      icon: Server,
      color: 'text-emerald-600',
    },
  ];

  const performanceCards = [
    {
      title: 'Tempo de Resposta',
      value: `${metrics.avgResponseTime}ms`,
      subtitle: 'Média última semana',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Taxa de Erro',
      value: `${metrics.errorRate}%`,
      subtitle: 'Últimas 24h',
      icon: AlertTriangle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard SuperAdmin
        </h1>
        <p className="mt-2 text-gray-600">
          Bem-vindo de volta, {superAdminData?.email}
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {performanceCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {card.subtitle}
                  </p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Workspaces */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workspaces Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workspaceAnalytics.slice(0, 5).map((workspace) => (
              <div
                key={workspace.workspace_id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {workspace.workspace_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {workspace.total_members} membros • {workspace.total_clients} clientes
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workspace.activity_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : workspace.activity_status === 'idle'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {workspace.activity_status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {workspace.last_activity
                      ? new Date(workspace.last_activity).toLocaleDateString('pt-BR')
                      : 'Sem atividade'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
