
export interface Deadline {
  id: string;
  workspace_id: string;
  process_id?: string;
  client_id?: string;
  template_id?: string;
  petition_id?: string;
  petition_execution_id?: string;
  title: string;
  description?: string;
  deadline_type: 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado';
  due_date: string;
  created_date: string;
  completed_date?: string;
  business_days_only: boolean;
  anticipation_days: number;
  is_critical: boolean;
  assigned_to?: string;
  created_by: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CUMPRIDO' | 'PERDIDO' | 'SUSPENSO';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  completion_notes?: string;
  attachments: any[];
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  process?: {
    id: string;
    title: string;
    process_number: string;
  };
  client?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  petition?: {
    id: string;
    name: string;
    category: string;
  };
  petition_execution?: {
    id: string;
    created_at: string;
    filled_data: any;
  };
}

export interface DeadlineFormData {
  title: string;
  description?: string;
  deadline_type: 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado';
  due_date: Date;
  process_id?: string;
  client_id?: string;
  petition_id?: string;
  petition_execution_id?: string;
  assigned_to?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  business_days_only: boolean;
  anticipation_days: number;
  is_critical: boolean;
  attachments?: File[];
  custom_fields?: Record<string, any>;
}

export interface DeadlineFilters {
  search?: string;
  status?: string;
  priority?: string;
  deadline_type?: string;
  assigned_to?: string;
  process_id?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CalendarSettings {
  id: string;
  workspace_id: string;
  state_holidays: any[];
  city_holidays: any[];
  custom_holidays: any[];
  december_recess_start: string;
  december_recess_end: string;
  july_recess_start: string;
  july_recess_end: string;
  default_anticipation_days: number;
  work_days: number[];
  enable_email_notifications: boolean;
  enable_whatsapp_notifications: boolean;
  notification_time: string;
  created_at: string;
  updated_at: string;
}

export interface DeadlineNotification {
  id: string;
  deadline_id: string;
  workspace_id: string;
  days_before: number;
  notification_type: 'email' | 'in_app' | 'whatsapp' | 'sms';
  is_sent: boolean;
  sent_at?: string;
  recipient_id: string;
  subject?: string;
  message?: string;
  created_at: string;
}
