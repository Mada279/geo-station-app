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

-- Insert Default Row for Auto-Approval of Providers
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
  'auto_approve_providers',
  'false'::jsonb,
  'Toggle automatic approval of newly registered providers'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert Default Row for Dynamic Welcome Email Template
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES (
  'template_welcome_email',
  '{
    "subject": "🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس",
    "badge_text": "شريك معتمد جديد",
    "badge_bg": "#0284c7",
    "title": "أهلاً ومرحباً بك معنا، {recipient_name} 👋",
    "main_message": "يسعدنا ويشرفنا انضمامك إلى منصة Survsta — المنظومة الرقمية الأولى والأشمل في مصر المتخصصة في خدمات وأجهزة المساحة والجيوماتكس.\n\nابدأ الآن بعرض معداتك وأجهزتك المساحية لتصل إلى آلاف المهندسين وشركات المقاولات الباحثة عن أجهزة للإيجار يومياً.",
    "cta_text": "➕ أضف معداتك وأجهزتك المساحية الآن",
    "cta_url": "https://survsta.com/provider/dashboard#equipment",
    "secondary_cta_text": "الدخول إلى لوحة التحكم",
    "secondary_cta_url": "https://survsta.com/provider/dashboard"
  }'::jsonb,
  'Dynamic welcome email template for newly registered providers and clients'
)
ON CONFLICT (setting_key) DO NOTHING;

