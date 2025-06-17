-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_workspace(text, text, text); -- Include parameter types for dropping
DROP FUNCTION IF EXISTS public.delete_workspace(uuid); -- Include parameter types for dropping
-- Also drop the duplicate workspace creation trigger and function if they might still exist
DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
DROP FUNCTION IF EXISTS public.create_default_workspace_for_user();


-- Alter tables to add new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS max_workspaces INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;


-- Create or replace functions

-- Function to handle new user creation (only creates profile now)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create a profile for the new user
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a workspace for a user with limit check
CREATE OR REPLACE FUNCTION public.create_user_workspace(
    workspace_name text,
    workspace_description text DEFAULT null,
    workspace_logo_url text DEFAULT null
)
RETURNS public.workspaces -- Return the newly created workspace row
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's permissions (typically database owner)
AS $$
DECLARE
    user_id uuid := auth.uid();
    user_max_workspaces integer;
    current_workspace_count integer;
    new_workspace_row public.workspaces;
BEGIN
    -- Get the user's workspace limit from the profiles table
    SELECT max_workspaces INTO user_max_workspaces
    FROM public.profiles
    WHERE id = user_id;

    -- Count the number of workspaces owned by the user
    SELECT count(*) INTO current_workspace_count
    FROM public.workspaces
    WHERE owner_id = user_id;

    -- Check if the user has reached their limit
    IF current_workspace_count >= user_max_workspaces THEN
        RAISE EXCEPTION 'Limite de workspaces atingido. Você pode ter no máximo % workspaces. Contate o administrador para aumentar seu limite.', user_max_workspaces; -- Updated message
    END IF;

    -- Create the new workspace
    INSERT INTO public.workspaces (name, description, logo_url, owner_id, is_active) -- Include is_active
    VALUES (workspace_name, workspace_description, workspace_logo_url, user_id, TRUE) -- Set is_active to TRUE
    RETURNING * INTO new_workspace_row; -- Return the created row

    -- Add the user as the owner member of the new workspace
    -- Based on schema, workspace_members has id, workspace_id, user_id, invited_by, joined_at, created_at, updated_at
    INSERT INTO public.workspace_members (workspace_id, user_id) -- Corrected to user_id, removed role/status
    VALUES (new_workspace_row.id, user_id);

    -- Update the user's current_workspace_id to the new workspace
    UPDATE public.profiles
    SET current_workspace_id = new_workspace_row.id
    WHERE id = user_id;

    RETURN new_workspace_row;
END;
$$;

-- Function to delete a workspace
CREATE OR REPLACE FUNCTION public.delete_workspace(workspace_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's permissions (typically database owner)
AS $$
DECLARE
    workspace_owner_id uuid;
BEGIN
    -- Get the owner_id of the workspace
    SELECT owner_id INTO workspace_owner_id
    FROM public.workspaces
    WHERE id = workspace_id_to_delete;

    -- Check if the workspace exists and the current user is the owner
    IF workspace_owner_id IS NULL THEN
        RAISE EXCEPTION 'Workspace with ID % not found.', workspace_id_to_delete;
    END IF;

    IF workspace_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the workspace owner can delete the workspace.';
    END IF;

    -- Delete the workspace (ON DELETE CASCADE should handle related data)
    DELETE FROM public.workspaces
    WHERE id = workspace_id_to_delete;

END;
$$;


-- Create triggers

-- Trigger that fires after a new user is inserted into auth.users (only creates profile now)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
