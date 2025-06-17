
-- Tabela principal para deadlines
CREATE TABLE public.deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Vinculações
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.petition_templates(id) ON DELETE SET NULL,
  
  -- Dados do Prazo
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline_type VARCHAR(50) NOT NULL, -- 'processual', 'administrativo', 'contratual', 'fiscal', 'personalizado'
  
  -- Datas
  due_date DATE NOT NULL,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_date DATE,
  
  -- Configurações
  business_days_only BOOLEAN DEFAULT true,
  anticipation_days INTEGER DEFAULT 7,
  is_critical BOOLEAN DEFAULT false,
  
  -- Responsabilidade
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDENTE', -- 'PENDENTE', 'EM_ANDAMENTO', 'CUMPRIDO', 'PERDIDO', 'SUSPENSO'
  priority VARCHAR(10) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  
  -- Metadados
  completion_notes TEXT,
  attachments JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_deadlines_workspace_id ON public.deadlines(workspace_id);
CREATE INDEX idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX idx_deadlines_status ON public.deadlines(status);
CREATE INDEX idx_deadlines_assigned_to ON public.deadlines(assigned_to);
CREATE INDEX idx_deadlines_process_id ON public.deadlines(process_id);

-- Tabela para notificações de prazos
CREATE TABLE public.deadline_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id UUID NOT NULL REFERENCES public.deadlines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Configuração da Notificação
  days_before INTEGER NOT NULL, -- 30, 15, 7, 3, 1, 0
  notification_type VARCHAR(20) NOT NULL, -- 'email', 'in_app', 'whatsapp', 'sms'
  
  -- Status
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Conteúdo
  subject VARCHAR(255),
  message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX idx_deadline_notifications_deadline_id ON public.deadline_notifications(deadline_id);
CREATE INDEX idx_deadline_notifications_recipient_id ON public.deadline_notifications(recipient_id);
CREATE INDEX idx_deadline_notifications_is_sent ON public.deadline_notifications(is_sent);

-- Tabela para configurações do calendário do workspace
CREATE TABLE public.workspace_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Configurações de Feriados
  state_holidays JSONB DEFAULT '[]', -- Lista de feriados estaduais
  city_holidays JSONB DEFAULT '[]', -- Lista de feriados municipais
  custom_holidays JSONB DEFAULT '[]', -- Feriados personalizados
  
  -- Configurações de Recesso
  december_recess_start DATE DEFAULT '2024-12-20',
  december_recess_end DATE DEFAULT '2025-01-06',
  july_recess_start DATE DEFAULT '2024-07-01',
  july_recess_end DATE DEFAULT '2024-07-31',
  
  -- Configurações Padrão
  default_anticipation_days INTEGER DEFAULT 7,
  work_days JSONB DEFAULT '[1,2,3,4,5]', -- Segunda a sexta
  
  -- Notificações
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_whatsapp_notifications BOOLEAN DEFAULT false,
  notification_time TIME DEFAULT '09:00:00',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para histórico de ações nos prazos
CREATE TABLE public.deadline_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id UUID NOT NULL REFERENCES public.deadlines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Ação Realizada
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'completed', 'delayed', 'assigned', 'commented'
  old_values JSONB,
  new_values JSONB,
  
  -- Responsável
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para histórico
CREATE INDEX idx_deadline_history_deadline_id ON public.deadline_history(deadline_id);
CREATE INDEX idx_deadline_history_performed_by ON public.deadline_history(performed_by);

-- RLS Policies para deadlines
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deadlines from their workspaces" 
ON public.deadlines FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create deadlines in their workspaces" 
ON public.deadlines FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Users can update deadlines in their workspaces" 
ON public.deadlines FOR UPDATE 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Users can delete deadlines in their workspaces" 
ON public.deadlines FOR DELETE 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- RLS Policies para deadline_notifications
ALTER TABLE public.deadline_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications from their workspaces" 
ON public.deadline_notifications FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create notifications in their workspaces" 
ON public.deadline_notifications FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies para workspace_calendar_settings
ALTER TABLE public.workspace_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar settings from their workspaces" 
ON public.workspace_calendar_settings FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage calendar settings in their workspaces" 
ON public.workspace_calendar_settings FOR ALL 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- RLS Policies para deadline_history
ALTER TABLE public.deadline_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deadline history from their workspaces" 
ON public.deadline_history FOR SELECT 
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create deadline history in their workspaces" 
ON public.deadline_history FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Função para calcular dias úteis (com nome de variável corrigido)
CREATE OR REPLACE FUNCTION public.add_business_days(start_date DATE, business_days INTEGER)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  calc_date DATE := start_date;
  days_added INTEGER := 0;
BEGIN
  WHILE days_added < business_days LOOP
    calc_date := calc_date + INTERVAL '1 day';
    -- Pular fins de semana (1 = domingo, 7 = sábado)
    IF EXTRACT(DOW FROM calc_date) NOT IN (1, 7) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  
  RETURN calc_date;
END;
$$;

-- Função para verificar se é dia útil
CREATE OR REPLACE FUNCTION public.is_business_day(check_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se não é fim de semana
  IF EXTRACT(DOW FROM check_date) IN (1, 7) THEN
    RETURN FALSE;
  END IF;
  
  -- Aqui poderia adicionar verificação de feriados
  -- Por enquanto, só verifica fins de semana
  
  RETURN TRUE;
END;
$$;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_deadlines_updated_at
  BEFORE UPDATE ON public.deadlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_calendar_settings_updated_at
  BEFORE UPDATE ON public.workspace_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
