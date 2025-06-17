-- Add max_workspaces column to profiles table
ALTER TABLE public.profiles
ADD COLUMN max_workspaces INTEGER NOT NULL DEFAULT 1;
