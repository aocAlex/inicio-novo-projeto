
-- Criar tabela principal de contratos
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Vinculação com Cliente (busca automática)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  matched_by VARCHAR(20), -- 'document_number', 'email', 'manual' - como foi vinculado
  matching_confidence DECIMAL(3,2) DEFAULT 1.00, -- Confiança da vinculação (0.0 a 1.0)
  
  -- Dados do Contrato (vindos do ZapSign)
  contract_name VARCHAR(255) NOT NULL, -- Nome do documento no ZapSign
  contract_code VARCHAR(100), -- Código/número interno do contrato
  contract_type VARCHAR(100), -- Categoria do contrato
  folder_path VARCHAR(255) DEFAULT '/', -- Pasta no ZapSign
  
  -- Dados ZapSign
  zapsign_open_id INTEGER UNIQUE NOT NULL, -- ID único do ZapSign
  zapsign_token VARCHAR(255) UNIQUE NOT NULL, -- Token do documento
  zapsign_template_token VARCHAR(255), -- Token do template usado
  
  -- Status e Datas
  status VARCHAR(30) NOT NULL, -- 'pending', 'signed', 'rejected', 'expired'
  created_through VARCHAR(50) DEFAULT 'template', -- Como foi criado
  lang VARCHAR(10) DEFAULT 'pt-br',
  
  -- URLs dos Arquivos
  original_file_url TEXT, -- URL do arquivo original
  signed_file_url TEXT, -- URL do arquivo assinado
  extra_docs JSONB DEFAULT '[]', -- Documentos extras
  
  -- Configurações do Documento
  disable_signer_emails BOOLEAN DEFAULT false,
  signed_file_only_finished BOOLEAN DEFAULT false,
  auto_reminder INTEGER DEFAULT 0,
  
  -- Branding
  brand_logo TEXT,
  brand_primary_color VARCHAR(7), -- Cor hex
  
  -- Datas importantes
  zapsign_created_at TIMESTAMPTZ, -- Data de criação no ZapSign
  zapsign_updated_at TIMESTAMPTZ, -- Última atualização no ZapSign
  signed_at TIMESTAMPTZ, -- Data de assinatura
  
  -- Dados do Criador (no ZapSign)
  created_by_email VARCHAR(255),
  
  -- Metadados
  metadata JSONB DEFAULT '{}', -- Metadados extras do ZapSign
  contract_answers JSONB DEFAULT '{}', -- Respostas do formulário
  
  -- Campos de controle interno
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  notes TEXT, -- Observações internas
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de signatários
CREATE TABLE contract_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Identificação ZapSign
  zapsign_token VARCHAR(255) UNIQUE NOT NULL, -- Token do signatário
  external_id VARCHAR(255), -- ID externo se houver
  
  -- Dados Pessoais (vindos do ZapSign)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_country VARCHAR(3) DEFAULT '55',
  phone_number VARCHAR(20),
  
  -- Documentos
  cpf VARCHAR(14), -- CPF limpo
  cnpj VARCHAR(18), -- CNPJ limpo
  rg_number VARCHAR(20),
  
  -- Endereço (das respostas do formulário)
  address_street VARCHAR(255),
  address_number VARCHAR(50),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Dados Profissionais
  profession VARCHAR(100),
  civil_status VARCHAR(50),
  qualification VARCHAR(255), -- Qualificação jurídica
  
  -- Status de Assinatura
  status VARCHAR(20) NOT NULL, -- 'pending', 'signed', 'rejected'
  sign_url TEXT, -- URL para assinatura
  
  -- Configurações de Segurança
  auth_mode VARCHAR(50), -- Modo de autenticação usado
  require_selfie_photo BOOLEAN DEFAULT false,
  require_document_photo BOOLEAN DEFAULT false,
  
  -- Dados de Assinatura
  times_viewed INTEGER DEFAULT 0,
  last_view_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  
  -- URLs de Verificação
  signature_image_url TEXT, -- Imagem da assinatura
  visto_image_url TEXT, -- Imagem do visto
  document_photo_url TEXT, -- Foto do documento
  document_verse_photo_url TEXT, -- Verso do documento
  selfie_photo_url TEXT, -- Selfie
  selfie_photo_url2 TEXT, -- Segunda selfie
  liveness_photo_url TEXT, -- Foto de prova de vida
  
  -- Dados de Acesso
  ip_address INET, -- IP de onde assinou
  geo_latitude DECIMAL(10,8),
  geo_longitude DECIMAL(11,8),
  
  -- Configurações
  lock_name BOOLEAN DEFAULT true,
  lock_email BOOLEAN DEFAULT true,
  lock_phone BOOLEAN DEFAULT true,
  hide_email BOOLEAN DEFAULT false,
  hide_phone BOOLEAN DEFAULT false,
  blank_email BOOLEAN DEFAULT false,
  blank_phone BOOLEAN DEFAULT false,
  
  -- Tentativas de Envio
  resend_attempts JSONB DEFAULT '{"whatsapp": 0, "email": 0, "sms": 0}',
  send_via VARCHAR(20), -- Canal usado para envio
  redirect_link TEXT, -- Link de redirecionamento pós-assinatura
  send_automatic_whatsapp_signed_file BOOLEAN DEFAULT false,
  
  -- Validação de Selfie
  selfie_validation_type VARCHAR(20) DEFAULT 'none',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de logs de webhook
