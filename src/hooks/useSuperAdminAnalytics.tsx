
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceAnalytics {
  workspace_id: string;
  workspace_name: string;
  total_members: number;
  total_clients: number;
  total_processes: number;
  total_templates: number;
  total_executions: number;
  created_at: string;
}

export const useSuperAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Buscar workspaces com contagem de dados
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id, name, created_at');

      if (workspacesError) throw workspacesError;

      const analyticsData: WorkspaceAnalytics[] = [];

      for (const workspace of workspacesData || []) {
        // Contar membros
        const { count: membersCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        // Contar clientes
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        // Contar processos
        const { count: processesCount } = await supabase
          .from('processes')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        // Contar templates
        const { count: templatesCount } = await supabase
          .from('petition_templates')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        // Contar execuções
        const { count: executionsCount } = await supabase
          .from('petition_executions')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        analyticsData.push({
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          total_members: membersCount || 0,
          total_clients: clientsCount || 0,
          total_processes: processesCount || 0,
          total_templates: templatesCount || 0,
          total_executions: executionsCount || 0,
          created_at: workspace.created_at,
        });
      }

      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    analytics,
    isLoading,
    refreshAnalytics: loadAnalytics,
  };
};
