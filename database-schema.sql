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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
