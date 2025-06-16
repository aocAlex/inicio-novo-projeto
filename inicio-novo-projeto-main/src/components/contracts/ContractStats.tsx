
import React from 'react';
import { FileSignature, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContracts } from '@/hooks/useContracts';

export const ContractStats = () => {
  const { contracts } = useContracts();

  const stats = React.useMemo(() => {
    const total = contracts.length;
    const pending = contracts.filter(c => c.status === 'pending').length;
    const signed = contracts.filter(c => c.status === 'signed').length;
    const rejected = contracts.filter(c => c.status === 'rejected').length;
    const expired = contracts.filter(c => c.status === 'expired').length;

    return { total, pending, signed, rejected, expired };
  }, [contracts]);

  const statCards = [
    {
      title: 'Total de Contratos',
      value: stats.total,
      icon: FileSignature,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Assinados',
      value: stats.signed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Rejeitados/Expirados',
      value: stats.rejected + stats.expired,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
