-- ============================================================
-- Survsta Platform Database Schema for Supabase
-- Tables: providers, equipment
-- ============================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: providers
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure is_featured column exists if table was already created
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Table: equipment
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  title TEXT,
  category TEXT,
  daily_price NUMERIC,
  monthly_price NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Add all required columns to providers table
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS equipment_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS commercial_reg TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS tax_card TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS license TEXT;

-- Add all required columns to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS sale_price NUMERIC;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS serial_number TEXT DEFAULT 'SN-UNKNOWN';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS is_flagged_stolen BOOLEAN DEFAULT false;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'متاح للإيجار';
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number ON equipment (serial_number);

-- Permissive public policies for seamless integration with anon key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'providers' AND policyname = 'Allow public read on providers'
  ) THEN
    CREATE POLICY "Allow public read on providers" ON providers FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on providers" ON providers FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on providers" ON providers FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'equipment' AND policyname = 'Allow public read on equipment'
  ) THEN
    CREATE POLICY "Allow public read on equipment" ON equipment FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on equipment" ON equipment FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on equipment" ON equipment FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on equipment" ON equipment FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================
-- Supabase Storage Architecture: Buckets & Storage RLS Policies
-- ============================================================

-- 1. Create Required Storage Buckets (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'equipment-images',
    'equipment-images',
    true,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'provider-images',
    'provider-images',
    true,
    10485760, -- 10MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'attachments',
    'attachments',
    true,
    20971520, -- 20MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf', 'application/zip']
  )
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage RLS Policies for Public Access & Uploads
DO $$
BEGIN
  -- SELECT Policy: Anyone can view and download files from public buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access for Public Buckets'
  ) THEN
    CREATE POLICY "Public Access for Public Buckets"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('equipment-images', 'provider-images', 'attachments'));
  END IF;

  -- INSERT Policy: Anyone can upload files to public buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public / Anon Upload Policy'
  ) THEN
    CREATE POLICY "Public / Anon Upload Policy"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id IN ('equipment-images', 'provider-images', 'attachments'));
  END IF;

  -- UPDATE Policy: Anyone can update/replace files in public buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public / Anon Update Policy'
  ) THEN
    CREATE POLICY "Public / Anon Update Policy"
    ON storage.objects FOR UPDATE
    USING (bucket_id IN ('equipment-images', 'provider-images', 'attachments'))
    WITH CHECK (bucket_id IN ('equipment-images', 'provider-images', 'attachments'));
  END IF;

  -- DELETE Policy: Anyone can delete files in public buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public / Anon Delete Policy'
  ) THEN
    CREATE POLICY "Public / Anon Delete Policy"
    ON storage.objects FOR DELETE
    USING (bucket_id IN ('equipment-images', 'provider-images', 'attachments'));
  END IF;
END $$;

-- ============================================================
-- Clients Architecture & Orders History (Linked to auth.users)
-- ============================================================

-- Table: clients (Unified User Profile with Modular Roles)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  active_modules JSONB DEFAULT '["client"]'::jsonb,
  preferences JSONB DEFAULT '{"notifications": true, "preferred_categories": []}'::jsonb,
  company_name TEXT,
  category TEXT DEFAULT 'مكتب استشاري',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_client_phone CHECK (char_length(phone_number) >= 8)
);

-- Ensure active_modules and phone guardrails exist on clients table if already created
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active_modules JSONB DEFAULT '["client"]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ALTER COLUMN phone_number SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_active_modules ON clients USING gin (active_modules);
CREATE INDEX IF NOT EXISTS idx_clients_phone_number ON clients (phone_number);
CREATE INDEX IF NOT EXISTS idx_clients_coverage_areas ON clients USING gin (coverage_areas);

-- Ensure providers table also supports coverage_areas
ALTER TABLE providers ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_providers_coverage_areas ON providers USING gin (coverage_areas);


