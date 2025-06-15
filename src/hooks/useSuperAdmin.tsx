
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdmin } from '@/types/superadmin';
import { useToast } from '@/hooks/use-toast';

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  superAdminData: SuperAdmin | null;
  permissions: {
    canCreateWorkspaces: boolean;
    canDeleteWorkspaces: boolean;
    canAccessWorkspaces: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canModifySystemSettings: boolean;
  };
  isLoading: boolean;
  error: string | null;
  refreshSuperAdminStatus: () => Promise<void>;
}

export const useSuperAdmin = (): SuperAdminContextType => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [superAdminData, setSuperAdminData] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSuperAdminStatus = useCallback(async () => {
    if (!user?.id) {
      setSuperAdminData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSuperAdminData(data || null);

      // Update last login
      if (data) {
        await supabase
          .from('super_admins')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (err: any) {
      console.error('Error checking super admin status:', err);
      setError(err.message);
      setSuperAdminData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refreshSuperAdminStatus = useCallback(async () => {
    await checkSuperAdminStatus();
  }, [checkSuperAdminStatus]);

  useEffect(() => {
    checkSuperAdminStatus();
  }, [checkSuperAdminStatus]);

  const permissions = {
    canCreateWorkspaces: superAdminData?.can_create_workspaces || false,
    canDeleteWorkspaces: superAdminData?.can_delete_workspaces || false,
    canAccessWorkspaces: superAdminData?.can_access_workspaces || false,
    canManageUsers: superAdminData?.can_manage_users || false,
    canViewAnalytics: superAdminData?.can_view_analytics || false,
    canModifySystemSettings: superAdminData?.can_modify_system_settings || false,
  };

  return {
    isSuperAdmin: !!superAdminData,
    superAdminData,
    permissions,
    isLoading,
    error,
    refreshSuperAdminStatus,
  };
};
