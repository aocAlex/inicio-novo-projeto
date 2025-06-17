
-- Corrigir constraints de chave estrangeira para permitir exclusão em cascata
-- Isso resolverá o erro: "petition_templates_created_by_fkey"

-- Remover constraint existente e recriar com DELETE CASCADE
ALTER TABLE petition_templates 
DROP CONSTRAINT IF EXISTS petition_templates_created_by_fkey;

ALTER TABLE petition_templates 
ADD CONSTRAINT petition_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fazer o mesmo para outras tabelas que podem ter o mesmo problema
ALTER TABLE processes 
DROP CONSTRAINT IF EXISTS processes_created_by_fkey;

ALTER TABLE processes 
ADD CONSTRAINT processes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE processes 
DROP CONSTRAINT IF EXISTS processes_assigned_lawyer_fkey;

ALTER TABLE processes 
ADD CONSTRAINT processes_assigned_lawyer_fkey 
FOREIGN KEY (assigned_lawyer) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE deadlines 
DROP CONSTRAINT IF EXISTS deadlines_created_by_fkey;

ALTER TABLE deadlines 
ADD CONSTRAINT deadlines_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE deadlines 
DROP CONSTRAINT IF EXISTS deadlines_assigned_to_fkey;

ALTER TABLE deadlines 
ADD CONSTRAINT deadlines_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE petition_executions 
DROP CONSTRAINT IF EXISTS petition_executions_created_by_fkey;

ALTER TABLE petition_executions 
ADD CONSTRAINT petition_executions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE client_interactions 
DROP CONSTRAINT IF EXISTS client_interactions_created_by_fkey;

ALTER TABLE client_interactions 
ADD CONSTRAINT client_interactions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_created_by_fkey;

ALTER TABLE clients 
ADD CONSTRAINT clients_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Para workspaces, usar SET NULL para owner_id quando usuário for excluído
ALTER TABLE workspaces 
DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;

ALTER TABLE workspaces 
ADD CONSTRAINT workspaces_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Para workspace_members, excluir em cascata
ALTER TABLE workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;

ALTER TABLE workspace_members 
ADD CONSTRAINT workspace_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE workspace_members 
DROP CONSTRAINT IF EXISTS workspace_members_invited_by_fkey;

ALTER TABLE workspace_members 
ADD CONSTRAINT workspace_members_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Para profiles, usar CASCADE para manter consistência
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
