export interface Contract {
  id: string;
  workspace_id: string;
  client_id?: string;
  matched_by?: 'document_number' | 'email' | 'manual';
  matching_confidence?: number;
  
  // Dados do Contrato
  contract_name: string;
  contract_code?: string;
  contract_type?: string;
  contract_value?: number;
  folder_path?: string;
  
  // Dados ZapSign
  zapsign_open_id: number;
  zapsign_token: string;
  zapsign_template_token?: string;
  
  // Status e Datas
  status: 'pending' | 'signed' | 'rejected' | 'expired';
  created_through?: string;
  lang?: string;
  
  // URLs dos Arquivos
  original_file_url?: string;
  signed_file_url?: string;
  extra_docs?: any[];
  
  // Configurações
  disable_signer_emails?: boolean;
  signed_file_only_finished?: boolean;
  auto_reminder?: number;
  
  // Branding
  brand_logo?: string;
  brand_primary_color?: string;
  
  // Datas
  zapsign_created_at?: string;
  zapsign_updated_at?: string;
  signed_at?: string;
  created_by_email?: string;
  
  // Metadados
  metadata?: Record<string, any>;
  contract_answers?: Record<string, any>;
  
  // Controle interno
  is_deleted?: boolean;
  deleted_at?: string;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  client?: {
    id: string;
    name: string;
    email?: string;
  };
  signers?: ContractSigner[];
}

export interface ContractSigner {
  id: string;
  contract_id: string;
  workspace_id: string;
  zapsign_token: string;
  external_id?: string;
  
  // Dados Pessoais
  name: string;
  email: string;
  phone_country?: string;
  phone_number?: string;
  
  // Documentos
  cpf?: string;
  cnpj?: string;
  rg_number?: string;
  
  // Endereço
  address_street?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  
  // Dados Profissionais
  profession?: string;
  civil_status?: string;
  qualification?: string;
  
  // Status
  status: 'pending' | 'signed' | 'rejected';
  sign_url?: string;
  
  // Autenticação
  auth_mode?: string;
  require_selfie_photo?: boolean;
  require_document_photo?: boolean;
  
  // Assinatura
  times_viewed?: number;
  last_view_at?: string;
  signed_at?: string;
  
  // URLs de verificação
  signature_image_url?: string;
  visto_image_url?: string;
  document_photo_url?: string;
  document_verse_photo_url?: string;
  selfie_photo_url?: string;
  selfie_photo_url2?: string;
  liveness_photo_url?: string;
  
  // Localização
  ip_address?: string;
  geo_latitude?: number;
  geo_longitude?: number;
  
  created_at: string;
  updated_at: string;
}

export interface ContractWebhookLog {
  id: string;
  workspace_id?: string;
  contract_id?: string;
  event_type: string;
  zapsign_open_id?: number;
  zapsign_token?: string;
  raw_payload: Record<string, any>;
  processed_data?: Record<string, any>;
  processing_status: 'received' | 'processing' | 'processed' | 'error';
  error_message?: string;
  processing_attempts?: number;
  webhook_url?: string;
  execution_mode?: string;
  user_agent?: string;
  source_ip?: string;
  request_headers?: Record<string, any>;
  received_at: string;
  processed_at?: string;
  created_at: string;
}

export interface ContractHistory {
  id: string;
  contract_id: string;
  workspace_id: string;
  event_type: string;
  event_description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  signer_id?: string;
  signer_name?: string;
  signer_email?: string;
  ip_address?: string;
  user_agent?: string;
  performed_by?: string;
  event_timestamp: string;
  created_at: string;
}

export interface ContractFilters {
  search?: string;
  status?: Contract['status'];
  client_id?: string;
  contract_type?: string;
  signed_after?: string;
  signed_before?: string;
  created_after?: string;
  created_before?: string;
}

export interface CreateContractData {
  contract_name: string;
  contract_code?: string;
  contract_type?: string;
  contract_value?: number;
  zapsign_open_id: number;
  zapsign_token: string;
  status: Contract['status'];
  client_id?: string;
  notes?: string;
}

export interface UpdateContractData {
  contract_name?: string;
  contract_code?: string;
  contract_type?: string;
  contract_value?: number;
  status?: Contract['status'];
  client_id?: string;
  notes?: string;
  matched_by?: Contract['matched_by'];
  matching_confidence?: number;
}
