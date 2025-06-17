
-- Adicionar colunas para vincular prazos a petições e usuários
ALTER TABLE public.deadlines 
ADD COLUMN IF NOT EXISTS petition_id uuid REFERENCES public.petition_templates(id),
ADD COLUMN IF NOT EXISTS petition_execution_id uuid REFERENCES public.petition_executions(id);

-- Adicionar foreign keys para melhor integridade referencial
ALTER TABLE public.deadlines 
ADD CONSTRAINT fk_deadlines_process_id 
FOREIGN KEY (process_id) REFERENCES public.processes(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_deadlines_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_deadlines_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_deadlines_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_deadlines_petition_id ON public.deadlines(petition_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_petition_execution_id ON public.deadlines(petition_execution_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_process_id ON public.deadlines(process_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_client_id ON public.deadlines(client_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_assigned_to ON public.deadlines(assigned_to);
