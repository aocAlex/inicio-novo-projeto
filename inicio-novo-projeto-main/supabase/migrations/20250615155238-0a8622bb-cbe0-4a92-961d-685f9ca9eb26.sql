
-- Criar tabela de super administradores
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  
  -- Permissões
  can_create_workspaces BOOLEAN DEFAULT true,
  can_delete_workspaces BOOLEAN DEFAULT false,
  can_access_workspaces BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT true,
  can_view_analytics BOOLEAN DEFAULT true,
  can_modify_system_settings BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Configurações
  notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}'
);

-- Criar tabela de logs de atividade do super admin
CREATE TABLE public.super_admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES super_admins(id) ON DELETE CASCADE,
  
  -- Ação Realizada
  action_type VARCHAR(50) NOT NULL,
  action_description TEXT NOT NULL,
  
  -- Contexto da Ação
  target_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dados da Ação
  old_values JSONB,
  new_values JSONB,
  
  -- Dados da Requisição
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Metadados
  severity VARCHAR(20) DEFAULT 'info',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de configurações do sistema
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configuração
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type VARCHAR(20) NOT NULL,
  
  -- Metadados
  description TEXT,
  category VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_by UUID REFERENCES super_admins(id),
  updated_by UUID REFERENCES super_admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar view para analytics de workspaces
CREATE VIEW public.workspace_analytics AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  w.created_at as workspace_created_at,
  w.updated_at as workspace_updated_at,
  
  -- Contagem de Membros
  COUNT(DISTINCT wm.user_id) as total_members,
  COUNT(DISTINCT CASE WHEN wm.role = 'owner' THEN wm.user_id END) as owners_count,
  COUNT(DISTINCT CASE WHEN wm.role = 'admin' THEN wm.user_id END) as admins_count,
  
  -- Contagem de Dados
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT p.id) as total_processes,
  COUNT(DISTINCT pt.id) as total_templates,
  COUNT(DISTINCT pe.id) as total_executions,
  
  -- Atividade Recente (últimos 30 dias)
  COUNT(DISTINCT CASE 
    WHEN ua.created_at > NOW() - INTERVAL '30 days' 
    THEN ua.id 
  END) as recent_activities,
  
  -- Última Atividade
  MAX(ua.created_at) as last_activity,
  
  -- Status
  CASE 
    WHEN MAX(ua.created_at) > NOW() - INTERVAL '7 days' THEN 'active'
    WHEN MAX(ua.created_at) > NOW() - INTERVAL '30 days' THEN 'idle'
    ELSE 'inactive'
  END as activity_status

FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
LEFT JOIN clients c ON w.id = c.workspace_id
LEFT JOIN processes p ON w.id = p.workspace_id
LEFT JOIN petition_templates pt ON w.id = pt.workspace_id
LEFT JOIN petition_executions pe ON w.id = pe.workspace_id
LEFT JOIN user_activities ua ON w.id = ua.workspace_id
GROUP BY w.id, w.name, w.created_at, w.updated_at;

-- Criar índices para performance
CREATE INDEX idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX idx_super_admins_email ON super_admins(email);
CREATE INDEX idx_super_admins_is_active ON super_admins(is_active);

CREATE INDEX idx_super_admin_logs_admin_id ON super_admin_activity_logs(super_admin_id);
CREATE INDEX idx_super_admin_logs_action_type ON super_admin_activity_logs(action_type);
CREATE INDEX idx_super_admin_logs_created_at ON super_admin_activity_logs(created_at);
CREATE INDEX idx_super_admin_logs_workspace_id ON super_admin_activity_logs(target_workspace_id);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_is_public ON system_settings(is_public);

-- Funções para verificação de super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.super_admins sa
    WHERE sa.user_id = $1
    AND sa.is_active = true
  );
$$;

-- Função para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.has_super_admin_permission(
  user_id UUID, 
  permission_name TEXT
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  has_permission BOOLEAN := false;
BEGIN
  SELECT 
    CASE permission_name
      WHEN 'create_workspaces' THEN sa.can_create_workspaces
      WHEN 'delete_workspaces' THEN sa.can_delete_workspaces
      WHEN 'access_workspaces' THEN sa.can_access_workspaces
      WHEN 'manage_users' THEN sa.can_manage_users
      WHEN 'view_analytics' THEN sa.can_view_analytics
      WHEN 'modify_system_settings' THEN sa.can_modify_system_settings
      ELSE false
    END INTO has_permission
  FROM public.super_admins sa
  WHERE sa.user_id = $1 AND sa.is_active = true;
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para super_admins
CREATE POLICY "Super admins can view themselves" ON public.super_admins
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage super admins" ON public.super_admins
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Políticas RLS para logs
CREATE POLICY "Super admins can view all logs" ON public.super_admin_activity_logs
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert logs" ON public.super_admin_activity_logs
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

-- Políticas RLS para configurações do sistema
CREATE POLICY "Super admins can view system settings" ON public.system_settings
  FOR SELECT USING (
    is_public = true OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    public.has_super_admin_permission(auth.uid(), 'modify_system_settings')
  );

-- Inserir configurações iniciais do sistema
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
('max_workspaces_per_user', '5', 'number', 'Máximo de workspaces que um usuário pode criar', 'limits', false),
('maintenance_mode', 'false', 'boolean', 'Modo de manutenção do sistema', 'system', false),
('max_upload_size_mb', '10', 'number', 'Tamanho máximo de upload em MB', 'limits', true),
('session_timeout_minutes', '480', 'number', 'Timeout da sessão em minutos', 'security', false),
('enable_signup', 'true', 'boolean', 'Permitir novos cadastros', 'features', true);
