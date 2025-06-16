
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { metrics, isLoading, error, refresh } = useDashboardMetrics();
  const [retryCount, setRetryCount] = useState(0);

  console.log('📊 DashboardPage - Render state:', { 
    workspace: currentWorkspace?.name,
    hasMetrics: !!metrics,
    isLoading,
    error,
    retryCount
  });

  useEffect(() => {
    console.log('📊 DashboardPage - Mounted with workspace:', currentWorkspace?.name);
  }, [currentWorkspace]);

  const handleRetry = async () => {
    console.log('🔄 DashboardPage - Manual retry triggered');
    setRetryCount(prev => prev + 1);
    try {
      await refresh();
    } catch (err) {
      console.error('❌ DashboardPage - Retry failed:', err);
    }
  };

  // No workspace
  if (!currentWorkspace) {
    console.log('⚠️ DashboardPage - No workspace available');
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <p>Nenhuma workspace selecionada. Selecione ou crie uma workspace para ver o dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    console.log('❌ DashboardPage - Error state:', error);
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Erro ao carregar dashboard
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente ({retryCount})
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Recarregar Página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Clientes Ativos',
      value: metrics?.clients?.total || '0',
      change: `+${metrics?.clients?.newThisMonth || 0} este mês`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      loading: isLoading
    },
    {
      title: 'Processos em Andamento',
      value: metrics?.processes?.active || '0',
      change: `${metrics?.processes?.total || 0} total`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      loading: isLoading
    },
    {
      title: 'Templates Criados',
      value: metrics?.templates?.total || '0',
      change: `${metrics?.templates?.mostUsed?.length || 0} em uso`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      loading: isLoading
    },
    {
      title: 'Petições Este Mês',
      value: metrics?.petitions?.thisMonth || '0',
      change: `${metrics?.petitions?.successRate || 0}% sucesso`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      loading: isLoading
    },
  ];

  const recentActivity = [
    {
      title: 'Dashboard carregado',
      description: `Dados da workspace "${currentWorkspace.name}" carregados com sucesso`,
      time: 'agora',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Métricas atualizadas',
      description: 'Estatísticas da workspace foram atualizadas',
      time: '1 min atrás',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Sistema online',
      description: 'Todos os sistemas funcionando normalmente',
      time: '2 min atrás',
      icon: CheckCircle,
      color: 'text-green-600',
    }
  ];

  console.log('✅ DashboardPage - Rendering dashboard content');
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo à {currentWorkspace?.name || 'sua workspace'}
          </p>
        </div>
        
        <Button 
          onClick={handleRetry} 
          variant="outline" 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                {stat.loading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <div className="flex items-center mt-2">
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações realizadas na workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full bg-gray-100`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => console.log('🔗 Quick action: Novo Cliente')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Novo Cliente</p>
              </button>
              <button 
                onClick={() => console.log('🔗 Quick action: Novo Processo')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Novo Processo</p>
              </button>
              <button 
                onClick={() => console.log('🔗 Quick action: Criar Template')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Criar Template</p>
              </button>
              <button 
                onClick={() => console.log('🔗 Quick action: Executar Petição')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Executar Petição</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Nome</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {currentWorkspace?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Descrição</p>
              <p className="text-lg text-gray-900 mt-1">
                {currentWorkspace?.description || 'Sem descrição'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Criada em</p>
              <p className="text-lg text-gray-900 mt-1">
                {currentWorkspace?.created_at ? 
                  new Date(currentWorkspace.created_at).toLocaleDateString('pt-BR') : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">
            <div>Workspace: {currentWorkspace?.id}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
            <div>Metrics: {metrics ? 'Loaded' : 'Not loaded'}</div>
            <div>Retry count: {retryCount}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
