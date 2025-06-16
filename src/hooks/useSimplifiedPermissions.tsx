
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const useSimplifiedPermissions = () => {
  const { isOwner } = useWorkspace();

  // Regras ultra-simples: OWNER pode tudo, MEMBER pode quase tudo exceto gerenciar workspace
  const can = {
    // Workspace management - apenas owners
    manageWorkspace: () => isOwner,
    manageMembers: () => isOwner,
    deleteWorkspace: () => isOwner,
    
    // Todas as outras funcionalidades - owners e members
    createClient: () => true,
    readClient: () => true,
    updateClient: () => true,
    deleteClient: () => true,
    
    createProcess: () => true,
    readProcess: () => true,
    updateProcess: () => true,
    deleteProcess: () => true,
    
    createTemplate: () => true,
    readTemplate: () => true,
    updateTemplate: () => true,
    deleteTemplate: () => true,
    
    executePetition: () => true,
    readPetition: () => true,
    
    createDeadline: () => true,
    readDeadline: () => true,
    updateDeadline: () => true,
    deleteDeadline: () => true,
  };

  return { can, isOwner };
};
