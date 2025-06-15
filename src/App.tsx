
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainApp } from '@/pages/MainApp';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { Clients } from '@/pages/Clients';
import { Processes } from '@/pages/Processes';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { PetitionsPage } from '@/pages/PetitionsPage';
import { DeadlinesPage } from '@/pages/DeadlinesPage';
import { TemplateEditorPage } from '@/pages/TemplateEditorPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                } 
              >
                <Route index element={<Dashboard />} />
                <Route path="clients" element={<Clients />} />
                <Route path="processes" element={<Processes />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="templates/:id/edit" element={<TemplateEditorPage />} />
                <Route path="petitions" element={<PetitionsPage />} />
                <Route path="deadlines" element={<DeadlinesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
