
-- Function to increment template execution count
CREATE OR REPLACE FUNCTION increment_template_execution_count(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.petition_templates 
  SET execution_count = execution_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment execution retry count
CREATE OR REPLACE FUNCTION increment_execution_retry_count(execution_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.petition_executions 
  SET retry_count = retry_count + 1,
      updated_at = NOW()
  WHERE id = execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
