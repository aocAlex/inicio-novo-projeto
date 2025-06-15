
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const useWorkspaceOptions = () => {
  const { currentWorkspace } = useWorkspace();

  // Buscar processos
  const { data: processes = [] } = useQuery({
    queryKey: ['workspace-processes', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('processes')
        .select('id, title, process_number')
        .eq('workspace_id', currentWorkspace.id)
        .order('title');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['workspace-clients', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('workspace_id', currentWorkspace.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Buscar templates de petições
  const { data: petitionTemplates = [] } = useQuery({
    queryKey: ['workspace-petition-templates', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('petition_templates')
        .select('id, name, category')
        .eq('workspace_id', currentWorkspace.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Buscar usuários válidos da workspace usando a view criada
  const { data: workspaceUsers = [] } = useQuery({
    queryKey: ['workspace-users', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      console.log('Loading workspace users for workspace:', currentWorkspace.id);

      // Usar a view valid_workspace_members para garantir apenas usuários válidos
      const { data, error } = await supabase
        .from('valid_workspace_members')
        .select('user_id, full_name, email')
        .eq('workspace_id', currentWorkspace.id);

      if (error) {
        console.error('Error loading workspace users:', error);
        throw error;
      }
      
      console.log('Valid users from view:', data?.length || 0);
      
      // Mapear resultados
      const validUsers = data?.map((member: any) => ({
        id: member.user_id,
        full_name: member.full_name || member.email || 'Usuário sem nome',
        email: member.email || ''
      })) || [];

      console.log('Mapped valid users:', validUsers.length);
      return validUsers;
    },
    enabled: !!currentWorkspace?.id,
  });

  return {
    processes,
    clients,
    petitionTemplates,
    workspaceUsers
  };
};