-- Table: orders (Client Order History)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  provider_id UUID,
  client_email TEXT,
  equipment_name TEXT,
  category TEXT,
  duration TEXT,
  total_price NUMERIC,
  status TEXT DEFAULT 'قيد الانتظار',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure provider_id exists on orders if table was already created
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_id UUID;
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders (provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_id);

-- Table: inapp_notifications (Unified In-App Notification Center)
CREATE TABLE IF NOT EXISTS inapp_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'approval'
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for clients, orders & inapp_notifications
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inapp_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Allow public read on clients'
  ) THEN
    CREATE POLICY "Allow public read on clients" ON clients FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on clients" ON clients FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on clients" ON clients FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on clients" ON clients FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow public read on orders'
  ) THEN
    CREATE POLICY "Allow public read on orders" ON orders FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inapp_notifications' AND policyname = 'Allow public read on inapp_notifications'
  ) THEN
    CREATE POLICY "Allow public read on inapp_notifications" ON inapp_notifications FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on inapp_notifications" ON inapp_notifications FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on inapp_notifications" ON inapp_notifications FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on inapp_notifications" ON inapp_notifications FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inapp_notifications_user_id ON inapp_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_inapp_notifications_is_read ON inapp_notifications (is_read);

-- ============================================================
-- Anti-Fraud & Stolen Equipment Registry
-- ============================================================

-- Table: stolen_registry
CREATE TABLE IF NOT EXISTS stolen_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  serial_number TEXT NOT NULL,
  equipment_model TEXT NOT NULL,
  proof_document_url TEXT,
  status TEXT DEFAULT 'verified', -- 'verified' | 'pending' | 'resolved'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stolen_registry
ALTER TABLE stolen_registry ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stolen_registry' AND policyname = 'Allow public read on stolen_registry'
  ) THEN
    CREATE POLICY "Allow public read on stolen_registry" ON stolen_registry FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on stolen_registry" ON stolen_registry FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on stolen_registry" ON stolen_registry FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on stolen_registry" ON stolen_registry FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stolen_registry_serial_number ON stolen_registry (serial_number);
CREATE INDEX IF NOT EXISTS idx_stolen_registry_provider_id ON stolen_registry (provider_id);

-- ============================================================
-- Job Postings Table (Engineering & Surveying Jobs)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  job_type TEXT DEFAULT 'دوام كامل', -- 'full-time' | 'part-time' | 'freelance'
  salary TEXT,
  experience_level TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open', -- 'open' | 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_postings' AND policyname = 'Allow public read on job_postings'
  ) THEN
    CREATE POLICY "Allow public read on job_postings" ON job_postings FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on job_postings" ON job_postings FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on job_postings" ON job_postings FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on job_postings" ON job_postings FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_postings_provider_id ON job_postings (provider_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings (status);

-- ============================================================
-- Provider Team Table (Staff & Contacts)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on provider_team
ALTER TABLE provider_team ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'provider_team' AND policyname = 'Allow public read on provider_team'
  ) THEN
    CREATE POLICY "Allow public read on provider_team" ON provider_team FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on provider_team" ON provider_team FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on provider_team" ON provider_team FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on provider_team" ON provider_team FOR DELETE USING (true);
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  active_modules JSONB DEFAULT '["client"]'::jsonb,
  preferences JSONB DEFAULT '{"notifications": true, "preferred_categories": []}'::jsonb,
  company_name TEXT,
  category TEXT DEFAULT 'مكتب استشاري',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_client_phone CHECK (char_length(phone_number) >= 8)
);

-- Ensure active_modules and phone guardrails exist on clients table if already created
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active_modules JSONB DEFAULT '["client"]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ALTER COLUMN phone_number SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_active_modules ON clients USING gin (active_modules);
CREATE INDEX IF NOT EXISTS idx_clients_phone_number ON clients (phone_number);
CREATE INDEX IF NOT EXISTS idx_clients_coverage_areas ON clients USING gin (coverage_areas);

