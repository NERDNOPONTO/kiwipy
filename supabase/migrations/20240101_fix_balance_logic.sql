-- Migration: Corrigir lógica de saldo para excluir receitas de Assinatura Diária do saldo do produtor
-- e atribuir corretamente receitas da plataforma.

-- 1. Atualizar função de saldo do produtor para excluir produtos de sistema
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
    -- FIX: Excluir produtos com nome 'Assinatura Diária' do saldo do produtor
    SELECT COALESCE(SUM(o.net_amount), 0), COALESCE(SUM(o.amount), 0)
    INTO total_net, total_gross
    FROM public.orders o
    JOIN public.products p ON o.product_id = p.id
    WHERE o.producer_id = producer_uuid 
      AND o.status = 'approved'
      AND p.name != 'Assinatura Diária'; -- Exclui assinaturas do sistema

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

-- 2. Criar função para ver saldo da Plataforma (Admin)
-- Inclui comissões de vendas + total de assinaturas
CREATE OR REPLACE FUNCTION public.get_platform_balance()
RETURNS json AS $$
DECLARE
    total_commissions numeric;
    total_subscriptions numeric;
    total_revenue numeric;
BEGIN
    -- Soma de todas as comissões de plataforma
    SELECT COALESCE(SUM(commission_platform), 0)
    INTO total_commissions
    FROM public.orders
    WHERE status = 'approved';

    -- Soma total das assinaturas (onde o produto é Assinatura Diária)
    SELECT COALESCE(SUM(o.amount), 0)
    INTO total_subscriptions
    FROM public.orders o
    JOIN public.products p ON o.product_id = p.id
    WHERE o.status = 'approved'
      AND p.name = 'Assinatura Diária';

    total_revenue := total_commissions + total_subscriptions;

    RETURN json_build_object(
        'total_commissions', total_commissions,
        'total_subscriptions', total_subscriptions,
        'total_revenue', total_revenue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
