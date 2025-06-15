
import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Dashboard } from './Dashboard';
import { Clients } from './Clients';
import { Processes } from './Processes';
import { TemplatesPage } from './TemplatesPage';
import { TemplateEditorPage } from './TemplateEditorPage';
import { PetitionsPage } from './PetitionsPage';
import { DeadlinesPage } from './DeadlinesPage';
import { ContractsPage } from './ContractsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { SuperAdminPage } from './SuperAdminPage';
import { NotFound } from './NotFound';

export const Routes = () => {
  return (
    <RouterRoutes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/processes" element={<ProtectedRoute><Processes /></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
      <Route path="/templates/:id/editor" element={<ProtectedRoute><TemplateEditorPage /></ProtectedRoute>} />
      <Route path="/petitions" element={<ProtectedRoute><PetitionsPage /></ProtectedRoute>} />
      <Route path="/deadlines" element={<ProtectedRoute><DeadlinesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/superadmin" element={<ProtectedRoute><SuperAdminPage /></ProtectedRoute>} />
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
