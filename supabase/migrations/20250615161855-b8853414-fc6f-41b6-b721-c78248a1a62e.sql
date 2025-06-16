
-- Primeiro, vamos temporariamente remover a constraint de foreign key
ALTER TABLE public.super_admins DROP CONSTRAINT IF EXISTS super_admins_user_id_fkey;

-- Adicionar uma constraint que permite NULL ou UUID válido
ALTER TABLE public.super_admins ALTER COLUMN user_id DROP NOT NULL;

-- Agora inserir o super admin com user_id NULL
INSERT INTO public.super_admins (
  user_id,
  email,
  can_create_workspaces,
  can_delete_workspaces,
  can_access_workspaces,
  can_manage_users,
  can_view_analytics,
  can_modify_system_settings,
  is_active,
  created_at,
  updated_at
) VALUES (
  NULL, -- Usar NULL ao invés de UUID inválido
  'alexaocoliveira@gmail.com',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  can_create_workspaces = true,
  can_delete_workspaces = true,
  can_access_workspaces = true,
  can_manage_users = true,
  can_view_analytics = true,
  can_modify_system_settings = true,
  is_active = true,
  updated_at = now();

-- Criar função para associar super admin quando usuário se cadastrar
CREATE OR REPLACE FUNCTION public.handle_super_admin_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verificar se existe um registro de super admin com este email
  UPDATE public.super_admins 
  SET user_id = NEW.id,
      updated_at = now()
  WHERE email = NEW.email 
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger para associar super admin ao fazer signup
DROP TRIGGER IF EXISTS on_auth_user_created_handle_super_admin ON public.profiles;

CREATE TRIGGER on_auth_user_created_handle_super_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_super_admin_signup();

-- Recriar a foreign key constraint mas permitindo NULL
ALTER TABLE public.super_admins 
ADD CONSTRAINT super_admins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
