
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Header } from '@/components/layout/Header';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Routes } from './Routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const MainAppContent = () => {
  const { toggleSidebar } = useSidebar();
  
  // Enable keyboard shortcuts with sidebar toggle
  useKeyboardShortcuts(toggleSidebar);

  return (
    <>
      <ModernSidebar />
      <SidebarInset className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <Header />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
            <Routes />
          </div>
        </main>
      </SidebarInset>
    </>
  );
};

export const MainApp = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, isLoading: workspaceLoading, error: workspaceError, refreshWorkspaces } = useWorkspace();

  console.log('📱 MainApp - Render state:', { 
    user: !!user, 
    authLoading,
    currentWorkspace: !!currentWorkspace,
    workspaceName: currentWorkspace?.name,
    workspaceLoading, 
    workspaceError,
    timestamp: new Date().toISOString()
  });

  // Loading state - Auth still loading
  if (authLoading) {
    console.log('⏳ MainApp - Auth loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // No user - should not happen in protected route but safety check
  if (!user) {
    console.log('❌ MainApp - No user found in protected route');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Usuário não encontrado</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Workspace loading
  if (workspaceLoading) {
    console.log('⏳ MainApp - Workspace loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Carregando workspace...</p>
        </div>
      </div>
    );
  }

  // Workspace error
  if (workspaceError) {
    console.log('❌ MainApp - Workspace error:', workspaceError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Erro ao carregar workspace</p>
            <p className="text-gray-600 text-sm mb-4">{workspaceError}</p>
            <div className="flex gap-2">
              <Button onClick={refreshWorkspaces} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No workspace available
  if (!currentWorkspace) {
    console.log('⚠️ MainApp - No current workspace available');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <p className="text-orange-600 mb-2">Nenhuma workspace encontrada</p>
            <p className="text-gray-600 text-sm mb-4">
              Você precisa de uma workspace para acessar a aplicação
            </p>
            <Button onClick={refreshWorkspaces}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Workspaces
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - render main layout with modern sidebar
  console.log('✅ MainApp - Rendering main layout:', currentWorkspace.name);
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background flex w-full">
        <MainAppContent />
      </div>
    </SidebarProvider>
  );
};
