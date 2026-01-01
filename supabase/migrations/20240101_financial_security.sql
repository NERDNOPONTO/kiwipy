-- 1. Trigger para garantir a taxa de 10% da plataforma em cada pedido
-- Isso remove o risco de lógica de frontend falha ou alterada.
CREATE OR REPLACE FUNCTION public.calculate_order_commissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Garante 10% de comissão da plataforma
    -- Se o valor já vier preenchido, respeita, senão calcula.
    -- Mas a regra de negócio é 10%, então vamos forçar para garantir integridade.
    NEW.commission_platform := NEW.amount * 0.10;
    
    -- Garante que o net_amount (Saldo do Produtor) seja: Bruto - Plataforma - Afiliado
    NEW.net_amount := NEW.amount - NEW.commission_platform - COALESCE(NEW.commission_affiliate, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_commissions ON public.orders;
CREATE TRIGGER trigger_calculate_commissions
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_order_commissions();

-- 2. Atualizar pedidos antigos que possam estar com net_amount zerado ou nulo
UPDATE public.orders 
SET 
    commission_platform = amount * 0.10,
    net_amount = amount - (amount * 0.10) - COALESCE(commission_affiliate, 0)
WHERE net_amount IS NULL OR net_amount = 0;

-- 3. Função segura para consultar saldo (Pode ser usada pelo Front ou Admin)
-- Centraliza a lógica: Saldo = (Vendas Aprovadas Líquidas) - (Saques Pagos/Aprovados) - (Saques Pendentes)
DROP FUNCTION IF EXISTS public.get_producer_balance(uuid);

CREATE OR REPLACE FUNCTION public.get_producer_balance(producer_uuid uuid)
RETURNS json AS $$
DECLARE
    total_gross numeric;
    total_net numeric;
    total_withdrawn numeric;
    pending_withdrawals numeric;
    available_balance numeric;
BEGIN
    -- Soma das Vendas Aprovadas (Usando net_amount garantido pelo trigger)
    SELECT COALESCE(SUM(net_amount), 0), COALESCE(SUM(amount), 0)
    INTO total_net, total_gross
    FROM public.orders
    WHERE producer_id = producer_uuid AND status = 'approved';

    -- Soma dos Saques já processados (Pagos ou Aprovados para pagamento)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_withdrawn
    FROM public.withdrawals
    WHERE user_id = producer_uuid AND status IN ('paid', 'approved');

    -- Soma dos Saques Pendentes (O dinheiro fica "travado" aguardando aprovação)
    SELECT COALESCE(SUM(amount), 0)
    INTO pending_withdrawals
    FROM public.withdrawals
    WHERE user_id = producer_uuid AND status = 'pending';

    -- Saldo Disponível = Ganho Líquido - O que já tirou - O que pediu pra tirar
    available_balance := total_net - total_withdrawn - pending_withdrawals;

    -- Retorna JSON para fácil consumo no Frontend
    RETURN json_build_object(
        'gross_revenue', total_gross,
        'net_revenue', total_net,
        'withdrawn', total_withdrawn,
        'pending_withdrawal', pending_withdrawals,
        'available_balance', available_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
