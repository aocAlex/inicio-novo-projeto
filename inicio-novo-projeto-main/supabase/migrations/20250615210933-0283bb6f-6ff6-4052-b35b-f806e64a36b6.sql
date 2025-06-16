
-- Adicionar campo de valor ao contrato
ALTER TABLE public.contracts 
ADD COLUMN contract_value DECIMAL(15,2);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.contracts.contract_value IS 'Valor do contrato assinado em reais';
