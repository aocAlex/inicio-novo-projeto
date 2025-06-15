
-- 1. Criar tabela simplificada de quotas de usuário
CREATE TABLE public.user_workspace_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_workspaces INTEGER NOT NULL DEFAULT 10,
  current_workspaces INTEGER NOT NULL DEFAULT 0,
  is_unlimited BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  last_modified_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 2. Criar tabela de logs de quota (simplificada)
CREATE TABLE public.user_quota_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL,
  old_value INTEGER,
  new_value INTEGER,
  quota_limit INTEGER,
  workspace_id UUID REFERENCES public.workspaces(id),
  performed_by UUID REFERENCES auth.users(id),
  is_admin_override BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Função para criar quota padrão para novos usuários
CREATE OR REPLACE FUNCTION public.create_default_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar quota padrão para o novo usuário
  INSERT INTO public.user_workspace_quotas (
    user_id,
    max_workspaces,
    current_workspaces
  ) VALUES (
    NEW.id,
    10, -- Quota padrão de 10 workspaces
    1   -- Já tem 1 workspace (a criada automaticamente)
  );
  
  -- Log da criação da quota
  INSERT INTO public.user_quota_logs (
    user_id,
    action_type,
    new_value,
    quota_limit,
    performed_by
  ) VALUES (
    NEW.id,
    'quota_created',
    10,
    10,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para verificar se usuário pode criar workspace
CREATE OR REPLACE FUNCTION public.user_can_create_workspace(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  quota_record RECORD;
BEGIN
  -- Buscar quota do usuário
  SELECT * INTO quota_record
  FROM public.user_workspace_quotas 
  WHERE user_id = p_user_id;
  
  -- Se não tem quota, não pode criar
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Se está suspenso, não pode criar
  IF quota_record.is_suspended THEN
    RETURN false;
  END IF;
  
  -- Se é ilimitado, pode criar
  IF quota_record.is_unlimited THEN
    RETURN true;
  END IF;
  
  -- Verificar se está dentro do limite
  RETURN quota_record.current_workspaces < quota_record.max_workspaces;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Função para atualizar contador de workspaces
CREATE OR REPLACE FUNCTION public.update_workspace_quota_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador ao criar workspace
    UPDATE public.user_workspace_quotas 
    SET current_workspaces = current_workspaces + 1,
        updated_at = now()
    WHERE user_id = NEW.owner_id;
    
    -- Log da criação
    INSERT INTO public.user_quota_logs (
      user_id,
      action_type,
      workspace_id,
      performed_by
    ) VALUES (
      NEW.owner_id,
      'workspace_created',
      NEW.id,
      NEW.owner_id
    );
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador ao deletar workspace
    UPDATE public.user_workspace_quotas 
    SET current_workspaces = GREATEST(0, current_workspaces - 1),
        updated_at = now()
    WHERE user_id = OLD.owner_id;
    
    -- Log da exclusão
    INSERT INTO public.user_quota_logs (
      user_id,
      action_type,
      workspace_id,
      performed_by
    ) VALUES (
      OLD.owner_id,
      'workspace_deleted',
      OLD.id,
      auth.uid()
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para criar quota automática
CREATE TRIGGER on_user_created_quota
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_quota();

-- 7. Trigger para atualizar contador de workspaces
CREATE TRIGGER on_workspace_quota_change
  AFTER INSERT OR DELETE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_workspace_quota_counter();

-- 8. Atualizar política RLS de criação de workspaces
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;

CREATE POLICY "Users can create workspaces within quota" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND 
    public.user_can_create_workspace(auth.uid())
  );

-- 9. RLS para tabela de quotas
ALTER TABLE public.user_workspace_quotas ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas sua própria quota
CREATE POLICY "Users can view their own quota" ON public.user_workspace_quotas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- SuperAdmins podem ver e modificar todas as quotas
CREATE POLICY "SuperAdmins can manage all quotas" ON public.user_workspace_quotas
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 10. RLS para logs de quota
ALTER TABLE public.user_quota_logs ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver logs relacionados a eles
CREATE POLICY "Users can view their quota logs" ON public.user_quota_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR performed_by = auth.uid());

-- SuperAdmins podem ver todos os logs
CREATE POLICY "SuperAdmins can view all quota logs" ON public.user_quota_logs
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- SuperAdmins podem inserir logs
CREATE POLICY "SuperAdmins can create quota logs" ON public.user_quota_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 11. Migração de dados existentes (simplificada)
INSERT INTO public.user_workspace_quotas (user_id, max_workspaces, current_workspaces)
SELECT 
  w.owner_id,
  GREATEST(10, workspace_count) as max_workspaces, -- Pelo menos 10, ou o atual se maior
  workspace_count as current_workspaces
FROM (
  SELECT 
    owner_id, 
    COUNT(*) as workspace_count
  FROM public.workspaces 
  GROUP BY owner_id
) w
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_workspace_quotas q 
  WHERE q.user_id = w.owner_id
);

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_workspace_quotas_user_id ON public.user_workspace_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quota_logs_user_id ON public.user_quota_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quota_logs_action_type ON public.user_quota_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_quota_logs_created_at ON public.user_quota_logs(created_at);
