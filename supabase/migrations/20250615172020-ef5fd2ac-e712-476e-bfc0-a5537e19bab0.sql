
-- Remover TODAS as políticas problemáticas que estão causando recursão
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can be added as members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can manage workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;

-- Remover também políticas de workspaces que fazem referência a workspace_members
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;

-- Criar políticas MUITO simples para quebrar a recursão
-- workspace_members: apenas permitir que usuários vejam seus próprios registros
CREATE POLICY "Users can view own membership" ON public.workspace_members
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- workspace_members: permitir inserção onde user_id = auth.uid()
CREATE POLICY "Users can create own membership" ON public.workspace_members
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- workspace_members: permitir owners gerenciarem membros (sem recursão)
CREATE POLICY "Owners can manage members" ON public.workspace_members
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id 
      AND w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id 
      AND w.owner_id = auth.uid()
    )
  );

-- workspaces: política simples sem referência a workspace_members
CREATE POLICY "Users can view owned workspaces" ON public.workspaces
  FOR SELECT 
  TO authenticated
  USING (
    is_public = true OR 
    owner_id = auth.uid()
  );