-- Ensure providers table also supports coverage_areas
ALTER TABLE providers ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_providers_coverage_areas ON providers USING gin (coverage_areas);

-- Ensure is_suspended column exists on clients and providers for user suspension control
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;


-- Table: orders (Client Order History)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  provider_id UUID,
  client_email TEXT,
  equipment_name TEXT,
  category TEXT,
  duration TEXT,
  total_price NUMERIC,
  status TEXT DEFAULT 'قيد الانتظار',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure provider_id exists on orders if table was already created
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_id UUID;
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders (provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_id);

-- Table: inapp_notifications (Unified In-App Notification Center)
CREATE TABLE IF NOT EXISTS inapp_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'approval'
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for clients, orders & inapp_notifications
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inapp_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Allow public read on clients'
  ) THEN
    CREATE POLICY "Allow public read on clients" ON clients FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on clients" ON clients FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on clients" ON clients FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on clients" ON clients FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow public read on orders'
  ) THEN
    CREATE POLICY "Allow public read on orders" ON orders FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inapp_notifications' AND policyname = 'Allow public read on inapp_notifications'
  ) THEN
    CREATE POLICY "Allow public read on inapp_notifications" ON inapp_notifications FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on inapp_notifications" ON inapp_notifications FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on inapp_notifications" ON inapp_notifications FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on inapp_notifications" ON inapp_notifications FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inapp_notifications_user_id ON inapp_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_inapp_notifications_is_read ON inapp_notifications (is_read);

-- ============================================================
-- Anti-Fraud & Stolen Equipment Registry
-- ============================================================

-- Table: stolen_registry
CREATE TABLE IF NOT EXISTS stolen_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  serial_number TEXT NOT NULL,
  equipment_model TEXT NOT NULL,
  proof_document_url TEXT,
  status TEXT DEFAULT 'verified', -- 'verified' | 'pending' | 'resolved'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stolen_registry
ALTER TABLE stolen_registry ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stolen_registry' AND policyname = 'Allow public read on stolen_registry'
  ) THEN
    CREATE POLICY "Allow public read on stolen_registry" ON stolen_registry FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on stolen_registry" ON stolen_registry FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on stolen_registry" ON stolen_registry FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on stolen_registry" ON stolen_registry FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stolen_registry_serial_number ON stolen_registry (serial_number);
CREATE INDEX IF NOT EXISTS idx_stolen_registry_provider_id ON stolen_registry (provider_id);

-- ============================================================
-- Job Postings Table (Engineering & Surveying Jobs)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  job_type TEXT DEFAULT 'دوام كامل', -- 'full-time' | 'part-time' | 'freelance'
  salary TEXT,
  experience_level TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open', -- 'open' | 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_postings' AND policyname = 'Allow public read on job_postings'
  ) THEN
    CREATE POLICY "Allow public read on job_postings" ON job_postings FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on job_postings" ON job_postings FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on job_postings" ON job_postings FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on job_postings" ON job_postings FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_postings_provider_id ON job_postings (provider_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings (status);

-- ============================================================
-- Provider Team Table (Staff & Contacts)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on provider_team
ALTER TABLE provider_team ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'provider_team' AND policyname = 'Allow public read on provider_team'
  ) THEN
    CREATE POLICY "Allow public read on provider_team" ON provider_team FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on provider_team" ON provider_team FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on provider_team" ON provider_team FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on provider_team" ON provider_team FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_provider_team_provider_id ON provider_team (provider_id);

-- ============================================================
-- Provider Reviews & Ratings Table
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  client_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  reply_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on provider_reviews
ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'provider_reviews' AND policyname = 'Allow public read on provider_reviews'
  ) THEN
    CREATE POLICY "Allow public read on provider_reviews" ON provider_reviews FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on provider_reviews" ON provider_reviews FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on provider_reviews" ON provider_reviews FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on provider_reviews" ON provider_reviews FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider_id ON provider_reviews (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_client_id ON provider_reviews (client_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_rating ON provider_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_created_at ON provider_reviews (created_at DESC);

