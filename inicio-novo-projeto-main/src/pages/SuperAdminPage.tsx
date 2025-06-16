
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SuperAdminGuard } from '@/components/superadmin/SuperAdminGuard';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { SuperAdminDashboard } from '@/components/superadmin/SuperAdminDashboard';

const SuperAdminWorkspaces = () => <div>Workspaces Management (Em desenvolvimento)</div>;
const SuperAdminUsers = () => <div>Users Management (Em desenvolvimento)</div>;
const SuperAdminAnalytics = () => <div>Analytics (Em desenvolvimento)</div>;
const SuperAdminSettings = () => <div>System Settings (Em desenvolvimento)</div>;
const SuperAdminLogs = () => <div>Activity Logs (Em desenvolvimento)</div>;

export const SuperAdminPage: React.FC = () => {
  return (
    <SuperAdminGuard>
      <SuperAdminLayout>
        <Routes>
          <Route index element={<SuperAdminDashboard />} />
          <Route 
            path="workspaces" 
            element={
              <SuperAdminGuard requiredPermission="access_workspaces">
                <SuperAdminWorkspaces />
              </SuperAdminGuard>
            } 
          />
          <Route 
            path="users" 
            element={
              <SuperAdminGuard requiredPermission="manage_users">
                <SuperAdminUsers />
              </SuperAdminGuard>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <SuperAdminGuard requiredPermission="view_analytics">
                <SuperAdminAnalytics />
              </SuperAdminGuard>
            } 
          />
          <Route 
            path="settings" 
            element={
              <SuperAdminGuard requiredPermission="modify_system_settings">
                <SuperAdminSettings />
              </SuperAdminGuard>
            } 
          />
          <Route path="logs" element={<SuperAdminLogs />} />
        </Routes>
      </SuperAdminLayout>
    </SuperAdminGuard>
  );
};
