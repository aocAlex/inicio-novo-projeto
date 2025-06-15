
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Processes } from '@/pages/Processes';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { TemplateEditorPage } from '@/pages/TemplateEditorPage';
import { PetitionsPage } from '@/pages/PetitionsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Outlet } from 'react-router-dom';

export const MainApp = () => {
  const { user } = useAuth();
  const { isLoading, error } = useWorkspace();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
