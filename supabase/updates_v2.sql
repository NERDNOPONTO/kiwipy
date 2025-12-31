
-- Update products table for subscriptions and more features
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'quarterly', 'semiannual', 'annual', 'lifetime')),
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AOA',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 3. Sistema de Afiliados
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')),
  commission_rate INTEGER DEFAULT 0, -- Global commission rate override
  pix_key TEXT, -- Or bank details
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL, -- custom slug like /ref/leonardo-curso
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'canceled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Cupons e Promoções
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  product_ids UUID[], -- Array of specific products, null means all producer's products
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Gestão de Clientes e Membros (LMS Structure)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Rich text content
  video_url TEXT, -- Vimeo/YouTube/Bunny
  duration_seconds INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, lesson_id)
);

-- Enable RLS for new tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Examples - Need refinement based on exact business logic)

-- Modules/Lessons: Visible to anyone (content is protected, structure might be visible or not)
-- Usually only customers with access should see lessons content, but for now allow read for authenticated
CREATE POLICY "Public modules view" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Public lessons view" ON public.lessons FOR SELECT USING (true);

-- Producers manage their own modules/lessons
CREATE POLICY "Producers manage modules" ON public.modules FOR ALL 
USING (product_id IN (SELECT id FROM public.products WHERE producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Producers manage lessons" ON public.lessons FOR ALL 
USING (module_id IN (SELECT id FROM public.modules WHERE product_id IN (SELECT id FROM public.products WHERE producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))));

