
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from './useSuperAdmin';

export const useSuperAdminActivityLog = () => {
  const { superAdminData } = useSuperAdmin();
  const [isLogging, setIsLogging] = useState(false);

  const logActivity = useCallback(async (
    actionType: string,
    actionDescription: string,
    options?: {
      targetWorkspaceId?: string;
      targetUserId?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      severity?: 'info' | 'warning' | 'critical';
      success?: boolean;
      errorMessage?: string;
    }
  ) => {
    if (!superAdminData) return;

    setIsLogging(true);

    try {
      const logEntry = {
        super_admin_id: superAdminData.id,
        action_type: actionType,
        action_description: actionDescription,
        target_workspace_id: options?.targetWorkspaceId || null,
        target_user_id: options?.targetUserId || null,
        old_values: options?.oldValues || null,
        new_values: options?.newValues || null,
        severity: options?.severity || 'info',
        success: options?.success !== false,
        error_message: options?.errorMessage || null,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        session_id: generateSessionId(),
      };

      const { error } = await supabase
        .from('super_admin_activity_logs')
        .insert(logEntry);

      if (error) {
        console.error('Error logging super admin activity:', error);
      }
    } catch (err) {
      console.error('Error in logActivity:', err);
    } finally {
      setIsLogging(false);
    }
  }, [superAdminData]);

  return {
    logActivity,
    isLogging,
  };
};

// Helper functions
const getClientIP = async (): Promise<string | undefined> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
};

const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
