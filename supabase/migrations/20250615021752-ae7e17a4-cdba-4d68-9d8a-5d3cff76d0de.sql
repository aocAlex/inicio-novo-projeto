
-- Add webhook columns to petition_templates table
ALTER TABLE petition_templates 
ADD COLUMN webhook_url TEXT,
ADD COLUMN webhook_enabled BOOLEAN DEFAULT false;
