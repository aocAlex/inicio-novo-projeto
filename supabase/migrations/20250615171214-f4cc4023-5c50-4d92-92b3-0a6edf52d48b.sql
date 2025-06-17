
-- Remover todas as políticas conflitantes da tabela workspaces
DROP POLICY IF EXISTS "Users can create workspace if they have none" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view accessible workspaces" ON public.workspaces;

-- Criar políticas mais simples e permissivas
-- Permitir que usuários autenticados criem workspaces
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT 
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Permitir que usuários vejam workspaces onde são membros OU workspaces públicos
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
  FOR SELECT 
  TO authenticated
  USING (
    is_public = true OR 
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = id 
      AND wm.user_id = auth.uid() 
      AND wm.status = 'active'
    )
  );

-- Permitir que owners atualizem seus workspaces
CREATE POLICY "Owners can update their workspaces" ON public.workspaces
  FOR UPDATE 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Permitir que owners deletem seus workspaces
CREATE POLICY "Owners can delete their workspaces" ON public.workspaces
  FOR DELETE 
  TO authenticated
  USING (owner_id = auth.uid());

-- Também verificar se precisamos ajustar as políticas da tabela workspace_members
DROP POLICY IF EXISTS "Users can view accessible workspace members" ON public.workspace_members;

CREATE POLICY "Users can view workspace members" ON public.workspace_members
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id 
      AND (
        w.is_public = true OR 
        w.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.workspace_members wm2 
          WHERE wm2.workspace_id = w.id 
          AND wm2.user_id = auth.uid() 
          AND wm2.status = 'active'
        )
      )
    )
  );

-- Permitir que usuários sejam adicionados como membros
CREATE POLICY "Users can be added as members" ON public.workspace_members
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id 
      AND w.owner_id = auth.uid()
    )
  );
