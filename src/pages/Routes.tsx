
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { Clients } from '@/pages/Clients';
import { Processes } from '@/pages/Processes';
import { Templates } from '@/pages/Templates';
import { Petitions } from '@/pages/Petitions';
import { DeadlinesPage } from '@/pages/DeadlinesPage';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const AppRoutes = () => {
  const location = useLocation();
  
  console.log('🛣️ AppRoutes - Rendering routes for:', location.pathname);
  
  // Fallback component for unknown routes
  const NotFoundFallback = () => (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Página não encontrada</h2>
        <p className="text-gray-600 mb-4">
          A página "{location.pathname}" não existe.
        </p>
        <p className="text-sm text-gray-500">
          Redirecionando para o dashboard...
        </p>
      </CardContent>
    </Card>
  );
  
  return (
    <Routes>
      {/* Main app routes */}
      <Route 
        path="/dashboard" 
        element={
          <div>
            {console.log('📊 Rendering DashboardPage')}
            <DashboardPage />
          </div>
        } 
      />
      <Route 
        path="/clients" 
        element={
          <div>
            {console.log('👥 Rendering Clients')}
            <Clients />
          </div>
        } 
      />
      <Route 
        path="/processes" 
        element={
          <div>
            {console.log('⚖️ Rendering Processes')}
            <Processes />
          </div>
        } 
      />
      <Route 
        path="/templates" 
        element={
          <div>
            {console.log('📄 Rendering Templates')}
            <Templates />
          </div>
        } 
      />
      <Route 
        path="/petitions" 
        element={
          <div>
            {console.log('📁 Rendering Petitions')}
            <Petitions />
          </div>
        } 
      />
      <Route 
        path="/deadlines" 
        element={
          <div>
            {console.log('📅 Rendering Deadlines')}
            <DeadlinesPage />
          </div>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <div>
            {console.log('⚙️ Rendering Settings')}
            <SettingsPage />
          </div>
        } 
      />
      
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch all unknown routes */}
      <Route 
        path="*" 
        element={
          <div>
            {console.log('❓ Unknown route, showing fallback and redirecting')}
            <NotFoundFallback />
            <Navigate to="/dashboard" replace />
          </div>
        } 
      />
    </Routes>
  );
};
