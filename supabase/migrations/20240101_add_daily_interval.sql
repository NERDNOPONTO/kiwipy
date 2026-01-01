-- Atualizar a restrição da coluna interval na tabela saas_plans para permitir 'daily'

-- Primeiro, remover a restrição existente (o nome pode variar, mas geralmente é saas_plans_interval_check)
ALTER TABLE public.saas_plans DROP CONSTRAINT IF EXISTS saas_plans_interval_check;

-- Adicionar a nova restrição incluindo 'daily'
ALTER TABLE public.saas_plans ADD CONSTRAINT saas_plans_interval_check 
CHECK (interval IN ('monthly', 'yearly', 'lifetime', 'daily'));

-- Comentário para confirmar a alteração
COMMENT ON COLUMN public.saas_plans.interval IS 'Intervalo do plano: monthly, yearly, lifetime ou daily';
