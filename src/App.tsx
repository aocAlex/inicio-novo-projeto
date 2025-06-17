
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthPage } from '@/components/auth/AuthPage';
import { MainApp } from '@/pages/MainApp';
import { SuperAdminPage } from '@/pages/SuperAdminPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        console.log(`🔄 Query retry ${failureCount}:`, error?.message);
        return failureCount < 3;
      },
    },
  },
});

function App() {
  console.log('🚀 App - Root component rendering');
  
  return (
    <ErrorBoundary fallbackTitle="Erro na Aplicação" fallbackMessage="A aplicação encontrou um erro. Tente recarregar a página.">
      <QueryClientProvider client={queryClient}>
        <Router>
          <ErrorBoundary fallbackTitle="Erro de Autenticação" fallbackMessage="Erro no sistema de autenticação.">
            <AuthProvider>
              <Routes>
                {/* Root Route */}
                <Route path="/" element={<Index />} />
                
                {/* Public Routes */}
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Protected Routes - Centralized through MainApp */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary fallbackTitle="Erro na Workspace" fallbackMessage="Erro ao carregar dados da workspace.">
                        <WorkspaceProvider>
                          <ErrorBoundary fallbackTitle="Erro na Interface" fallbackMessage="Erro na interface da aplicação.">
                            <MainApp />
                          </ErrorBoundary>
                        </WorkspaceProvider>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                
                {/* SuperAdmin Routes */}
                <Route
                  path="/superadmin/*"
                  element={
                    <ProtectedRoute>
                      <WorkspaceProvider>
                        <SuperAdminPage />
                      </WorkspaceProvider>
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </AuthProvider>
          </ErrorBoundary>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
