
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  slug?: string;
  owner_id: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  invited_by?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  current_workspace_id?: string;
  preferences: {
    notifications: boolean;
    email_alerts: boolean;
    theme: 'light' | 'dark';
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  logo_url?: string;
}

// Outros tipos permanecem iguais
export interface Client {
  id: string;
  workspace_id: string;
  client_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone?: string;
  document_number?: string;
  address?: Record<string, any>;
  custom_fields?: Record<string, any>;
  tags?: string[];
  lead_score: number;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'archived';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Process {
  id: string;
  workspace_id: string;
  process_number: string;
  title: string;
  description?: string;
  status: 'active' | 'suspended' | 'completed' | 'archived';
  court?: string;
  judge?: string;
  case_value?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline_date?: string;
  assigned_lawyer?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PetitionTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  category: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial';
  template_content: string;
  is_shared: boolean;
  execution_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  id: string;
  template_id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'cpf' | 'cnpj' | 'email' | 'phone';
  field_options?: Record<string, any>;
  is_required: boolean;
  display_order: number;
  validation_rules?: Record<string, any>;
  created_at: string;
}

export interface PetitionExecution {
  id: string;
  workspace_id: string;
  template_id: string;
  client_id?: string;
  process_id?: string;
  filled_data: Record<string, any>;
  generated_content?: string;
  webhook_url?: string;
  webhook_status: 'pending' | 'sent' | 'success' | 'failed' | 'retry';
  webhook_response?: Record<string, any>;
  webhook_sent_at?: string;
  webhook_completed_at?: string;
  retry_count: number;
  final_document_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
