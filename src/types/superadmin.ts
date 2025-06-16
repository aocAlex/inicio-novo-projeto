
export interface SuperAdmin {
  id: string;
  user_id: string;
  email: string;
  can_create_workspaces: boolean;
  can_delete_workspaces: boolean;
  can_access_workspaces: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_modify_system_settings: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
  };
}

export interface SuperAdminActivityLog {
  id: string;
  super_admin_id: string;
  action_type: string;
  action_description: string;
  target_workspace_id?: string;
  target_user_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  severity: 'info' | 'warning' | 'critical';
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category?: string;
  is_public: boolean;
  requires_restart: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceAnalytics {
  workspace_id: string;
  workspace_name: string;
  workspace_created_at: string;
  workspace_updated_at: string;
  total_members: number;
  owners_count: number;
  admins_count: number;
  total_clients: number;
  total_processes: number;
  total_templates: number;
  total_executions: number;
  recent_activities: number;
  last_activity?: string;
  activity_status: 'active' | 'idle' | 'inactive';
}

export interface SuperAdminDashboardMetrics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalUsers: number;
  activeUsers: number;
  totalExecutions: number;
  systemUptime: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface CreateWorkspaceForm {
  name: string;
  description?: string;
  ownerEmail: string;
  createOwnerIfNotExists: boolean;
  sendWelcomeEmail: boolean;
  planType: 'trial' | 'basic' | 'premium' | 'enterprise';
  maxUsers: number;
  enabledFeatures: string[];
}

export interface ImpersonationSession {
  superAdminId: string;
  targetWorkspaceId: string;
  startedAt: Date;
  originalPermissions: string[];
  impersonatedRole: 'owner' | 'admin' | 'editor' | 'viewer';
}
