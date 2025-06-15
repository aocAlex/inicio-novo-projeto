
export interface PetitionTemplate {
  id: string
  workspace_id: string
  name: string
  description?: string
  category: 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
  template_content: string // Conteúdo com variáveis {{}}
  is_shared: boolean
  execution_count: number
  created_by: string
  created_at: string
  updated_at: string
  
  // Relacionamentos
  fields?: TemplateField[]
  creator?: {
    id: string
    full_name: string
    email: string
  }
}

export interface TemplateField {
  id: string
  template_id: string
  field_key: string // cliente_nome, processo_numero
  field_label: string // "Nome do Cliente"
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'cpf' | 'cnpj' | 'email' | 'phone' | 'oab' | 'processo_numero' | 'cep' | 'rg' | 'currency' | 'percentage'
  field_options: {
    placeholder?: string
    options?: string[] // Para select/radio
    min?: number
    max?: number
    maxLength?: number
    pattern?: string
    helpText?: string
    tooltip?: string
    icon?: string
    defaultValue?: any
    autoComplete?: boolean
    dependsOn?: string[] // Dependência de outros campos
    calculation?: string // Fórmula para cálculos automáticos
  }
  is_required: boolean
  display_order: number
  validation_rules: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: string
    custom?: string
    min?: number
    max?: number
  }
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
  fields: Omit<TemplateField, 'id' | 'template_id' | 'created_at'>[]
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  updated_at?: string
}

export interface TemplateExecution {
  id: string
  template_id: string
  filled_data: Record<string, any> // Dados preenchidos pelo usuário
  generated_content: string // Petição final gerada
  client_id?: string
  process_id?: string
  webhook_status?: 'pending' | 'sent' | 'completed' | 'failed'
  webhook_url?: string
  webhook_response?: any
  retry_count: number
  created_by: string
  created_at: string
  
  // Relacionamentos
  template?: PetitionTemplate
  client?: {
    id: string
    name: string
    email?: string
    document_number?: string
  }
  process?: {
    id: string
    title: string
    process_number: string
  }
}

export interface TemplatePreview {
  original_content: string
  preview_content: string
  missing_fields: string[]
  filled_fields: Record<string, any>
  orphan_variables: string[] // Variáveis sem campo definido
}

export interface FieldValidationError {
  field_key: string
  field_label: string
  message: string
}

export interface TemplateFilters {
  search?: string
  category?: string
  is_shared?: boolean
  created_by?: string
}

export interface FieldBuilderItem {
  type: TemplateField['field_type']
  label: string
  icon: string
  description: string
  defaultConfig: Partial<TemplateField>
}

// Tipos para o sistema de webhook
export interface WebhookPayload {
  event: 'petition_executed' | 'template_created' | 'template_updated'
  timestamp: string
  workspace: {
    id: string
    name: string
    owner_email?: string
  }
  template: {
    id: string
    name: string
    category: string
    version?: string
  }
  execution?: {
    id: string
    execution_date: string
    executed_by: {
      id: string
      name: string
      email: string
    }
  }
  client?: any
  process?: any
  filled_data?: Record<string, any>
  generated_content?: {
    raw_text: string
    formatted_html?: string
    metadata: {
      word_count: number
      pages_estimated: number
      processing_time_ms: number
    }
  }
  attachments?: Array<{
    name: string
    url: string
    size_bytes: number
    type: string
  }>
}
