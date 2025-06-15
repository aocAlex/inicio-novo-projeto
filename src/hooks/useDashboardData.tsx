
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetrics {
  clients: {
    total: number;
    activeToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  processes: {
    total: number;
    active: number;
    pending: number;
    archived: number;
    withDeadlineThisWeek: number;
  };
  petitions: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    successRate: number;
  };
  templates: {
    total: number;
    mostUsed: Array<{
      id: string;
      name: string;
      category: string;
      executionCount: number;
    }>;
  };
}

export const useDashboardData = () => {
  const { currentWorkspace } = useWorkspace();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      const [clientsMetrics, processesMetrics, petitionsMetrics, templatesMetrics] = 
        await Promise.all([
          loadClientsMetrics(),
          loadProcessesMetrics(),
          loadPetitionsMetrics(),
          loadTemplatesMetrics(),
        ]);

      setMetrics({
        clients: clientsMetrics,
        processes: processesMetrics,
        petitions: petitionsMetrics,
        templates: templatesMetrics,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientsMetrics = async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];

    const { count: total } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'active');

    const { count: newThisWeek } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', weekAgo.toISOString());

    const { count: newThisMonth } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', monthAgo.toISOString());

    return {
      total: total || 0,
      activeToday: total || 0, // Pode ser refinado com última atividade
      newThisWeek: newThisWeek || 0,
      newThisMonth: newThisMonth || 0,
    };
  };

  const loadProcessesMetrics = async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { count: total } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    const { count: active } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'active');

    const { count: pending } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'pending');

    const { count: archived } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'archived');

    const { count: withDeadlineThisWeek } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .not('deadline_date', 'is', null)
      .lte('deadline_date', nextWeek.toISOString());

    return {
      total: total || 0,
      active: active || 0,
      pending: pending || 0,
      archived: archived || 0,
      withDeadlineThisWeek: withDeadlineThisWeek || 0,
    };
  };

  const loadPetitionsMetrics = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { count: total } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    const { count: thisWeek } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', weekAgo.toISOString());

    const { count: thisMonth } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', monthAgo.toISOString());

    const { count: successful } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('webhook_status', 'success');

    const successRate = total && total > 0 ? Math.round(((successful || 0) / total) * 100) : 0;

    return {
      total: total || 0,
      thisWeek: thisWeek || 0,
      thisMonth: thisMonth || 0,
      successRate,
    };
  };

  const loadTemplatesMetrics = async () => {
    const { count: total } = await supabase
      .from('petition_templates')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    const { data: mostUsedData } = await supabase
      .from('petition_templates')
      .select('id, name, category, execution_count')
      .eq('workspace_id', currentWorkspace!.id)
      .order('execution_count', { ascending: false })
      .limit(5);

    const mostUsed = mostUsedData?.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category || 'Geral',
      executionCount: template.execution_count || 0,
    })) || [];

    return {
      total: total || 0,
      mostUsed,
    };
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadDashboardData();
    }
  }, [currentWorkspace]);

  return {
    metrics,
    isLoading,
    error,
    refresh: loadDashboardData,
  };
};
