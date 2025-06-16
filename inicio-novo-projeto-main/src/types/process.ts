
export interface Process {
  id: string;
  workspace_id: string;
  title: string;
  process_number: string;
  description: string | null;
  status: 'active' | 'pending' | 'suspended' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  court: string | null;
  judge: string | null;
  assigned_lawyer: string | null;
  case_value: number | null;
  deadline_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessClient {
  id: string;
  process_id: string;
  client_id: string;
  role: 'plaintiff' | 'defendant' | 'witness' | 'other';
  created_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    client_type: 'individual' | 'company';
  };
}

export interface CreateProcessData {
  title: string;
  process_number: string;
  description?: string;
  status?: 'active' | 'pending' | 'suspended' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  court?: string;
  judge?: string;
  assigned_lawyer?: string;
  case_value?: number;
  deadline_date?: string;
}

export interface UpdateProcessData {
  title?: string;
  process_number?: string;
  description?: string;
  status?: 'active' | 'pending' | 'suspended' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  court?: string;
  judge?: string;
  assigned_lawyer?: string;
  case_value?: number;
  deadline_date?: string;
}

export interface ProcessFilters {
  search?: string;
  status?: 'active' | 'pending' | 'suspended' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  court?: string;
  assigned_lawyer?: string;
  deadline_after?: string;
  deadline_before?: string;
}
