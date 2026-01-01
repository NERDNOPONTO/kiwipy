-- Enable Storage Buckets for Products
-- Creates 'product-images' and 'product-files' buckets if they don't exist
-- Sets up public access policies

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create Policies (Safely)
DO $$
BEGIN
    -- product-images policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access to Product Images'
    ) THEN
        CREATE POLICY "Public Access to Product Images"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'product-images' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Product Images'
    ) THEN
        CREATE POLICY "Authenticated Upload Product Images"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
    END IF;

    -- product-files policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access to Product Files'
    ) THEN
        CREATE POLICY "Public Access to Product Files"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'product-files' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Product Files'
    ) THEN
        CREATE POLICY "Authenticated Upload Product Files"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'product-files' AND auth.role() = 'authenticated' );
    END IF;
END $$;
