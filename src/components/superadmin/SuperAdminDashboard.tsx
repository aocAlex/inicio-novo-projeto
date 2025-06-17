
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
  const { analytics, isLoading } = useSuperAdminAnalytics();
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

  // Calculate metrics from analytics data
  const totalWorkspaces = analytics.length;
  const totalMembers = analytics.reduce((sum, w) => sum + w.total_members, 0);
  const totalClients = analytics.reduce((sum, w) => sum + w.total_clients, 0);
  const totalExecutions = analytics.reduce((sum, w) => sum + w.total_executions, 0);

  const metricCards = [
    {
      title: 'Total de Workspaces',
      value: totalWorkspaces,
      subtitle: `${analytics.filter(w => w.total_members > 0).length} ativas`,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Usuários Totais',
      value: totalMembers,
      subtitle: `${Math.round(totalMembers / totalWorkspaces)} por workspace`,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Clientes Totais',
      value: totalClients,
      subtitle: 'Todos os workspaces',
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      title: 'Execuções Totais',
      value: totalExecutions,
      subtitle: 'Templates executados',
      icon: Zap,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900"> {/* Adjusted text size */}
            Dashboard SuperAdmin
          </h1>
          <p className="text-gray-600"> {/* Adjusted text color and removed mt-2 */}
            Bem-vindo de volta, {superAdminData?.email}
          </p>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 mb-6"> {/* Applied new responsive grid classes and mb-6 */}
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6"> {/* Keep p-6 for these smaller cards */}
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
      <Card className="mb-6"> {/* Added mb-6 */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workspaces Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
          <div className="space-y-3">
            {analytics.slice(0, 5).map((workspace) => (
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ativa
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
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
