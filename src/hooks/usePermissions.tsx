
import { useWorkspace } from '@/contexts/WorkspaceContext';

type Permission = {
  resource: string;
  action: string;
};

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [{ resource: '*', action: '*' }],
  admin: [
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'update' },
    { resource: 'clients', action: 'delete' },
    { resource: 'processes', action: 'create' },
    { resource: 'processes', action: 'read' },
    { resource: 'processes', action: 'update' },
    { resource: 'processes', action: 'delete' },
    { resource: 'templates', action: 'create' },
    { resource: 'templates', action: 'read' },
    { resource: 'templates', action: 'update' },
    { resource: 'templates', action: 'delete' },
    { resource: 'petitions', action: 'execute' },
    { resource: 'petitions', action: 'read' },
    { resource: 'members', action: 'invite' },
    { resource: 'members', action: 'remove' },
    { resource: 'workspace', action: 'settings' },
  ],
  editor: [
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'update' },
    { resource: 'processes', action: 'create' },
    { resource: 'processes', action: 'read' },
    { resource: 'processes', action: 'update' },
    { resource: 'templates', action: 'read' },
    { resource: 'petitions', action: 'execute' },
    { resource: 'petitions', action: 'read' },
  ],
  viewer: [
    { resource: 'clients', action: 'read' },
    { resource: 'processes', action: 'read' },
    { resource: 'templates', action: 'read' },
    { resource: 'petitions', action: 'read' },
  ],
};

export const usePermissions = () => {
  const { currentMember } = useWorkspace();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!currentMember) return false;

    // Check role-based permissions first
    const rolePermissions = ROLE_PERMISSIONS[currentMember.role] || [];

    // Check for wildcard permissions (owner)
    if (rolePermissions.some(p => p.resource === '*' && p.action === '*')) {
      return true;
    }

    // Check for specific resource wildcard
    if (rolePermissions.some(p => p.resource === resource && p.action === '*')) {
      return true;
    }

    // Check for specific permission in role
    if (rolePermissions.some(p => p.resource === resource && p.action === action)) {
      return true;
    }

    // Check custom permissions for the member
    const customPermissions = currentMember.permissions || {};
    const permissionKey = `${resource}.${action}`;
    
    if (customPermissions[permissionKey] !== undefined) {
      return customPermissions[permissionKey];
    }

    return false;
  };

  const can = {
    // Clients
    createClient: () => hasPermission('clients', 'create'),
    readClient: () => hasPermission('clients', 'read'),
    updateClient: () => hasPermission('clients', 'update'),
    deleteClient: () => hasPermission('clients', 'delete'),

    // Processes
    createProcess: () => hasPermission('processes', 'create'),
    readProcess: () => hasPermission('processes', 'read'),
    updateProcess: () => hasPermission('processes', 'update'),
    deleteProcess: () => hasPermission('processes', 'delete'),

    // Templates
    createTemplate: () => hasPermission('templates', 'create'),
    readTemplate: () => hasPermission('templates', 'read'),
    updateTemplate: () => hasPermission('templates', 'update'),
    deleteTemplate: () => hasPermission('templates', 'delete'),

    // Petitions
    executePetition: () => hasPermission('petitions', 'execute'),
    readPetition: () => hasPermission('petitions', 'read'),

    // Members
    manageMembers: () => hasPermission('members', 'invite'),
    removeMembers: () => hasPermission('members', 'remove'),

    // Workspace
    manageWorkspace: () => hasPermission('workspace', 'settings'),
  };

  return { hasPermission, can };
};
