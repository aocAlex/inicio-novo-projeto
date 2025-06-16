
-- Alterar a constraint da foreign key para CASCADE
-- Isso permitirá que quando um template for deletado, suas execuções também sejam deletadas automaticamente

-- Primeiro, remover a constraint existente
ALTER TABLE petition_executions 
DROP CONSTRAINT IF EXISTS petition_executions_template_id_fkey;

-- Recriar a constraint com CASCADE
ALTER TABLE petition_executions 
ADD CONSTRAINT petition_executions_template_id_fkey 
FOREIGN KEY (template_id) 
REFERENCES petition_templates(id) 
ON DELETE CASCADE;

-- Fazer o mesmo para template_fields se necessário
ALTER TABLE template_fields 
DROP CONSTRAINT IF EXISTS template_fields_template_id_fkey;

ALTER TABLE template_fields 
ADD CONSTRAINT template_fields_template_id_fkey 
FOREIGN KEY (template_id) 
REFERENCES petition_templates(id) 
ON DELETE CASCADE;
