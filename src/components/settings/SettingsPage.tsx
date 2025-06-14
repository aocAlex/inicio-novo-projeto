
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceSettings } from './WorkspaceSettings';
import { MembersManagement } from './MembersManagement';
import { PermissionsSettings } from './PermissionsSettings';
import { usePermissions } from '@/hooks/usePermissions';
import { Settings, Users, Shield } from 'lucide-react';

export const SettingsPage = () => {
  const { can } = usePermissions();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie seu workspace, membros e permissões</p>
      </div>

      <Tabs defaultValue="workspace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <WorkspaceSettings />
        </TabsContent>

        <TabsContent value="members">
          <MembersManagement />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
