
export interface PetitionTemplate {
  id: string
  workspace_id: string
  name: string
  description: string | null
  category: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
  template_content: string
  is_shared: boolean
  execution_count: number
  webhook_url: string | null
  webhook_enabled: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Relacionamentos opcionais
  fields?: TemplateField[]
}

export interface TemplateField {
  id: string
  template_id: string
  field_key: string
  field_label: string
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'email' | 'phone' | 'cpf' | 'cnpj' | 'cep' | 'currency' | 'percentage' | 'oab' | 'processo_numero'
  field_options: Record<string, any>
  is_required: boolean
  display_order: number
  validation_rules: Record<string, any>
  created_at: string
}

export interface CreateTemplateData {
  name: string
  description?: string
  category: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
  template_content: string
  is_shared?: boolean
  webhook_url?: string
  webhook_enabled?: boolean
  fields?: Omit<TemplateField, 'id' | 'template_id' | 'created_at'>[]
}

export interface UpdateTemplateData {
  name?: string
  description?: string
  category?: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
  template_content?: string
  is_shared?: boolean
  webhook_url?: string
  webhook_enabled?: boolean
  fields?: Omit<TemplateField, 'id' | 'template_id' | 'created_at'>[]
}

export interface TemplateFilters {
  search?: string
  category?: string
  is_shared?: boolean
  created_by?: string
}

export interface TemplateExecution {
  id: string
  template_id: string
  workspace_id: string
  filled_data: Record<string, any>
  generated_content: string | null
  client_id: string | null
  process_id: string | null
  webhook_url: string | null
  webhook_status: 'pending' | 'sent' | 'completed' | 'failed' | null
  webhook_sent_at: string | null
  webhook_completed_at: string | null
  webhook_response: Record<string, any> | null
  retry_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Relacionamentos opcionais
  template?: Pick<PetitionTemplate, 'id' | 'name'>
  client?: { id: string; name: string }
  process?: { id: string; title: string; process_number: string }
}

export interface TemplatePreview {
  original_content: string
  preview_content: string
  missing_fields: string[]
  filled_fields: Record<string, any>
  orphan_variables?: string[]
}

export interface FieldValidationError {
  field: string
  message: string
}
