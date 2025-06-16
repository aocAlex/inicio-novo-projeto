
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { formatCurrency } from '@/utils/formatters';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { addDays, format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const FinancialReports = () => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  const { contracts } = useContracts();
  const { metrics } = useFinancialMetrics();

  // Processar dados dos contratos
  const contractsData = contracts.map(contract => ({
    id: contract.id,
    name: contract.contract_name,
    value: contract.contract_value || 0,
    status: contract.status,
    client: contract.client?.name || 'Cliente não vinculado',
    createdAt: new Date(contract.created_at),
    signedAt: contract.signed_at ? new Date(contract.signed_at) : null
  }));

  // Dados para gráficos
  const monthlyData = React.useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const monthContracts = contractsData.filter(contract => {
        const contractMonth = contract.createdAt.getMonth();
        const contractYear = contract.createdAt.getFullYear();
        return contractMonth === date.getMonth() && contractYear === date.getFullYear();
      });
      
      months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        contratos: monthContracts.length,
        receita: monthContracts.reduce((sum, c) => sum + c.value, 0),
        assinados: monthContracts.filter(c => c.status === 'signed').length
      });
    }
    return months;
  }, [contractsData]);

  const statusData = React.useMemo(() => {
    const statusCount = contractsData.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status === 'signed' ? 'Assinados' : 
              status === 'pending' ? 'Pendentes' : 
              status === 'rejected' ? 'Rejeitados' : 'Outros',
      count,
      percentage: (count / contractsData.length * 100).toFixed(1)
    }));
  }, [contractsData]);

  const topClients = React.useMemo(() => {
    const clientsValue = contractsData.reduce((acc, contract) => {
      const client = contract.client;
      acc[client] = (acc[client] || 0) + contract.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(clientsValue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([client, value]) => ({ client, value }));
  }, [contractsData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const exportReport = () => {
    // Simular exportação de relatório
    const reportData = {
      periodo: `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`,
      tipo: reportType,
      resumo: {
        totalContratos: contractsData.length,
        receitaTotal: contractsData.reduce((sum, c) => sum + c.value, 0),
        contratosAssinados: contractsData.filter(c => c.status === 'signed').length
      },
      dados: contractsData
    };
    
    console.log('Relatório exportado:', reportData);
    // Aqui implementaria a exportação real (PDF, Excel, etc.)
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card className="mb-6"> {/* Added mb-6 */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Visão Geral</SelectItem>
                  <SelectItem value="contracts">Relatório de Contratos</SelectItem>
                  <SelectItem value="revenue">Análise de Receita</SelectItem>
                  <SelectItem value="clients">Relatório de Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>

            <Button onClick={exportReport} className="flex items-center gap-2">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"> {/* Applied new responsive grid classes */}
        <Card>
          <CardContent className="p-6"> {/* Keep p-6 for these smaller cards */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contratos</p>
                <p className="text-2xl font-bold">{contractsData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6"> {/* Keep p-6 for these smaller cards */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(contractsData.reduce((sum, c) => sum + c.value, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6"> {/* Keep p-6 for these smaller cards */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contratos Assinados</p>
                <p className="text-2xl font-bold">
                  {contractsData.filter(c => c.status === 'signed').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6"> {/* Keep p-6 for these smaller cards */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">
                  {contractsData.length > 0
                    ? `${((contractsData.filter(c => c.status === 'signed').length / contractsData.length) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"> {/* Applied responsive gap classes */}
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal de Contratos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
            <ChartContainer
              config={{
                contratos: { label: "Contratos", color: "#0088FE" },
                receita: { label: "Receita", color: "#00C49F" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="contratos" fill="#0088FE" name="Contratos" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status dos Contratos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Contratos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
            <ChartContainer
              config={{
                count: { label: "Quantidade", color: "#0088FE" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes */}
      <Card className="mb-6"> {/* Added mb-6 */}
        <CardHeader>
          <CardTitle>Top 5 Clientes por Valor</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.client} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{client.client}</span>
                </div>
                <span className="font-bold text-green-600">
                  {formatCurrency(client.value)}
                </span>
              </div>
            ))}
            {topClients.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum cliente encontrado para o período selecionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista Detalhada de Contratos */}
      {reportType === 'contracts' && (
        <Card className="mb-6"> {/* Added mb-6 */}
          <CardHeader>
            <CardTitle>Detalhes dos Contratos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Contrato</th>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Valor</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {contractsData.map((contract) => (
                    <tr key={contract.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{contract.name}</td>
                      <td className="p-3">{contract.client}</td>
                      <td className="p-3 font-medium text-green-600">
                        {formatCurrency(contract.value)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                          contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {contract.status === 'signed' ? 'Assinado' :
                           contract.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="p-3">
                        {format(contract.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contractsData.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum contrato encontrado para o período selecionado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
