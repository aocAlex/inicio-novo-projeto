
-- Adicionar coluna para indicar se um workspace é público
ALTER TABLE public.workspaces 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Criar um workspace padrão público
INSERT INTO public.workspaces (name, description, is_public, owner_id)
VALUES (
  'Workspace Público',
  'Workspace disponível para todos os usuários cadastrados',
  true,
  (SELECT id FROM auth.users LIMIT 1) -- Usar o primeiro usuário como owner
);

-- Atualizar as políticas RLS para permitir acesso a workspaces públicos
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;

CREATE POLICY "Users can view accessible workspaces" ON public.workspaces
  FOR SELECT USING (
    is_public = true OR 
    public.is_workspace_member(id, auth.uid())
  );

-- Criar política para permitir que usuários vejam membros de workspaces públicos
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;

CREATE POLICY "Users can view accessible workspace members" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id 
      AND (w.is_public = true OR public.is_workspace_member(w.id, auth.uid()))
    )
  );

-- Função para adicionar usuário automaticamente ao workspace público
CREATE OR REPLACE FUNCTION public.add_user_to_public_workspaces()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Adicionar o usuário a todos os workspaces públicos como viewer
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  SELECT w.id, NEW.id, 'viewer', 'active'
  FROM public.workspaces w
  WHERE w.is_public = true
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger para adicionar automaticamente novos usuários aos workspaces públicos
DROP TRIGGER IF EXISTS on_profile_created_add_to_public_workspaces ON public.profiles;

CREATE TRIGGER on_profile_created_add_to_public_workspaces
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.add_user_to_public_workspaces();
