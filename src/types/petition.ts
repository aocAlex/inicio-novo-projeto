
export interface PetitionTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string;
  template_content: string;
  is_shared: boolean;
  execution_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  id: string;
  template_id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'phone';
  field_options: Record<string, any>;
  is_required: boolean;
  display_order: number;
  validation_rules: Record<string, any>;
  created_at: string;
}

export interface PetitionExecution {
  id: string;
  workspace_id: string;
  template_id: string;
  process_id: string | null;
  client_id: string | null;
  filled_data: Record<string, any>;
  generated_content: string | null;
  final_document_url: string | null;
  webhook_url: string | null;
  webhook_status: 'pending' | 'sent' | 'completed' | 'failed';
  webhook_sent_at: string | null;
  webhook_completed_at: string | null;
  webhook_response: Record<string, any>;
  retry_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template?: PetitionTemplate;
  process?: {
    id: string;
    title: string;
    process_number: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  template_content: string;
  is_shared?: boolean;
  fields?: Omit<TemplateField, 'id' | 'template_id' | 'created_at'>[];
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: string;
  template_content?: string;
  is_shared?: boolean;
}

export interface CreateExecutionData {
  template_id: string;
  process_id?: string;
  client_id?: string;
  filled_data: Record<string, any>;
  webhook_url?: string;
}

export interface PetitionFilters {
  search?: string;
  category?: string;
  is_shared?: boolean;
  created_by?: string;
}

export interface ExecutionFilters {
  search?: string;
  template_id?: string;
  process_id?: string;
  client_id?: string;
  webhook_status?: string;
  date_from?: string;
  date_to?: string;
}
