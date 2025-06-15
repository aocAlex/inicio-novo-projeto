
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { ChevronDown, Building2, Plus, Check, Crown, Users } from 'lucide-react';

export const WorkspaceSelector = () => {
  const { currentWorkspace, workspaces, isOwner, switchWorkspace } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId !== currentWorkspace?.id) {
      await switchWorkspace(workspaceId);
    }
  };

  const getWorkspaceIcon = (workspace: any) => {
    const isCurrentOwner = workspace.owner_id === workspace.id; // Esta lógica será ajustada
    return isCurrentOwner ? (
      <Crown className="mr-2 h-4 w-4 text-yellow-600" />
    ) : (
      <Users className="mr-2 h-4 w-4 text-blue-600" />
    );
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
          <DropdownMenuSeparator />
          
          {workspaces.map((workspace) => {
            const isWorkspaceOwner = workspace.owner_id === workspace.id; // Será ajustado
            return (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  {isWorkspaceOwner ? (
                    <Crown className="mr-2 h-4 w-4 text-yellow-600" />
                  ) : (
                    <Users className="mr-2 h-4 w-4 text-blue-600" />
                  )}
                  <div className="flex flex-col">
                    <span className="truncate font-medium">{workspace.name}</span>
                    <span className="text-xs text-gray-500">
                      {isWorkspaceOwner ? 'Minha workspace' : 'Membro'}
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
          <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nova Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};
