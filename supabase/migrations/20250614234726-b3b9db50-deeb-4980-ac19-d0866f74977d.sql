
-- Tabela para templates de petição
CREATE TABLE IF NOT EXISTS public.petition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'civil',
  template_content TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para campos dos templates
CREATE TABLE IF NOT EXISTS public.template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.petition_templates(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_options JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  validation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para execuções de petições
CREATE TABLE IF NOT EXISTS public.petition_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.petition_templates(id),
  process_id UUID REFERENCES public.processes(id),
  client_id UUID REFERENCES public.clients(id),
  filled_data JSONB NOT NULL,
  generated_content TEXT,
  final_document_url TEXT,
  webhook_url TEXT,
  webhook_status TEXT DEFAULT 'pending',
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_completed_at TIMESTAMP WITH TIME ZONE,
  webhook_response JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_petition_templates_workspace ON public.petition_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_petition_templates_category ON public.petition_templates(category);
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON public.template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_petition_executions_workspace ON public.petition_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_petition_executions_template ON public.petition_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_petition_executions_process ON public.petition_executions(process_id);

-- RLS Policies
ALTER TABLE public.petition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_executions ENABLE ROW LEVEL SECURITY;

-- Políticas para petition_templates
CREATE POLICY "Users can view templates in their workspace" ON public.petition_templates
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create templates in their workspace" ON public.petition_templates
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update templates in their workspace" ON public.petition_templates
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete templates in their workspace" ON public.petition_templates
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Políticas para template_fields
CREATE POLICY "Users can view template fields" ON public.template_fields
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM public.petition_templates
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage template fields" ON public.template_fields
  FOR ALL USING (
    template_id IN (
      SELECT id FROM public.petition_templates
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Políticas para petition_executions
CREATE POLICY "Users can view executions in their workspace" ON public.petition_executions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create executions in their workspace" ON public.petition_executions
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update executions in their workspace" ON public.petition_executions
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
