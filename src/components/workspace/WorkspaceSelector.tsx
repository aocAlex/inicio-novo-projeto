
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { ChevronDown, Building2, Plus, Check, Globe } from 'lucide-react';

export const WorkspaceSelector = () => {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId !== currentWorkspace?.id) {
      await switchWorkspace(workspaceId);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-48 justify-between">
            <div className="flex items-center">
              {currentWorkspace?.is_public ? (
                <Globe className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <Building2 className="mr-2 h-4 w-4" />
              )}
              <span className="truncate">
                {currentWorkspace?.name || 'Selecionar workspace'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel>Suas Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSwitch(workspace.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                {workspace.is_public ? (
                  <Globe className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Building2 className="mr-2 h-4 w-4" />
                )}
                <span className="truncate">{workspace.name}</span>
                {workspace.is_public && (
                  <span className="ml-1 text-xs text-green-600">(Público)</span>
                )}
              </div>
              {currentWorkspace?.id === workspace.id && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          ))}
          
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
