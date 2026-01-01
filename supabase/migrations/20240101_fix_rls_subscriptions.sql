-- Habilitar RLS na tabela saas_subscriptions se ainda não estiver habilitado
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados criem suas próprias assinaturas
CREATE POLICY "Users can insert their own subscriptions" 
ON public.saas_subscriptions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = saas_subscriptions.user_id
));

-- Política para permitir que usuários vejam suas próprias assinaturas
CREATE POLICY "Users can view their own subscriptions" 
ON public.saas_subscriptions 
FOR SELECT 
TO authenticated 
USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = saas_subscriptions.user_id
));
