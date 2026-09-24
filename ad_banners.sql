-- ============================================================
-- Survsta Platform Ad Banner Management (Monetization System)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS ad_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_link TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('homepage_hero', 'search_in_feed', 'providers_directory', 'equipment_sidebar')),
  is_active BOOLEAN DEFAULT false,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE ad_banners ENABLE ROW LEVEL SECURITY;

-- 1. Public can read active ad banners
DROP POLICY IF EXISTS "Allow public read on active ad_banners" ON ad_banners;
CREATE POLICY "Allow public read on active ad_banners"
  ON ad_banners FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Allow administrative/dashboard full management
DROP POLICY IF EXISTS "Allow full access for admin on ad_banners" ON ad_banners;
CREATE POLICY "Allow full access for admin on ad_banners"
  ON ad_banners FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 3. Stored Procedure for atomic click counter increment
CREATE OR REPLACE FUNCTION increment_ad_clicks(banner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ad_banners
  SET clicks = clicks + 1,
      updated_at = NOW()
  WHERE id = banner_id;
END;
$$;

-- Grant execution on increment_ad_clicks to anon and authenticated
GRANT EXECUTE ON FUNCTION increment_ad_clicks(UUID) TO anon, authenticated, service_role;

-- 4. Supabase Storage Bucket setup for banner images ('ads')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('ads', 'ads', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
  END IF;
END $$;

-- Storage policies for 'ads' bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "Public Access to Ads" ON storage.objects;
    CREATE POLICY "Public Access to Ads"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'ads');

    DROP POLICY IF EXISTS "Allow upload to Ads" ON storage.objects;
    CREATE POLICY "Allow upload to Ads"
      ON storage.objects FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'ads');

    DROP POLICY IF EXISTS "Allow delete from Ads" ON storage.objects;
    CREATE POLICY "Allow delete from Ads"
      ON storage.objects FOR DELETE
      TO public
      USING (bucket_id = 'ads');
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_banners_location_active ON ad_banners (location, is_active);
CREATE INDEX IF NOT EXISTS idx_ad_banners_created_at ON ad_banners (created_at DESC);
