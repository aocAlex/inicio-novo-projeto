
import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Loader2 } from 'lucide-react';

export const MainApp = () => {
  const { isLoading } = useWorkspace();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Carregando workspace...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'clients':
        return <div className="p-6">Módulo de Clientes (em breve)</div>;
      case 'processes':
        return <div className="p-6">Módulo de Processos (em breve)</div>;
      case 'templates':
        return <div className="p-6">Módulo de Templates (em breve)</div>;
      case 'petitions':
        return <div className="p-6">Módulo de Petições (em breve)</div>;
      case 'executions':
        return <div className="p-6">Módulo de Execuções (em breve)</div>;
      case 'settings':
        return <div className="p-6">Configurações (em breve)</div>;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
