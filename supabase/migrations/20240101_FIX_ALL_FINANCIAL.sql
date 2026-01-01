-- MIGRATION CRÍTICA: CORREÇÃO FINANCEIRA DEFINITIVA
-- Execute este script no Supabase SQL Editor para corrigir a distribuição de saldo.

-- 1. Garantir colunas necessárias
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

-- 2. Atualizar Trigger de Cálculo de Comissões (A FONTE DA VERDADE)
CREATE OR REPLACE FUNCTION public.calculate_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
    is_subscription boolean;
    product_name text;
BEGIN
    -- Buscar nome do produto para identificação extra
    SELECT name INTO product_name FROM public.products WHERE id = NEW.product_id;
    
    -- Identificar se é assinatura (pelos metadados OU pelo nome do produto)
    is_subscription := (
        (NEW.payment_data IS NOT NULL AND (NEW.payment_data->>'subscription') IS NOT NULL) 
        OR 
        (product_name = 'Assinatura Diária')
    );

    IF is_subscription THEN
        -- CASO 1: ASSINATURA (Dinheiro é 100% da Plataforma/Admin)
        -- O Produtor NÃO recebe nada (net_amount = 0)
        
        NEW.commission_affiliate := COALESCE(NEW.commission_affiliate, 0);
        
        -- Plataforma recebe tudo (menos comissão de afiliado, se houver)
        NEW.commission_platform := NEW.amount - NEW.commission_affiliate;
        
        -- Produtor recebe ZERO
        NEW.net_amount := 0;
        
    ELSE
        -- CASO 2: VENDA DE PRODUTO (Dinheiro é dividido 90/10)
        -- Plataforma recebe 10%
        NEW.commission_platform := NEW.amount * 0.10;
        
        -- Afiliado recebe sua parte
        NEW.commission_affiliate := COALESCE(NEW.commission_affiliate, 0);
        
        -- Produtor recebe o resto (90% - afiliado)
        NEW.net_amount := NEW.amount - NEW.commission_platform - NEW.commission_affiliate;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reaplicar Trigger
DROP TRIGGER IF EXISTS trigger_calculate_commissions ON public.orders;
CREATE TRIGGER trigger_calculate_commissions
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_order_commissions();

-- 3. Atualizar Função de Leitura de Saldo (Proteção Dupla)
-- Garante que mesmo que o trigger falhasse (impossível), a leitura ignoraria assinaturas.
CREATE OR REPLACE FUNCTION public.get_producer_balance(producer_uuid uuid)
RETURNS json AS $$
DECLARE
    total_gross numeric;
    total_net numeric;
    total_withdrawn numeric;
    pending_withdrawals numeric;
    available_balance numeric;
BEGIN
    -- Soma das Vendas Aprovadas
    -- FILTRO: Exclui explicitamente produtos com nome 'Assinatura Diária'
    -- FILTRO: Exclui pedidos onde net_amount é 0 (redundância de segurança)
    SELECT COALESCE(SUM(o.net_amount), 0), COALESCE(SUM(o.amount), 0)
    INTO total_net, total_gross
    FROM public.orders o
    JOIN public.products p ON o.product_id = p.id
    WHERE o.producer_id = producer_uuid 
      AND o.status = 'approved'
      AND p.name != 'Assinatura Diária'
      AND o.net_amount > 0;

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

-- 4. CORREÇÃO RETROATIVA (Recalcular tudo agora)
-- Força update em todos os pedidos para que o trigger rode e corrija os valores
UPDATE public.orders SET id = id; 

-- 5. Opcional: Transferir propriedade do produto 'Assinatura Diária' para evitar confusão visual
-- Se houver um usuário admin específico, seria bom setar aqui.
-- Como não sabemos o ID do admin, vamos apenas garantir que o trigger cuide do saldo.
