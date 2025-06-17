
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceQuota } from '@/hooks/useWorkspaceQuota';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { QuotaIndicator } from './QuotaIndicator';
import { WorkspaceQuotaModal } from './WorkspaceQuotaModal';
import { ChevronDown, Building2, Plus, Check, Crown, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const WorkspaceSelector = () => {
  const { currentWorkspace, workspaces, isOwner, switchWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { quota, canCreateWorkspace, quotaStatus } = useWorkspaceQuota();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId !== currentWorkspace?.id) {
      await switchWorkspace(workspaceId);
    }
  };

  const isWorkspaceOwner = (workspace: any) => {
    return workspace.owner_id === user?.id;
  };

  const handleNewWorkspaceClick = () => {
    if (canCreateWorkspace) {
      setShowCreateModal(true);
    } else {
      setShowQuotaModal(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-48 justify-between">
            <div className="flex items-center">
              {isOwner ? (
                <Crown className="mr-2 h-4 w-4 text-yellow-600" />
              ) : (
                <Users className="mr-2 h-4 w-4 text-blue-600" />
              )}
              <span className="truncate">
                {currentWorkspace?.name || 'Selecionar workspace'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel>Suas Workspaces</DropdownMenuLabel>
          
          {/* Indicador de Quota */}
          {quota && (
            <div className="px-2 py-2 border-b">
              <QuotaIndicator 
                used={quotaStatus.used} 
                total={quotaStatus.total}
                isUnlimited={quotaStatus.isUnlimited}
                showDetails={false}
              />
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          {workspaces.map((workspace) => {
            const isCurrentOwner = isWorkspaceOwner(workspace);
            return (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  {isCurrentOwner ? (
                    <Crown className="mr-2 h-4 w-4 text-yellow-600" />
                  ) : (
                    <Users className="mr-2 h-4 w-4 text-blue-600" />
                  )}
                  <div className="flex flex-col">
                    <span className="truncate font-medium">{workspace.name}</span>
                    <span className="text-xs text-gray-500">
                      {isCurrentOwner ? 'Minha workspace' : 'Membro'}
                    </span>
                  </div>
                </div>
                {currentWorkspace?.id === workspace.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNewWorkspaceClick}>
            {canCreateWorkspace ? (
              <Plus className="mr-2 h-4 w-4" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            )}
            <span>Nova Workspace</span>
            {!canCreateWorkspace && (
              <span className="ml-auto text-xs text-red-500">Limite</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <WorkspaceQuotaModal
        open={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        used={quotaStatus.used}
        total={quotaStatus.total}
        isUnlimited={quotaStatus.isUnlimited}
      />
    </>
  );
};
