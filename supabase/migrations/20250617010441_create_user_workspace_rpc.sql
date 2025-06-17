-- Create a function to create a workspace for a user with limit check
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
        RAISE EXCEPTION 'Workspace limit reached. You can only create % workspaces.', user_max_workspaces;
    END IF;

    -- Create the new workspace
    INSERT INTO public.workspaces (name, description, logo_url, owner_id)
    VALUES (workspace_name, workspace_description, workspace_logo_url, user_id)
    RETURNING * INTO new_workspace_row; -- Return the created row

    -- Add the user as the owner member of the new workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (new_workspace_row.id, user_id, 'owner', 'active'); -- Assuming role and status exist and 'owner'/'active' are valid

    -- Update the user's current_workspace_id to the new workspace
    UPDATE public.profiles
    SET current_workspace_id = new_workspace_row.id
    WHERE id = user_id;

    RETURN new_workspace_row;
END;
$$;
