
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminDashboardMetrics, WorkspaceAnalytics } from '@/types/superadmin';

export const useSuperAdminAnalytics = () => {
  const [metrics, setMetrics] = useState<SuperAdminDashboardMetrics | null>(null);
  const [workspaceAnalytics, setWorkspaceAnalytics] = useState<WorkspaceAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Total workspaces
      const { count: totalWorkspaces } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true });

      // Active workspaces (with activity in last 30 days)
      const { count: activeWorkspaces } = await supabase
        .from('workspace_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('activity_status', 'active');

      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active users (logged in last 7 days)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Total executions
      const { count: totalExecutions } = await supabase
        .from('petition_executions')
        .select('*', { count: 'exact', head: true });

      const dashboardMetrics: SuperAdminDashboardMetrics = {
        totalWorkspaces: totalWorkspaces || 0,
        activeWorkspaces: activeWorkspaces || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalExecutions: totalExecutions || 0,
        systemUptime: 99.9, // Mock data - would come from monitoring
        avgResponseTime: 150, // Mock data - would come from monitoring
        errorRate: 0.1, // Mock data - would come from monitoring
      };

      setMetrics(dashboardMetrics);
    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWorkspaceAnalytics = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('workspace_analytics')
        .select('*')
        .order('last_activity', { ascending: false });

      if (fetchError) throw fetchError;

      // Convert database response to our WorkspaceAnalytics type
      const convertedData: WorkspaceAnalytics[] = (data || []).map(item => ({
        workspace_id: item.workspace_id,
        workspace_name: item.workspace_name,
        workspace_created_at: item.workspace_created_at,
        workspace_updated_at: item.workspace_updated_at,
        total_members: item.total_members,
        owners_count: item.owners_count,
        admins_count: item.admins_count,
        total_clients: item.total_clients,
        total_processes: item.total_processes,
        total_templates: item.total_templates,
        total_executions: item.total_executions,
        recent_activities: item.recent_activities,
        last_activity: item.last_activity,
        activity_status: (item.activity_status === 'active' || item.activity_status === 'idle' || item.activity_status === 'inactive') 
          ? item.activity_status 
          : 'inactive'
      }));

      setWorkspaceAnalytics(convertedData);
    } catch (err: any) {
      console.error('Error fetching workspace analytics:', err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchWorkspaceAnalytics();
  }, [fetchDashboardMetrics, fetchWorkspaceAnalytics]);

  return {
    metrics,
    workspaceAnalytics,
    isLoading,
    error,
    refreshMetrics: fetchDashboardMetrics,
    refreshWorkspaceAnalytics: fetchWorkspaceAnalytics,
  };
};
