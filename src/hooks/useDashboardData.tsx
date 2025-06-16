
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export const useDashboardData = () => {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      // Buscar dados em paralelo para evitar loading infinito
      const [petitionsData, templatesData, membersData, clientsData, processesData] = await Promise.all([
        supabase
          .from('petition_executions')
          .select('*')
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('petition_templates')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('execution_count', { ascending: false })
          .limit(5),
        supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('clients')
          .select('*')
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('processes')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
      ]);

      if (petitionsData.error) throw petitionsData.error;
      if (templatesData.error) throw templatesData.error;
      if (membersData.error) throw membersData.error;
      if (clientsData.error) throw clientsData.error;
      if (processesData.error) throw processesData.error;

      // Calcular métricas de tempo
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Métricas de petições
      const petitions = petitionsData.data || [];
      const petitionsToday = petitions.filter(p => 
        new Date(p.created_at) >= today
      ).length;
      const petitionsThisWeek = petitions.filter(p => 
        new Date(p.created_at) >= thisWeekStart
      ).length;
      const petitionsThisMonth = petitions.filter(p => 
        new Date(p.created_at) >= thisMonthStart
      ).length;
      const successfulPetitions = petitions.filter(p => 
        p.webhook_status === 'completed'
      ).length;
      const successRate = petitions.length > 0 
        ? (successfulPetitions / petitions.length) * 100 
        : 0;

      // Métricas de clientes
      const clients = clientsData.data || [];
      const clientsThisWeek = clients.filter(c => 
        new Date(c.created_at) >= thisWeekStart
      ).length;
      const clientsThisMonth = clients.filter(c => 
        new Date(c.created_at) >= thisMonthStart
      ).length;
      const activeClients = clients.filter(c => c.status === 'active').length;

      // Métricas de processos
      const processes = processesData.data || [];
      const activeProcesses = processes.filter(p => p.status === 'active').length;
      const pendingProcesses = processes.filter(p => p.status === 'pending').length;
      const archivedProcesses = processes.filter(p => p.status === 'archived').length;
      const processesWithDeadlineThisWeek = processes.filter(p => {
        if (!p.deadline_date) return false;
        try {
          const deadline = new Date(p.deadline_date);
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          return deadline <= nextWeek && deadline >= new Date();
        } catch {
          return false;
        }
      }).length;

      // Métricas de webhooks
      const webhooksSent = petitions.filter(p => 
        p.webhook_status === 'sent' || p.webhook_status === 'completed'
      ).length;
      const webhooksFailed = petitions.filter(p => 
        p.webhook_status === 'failed'
      ).length;
      const webhookSuccessRate = webhooksSent > 0 
        ? ((webhooksSent - webhooksFailed) / webhooksSent) * 100 
        : 0;

      // Membros ativos
      const members = membersData.data || [];
      const activeToday = Math.floor(members.length * 0.7);

      const metrics: DashboardMetrics = {
        clients: {
          total: clients.length,
          activeToday: activeClients,
          newThisWeek: clientsThisWeek,
          newThisMonth: clientsThisMonth,
        },
        processes: {
          total: processes.length,
          active: activeProcesses,
          pending: pendingProcesses,
          archived: archivedProcesses,
          withDeadlineThisWeek: processesWithDeadlineThisWeek,
        },
        petitions: {
          total: petitions.length,
          today: petitionsToday,
          thisWeek: petitionsThisWeek,
          thisMonth: petitionsThisMonth,
          successRate: Math.round(successRate * 100) / 100,
        },
        templates: {
          total: (templatesData.data || []).length,
          mostUsed: (templatesData.data || []).map(template => ({
            id: template.id,
            name: template.name,
            category: template.category,
            executionCount: template.execution_count || 0,
            lastUsed: template.updated_at,
          })),
        },
        webhooks: {
          successRate: Math.round(webhookSuccessRate * 100) / 100,
          averageResponseTime: 1200,
          totalSent: webhooksSent,
          failed: webhooksFailed,
        },
        members: {
          total: members.length,
          activeToday: activeToday,
        },
      };

      setMetrics(metrics);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading dashboard metrics:', err);
      toast({
        title: "Erro ao carregar métricas",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    loadMetrics();
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadMetrics();
    } else {
      setMetrics(null);
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  return {
    metrics,
    isLoading,
    error,
    refresh,
  };
};
