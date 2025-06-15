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

  // Buscar usuários válidos da workspace usando consultas separadas
  const { data: workspaceUsers = [] } = useQuery({
    queryKey: ['workspace-users', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      console.log('Loading workspace users for workspace:', currentWorkspace.id);

      // Get active members first
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'active');

      if (membersError) {
        console.error('Error loading workspace members:', membersError);
        throw membersError;
      }

      if (!membersData || membersData.length === 0) {
        console.log('No active members found');
        return [];
      }

      // Get profiles for these users
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      console.log('Valid users found:', profilesData?.length || 0);
      
      // Map to expected format
      const validUsers = profilesData?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || profile.email || 'Usuário sem nome',
        email: profile.email || ''
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
