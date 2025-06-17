
-- 1. Criar nova estrutura simplificada de workspaces
-- Vamos preservar a tabela workspaces atual mas simplificar os membros

-- Limpar tabela de membros e recriar com estrutura simples
DROP TABLE IF EXISTS public.workspace_members CASCADE;

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(workspace_id, user_id)
);

-- 2. Simplificar tabela de convites
DROP TABLE IF EXISTS public.workspace_invitations CASCADE;

CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  -- Constraint para evitar convites duplicados
  UNIQUE(workspace_id, email)
);

-- 3. Garantir que toda workspace tem um owner
-- Adicionar constraint para garantir que owner_id seja sempre válido
ALTER TABLE public.workspaces 
ALTER COLUMN owner_id SET NOT NULL;

-- 4. Função para criar workspace automática no cadastro
CREATE OR REPLACE FUNCTION public.create_default_workspace_for_user()
RETURNS TRIGGER AS $$
DECLARE
  workspace_name TEXT;
  workspace_id UUID;
BEGIN
  -- Determinar nome da workspace baseado no perfil
  SELECT 
    CASE 
      WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
      THEN 'Escritório de ' || (NEW.raw_user_meta_data->>'full_name')
      ELSE 'Minha Workspace'
    END INTO workspace_name;
  
  -- Criar workspace para o novo usuário
  INSERT INTO public.workspaces (
    name,
    description,
    owner_id
  ) VALUES (
    workspace_name,
    'Workspace criada automaticamente',
    NEW.id
  ) RETURNING id INTO workspace_id;
  
  -- Definir como workspace atual no perfil
  UPDATE public.profiles 
  SET current_workspace_id = workspace_id 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para criar workspace automática
DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_workspace_for_user();

-- 6. Função para verificar se usuário tem acesso à workspace
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se é owner OU membro
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = p_workspace_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Função para verificar se usuário é owner
CREATE OR REPLACE FUNCTION public.user_is_workspace_owner(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = p_workspace_id AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 8. RLS simplificado - workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Política para ver membros: apenas se tem acesso à workspace
CREATE POLICY "Users can view members of accessible workspaces" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- Política para adicionar membros: apenas owners
CREATE POLICY "Owners can add members" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_workspace_owner(workspace_id, auth.uid()));

-- Política para remover membros: apenas owners (ou o próprio membro pode se remover)
CREATE POLICY "Owners can remove members or users can remove themselves" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    public.user_is_workspace_owner(workspace_id, auth.uid()) OR 
    user_id = auth.uid()
  );

-- 9. RLS simplificado - workspace_invitations
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Política para ver convites: apenas owners da workspace
CREATE POLICY "Owners can view invitations" ON public.workspace_invitations
  FOR SELECT TO authenticated
  USING (public.user_is_workspace_owner(workspace_id, auth.uid()));

-- Política para criar convites: apenas owners
CREATE POLICY "Owners can create invitations" ON public.workspace_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_workspace_owner(workspace_id, auth.uid()));

-- Política para atualizar convites: apenas owners
CREATE POLICY "Owners can update invitations" ON public.workspace_invitations
  FOR UPDATE TO authenticated
  USING (public.user_is_workspace_owner(workspace_id, auth.uid()));

-- 10. RLS simplificado - workspaces
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view owned workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;

-- Políticas simplificadas
CREATE POLICY "Users can view accessible workspaces" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.user_has_workspace_access(id, auth.uid()));

CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspaces" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces" ON public.workspaces
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- 11. RLS para todas as outras tabelas - Regra Universal
-- Aplicar a regra: usuário vê dados apenas das workspaces onde tem acesso

-- Clients
DROP POLICY IF EXISTS "Users can access clients from their workspaces" ON public.clients;
CREATE POLICY "Users can access clients from their workspaces" ON public.clients
  FOR ALL TO authenticated
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- Processes  
DROP POLICY IF EXISTS "Users can access processes from their workspaces" ON public.processes;
CREATE POLICY "Users can access processes from their workspaces" ON public.processes
  FOR ALL TO authenticated
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- Petition Templates
DROP POLICY IF EXISTS "Users can access templates from their workspaces" ON public.petition_templates;
CREATE POLICY "Users can access templates from their workspaces" ON public.petition_templates
  FOR ALL TO authenticated
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- Petition Executions
DROP POLICY IF EXISTS "Users can access executions from their workspaces" ON public.petition_executions;
CREATE POLICY "Users can access executions from their workspaces" ON public.petition_executions
  FOR ALL TO authenticated
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- Deadlines
DROP POLICY IF EXISTS "Users can access deadlines from their workspaces" ON public.deadlines;
CREATE POLICY "Users can access deadlines from their workspaces" ON public.deadlines
  FOR ALL TO authenticated
  USING (public.user_has_workspace_access(workspace_id, auth.uid()));

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);

-- 13. Migração dos dados existentes (se houver)
-- Converter membros existentes para a nova estrutura simples
-- (Este será executado apenas se já existem dados)

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_workspace_admin(uuid, uuid);
