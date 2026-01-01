-- Migration: Impor Regras Financeiras Estritas e Corrigir Estrutura de Comissões

-- 1. Garantir existência das colunas corretas em 'orders'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='commission_platform') THEN
        ALTER TABLE public.orders ADD COLUMN commission_platform numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='commission_affiliate') THEN
        ALTER TABLE public.orders ADD COLUMN commission_affiliate numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='net_amount') THEN
        ALTER TABLE public.orders ADD COLUMN net_amount numeric DEFAULT 0;
    END IF;
END $$;

-- 2. Atualizar Trigger de Cálculo de Comissões
CREATE OR REPLACE FUNCTION public.calculate_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
    is_subscription boolean;
    product_name text;
BEGIN
    -- Determinar se é assinatura verificando payment_data OU nome do produto
    SELECT name INTO product_name FROM public.products WHERE id = NEW.product_id;
    
    is_subscription := (
        (NEW.payment_data IS NOT NULL AND (NEW.payment_data->>'subscription') IS NOT NULL) 
        OR 
        (product_name = 'Assinatura Diária')
    );

    IF is_subscription THEN
        -- REGRA 1: Assinaturas pertencem 100% à Plataforma (Admin)
        -- Se houver afiliado, ele recebe sua parte, o resto é da plataforma.
        -- Produtor (se houver ID vinculado) recebe ZERO.
        
        NEW.commission_affiliate := COALESCE(NEW.commission_affiliate, 0);
        
        -- Plataforma fica com tudo menos a parte do afiliado
        NEW.commission_platform := NEW.amount - NEW.commission_affiliate;
        
        -- Produtor fica com ZERO
        NEW.net_amount := 0;
        
    ELSE
        -- REGRA 2: Vendas de Produtores (90% Produtor / 10% Plataforma)
        -- Plataforma recebe 10% fixo sobre o valor BRUTO
        NEW.commission_platform := NEW.amount * 0.10;
        
        -- Afiliado recebe sua parte (definida externamente ou no insert)
        NEW.commission_affiliate := COALESCE(NEW.commission_affiliate, 0);
        
        -- Produtor recebe o restante: (Bruto - 10% Plataforma - Comissão Afiliado)
        NEW.net_amount := NEW.amount - NEW.commission_platform - NEW.commission_affiliate;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicar Trigger em INSERT e UPDATE (para capturar atualizações de comissão de afiliado tardias)
DROP TRIGGER IF EXISTS trigger_calculate_commissions ON public.orders;
CREATE TRIGGER trigger_calculate_commissions
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_order_commissions();

-- 4. Retroactive Fix: Recalcular todas as ordens existentes
-- Primeiro, assinaturas
UPDATE public.orders
SET 
    commission_affiliate = COALESCE(commission_affiliate, 0), -- Trigger fará o resto
    amount = amount -- Dummy update para acionar trigger
WHERE payment_data->>'subscription' IS NOT NULL;

-- Segundo, produtos normais
UPDATE public.orders
SET 
    amount = amount -- Dummy update para acionar trigger
WHERE payment_data->>'subscription' IS NULL;

-- 5. Atualizar função de saldo do produtor (Simplificada agora que net_amount é confiável)
CREATE OR REPLACE FUNCTION public.get_producer_balance(producer_uuid uuid)
RETURNS json AS $$
DECLARE
    total_gross numeric;
    total_net numeric;
    total_withdrawn numeric;
    pending_withdrawals numeric;
    available_balance numeric;
BEGIN
    -- Soma das Vendas Aprovadas (Agora basta somar net_amount, pois ele já é 0 para assinaturas)
    SELECT COALESCE(SUM(net_amount), 0), COALESCE(SUM(amount), 0)
    INTO total_net, total_gross
    FROM public.orders
    WHERE producer_id = producer_uuid AND status = 'approved';

    -- Soma dos Saques já processados
    SELECT COALESCE(SUM(amount), 0)
    INTO total_withdrawn
    FROM public.withdrawals
    WHERE user_id = producer_uuid AND status IN ('paid', 'approved');

    -- Soma dos Saques Pendentes
    SELECT COALESCE(SUM(amount), 0)
    INTO pending_withdrawals
    FROM public.withdrawals
    WHERE user_id = producer_uuid AND status = 'pending';

    -- Saldo Disponível
    available_balance := total_net - total_withdrawn - pending_withdrawals;

    RETURN json_build_object(
        'gross_revenue', total_gross,
        'net_revenue', total_net,
        'withdrawn', total_withdrawn,
        'pending_withdrawal', pending_withdrawals,
        'available_balance', available_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
