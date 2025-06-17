
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
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Controle Financeiro</h1> {/* Adjusted text size and color */}
            <p className="text-gray-600">
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
    </div>
  );
};
