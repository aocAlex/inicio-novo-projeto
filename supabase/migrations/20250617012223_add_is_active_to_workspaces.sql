-- Add is_active column to workspaces table
ALTER TABLE public.workspaces
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
