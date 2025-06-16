
export interface Client {
  id: string;
  workspace_id: string;
  client_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone?: string;
  document_number?: string; // CPF/CNPJ
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  custom_fields?: Record<string, any>;
  tags?: string[];
  lead_score: number;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'archived';
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  interactions_count?: number;
  last_interaction?: string;
  processes_count?: number;
}

export interface CustomFieldDefinition {
  id: string;
  workspace_id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'phone' | 'cpf' | 'cnpj';
  field_options: {
    options?: string[]; // Para select
    placeholder?: string;
    min?: number;
    max?: number;
    required?: boolean;
  };
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ClientInteraction {
  id: string;
  workspace_id: string;
  client_id: string;
  interaction_type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'document';
  subject: string;
  description?: string;
  interaction_date: string;
  created_by: string;
  metadata: Record<string, any>;
  created_at: string;
  
  // Relationships
  creator?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateClientData {
  client_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone?: string;
  document_number?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  custom_fields?: Record<string, any>;
  tags?: string[];
  status?: 'lead' | 'prospect' | 'active' | 'inactive';
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  document_number?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  custom_fields?: Record<string, any>;
  tags?: string[];
  status?: 'lead' | 'prospect' | 'active' | 'inactive' | 'archived';
}

export interface ClientFilters {
  search?: string;
  client_type?: 'individual' | 'company';
  status?: 'lead' | 'prospect' | 'active' | 'inactive' | 'archived';
  tags?: string[];
  lead_score_min?: number;
  lead_score_max?: number;
  created_after?: string;
  created_before?: string;
}

export interface ClientStats {
  total_clients: number;
  leads_count: number;
  prospects_count: number;
  active_count: number;
  avg_lead_score: number;
  top_tags: Array<{ tag: string; count: number }>;
}
