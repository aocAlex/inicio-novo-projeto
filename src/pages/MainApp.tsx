
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Processes } from '@/pages/Processes';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { PetitionsPage } from '@/pages/PetitionsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { Loader2 } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';

export const MainApp = () => {
  const { user } = useAuth();
  const { isLoading, error } = useWorkspace();
  const [activeTab, setActiveTab] = useState('dashboard');

  console.log('MainApp - user:', user, 'isLoading:', isLoading, 'error:', error);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            Erro ao carregar workspace: {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard />;
        case 'clients':
          return <Clients />;
        case 'processes':
          return <Processes />;
        case 'templates':
          return <TemplatesPage />;
        case 'petitions':
        case 'executions':
          return <PetitionsPage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <Dashboard />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              Erro ao carregar a página
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="text-blue-600 hover:underline"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={renderContent()} />
            <Route path="/*" element={renderContent()} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
