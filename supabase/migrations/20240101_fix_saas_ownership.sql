-- MIGRATION: CORREÇÃO DE PROPRIEDADE DE ASSINATURAS (VERSÃO CORRIGIDA)
-- Objetivo: Remover as vendas de assinatura do painel do usuário e movê-las para o Admin.

DO $$
DECLARE
    admin_profile_id uuid;
BEGIN
    -- 1. Encontrar um Perfil Válido para ser o "Admin/Dono do Sistema"
    -- Selecionamos o perfil mais antigo da tabela profiles para garantir que a FK funcione.
    -- (A tabela products referencia profiles.id, não auth.users.id diretamente em alguns schemas)
    SELECT id INTO admin_profile_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
    
    IF admin_profile_id IS NULL THEN
        RAISE NOTICE 'Nenhum perfil encontrado na tabela profiles. Abortando.';
        RETURN;
    END IF;

    RAISE NOTICE 'Perfil Admin identificado com ID: %', admin_profile_id;

    -- 2. Corrigir propriedade do Produto "Assinatura Diária"
    UPDATE public.products 
    SET producer_id = admin_profile_id 
    WHERE name = 'Assinatura Diária';
    
    -- 3. Corrigir propriedade dos Pedidos de Assinatura (SaaS) JÁ EXISTENTES
    UPDATE public.orders
    SET producer_id = admin_profile_id,
        commission_affiliate = 0,
        commission_platform = amount,
        net_amount = 0
    WHERE (payment_data->>'subscription') IS NOT NULL
       OR product_id IN (SELECT id FROM public.products WHERE name = 'Assinatura Diária');

    RAISE NOTICE 'Correção aplicada com sucesso. Assinaturas movidas para o Admin.';
END $$;
