-- Add is_personal_workspace column to workspaces table
ALTER TABLE public.workspaces
ADD COLUMN is_personal_workspace BOOLEAN DEFAULT FALSE;

-- Drop trigger and function if they exist to allow recreation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a function to handle new user creation (creates profile and workspace)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    personal_workspace_id UUID;
BEGIN
    -- Create a profile for the new user
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);

    -- Create a personal workspace for the new user
    INSERT INTO public.workspaces (name, created_by, is_personal_workspace)
    VALUES (NEW.email || '''s Workspace', NEW.id, TRUE) -- Using email for name for now, can be updated later
    RETURNING id INTO personal_workspace_id;

    -- Link the personal workspace to the user's profile
    UPDATE public.profiles
    SET current_workspace_id = personal_workspace_id
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS on workspaces table if not already enabled
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to prevent deletion of personal workspaces
DROP POLICY IF EXISTS "Prevent deletion of personal workspaces" ON public.workspaces;
CREATE POLICY "Prevent deletion of personal workspaces"
ON public.workspaces FOR DELETE
USING (
    NOT is_personal_workspace
);
