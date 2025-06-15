
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Loader2 } from 'lucide-react';
import { AppRoutes } from './Routes';

export const MainApp = () => {
  const { user } = useAuth();
  const { currentWorkspace, isLoading, error } = useWorkspace();

  console.log('MainApp - Rendering with:', { 
    user: !!user, 
    currentWorkspace: !!currentWorkspace,
    workspaceName: currentWorkspace?.name,
    isLoading, 
    error 
  });

  if (isLoading) {
    console.log('MainApp - Showing loading state');
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
    console.log('MainApp - Showing error state:', error);
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

  if (!currentWorkspace) {
    console.log('MainApp - No current workspace available');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-orange-600 mb-4">
            Nenhuma workspace selecionada
          </div>
          <p className="text-gray-600 mb-4">
            Selecione ou crie uma workspace para continuar
          </p>
        </div>
      </div>
    );
  }

  console.log('MainApp - Rendering main layout with current workspace:', currentWorkspace.name);
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <AppRoutes />
          </div>
        </main>
      </div>
    </div>
  );
};
