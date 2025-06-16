
-- Corrigir a função increment_template_execution_count para ter search_path seguro
CREATE OR REPLACE FUNCTION public.increment_template_execution_count(template_id uuid)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.petition_templates 
  SET execution_count = execution_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$;

-- Também corrigir a função increment_execution_retry_count
CREATE OR REPLACE FUNCTION public.increment_execution_retry_count(execution_id uuid)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.petition_executions 
  SET retry_count = retry_count + 1,
      updated_at = NOW()
  WHERE id = execution_id;
END;
$$;
