-- ============================================================
-- Survsta Platform Global Announcements System
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS global_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_ar TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  theme_type TEXT NOT NULL DEFAULT 'info' CHECK (theme_type IN ('promo', 'alert', 'info', 'maintenance')),
  is_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;

-- 1. Permissive Read Policy: Any client or public visitor can read active announcements
DROP POLICY IF EXISTS "Allow public read on active announcements" ON global_announcements;
CREATE POLICY "Allow public read on active announcements"
  ON global_announcements FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Allow administrative/dashboard full management
DROP POLICY IF EXISTS "Allow full access for admin on global_announcements" ON global_announcements;
CREATE POLICY "Allow full access for admin on global_announcements"
  ON global_announcements FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_announcements_active_created ON global_announcements (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_announcements_expires_at ON global_announcements (expires_at);

-- Seed initial announcement replacing the hardcoded text
INSERT INTO global_announcements (message_ar, cta_text, cta_link, theme_type, is_active)
VALUES (
  '📍 نخدم حاليًا: الإسكندرية والقاهرة والجيزة — التوسع تباعًا لباقي المحافظات',
  'حمل التطبيق',
  '/mobile-app',
  'info',
  true
);
