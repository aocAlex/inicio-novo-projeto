
-- Update the template_fields table to match the expected schema
ALTER TABLE public.template_fields 
  ADD COLUMN IF NOT EXISTS default_value TEXT,
  ADD COLUMN IF NOT EXISTS field_description TEXT NOT NULL DEFAULT '';

-- Update existing records to have a default description if they don't have one
UPDATE public.template_fields 
SET field_description = 'Campo personalizado' 
WHERE field_description IS NULL OR field_description = '';

-- Rename field_label to field_title to match our interface
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'template_fields' 
             AND column_name = 'field_label') THEN
    ALTER TABLE public.template_fields RENAME COLUMN field_label TO field_title;
  END IF;
END $$;
