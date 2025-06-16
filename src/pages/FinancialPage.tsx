
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialDashboard } from '@/components/financial/FinancialDashboard';
import { FinancialContractsList } from '@/components/financial/FinancialContractsList';
import { FinancialTransactionsList } from '@/components/financial/FinancialTransactionsList';
import { FinancialReports } from '@/components/financial/FinancialReports';
import { CashFlowProjection } from '@/components/financial/CashFlowProjection';

export const FinancialPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle Financeiro</h1>
          <p className="text-muted-foreground">
            Gestão completa de honorários, recebimentos e despesas processuais
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <FinancialContractsList />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <FinancialTransactionsList />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <CashFlowProjection />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};
