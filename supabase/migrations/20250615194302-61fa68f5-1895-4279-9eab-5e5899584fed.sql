
-- Criar tabela para campos personalizados dos templates
CREATE TABLE IF NOT EXISTS public.template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.petition_templates(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_title TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'checkbox', 'email', 'phone', 'cpf', 'cnpj')),
  default_value TEXT,
  field_description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  field_options JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir que a combinação template_id + field_key seja única
  UNIQUE(template_id, field_key),
  -- Garantir que a combinação template_id + field_title seja única
  UNIQUE(template_id, field_title)
);

-- Criar tabela para valores preenchidos nas petições
CREATE TABLE IF NOT EXISTS public.petition_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.petition_executions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.template_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir que cada campo só tenha um valor por execução
  UNIQUE(execution_id, field_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id ON public.template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_display_order ON public.template_fields(template_id, display_order);
CREATE INDEX IF NOT EXISTS idx_petition_field_values_execution_id ON public.petition_field_values(execution_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_petition_field_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_petition_field_values_updated_at
  BEFORE UPDATE ON public.petition_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_petition_field_values_updated_at();

-- Adicionar políticas RLS
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_field_values ENABLE ROW LEVEL SECURITY;

-- RLS para template_fields - usuários podem ver campos de templates do seu workspace
CREATE POLICY "Users can view template fields from their workspace" 
  ON public.template_fields 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.petition_templates pt 
      WHERE pt.id = template_fields.template_id 
      AND pt.workspace_id IN (
        SELECT w.id FROM public.workspaces w 
        WHERE w.owner_id = auth.uid()
        UNION
        SELECT wm.workspace_id FROM public.workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

-- RLS para template_fields - usuários podem inserir/atualizar campos em templates do seu workspace
CREATE POLICY "Users can manage template fields from their workspace" 
  ON public.template_fields 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.petition_templates pt 
      WHERE pt.id = template_fields.template_id 
      AND pt.workspace_id IN (
        SELECT w.id FROM public.workspaces w 
        WHERE w.owner_id = auth.uid()
        UNION
        SELECT wm.workspace_id FROM public.workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

-- RLS para petition_field_values - usuários podem ver valores de execuções do seu workspace
CREATE POLICY "Users can view petition field values from their workspace" 
  ON public.petition_field_values 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.petition_executions pe 
      WHERE pe.id = petition_field_values.execution_id 
      AND pe.workspace_id IN (
        SELECT w.id FROM public.workspaces w 
        WHERE w.owner_id = auth.uid()
        UNION
        SELECT wm.workspace_id FROM public.workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );

-- RLS para petition_field_values - usuários podem inserir/atualizar valores em execuções do seu workspace
CREATE POLICY "Users can manage petition field values from their workspace" 
  ON public.petition_field_values 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.petition_executions pe 
      WHERE pe.id = petition_field_values.execution_id 
      AND pe.workspace_id IN (
        SELECT w.id FROM public.workspaces w 
        WHERE w.owner_id = auth.uid()
        UNION
        SELECT wm.workspace_id FROM public.workspace_members wm 
        WHERE wm.user_id = auth.uid()
      )
    )
  );
