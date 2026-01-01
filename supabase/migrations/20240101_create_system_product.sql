-- 1. Create a System Product for Daily Subscriptions if it doesn't exist
DO $$
DECLARE
    system_producer_id uuid;
    existing_product_id uuid;
BEGIN
    -- Get the first admin or user to be the "owner" of the system product
    -- In a real app, this should be a specific system account
    SELECT id INTO system_producer_id FROM public.profiles LIMIT 1;

    IF system_producer_id IS NOT NULL THEN
        -- Check if product already exists
        SELECT id INTO existing_product_id FROM public.products WHERE name = 'Assinatura Diária' LIMIT 1;

        IF existing_product_id IS NULL THEN
            INSERT INTO public.products (
                producer_id,
                name,
                description,
                price,
                product_type,
                is_active,
                stock_enabled,
                image_url
            ) VALUES (
                system_producer_id,
                'Assinatura Diária',
                'Acesso à plataforma por dias contratados',
                100, -- Base price, will be overridden by logic
                'servico',
                true,
                false,
                'https://placehold.co/600x400/png?text=Assinatura+Diaria'
            );
        END IF;
    END IF;
END $$;
