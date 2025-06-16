
-- Remover a foreign key duplicada que está causando o conflito
ALTER TABLE public.deadlines DROP CONSTRAINT IF EXISTS deadlines_process_id_fkey;

-- Manter apenas a constraint nomeada explicitamente
-- A constraint fk_deadlines_process_id já existe e é suficiente
