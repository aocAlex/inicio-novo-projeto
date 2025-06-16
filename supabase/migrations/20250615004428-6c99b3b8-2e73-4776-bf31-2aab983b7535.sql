
-- Create client_interactions table
CREATE TABLE public.client_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'note', 'task', 'document')),
  subject TEXT NOT NULL,
  description TEXT,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_field_definitions table
CREATE TABLE public.custom_field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'select', 'checkbox', 'email', 'phone', 'cpf', 'cnpj')),
  field_options JSONB DEFAULT '{}'::jsonb,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) policies for client_interactions
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for client_interactions
CREATE POLICY "Users can view interactions in their workspace" 
  ON public.client_interactions 
  FOR SELECT 
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create interactions in their workspace" 
  ON public.client_interactions 
  FOR INSERT 
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update interactions in their workspace" 
  ON public.client_interactions 
  FOR UPDATE 
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete interactions in their workspace" 
  ON public.client_interactions 
  FOR DELETE 
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Add Row Level Security (RLS) policies for custom_field_definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- Policies for custom_field_definitions
CREATE POLICY "Users can view custom fields in their workspace" 
  ON public.custom_field_definitions 
  FOR SELECT 
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create custom fields in their workspace" 
  ON public.custom_field_definitions 
  FOR INSERT 
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update custom fields in their workspace" 
  ON public.custom_field_definitions 
  FOR UPDATE 
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete custom fields in their workspace" 
  ON public.custom_field_definitions 
  FOR DELETE 
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_client_interactions_workspace_id ON public.client_interactions(workspace_id);
CREATE INDEX idx_client_interactions_client_id ON public.client_interactions(client_id);
CREATE INDEX idx_client_interactions_interaction_date ON public.client_interactions(interaction_date);
CREATE INDEX idx_custom_field_definitions_workspace_id ON public.custom_field_definitions(workspace_id);
CREATE INDEX idx_custom_field_definitions_display_order ON public.custom_field_definitions(display_order);
