
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceSettings } from './WorkspaceSettings';
import { MembersManagement } from './MembersManagement';
import { PermissionsSettings } from './PermissionsSettings';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Settings, Users, Shield, AlertCircle } from 'lucide-react';

export const SettingsPage = () => {
  const { can } = usePermissions();
  const { currentWorkspace, currentMember, isLoading } = useWorkspace();

  useEffect(() => {
    console.log('=== DEBUG: SettingsPage ===');
    console.log('Current workspace:', {
      id: currentWorkspace?.id,
      name: currentWorkspace?.name,
      owner_id: currentWorkspace?.owner_id
    });
    console.log('Current member:', {
      id: currentMember?.id,
      role: currentMember?.role,
      status: currentMember?.status
    });
    console.log('Loading state:', isLoading);
    console.log('Permissions:', {
      canManageWorkspace: can.manageWorkspace(),
      canManageMembers: can.manageMembers()
    });
  }, [currentWorkspace, currentMember, isLoading, can]);

  if (isLoading) {
    console.log('SettingsPage: Showing loading state');
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    console.log('SettingsPage: No workspace selected');
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <p>Nenhum workspace selecionado. Selecione ou crie um workspace para acessar as configurações.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('SettingsPage: Rendering settings interface');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie seu workspace, membros e permissões</p>
        <p className="text-sm text-gray-500 mt-1">
          Workspace: {currentWorkspace.name} | Sua função: {currentMember?.role || 'Não definida'}
        </p>
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
