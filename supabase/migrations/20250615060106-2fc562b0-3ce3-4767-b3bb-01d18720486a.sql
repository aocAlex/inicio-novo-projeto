
-- Corrigir todas as funções para ter search_path seguro
CREATE OR REPLACE FUNCTION public.add_business_days(start_date date, business_days integer)
RETURNS date
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  calc_date DATE := start_date;
  days_added INTEGER := 0;
BEGIN
  WHILE days_added < business_days LOOP
    calc_date := calc_date + INTERVAL '1 day';
    -- Pular fins de semana (1 = domingo, 7 = sábado)
    IF EXTRACT(DOW FROM calc_date) NOT IN (1, 7) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  
  RETURN calc_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_business_day(check_date date)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Verificar se não é fim de semana
  IF EXTRACT(DOW FROM check_date) IN (1, 7) THEN
    RETURN FALSE;
  END IF;
  
  -- Aqui poderia adicionar verificação de feriados
  -- Por enquanto, só verifica fins de semana
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_client_by_document(p_workspace_id uuid, p_document character varying)
RETURNS TABLE(client_id uuid, confidence numeric, match_type character varying)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Remover formatação do documento
  p_document := REGEXP_REPLACE(p_document, '[^0-9]', '', 'g');
  
  -- Buscar por document_number exato
  RETURN QUERY
  SELECT 
    c.id,
    1.00::DECIMAL(3,2) as confidence,
    'document_number'::VARCHAR(20) as match_type
  FROM public.clients c
  WHERE c.workspace_id = p_workspace_id
    AND REGEXP_REPLACE(COALESCE(c.document_number, ''), '[^0-9]', '', 'g') = p_document
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_client_by_email(p_workspace_id uuid, p_email character varying)
RETURNS TABLE(client_id uuid, confidence numeric, match_type character varying)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    0.95::DECIMAL(3,2) as confidence,
    'email'::VARCHAR(20) as match_type
  FROM public.clients c
  WHERE c.workspace_id = p_workspace_id
    AND LOWER(c.email) = LOWER(p_email)
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_client_by_name(p_workspace_id uuid, p_name character varying)
RETURNS TABLE(client_id uuid, confidence numeric, match_type character varying)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    0.80::DECIMAL(3,2) as confidence,
    'name_similarity'::VARCHAR(20) as match_type
  FROM public.clients c
  WHERE c.workspace_id = p_workspace_id
    AND SIMILARITY(LOWER(c.name), LOWER(p_name)) > 0.8
  ORDER BY SIMILARITY(LOWER(c.name), LOWER(p_name)) DESC
  LIMIT 1;
END;
$$;

-- Mover a extensão pg_trgm do schema public para um schema dedicado
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

-- Recriar as funções que dependem da extensão com referências corretas
CREATE OR REPLACE FUNCTION public.find_client_by_name(p_workspace_id uuid, p_name character varying)
RETURNS TABLE(client_id uuid, confidence numeric, match_type character varying)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    0.80::DECIMAL(3,2) as confidence,
    'name_similarity'::VARCHAR(20) as match_type
  FROM public.clients c
  WHERE c.workspace_id = p_workspace_id
    AND extensions.similarity(LOWER(c.name), LOWER(p_name)) > 0.8
  ORDER BY extensions.similarity(LOWER(c.name), LOWER(p_name)) DESC
  LIMIT 1;
END;
$$;
