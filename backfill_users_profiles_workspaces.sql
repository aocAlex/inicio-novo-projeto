-- This script backfills profiles and dedicated workspaces for existing authenticated users
-- who do not currently have a profile or are not linked to any workspace.
-- It is designed to be idempotent, meaning it can be run multiple times safely.

-- Ensure profiles exist for all auth.users
INSERT INTO public.profiles (id, email)
SELECT
    u.id,
    u.email
FROM
    auth.users u
LEFT JOIN
    public.profiles p ON u.id = p.id
WHERE
    p.id IS NULL;

-- Identify users who do not have any entries in public.workspace_members
WITH users_without_workspace AS (
    SELECT
        u.id,
        u.email
    FROM
        auth.users u
    LEFT JOIN
        public.workspace_members wm ON u.id = wm.user_id
    WHERE
        wm.user_id IS NULL
)
-- Create a new workspace for each user without a workspace
INSERT INTO public.workspaces (name, owner_id, is_active)
SELECT
    uw.email, -- Use user email as workspace name
    uw.id,    -- Set user as owner
    TRUE      -- Set as active by default
FROM
    users_without_workspace uw
RETURNING id, owner_id; -- Return created workspace ID and owner ID

-- Link the users to the workspaces just created for them (as owners)
-- We need to select the workspaces that were just created and link their owners
INSERT INTO public.workspace_members (workspace_id, user_id)
SELECT
    w.id,
    w.owner_id
FROM
    public.workspaces w
WHERE
    w.owner_id IN (
        SELECT
            u.id
        FROM
            auth.users u
        LEFT JOIN
            public.workspace_members wm ON u.id = wm.user_id
        WHERE
            wm.user_id IS NULL
    ) -- Subquery to identify users without a workspace
    AND NOT EXISTS ( -- Ensure we don't create duplicate workspace_members entries
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = w.id AND wm.user_id = w.owner_id
    );

-- Optional: Update current_workspace_id for users who just got a workspace
-- This part assumes the user should be directed to their new workspace upon next login
UPDATE public.profiles p
SET current_workspace_id = w.id
FROM public.workspaces w
JOIN public.workspace_members wm ON w.id = wm.workspace_id
WHERE p.id = wm.user_id
AND p.current_workspace_id IS NULL -- Only update if current_workspace_id is not set
AND w.owner_id = p.id; -- Ensure it's a workspace they own
