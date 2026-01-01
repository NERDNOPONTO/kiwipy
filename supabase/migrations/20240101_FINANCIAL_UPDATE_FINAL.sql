-- 1. Create platform_revenue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    source TEXT NOT NULL, -- 'withdrawal_tax', 'subscription', etc.
    user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS policies for platform_revenue
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_revenue' AND policyname = 'Admins can view all platform revenue') THEN
        CREATE POLICY "Admins can view all platform revenue"
            ON public.platform_revenue
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_revenue' AND policyname = 'Users can insert platform revenue (system)') THEN
        CREATE POLICY "Users can insert platform revenue (system)"
            ON public.platform_revenue
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 3. Grant permissions
GRANT ALL ON public.platform_revenue TO authenticated;
GRANT ALL ON public.platform_revenue TO service_role;

-- 4. Add tax_amount to withdrawals if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'tax_amount') THEN
        ALTER TABLE public.withdrawals ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;
