-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for product types
CREATE TYPE public.product_type AS ENUM ('curso', 'ebook', 'servico', 'download');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'rejected', 'refunded');

-- Create profiles table for producers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0), -- Price in Kwanzas (smallest unit)
  product_type product_type NOT NULL DEFAULT 'curso',
  image_url TEXT,
  content_url TEXT, -- URL to the content after purchase
  is_active BOOLEAN NOT NULL DEFAULT true,
  checkout_color TEXT DEFAULT '#f97316', -- Brand color for checkout
  checkout_logo_url TEXT,
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table (buyers)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id TEXT NOT NULL UNIQUE, -- Normalized email hash for tracking
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL, -- Lowercase email for lookup
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE, -- Unique order reference for payment
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount >= 0), -- Amount in Kwanzas
  status order_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT, -- CulongaPay transaction reference
  payment_data JSONB, -- Store full payment callback data
  access_granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_access table (to track what customers have access to)
CREATE TABLE public.product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means lifetime access
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_access ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Producers can manage their own products"
  ON public.products FOR ALL
  USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Customers policies (producers can see their customers)
CREATE POLICY "Producers can view customers who bought their products"
  ON public.customers FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT o.customer_id 
      FROM public.orders o 
      WHERE o.producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Orders policies
CREATE POLICY "Producers can view their orders"
  ON public.orders FOR SELECT
  USING (producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Product access policies
CREATE POLICY "Producers can view access for their products"
  ON public.product_access FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE producer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate buyer ID from email
CREATE OR REPLACE FUNCTION public.generate_buyer_id(email_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(lower(trim(email_input))::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get or create customer
CREATE OR REPLACE FUNCTION public.get_or_create_customer(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
  v_email_normalized TEXT;
  v_buyer_id TEXT;
BEGIN
  v_email_normalized := lower(trim(p_email));
  v_buyer_id := public.generate_buyer_id(p_email);
  
  -- Try to find existing customer
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE email_normalized = v_email_normalized;
  
  -- If not found, create new customer
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (buyer_id, email, email_normalized, full_name, phone)
    VALUES (v_buyer_id, p_email, v_email_normalized, p_full_name, p_phone)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update existing customer info
    UPDATE public.customers
    SET full_name = COALESCE(p_full_name, full_name),
        phone = COALESCE(p_phone, phone),
        updated_at = now()
    WHERE id = v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to generate unique order reference
CREATE OR REPLACE FUNCTION public.generate_order_reference()
RETURNS TEXT AS $$
DECLARE
  v_reference TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate reference: INF-YYYYMMDD-XXXXX (5 random alphanumeric)
    v_reference := 'INF-' || to_char(now(), 'YYYYMMDD') || '-' || 
                   upper(substr(md5(random()::text), 1, 5));
    
    -- Check if reference already exists
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE reference = v_reference) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;
