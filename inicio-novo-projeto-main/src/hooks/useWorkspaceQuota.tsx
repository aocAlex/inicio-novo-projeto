
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceQuota {
  id: string;
  user_id: string;
  max_workspaces: number;
  current_workspaces: number;
  is_unlimited: boolean;
  is_suspended: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useWorkspaceQuota = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quota, setQuota] = useState<WorkspaceQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuota = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: quotaError } = await supabase
        .from('user_workspace_quotas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (quotaError) {
        console.error('Error loading quota:', quotaError);
        setError(quotaError.message);
        return;
      }

      setQuota(data);
    } catch (err: any) {
      console.error('Error in loadQuota:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCanCreateWorkspace = () => {
    if (!quota) return false;
    if (quota.is_suspended) return false;
    if (quota.is_unlimited) return true;
    return quota.current_workspaces < quota.max_workspaces;
  };

  const getQuotaStatus = () => {
    if (!quota) return { available: 0, used: 0, total: 0, percentage: 0 };
    
    return {
      available: quota.is_unlimited ? Infinity : quota.max_workspaces - quota.current_workspaces,
      used: quota.current_workspaces,
      total: quota.max_workspaces,
      percentage: quota.is_unlimited ? 0 : (quota.current_workspaces / quota.max_workspaces) * 100,
      isUnlimited: quota.is_unlimited
    };
  };

  const refreshQuota = () => {
    loadQuota();
  };

  useEffect(() => {
    loadQuota();
  }, [user?.id]);

  return {
    quota,
    isLoading,
    error,
    canCreateWorkspace: checkCanCreateWorkspace(),
    quotaStatus: getQuotaStatus(),
    refreshQuota
  };
};