CREATE TABLE contract_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Dados do Webhook
  event_type VARCHAR(50) NOT NULL, -- 'doc_signed', 'doc_rejected', 'doc_viewed', etc.
  zapsign_open_id INTEGER,
  zapsign_token VARCHAR(255),
  
  -- Payload Completo
  raw_payload JSONB NOT NULL, -- JSON completo recebido
  processed_data JSONB, -- Dados processados
  
  -- Status de Processamento
  processing_status VARCHAR(20) DEFAULT 'received', -- 'received', 'processing', 'processed', 'error'
  error_message TEXT,
  processing_attempts INTEGER DEFAULT 0,
  
  -- Dados da Requisição
  webhook_url TEXT,
  execution_mode VARCHAR(20), -- 'production', 'test'
  user_agent TEXT,
  source_ip INET,
  request_headers JSONB,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de histórico
CREATE TABLE contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Tipo de Evento
  event_type VARCHAR(50) NOT NULL, -- 'created', 'signed', 'viewed', 'rejected', 'updated'
  event_description TEXT,
  
  -- Dados do Evento
  old_values JSONB,
  new_values JSONB,
  
  -- Contexto do Signatário (se aplicável)
  signer_id UUID REFERENCES contract_signers(id),
  signer_name VARCHAR(255),
  signer_email VARCHAR(255),
  
  -- Dados Técnicos
  ip_address INET,
  user_agent TEXT,
  
  -- Responsável (se ação manual)
  performed_by UUID REFERENCES profiles(id),
  
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_contracts_workspace_id ON contracts(workspace_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_zapsign_open_id ON contracts(zapsign_open_id);
CREATE INDEX idx_contracts_zapsign_token ON contracts(zapsign_token);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_signed_at ON contracts(signed_at);

CREATE INDEX idx_contract_signers_contract_id ON contract_signers(contract_id);
CREATE INDEX idx_contract_signers_zapsign_token ON contract_signers(zapsign_token);
CREATE INDEX idx_contract_signers_email ON contract_signers(email);
CREATE INDEX idx_contract_signers_cpf ON contract_signers(cpf);
CREATE INDEX idx_contract_signers_cnpj ON contract_signers(cnpj);
CREATE INDEX idx_contract_signers_status ON contract_signers(status);

CREATE INDEX idx_contract_webhook_logs_event_type ON contract_webhook_logs(event_type);
CREATE INDEX idx_contract_webhook_logs_zapsign_open_id ON contract_webhook_logs(zapsign_open_id);
CREATE INDEX idx_contract_webhook_logs_processing_status ON contract_webhook_logs(processing_status);
CREATE INDEX idx_contract_webhook_logs_received_at ON contract_webhook_logs(received_at);

CREATE INDEX idx_contract_history_contract_id ON contract_history(contract_id);
CREATE INDEX idx_contract_history_event_type ON contract_history(event_type);
CREATE INDEX idx_contract_history_event_timestamp ON contract_history(event_timestamp);

-- Funções para buscar clientes
CREATE OR REPLACE FUNCTION find_client_by_document(
  p_workspace_id UUID,
  p_document VARCHAR(18)
) RETURNS TABLE(client_id UUID, confidence DECIMAL(3,2), match_type VARCHAR(20)) AS $$
BEGIN
  -- Remover formatação do documento
  p_document := REGEXP_REPLACE(p_document, '[^0-9]', '', 'g');
  
  -- Buscar por document_number exato
  RETURN QUERY
  SELECT 
    c.id,
    1.00::DECIMAL(3,2) as confidence,
    'document_number'::VARCHAR(20) as match_type
  FROM clients c
  WHERE c.workspace_id = p_workspace_id
    AND REGEXP_REPLACE(COALESCE(c.document_number, ''), '[^0-9]', '', 'g') = p_document
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_client_by_email(
  p_workspace_id UUID,
  p_email VARCHAR(255)
) RETURNS TABLE(client_id UUID, confidence DECIMAL(3,2), match_type VARCHAR(20)) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    0.95::DECIMAL(3,2) as confidence,
    'email'::VARCHAR(20) as match_type
  FROM clients c
  WHERE c.workspace_id = p_workspace_id
    AND LOWER(c.email) = LOWER(p_email)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_client_by_name(
  p_workspace_id UUID,
  p_name VARCHAR(255)
) RETURNS TABLE(client_id UUID, confidence DECIMAL(3,2), match_type VARCHAR(20)) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    0.80::DECIMAL(3,2) as confidence,
    'name_similarity'::VARCHAR(20) as match_type
  FROM clients c
  WHERE c.workspace_id = p_workspace_id
    AND SIMILARITY(LOWER(c.name), LOWER(p_name)) > 0.8
  ORDER BY SIMILARITY(LOWER(c.name), LOWER(p_name)) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;

-- Políticas para contracts
CREATE POLICY "Users can view contracts from their workspaces" 
ON contracts FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update contracts in their workspaces" 
ON contracts FOR UPDATE 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'editor')
  )
);

-- Políticas para contract_signers
CREATE POLICY "Users can view signers from their workspaces" 
ON contract_signers FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Políticas para contract_webhook_logs
CREATE POLICY "Users can view webhook logs from their workspaces" 
ON contract_webhook_logs FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Políticas para contract_history
CREATE POLICY "Users can view contract history from their workspaces" 
ON contract_history FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Habilitar extensão pg_trgm para busca por similaridade se não existir
CREATE EXTENSION IF NOT EXISTS pg_trgm;
