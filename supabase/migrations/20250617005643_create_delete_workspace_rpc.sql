-- Create a function to delete a workspace
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
