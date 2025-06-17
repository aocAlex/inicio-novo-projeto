
-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  contract_type TEXT,
  contract_value NUMERIC(12,2),
  default_status TEXT NOT NULL DEFAULT 'pending' CHECK (default_status IN ('pending', 'signed', 'rejected', 'expired')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Policy for viewing templates (workspace members)
CREATE POLICY "Users can view contract templates in their workspaces" 
  ON public.contract_templates 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = contract_templates.workspace_id 
      AND (w.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.workspace_members wm 
        WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
      ))
    )
  );

-- Policy for creating templates (workspace members)
CREATE POLICY "Users can create contract templates in their workspaces" 
  ON public.contract_templates 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id 
      AND (w.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.workspace_members wm 
        WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
      ))
    )
  );

-- Policy for updating templates (workspace members)
CREATE POLICY "Users can update contract templates in their workspaces" 
  ON public.contract_templates 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = contract_templates.workspace_id 
      AND (w.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.workspace_members wm 
        WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
      ))
    )
  );

-- Policy for deleting templates (workspace members)
CREATE POLICY "Users can delete contract templates in their workspaces" 
  ON public.contract_templates 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = contract_templates.workspace_id 
      AND (w.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.workspace_members wm 
        WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
      ))
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
