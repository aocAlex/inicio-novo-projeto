
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const { currentWorkspace } = useWorkspace();

  console.log('DashboardPage - Rendering with workspace:', currentWorkspace?.name);

  const stats = [
    {
      title: 'Clientes Ativos',
      value: '127',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Processos em Andamento',
      value: '23',
      change: '+5%',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Templates Criados',
      value: '15',
      change: '+2',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Petições Executadas',
      value: '89',
      change: '+18%',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentActivity = [
    {
      title: 'Nova petição executada',
      description: 'Template "Ação de Cobrança" usado para cliente João Silva',
      time: '2 min atrás',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Processo atualizado',
      description: 'Status alterado para "Em andamento"',
      time: '15 min atrás',
      icon: Briefcase,
      color: 'text-blue-600',
    },
    {
      title: 'Novo cliente adicionado',
      description: 'Maria Santos cadastrada como cliente ativo',
      time: '1 hora atrás',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Template criado',
      description: 'Novo template "Contestação" criado',
      time: '2 horas atrás',
      icon: FileText,
      color: 'text-orange-600',
    },
  ];

  if (!currentWorkspace) {
    console.log('DashboardPage - No workspace, showing message');
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

  console.log('DashboardPage - Rendering dashboard content');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo à {currentWorkspace?.name || 'sua workspace'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-center mt-2">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <span className="ml-2 text-sm font-medium text-green-600">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
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
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Novo Cliente</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Novo Processo</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Criar Template</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
    </div>
  );
};
