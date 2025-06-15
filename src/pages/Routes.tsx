
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { Clients } from '@/pages/Clients';
import { Processes } from '@/pages/Processes';
import { Templates } from '@/pages/Templates';
import { Petitions } from '@/pages/Petitions';
import { DeadlinesPage } from '@/pages/DeadlinesPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/processes" element={<Processes />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/petitions" element={<Petitions />} />
      <Route path="/deadlines" element={<DeadlinesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
};
