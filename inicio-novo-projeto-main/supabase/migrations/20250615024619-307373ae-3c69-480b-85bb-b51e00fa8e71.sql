
-- Atualizar a constraint para incluir o tipo 'multiselect'
ALTER TABLE template_fields 
DROP CONSTRAINT IF EXISTS template_fields_field_type_check;

ALTER TABLE template_fields 
ADD CONSTRAINT template_fields_field_type_check 
CHECK (field_type IN (
  'text', 
  'textarea', 
  'number', 
  'date', 
  'datetime', 
  'time', 
  'select', 
  'multiselect',
  'radio', 
  'checkbox', 
  'email', 
  'phone', 
  'cpf', 
  'cnpj', 
  'cep', 
  'currency', 
  'percentage', 
  'oab', 
  'processo_numero'
));