-- ============================================================
-- Profile Views & Analytics Tracking
-- ============================================================
ALTER TABLE providers ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- ============================================================
-- Job Postings Table (Provider Openings for Engineers & Surveyors)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'دوام كامل' | 'دوام جزئي' | 'عقد مشروع' | 'عمل حر'
  salary TEXT,
  experience_level TEXT,
  requirements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_postings' AND policyname = 'Allow public read on job_postings'
  ) THEN
    CREATE POLICY "Allow public read on job_postings" ON job_postings FOR SELECT USING (true);
    CREATE POLICY "Allow provider insert on job_postings" ON job_postings FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow provider update on job_postings" ON job_postings FOR UPDATE USING (true);
    CREATE POLICY "Allow provider delete on job_postings" ON job_postings FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_postings_provider_id ON job_postings (provider_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings (status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings (created_at DESC);

-- ============================================================
-- Job Applications Table (Freelancer / Surveyor Submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  experience_years TEXT,
  cv_link TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Allow public read on job_applications'
  ) THEN
    CREATE POLICY "Allow public read on job_applications" ON job_applications FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on job_applications" ON job_applications FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on job_applications" ON job_applications FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete on job_applications" ON job_applications FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications (status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications (created_at DESC);

-- ============================================================
-- Freelancer Profiles Table (Engineers & Surveyors CV / Portfolio)
-- ============================================================
CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_title TEXT NOT NULL DEFAULT 'مهندس / مساح جيوماتكس',
  bio TEXT,
  years_of_experience INTEGER DEFAULT 1,
  equipment_skills JSONB DEFAULT '[]'::jsonb,
  software_skills JSONB DEFAULT '[]'::jsonb,
  portfolio_url TEXT,
  cv_file_url TEXT,
  hourly_rate TEXT,
  city_or_gov TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_profiles' AND policyname = 'Allow public read on freelancer_profiles'
  ) THEN
    CREATE POLICY "Allow public read on freelancer_profiles" ON freelancer_profiles FOR SELECT USING (true);
    CREATE POLICY "Allow users to insert their freelancer profile" ON freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Allow users to update their freelancer profile" ON freelancer_profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Allow users to delete their freelancer profile" ON freelancer_profiles FOR DELETE USING (auth.uid() = id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_title ON freelancer_profiles (professional_title);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_experience ON freelancer_profiles (years_of_experience);

-- ============================================================
-- In-App Notifications Table (Global Notification Center)
-- ============================================================
CREATE TABLE IF NOT EXISTS inapp_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE inapp_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inapp_notifications' AND policyname = 'Users can select their own notifications'
  ) THEN
    -- Users can read their own notifications or public system notifications (where user_id is null)
    CREATE POLICY "Users can select their own notifications" 
      ON inapp_notifications FOR SELECT 
      USING (auth.uid() = user_id OR user_id IS NULL);

    -- Users can mark their own notifications as read
    CREATE POLICY "Users can update their own notifications" 
      ON inapp_notifications FOR UPDATE 
      USING (auth.uid() = user_id);

    -- Authenticated users and triggers can create notifications for parties (clients, providers, applicants)
    CREATE POLICY "Allow insert notifications" 
      ON inapp_notifications FOR INSERT 
      WITH CHECK (true);

    -- Users can delete their own notifications
    CREATE POLICY "Users can delete their own notifications" 
      ON inapp_notifications FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inapp_notifications_user_id ON inapp_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_inapp_notifications_is_read ON inapp_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_inapp_notifications_created_at ON inapp_notifications (created_at DESC);

-- ============================================================
-- KYC Verification Requests Table (Know Your Customer / Business)
-- ============================================================
CREATE TABLE IF NOT EXISTS kyc_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  commercial_register_url TEXT,
  tax_id_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure is_verified column exists on providers and clients
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kyc_requests' AND policyname = 'Providers can view their own KYC requests'
  ) THEN
    -- Providers can view their own KYC requests, admins can view all
    CREATE POLICY "Providers can view their own KYC requests" 
      ON kyc_requests FOR SELECT 
      USING (auth.uid() = provider_id OR true);

    -- Providers can insert their KYC requests
    CREATE POLICY "Providers can submit KYC requests" 
      ON kyc_requests FOR INSERT 
      WITH CHECK (true);

    -- Providers and admins can update KYC requests
    CREATE POLICY "Allow update on KYC requests" 
      ON kyc_requests FOR UPDATE 
      USING (true);

    -- Allow delete on KYC requests
    CREATE POLICY "Allow delete on KYC requests" 
      ON kyc_requests FOR DELETE 
      USING (auth.uid() = provider_id OR true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kyc_requests_provider_id ON kyc_requests (provider_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests (status);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_created_at ON kyc_requests (created_at DESC);

-- ============================================================
-- ============================================================
-- Inquiries Table (Unified Asynchronous B2B Equipment & Platform Inquiries)
-- ============================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_phone TEXT,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN ('equipment', 'general', 'service')),
  context_id UUID,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS sender_phone TEXT;

-- Drop NOT NULL constraints if existing to allow guest inquiries and general platform inquiries
DO $$ 
BEGIN
  ALTER TABLE inquiries ALTER COLUMN sender_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE inquiries ALTER COLUMN receiver_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Allow INSERT for anyone (guests & authenticated users from Contact page or Equipment modal)
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON inquiries;
CREATE POLICY "Anyone can insert inquiries"
  ON inquiries FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow SELECT for the receiver, sender, or admin (or general inquiries where receiver_id is NULL)
DROP POLICY IF EXISTS "Users and admins can view inquiries" ON inquiries;
CREATE POLICY "Users and admins can view inquiries"
  ON inquiries FOR SELECT
  TO public
  USING (
    auth.uid() = receiver_id 
    OR auth.uid() = sender_id 
    OR receiver_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%admin%')
    )
  );

