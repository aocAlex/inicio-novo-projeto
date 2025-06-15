import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { DashboardMetrics, PetitionActivity, ChartData } from '@/types/dashboard';

export const useDashboardMetrics = () => {
  const { currentWorkspace } = useWorkspace();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPetitions, setRecentPetitions] = useState<PetitionActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadDashboardData();
    }
  }, [currentWorkspace]);

  const loadDashboardData = async () => {
    if (!currentWorkspace) return;

    try {
      setIsLoading(true);
      setError(null);

      // Carregar métricas de petições
      const petitionMetrics = await loadPetitionMetrics();
      
      // Carregar métricas de templates
      const templateMetrics = await loadTemplateMetrics();
      
      // Carregar métricas de webhooks
      const webhookMetrics = await loadWebhookMetrics();
      
      // Carregar métricas de membros
      const memberMetrics = await loadMemberMetrics();

      // Carregar métricas de clientes
      const clientMetrics = await loadClientMetrics();

      // Carregar métricas de processos
      const processMetrics = await loadProcessMetrics();

      // Combinar todas as métricas
      setMetrics({
        clients: clientMetrics,
        processes: processMetrics,
        petitions: petitionMetrics,
        templates: templateMetrics,
        webhooks: webhookMetrics,
        members: memberMetrics,
      });

      // Carregar atividades recentes
      await loadRecentPetitions();
      
      // Carregar dados para gráficos
      await loadChartData();

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Total de clientes
    const { count: total } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    // Clientes ativos hoje
    const { count: activeToday } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'active');

    // Novos clientes esta semana
    const { count: newThisWeek } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', weekAgo);

    // Novos clientes este mês
    const { count: newThisMonth } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', monthAgo);

    return {
      total: total || 0,
      activeToday: activeToday || 0,
      newThisWeek: newThisWeek || 0,
      newThisMonth: newThisMonth || 0,
    };
  };

  const loadProcessMetrics = async () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Total de processos
    const { count: total } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    // Processos ativos
    const { count: active } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'active');

    // Processos pendentes
    const { count: pending } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'pending');

    // Processos arquivados
    const { count: archived } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'archived');

    // Processos com deadline esta semana
    const { count: withDeadlineThisWeek } = await supabase
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('deadline_date', today.toISOString())
      .lte('deadline_date', nextWeek.toISOString());

    return {
      total: total || 0,
      active: active || 0,
      pending: pending || 0,
      archived: archived || 0,
      withDeadlineThisWeek: withDeadlineThisWeek || 0,
    };
  };

  const loadPetitionMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Total de petições
    const { count: total } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    // Petições de hoje
    const { count: today_count } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', today);

    // Petições desta semana
    const { count: week_count } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', weekAgo);

    // Petições deste mês
    const { count: month_count } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', monthAgo);

    // Success rate
    const { count: success_count } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('webhook_status', 'success');

    const successRate = total && total > 0 ? ((success_count || 0) / total) * 100 : 0;

    return {
      total: total || 0,
      today: today_count || 0,
      thisWeek: week_count || 0,
      thisMonth: month_count || 0,
      successRate: Math.round(successRate * 100) / 100,
    };
  };

  const loadTemplateMetrics = async () => {
    // Total de templates
    const { count: total } = await supabase
      .from('petition_templates')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id);

    // Templates mais usados
    const { data: templatesData } = await supabase
      .from('petition_templates')
      .select(`
        id,
        name,
        category,
        execution_count
      `)
      .eq('workspace_id', currentWorkspace!.id)
      .order('execution_count', { ascending: false })
      .limit(5);

    const mostUsed = templatesData?.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      executionCount: template.execution_count || 0,
      lastUsed: new Date().toISOString(), // TODO: Implementar last_used
    })) || [];

    return {
      total: total || 0,
      mostUsed,
    };
  };

  const loadWebhookMetrics = async () => {
    // Métricas de webhooks dos últimos 30 dias
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: totalSent } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', monthAgo)
      .neq('webhook_status', 'pending');

    const { count: failed } = await supabase
      .from('petition_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', monthAgo)
      .eq('webhook_status', 'failed');

    const successRate = totalSent && totalSent > 0 ? (((totalSent - (failed || 0)) / totalSent) * 100) : 0;

    return {
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: 2.5, // TODO: Calcular tempo real
      totalSent: totalSent || 0,
      failed: failed || 0,
    };
  };

  const loadMemberMetrics = async () => {
    // Total de membros ativos
    const { count: total } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .eq('status', 'active');

    // Membros ativos hoje (que tiveram atividade)
    const today = new Date().toISOString().split('T')[0];
    const { count: activeToday } = await supabase
      .from('user_activities')
      .select('user_id', { count: 'exact', head: true })
      .eq('workspace_id', currentWorkspace!.id)
      .gte('created_at', today);

    return {
      total: total || 0,
      activeToday: activeToday || 0,
    };
  };

  const loadRecentPetitions = async () => {
    const { data } = await supabase
      .from('petition_executions')
      .select(`
        id,
        webhook_status,
        created_at,
        created_by,
        petition_templates(name),
        clients(name)
      `)
      .eq('workspace_id', currentWorkspace!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentData = data?.map(item => ({
      id: item.id,
      templateName: (item.petition_templates as any)?.name || 'Template removido',
      clientName: (item.clients as any)?.name || 'Cliente não informado',
      status: item.webhook_status as 'success' | 'failed' | 'pending',
      createdAt: item.created_at,
      createdBy: item.created_by || '',
    })) || [];

    setRecentPetitions(recentData);
  };

  const loadChartData = async () => {
    // Dados para gráfico de petições dos últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }).reverse();

    const chartPromises = last7Days.map(async (date) => {
      const nextDay = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const { count } = await supabase
        .from('petition_executions')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace!.id)
        .gte('created_at', date)
        .lt('created_at', nextDay);

      return {
        date,
        value: count || 0,
        label: new Date(date).toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: 'numeric' 
        }),
      };
    });

    const chartResult = await Promise.all(chartPromises);
    setChartData(chartResult);
  };

  return {
    metrics,
    recentPetitions,
    chartData,
    isLoading,
    error,
    refresh: loadDashboardData,
  };
};
