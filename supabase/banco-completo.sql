-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.affiliate_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  product_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  clicks integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_links_pkey PRIMARY KEY (id),
  CONSTRAINT affiliate_links_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id),
  CONSTRAINT affiliate_links_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.affiliates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'blocked'::text])),
  commission_rate integer DEFAULT 0,
  pix_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  product_id uuid,
  CONSTRAINT affiliates_pkey PRIMARY KEY (id),
  CONSTRAINT affiliates_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  iban text NOT NULL,
  account_holder_name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bank_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT bank_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.checkout_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  product_id uuid,
  step text NOT NULL,
  status text DEFAULT 'completed'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT checkout_events_pkey PRIMARY KEY (id),
  CONSTRAINT checkout_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT checkout_events_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  order_id uuid NOT NULL,
  amount integer NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'available'::text, 'paid'::text, 'canceled'::text])),
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT commissions_pkey PRIMARY KEY (id),
  CONSTRAINT commissions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id),
  CONSTRAINT commissions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  producer_id uuid NOT NULL,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  discount_value integer NOT NULL,
  max_uses integer,
  used_count integer DEFAULT 0,
  expires_at timestamp with time zone,
  product_ids ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_id text NOT NULL UNIQUE,
  email text NOT NULL,
  email_normalized text NOT NULL,
  full_name text NOT NULL,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  is_completed boolean DEFAULT false,
  last_watched_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_progress_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  duration_seconds integer,
  order integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT true,
  is_free_preview boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  title text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  checkout_settings jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  product_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  producer_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  payment_reference text,
  payment_data jsonb,
  access_granted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  available_at timestamp with time zone,
  commission_platform integer DEFAULT 0,
  commission_affiliate integer DEFAULT 0,
  net_amount integer DEFAULT 0,
  affiliate_id uuid,
  commission_amount integer DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT orders_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id)
);
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  url text NOT NULL,
  path text NOT NULL,
  product_id uuid,
  referrer text,
  user_agent text,
  device_type text,
  country text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT page_views_pkey PRIMARY KEY (id),
  CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT page_views_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'failed'::text])),
  method text NOT NULL,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT payouts_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id)
);
CREATE TABLE public.product_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  order_id uuid NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_access_pkey PRIMARY KEY (id),
  CONSTRAINT product_access_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT product_access_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_access_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL CHECK (price >= 0),
  product_type USER-DEFINED NOT NULL DEFAULT 'curso'::product_type,
  image_url text,
  content_url text,
  is_active boolean NOT NULL DEFAULT true,
  checkout_color text DEFAULT '#f97316'::text,
  checkout_logo_url text,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  recurrence_period text CHECK (recurrence_period = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'semiannual'::text, 'annual'::text, 'lifetime'::text])),
  trial_days integer DEFAULT 0,
  currency text DEFAULT 'AOA'::text,
  is_featured boolean DEFAULT false,
  checkout_settings jsonb DEFAULT '{"logo_url": null, "ask_phone": true, "banner_url": null, "ask_address": false, "primary_color": "#f97316", "timer_enabled": false, "timer_duration": 900, "background_color": "#ffffff"}'::jsonb,
  social_proof_settings jsonb DEFAULT '{"testimonials": [], "testimonials_enabled": false, "notifications_enabled": false, "fake_purchases_enabled": false}'::jsonb,
  stock_enabled boolean DEFAULT false,
  stock_limit integer,
  is_marketplace boolean DEFAULT false,
  marketplace_category text,
  commission_rate integer DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  affiliate_approval_type text DEFAULT 'auto'::text CHECK (affiliate_approval_type = ANY (ARRAY['auto'::text, 'manual'::text])),
  affiliate_rules text,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  business_name text,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role text DEFAULT 'producer'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.saas_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  interval text DEFAULT 'monthly'::text CHECK ("interval" = ANY (ARRAY['monthly'::text, 'yearly'::text, 'lifetime'::text, 'daily'::text])),
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saas_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.saas_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'trialing'::text])),
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saas_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT saas_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT saas_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.saas_plans(id)
);
CREATE TABLE public.withdrawals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'paid'::text])),
  bank_account_id uuid,
  proof_url text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT withdrawals_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT withdrawals_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id)
);