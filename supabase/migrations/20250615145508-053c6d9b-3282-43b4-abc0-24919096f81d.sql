
-- Primeiro, remover políticas conflitantes se existirem
DROP POLICY IF EXISTS "Users can create workspace if they have none" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;

-- Criar função security definer para verificar se usuário é membro ativo de um workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = p_workspace_id 
    AND user_id = p_user_id 
    AND status = 'active'
  );
$$;

-- Adicionar política para permitir que usuários criem workspaces quando não têm nenhuma
CREATE POLICY "Users can create workspace if they have none" ON public.workspaces
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

-- Adicionar política para permitir que usuários vejam suas próprias workspaces
CREATE POLICY "Users can view their own workspaces" ON public.workspaces
  FOR SELECT USING (
    public.is_workspace_member(id, auth.uid())
  );

-- Adicionar política para permitir que owners atualizem suas workspaces
CREATE POLICY "Owners can update their workspaces" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());
