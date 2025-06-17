CREATE OR REPLACE FUNCTION get_superadmin_workspaces_overview()
RETURNS TABLE (
    workspace_id uuid,
    workspace_name text,
    workspace_description text,
    workspace_logo_url text,
    is_active boolean,
    created_at timestamp with time zone,
    owner_id uuid,
    owner_email text,
    owner_name text,
    members_count bigint,
    clients_count bigint,
    processes_count bigint,
    petitions_count bigint,
    executions_count bigint,
    active_executions_count bigint,
    failed_executions_count bigint,
    last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Optional: Add a check here to ensure the calling user is a super admin
    -- For example, by querying the super_admins table
    IF NOT EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = auth.uid() AND sa.is_active = true) THEN
        RAISE EXCEPTION 'Usuário não autorizado: Apenas super admins podem executar esta função.';
    END IF;

    RETURN QUERY
    SELECT
        w.id AS workspace_id,
        w.name AS workspace_name,
        w.description AS workspace_description,
        w.logo_url AS workspace_logo_url,
        w.is_public AS is_active, -- Assuming is_public indicates active status for this overview
        w.created_at AS created_at,
        p.id AS owner_id,
        p.email AS owner_email,
        p.full_name AS owner_name,
        (SELECT COUNT(*)::bigint FROM workspace_members wm WHERE wm.workspace_id = w.id) AS members_count,
        (SELECT COUNT(*)::bigint FROM clients c WHERE c.workspace_id = w.id) AS clients_count,
        (SELECT COUNT(*)::bigint FROM processes pr WHERE pr.workspace_id = w.id) AS processes_count,
        (SELECT COUNT(*)::bigint FROM petition_templates pt WHERE pt.workspace_id = w.id) AS petitions_count,
        (SELECT COUNT(*)::bigint FROM petition_executions pe WHERE pe.workspace_id = w.id) AS executions_count,
        (SELECT COUNT(*)::bigint FROM petition_executions pe WHERE pe.workspace_id = w.id AND pe.webhook_status IN ('pending', 'retry')) AS active_executions_count, -- Assuming 'pending' and 'retry' are active
        (SELECT COUNT(*)::bigint FROM petition_executions pe WHERE pe.workspace_id = w.id AND pe.webhook_status = 'failed') AS failed_executions_count,
        (
            SELECT MAX(activity_time)
            FROM (
                SELECT created_at AS activity_time FROM clients WHERE workspace_id = w.id
                UNION ALL
                SELECT created_at AS activity_time FROM processes WHERE workspace_id = w.id
                UNION ALL
                SELECT created_at AS activity_time FROM petition_executions WHERE workspace_id = w.id
            ) AS combined_activity
        ) AS last_activity
    FROM
        workspaces w
    JOIN
        profiles p ON w.owner_id = p.id;
END;
$$;
