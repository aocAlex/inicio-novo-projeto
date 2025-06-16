
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

      if (data) {
        // Convert database response to our SuperAdmin type
        const superAdmin: SuperAdmin = {
          id: data.id,
          user_id: data.user_id,
          email: data.email,
          can_create_workspaces: data.can_create_workspaces,
          can_delete_workspaces: data.can_delete_workspaces,
          can_access_workspaces: data.can_access_workspaces,
          can_manage_users: data.can_manage_users,
          can_view_analytics: data.can_view_analytics,
          can_modify_system_settings: data.can_modify_system_settings,
          is_active: data.is_active,
          created_by: data.created_by,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_login_at: data.last_login_at,
          notification_preferences: typeof data.notification_preferences === 'object' 
            ? data.notification_preferences as { email: boolean; in_app: boolean; }
            : { email: true, in_app: true }
        };

        setSuperAdminData(superAdmin);

        // Update last login
        await supabase
          .from('super_admins')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.id);
      } else {
        setSuperAdminData(null);
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
