
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
  created_after?: string;
  created_before?: string;
}