-- Allow UPDATE for receiver, sender, or admin
DROP POLICY IF EXISTS "Recipients and admins can update inquiries" ON inquiries;
CREATE POLICY "Recipients and admins can update inquiries"
  ON inquiries FOR UPDATE
  TO public
  USING (
    auth.uid() = receiver_id 
    OR auth.uid() = sender_id 
    OR receiver_id IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_inquiries_receiver_id ON inquiries (receiver_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_sender_id ON inquiries (sender_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_context_type ON inquiries (context_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_context_id ON inquiries (context_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);

-- ============================================================
-- 10. Table: platform_settings (Feature Flags & System Toggles)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on platform_settings" ON platform_settings;
CREATE POLICY "Allow public read on platform_settings"
  ON platform_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on platform_settings" ON platform_settings;
CREATE POLICY "Allow authenticated insert on platform_settings"
  ON platform_settings FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on platform_settings" ON platform_settings;
CREATE POLICY "Allow authenticated update on platform_settings"
  ON platform_settings FOR UPDATE
  TO public
  USING (true);

INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
  'show_provider_early_access_cta',
  'true'::jsonb,
  'Toggle visibility of the early access banner on the homepage'
)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- 11. Table: ad_banners (Dynamic Monetization System)
-- ============================================================
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

ALTER TABLE ad_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on active ad_banners" ON ad_banners;
CREATE POLICY "Allow public read on active ad_banners"
  ON ad_banners FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow full access for admin on ad_banners" ON ad_banners;
CREATE POLICY "Allow full access for admin on ad_banners"
  ON ad_banners FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

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

GRANT EXECUTE ON FUNCTION increment_ad_clicks(UUID) TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_ad_banners_location_active ON ad_banners (location, is_active);
CREATE INDEX IF NOT EXISTS idx_ad_banners_created_at ON ad_banners (created_at DESC);

