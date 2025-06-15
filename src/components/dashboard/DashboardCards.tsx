
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Zap, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DashboardMetrics } from '@/types/dashboard';

interface DashboardCardsProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export const DashboardCards = ({ metrics, isLoading }: DashboardCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Clientes',
      value: metrics.clients.total,
      change: `+${metrics.clients.newThisMonth} este mês`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Processos Ativos',
      value: metrics.processes.active,
      change: `${metrics.processes.total} total`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Petições Este Mês',
      value: metrics.petitions.thisMonth,
      change: `${metrics.petitions.successRate}% sucesso`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Templates Disponíveis',
      value: metrics.templates.total,
      change: `${metrics.templates.mostUsed.length} mais usados`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Processos Pendentes',
      value: metrics.processes.pending,
      change: 'Requerem atenção',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Prazos Esta Semana',
      value: metrics.processes.withDeadlineThisWeek,
      change: 'Próximos vencimentos',
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Petições Esta Semana',
      value: metrics.petitions.thisWeek,
      change: 'Executadas recentemente',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Novos Clientes',
      value: metrics.clients.newThisWeek,
      change: 'Últimos 7 dias',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <div className="flex items-center mt-2">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{card.change}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
