-- ============================================================
-- Survsta Platform Settings (Feature Toggles & Configurations)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 1. Permissive Read Policy: Any client or public visitor can read settings (e.g. homepage feature toggles)
DROP POLICY IF EXISTS "Allow public read on platform_settings" ON platform_settings;
CREATE POLICY "Allow public read on platform_settings"
  ON platform_settings FOR SELECT
  TO public
  USING (true);

-- 2. Insert Policy: Allow admins/authenticated users to insert new settings
DROP POLICY IF EXISTS "Allow authenticated insert on platform_settings" ON platform_settings;
CREATE POLICY "Allow authenticated insert on platform_settings"
  ON platform_settings FOR INSERT
  TO public
  WITH CHECK (true);

-- 3. Update Policy: Allow admins/authenticated users to modify settings
DROP POLICY IF EXISTS "Allow authenticated update on platform_settings" ON platform_settings;
CREATE POLICY "Allow authenticated update on platform_settings"
  ON platform_settings FOR UPDATE
  TO public
  USING (true);

-- Insert Default Row for Provider Early Access CTA banner if it doesn't already exist
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
  'show_provider_early_access_cta',
  'true'::jsonb,
  'Toggle visibility of the early access banner on the homepage'
)
ON CONFLICT (setting_key) DO NOTHING;
