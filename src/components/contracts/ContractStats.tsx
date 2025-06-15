
import React from 'react';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContracts } from '@/hooks/useContracts';

export const ContractStats = () => {
  const { contracts } = useContracts();

  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === 'signed').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    thisMonth: contracts.filter(c => {
      const contractDate = new Date(c.created_at);
      const now = new Date();
      return contractDate.getMonth() === now.getMonth() && 
             contractDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const signatureRate = stats.total > 0 ? (stats.signed / stats.total * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.thisMonth} este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contratos Assinados</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.signed}</div>
          <p className="text-xs text-muted-foreground">
            {signatureRate}% de taxa de assinatura
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando assinatura
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{signatureRate}%</div>
          <p className="text-xs text-muted-foreground">
            Contratos assinados vs. total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
