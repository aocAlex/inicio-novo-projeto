
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

      // Buscar dados de petições
      const { data: petitionsData, error: petitionsError } = await supabase
        .from('petition_executions')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (petitionsError) throw petitionsError;

      // Buscar dados de templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('petition_templates')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('execution_count', { ascending: false })
        .limit(5);

      if (templatesError) throw templatesError;

      // Buscar membros da workspace
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (membersError) throw membersError;

      // Calcular métricas de petições
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const petitionsToday = petitionsData.filter(p => 
        new Date(p.created_at) >= today
      ).length;

      const petitionsThisWeek = petitionsData.filter(p => 
        new Date(p.created_at) >= thisWeekStart
      ).length;

      const petitionsThisMonth = petitionsData.filter(p => 
        new Date(p.created_at) >= thisMonthStart
      ).length;

      const successfulPetitions = petitionsData.filter(p => 
        p.webhook_status === 'completed'
      ).length;

      const successRate = petitionsData.length > 0 
        ? (successfulPetitions / petitionsData.length) * 100 
        : 0;

      // Calcular métricas de webhooks
      const webhooksSent = petitionsData.filter(p => 
        p.webhook_status === 'sent' || p.webhook_status === 'completed'
      ).length;

      const webhooksFailed = petitionsData.filter(p => 
        p.webhook_status === 'failed'
      ).length;

      const webhookSuccessRate = webhooksSent > 0 
        ? ((webhooksSent - webhooksFailed) / webhooksSent) * 100 
        : 0;

      // Membros ativos hoje (simulado - seria baseado em last_activity)
      const activeToday = Math.floor(membersData.length * 0.7); // 70% dos membros ativos

      const metrics: DashboardMetrics = {
        petitions: {
          total: petitionsData.length,
          today: petitionsToday,
          thisWeek: petitionsThisWeek,
          thisMonth: petitionsThisMonth,
          successRate: Math.round(successRate * 100) / 100,
        },
        templates: {
          total: templatesData.length,
          mostUsed: templatesData.map(template => ({
            id: template.id,
            name: template.name,
            category: template.category,
            executionCount: template.execution_count || 0,
            lastUsed: template.updated_at,
          })),
        },
        webhooks: {
          successRate: Math.round(webhookSuccessRate * 100) / 100,
          averageResponseTime: 1200, // Simulado - seria calculado dos logs
          totalSent: webhooksSent,
          failed: webhooksFailed,
        },
        members: {
          total: membersData.length,
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
    }
  }, [currentWorkspace]);

  return {
    metrics,
    isLoading,
    error,
    refresh,
  };
};
