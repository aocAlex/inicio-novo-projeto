
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.process_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles - usuários podem ver/editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para workspaces - apenas membros podem ver workspaces
CREATE POLICY "Members can view workspaces" ON public.workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspaces.id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Owners can update workspaces" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Políticas para workspace_members - membros podem ver outros membros do mesmo workspace
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id 
      AND wm2.user_id = auth.uid() 
      AND wm2.status = 'active'
    )
  );

CREATE POLICY "Admins can manage members" ON public.workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id 
      AND wm2.user_id = auth.uid() 
      AND wm2.role IN ('owner', 'admin')
      AND wm2.status = 'active'
    )
  );

CREATE POLICY "Users can join workspace" ON public.workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para workspace_invitations
CREATE POLICY "Members can view invitations" ON public.workspace_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspace_invitations.workspace_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage invitations" ON public.workspace_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspace_invitations.workspace_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Políticas para workspace_webhooks
CREATE POLICY "Members can view webhooks" ON public.workspace_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspace_webhooks.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage webhooks" ON public.workspace_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = workspace_webhooks.workspace_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Políticas para clients - apenas membros do workspace podem acessar
CREATE POLICY "Members can view clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = clients.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Members can manage clients" ON public.clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = clients.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Políticas para processes - apenas membros do workspace podem acessar
CREATE POLICY "Members can view processes" ON public.processes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = processes.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Members can manage processes" ON public.processes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = processes.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Políticas para process_clients - baseado no processo
CREATE POLICY "Members can view process clients" ON public.process_clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.processes p
      JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = process_clients.process_id 
      AND wm.user_id = auth.uid() 
      AND wm.status = 'active'
    )
  );

CREATE POLICY "Members can manage process clients" ON public.process_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.processes p
      JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = process_clients.process_id 
      AND wm.user_id = auth.uid() 
      AND wm.status = 'active'
    )
  );

-- Políticas para user_activities - apenas membros do workspace podem acessar
CREATE POLICY "Members can view activities" ON public.user_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = user_activities.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create activities" ON public.user_activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = user_activities.workspace_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );
