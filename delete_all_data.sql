-- WARNING: This script will permanently delete ALL data from the specified tables in the public schema.
-- This action is irreversible. Use with extreme caution, preferably on a development or staging environment.

-- Delete data from tables in an order that respects foreign key dependencies where possible.
-- ON DELETE CASCADE should handle many dependencies, but explicit ordering is safer.

DELETE FROM public.deadline_history;
DELETE FROM public.deadline_notifications;
DELETE FROM public.deadlines;
DELETE FROM public.contract_history;
DELETE FROM public.contract_signers;
DELETE FROM public.contract_webhook_logs;
DELETE FROM public.contracts;
DELETE FROM public.petition_executions;
DELETE FROM public.template_fields;
DELETE FROM public.petition_templates;
DELETE FROM public.process_clients;
DELETE FROM public.processes;
DELETE FROM public.client_interactions;
DELETE FROM public.clients;
DELETE FROM public.workspace_members;
DELETE FROM public.workspace_calendar_settings;
DELETE FROM public.workspace_invitations;
DELETE FROM public.workspace_webhooks;
DELETE FROM public.user_activities;
DELETE FROM public.user_workspace_quotas;
DELETE FROM public.super_admins;
DELETE FROM public.user_quota_logs; -- Added deletion for quota logs
DELETE FROM public.profiles;
DELETE FROM public.workspaces;

-- Optional: If you also want to reset sequences for auto-incrementing IDs (though UUIDs are used here),
-- you would typically use TRUNCATE ... RESTART IDENTITY, but DELETE is safer for just removing data.
-- If you need to reset the database schema completely, dropping tables and reapplying migrations is the standard approach.

-- Remember to execute this script in your Supabase SQL Editor.
