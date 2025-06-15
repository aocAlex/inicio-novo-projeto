
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceSettings } from './WorkspaceSettings';
import { SimplifiedMembersManagement } from './SimplifiedMembersManagement';
import { useSimplifiedPermissions } from '@/hooks/useSimplifiedPermissions';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Settings, Users, AlertCircle, Crown, Building2 } from 'lucide-react';

export const SettingsPage = () => {
  const { can, isOwner } = useSimplifiedPermissions();
  const { currentWorkspace, isLoading } = useWorkspace();

  if (isLoading) {
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
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <p>Nenhuma workspace selecionada. Selecione ou crie uma workspace para acessar as configurações.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-gray-600">Gerencie sua workspace e membros</p>
        <div className="flex items-center gap-2 mt-2">
          {isOwner ? (
            <div className="flex items-center gap-1 text-yellow-600">
              <Crown className="h-4 w-4" />
              <span className="text-sm font-medium">Proprietário</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-blue-600">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Membro</span>
            </div>
          )}
          <span className="text-sm text-gray-500">• {currentWorkspace.name}</span>
        </div>
      </div>

      <Tabs defaultValue="workspace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <WorkspaceSettings />
        </TabsContent>

        <TabsContent value="members">
          <SimplifiedMembersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
