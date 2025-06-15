
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
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<Index />} />
            
            {/* Public Routes */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/clients/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/processes/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/templates/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/petitions/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/deadlines/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/*"
              element={
                <ProtectedRoute>
                  <WorkspaceProvider>
                    <MainApp />
                  </WorkspaceProvider>
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
      </Router>
    </QueryClientProvider>
  );
}

export default App;
