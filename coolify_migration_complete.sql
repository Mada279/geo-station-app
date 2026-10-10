-- ==============================================================================
--   SURVSTA PLATFORM — PRODUCTION COOLIFY / POSTGRESQL MIGRATION (V2 FINAL)
--   الترتيب الصارم لتنفيذ الأوامر (Execution Order):
--   1. إنشاء الهياكل والجداول (Tables Creation - CREATE TABLE IF NOT EXISTS)
--   2. توحيد أنواع البيانات إلى UUID (Data Type Casting)
--   3. الدوال الأساسية (Base Functions: handle_updated_at)
--   4. دوال العمليات المالية والتحكم (RPCs: approve & reject manual payment)
--   5. تنظيف البيانات والروابط (Sanitization & Foreign Keys)
--   6. المشغلات الذكية (Triggers)
--   7. الحماية والخزائن (RLS & Storage Buckets / Policies)
--   8. تحديث كاش PostgREST الفوري (Schema Cache Reload)
-- ==============================================================================

-- ==============================================================================
-- المرحلة 0: تفعيل الامتدادات الأساسية (EXTENSIONS)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- المرحلة 1: إنشاء الهياكل والجداول الأساسية (TABLES CREATION)
-- ==============================================================================

-- 1. جدول المزودين والشركات (providers)
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  governorate TEXT,
  city TEXT,
  address TEXT,
  bio TEXT,
  logo_url TEXT,
  equipment_photos JSONB DEFAULT '[]'::jsonb,
  coverage_areas JSONB DEFAULT '[]'::jsonb,
  commercial_reg TEXT,
  tax_card TEXT,
  license TEXT,
  status TEXT DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  suspended_until TIMESTAMPTZ,
  suspension_reason TEXT,
  admin_notes TEXT,
  wallet_balance NUMERIC DEFAULT 0.00,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- التأكد من وجود كافة الأعمدة المطلوبة في حال تم استيراد الجدول مسبقاً عبر CSV
ALTER TABLE public.providers 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS governorate TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS equipment_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS commercial_reg TEXT,
  ADD COLUMN IF NOT EXISTS tax_card TEXT,
  ADD COLUMN IF NOT EXISTS license TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. جدول العملاء (clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  active_modules JSONB DEFAULT '["client"]'::jsonb,
  preferences JSONB DEFAULT '{"notifications": true, "preferred_categories": []}'::jsonb,
  company_name TEXT,
  category TEXT DEFAULT 'مكتب استشاري',
  status TEXT DEFAULT 'active',
  trust_level TEXT DEFAULT 'silver',
  completed_rentals INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  suspended_until TIMESTAMPTZ,
  suspension_reason TEXT,
  admin_notes TEXT,
  profile_views INTEGER DEFAULT 0,
  coverage_areas JSONB DEFAULT '[]'::jsonb,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS active_modules JSONB DEFAULT '["client"]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"notifications": true, "preferred_categories": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'مكتب استشاري',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'silver',
  ADD COLUMN IF NOT EXISTS completed_rentals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. جدول المعدات والأجهزة المساحية (equipment)
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  title TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT DEFAULT 'SN-UNKNOWN',
  daily_price NUMERIC,
  monthly_price NUMERIC,
  sale_price NUMERIC,
  status TEXT DEFAULT 'متاح للإيجار',
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  calibration_cert_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_flagged_stolen BOOLEAN DEFAULT false,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS serial_number TEXT DEFAULT 'SN-UNKNOWN',
  ADD COLUMN IF NOT EXISTS daily_price NUMERIC,
  ADD COLUMN IF NOT EXISTS monthly_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'متاح للإيجار',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS calibration_cert_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_flagged_stolen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. جدول طلبات واستئجار الأجهزة (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  client_id UUID,
  provider_id UUID,
  equipment_id UUID,
  client_email TEXT,
  equipment_name TEXT,
  category TEXT,
  duration TEXT,
  total_price NUMERIC,
  status TEXT DEFAULT 'قيد الانتظار',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS equipment_id UUID,
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS equipment_name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'قيد الانتظار',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. جدول طلبات الشحن اليدوي (manual_payment_requests)
CREATE TABLE IF NOT EXISTS public.manual_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transfer_reference TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.manual_payment_requests
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transfer_reference TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. جدول حركات وتاريخ المحفظة (wallet_transactions)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  lead_id UUID,
  amount NUMERIC NOT NULL,
  tx_type TEXT NOT NULL, -- 'deposit', 'lead_charge', 'refund', 'adjustment'
  balance_after NUMERIC NOT NULL,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS lead_id UUID,
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS tx_type TEXT,
  ADD COLUMN IF NOT EXISTS balance_after NUMERIC,
  ADD COLUMN IF NOT EXISTS reference_no TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 7. جدول الخدمات المساحية (services)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  price NUMERIC,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 8. جدول توثيق الهوية والشركات (kyc_requests)
CREATE TABLE IF NOT EXISTS public.kyc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  commercial_register_url TEXT,
  tax_id_url TEXT,
  national_id_front_url TEXT,
  national_id_back_url TEXT,
  syndicate_card_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kyc_requests
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS commercial_register_url TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_url TEXT,
  ADD COLUMN IF NOT EXISTS national_id_front_url TEXT,
  ADD COLUMN IF NOT EXISTS national_id_back_url TEXT,
  ADD COLUMN IF NOT EXISTS syndicate_card_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 9. جدول الإشعارات الداخلية (inapp_notifications)
CREATE TABLE IF NOT EXISTS public.inapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inapp_notifications
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 10. جدول تتبع ليدات التواصل (lead_tracking & contact_requests)
CREATE TABLE IF NOT EXISTS public.lead_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  viewer_id TEXT,
  equipment_id UUID,
  client_id UUID,
  equipment_title TEXT,
  lead_type TEXT DEFAULT 'phone',
  client_phone TEXT,
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'charged',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lead_tracking
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS viewer_id TEXT,
  ADD COLUMN IF NOT EXISTS equipment_id UUID,
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS equipment_title TEXT,
  ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'charged',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  viewer_id TEXT,
  equipment_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. سجل الأجهزة المسروقة (stolen_registry)
CREATE TABLE IF NOT EXISTS public.stolen_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID,
  provider_id UUID,
  serial_number TEXT NOT NULL,
  equipment_model TEXT NOT NULL,
  proof_document_url TEXT,
  status TEXT DEFAULT 'verified',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stolen_registry
  ADD COLUMN IF NOT EXISTS reported_by UUID,
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS serial_number TEXT,
  ADD COLUMN IF NOT EXISTS equipment_model TEXT,
  ADD COLUMN IF NOT EXISTS proof_document_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 12. جدول البانرات الإعلانية (ad_banners)
CREATE TABLE IF NOT EXISTS public.ad_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_link TEXT,
  location TEXT DEFAULT 'homepage_hero',
  is_active BOOLEAN DEFAULT true,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ad_banners
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS target_link TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'homepage_hero',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 13. جدول التنبيهات العامة (global_announcements)
CREATE TABLE IF NOT EXISTS public.global_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_ar TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  theme_type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.global_announcements
  ADD COLUMN IF NOT EXISTS message_ar TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_link TEXT,
  ADD COLUMN IF NOT EXISTS theme_type TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 14. جدول إعدادات النظام (platform_settings)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS setting_key TEXT,
  ADD COLUMN IF NOT EXISTS setting_value JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 15. جدول تقييمات المزودين (provider_reviews)
CREATE TABLE IF NOT EXISTS public.provider_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  client_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  reply_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.provider_reviews
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS reply_text TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 16. جدول فريق عمل المزود (provider_team)
CREATE TABLE IF NOT EXISTS public.provider_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.provider_team
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 17. جداول الوظائف والتقديم عليها (job_postings & job_applications)
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT DEFAULT 'دوام كامل',
  salary TEXT,
  experience_level TEXT,
  requirements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  applicant_id UUID,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  experience_years TEXT,
  cv_link TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. جدول ملفات المستقلين (freelancer_profiles)
CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_title TEXT DEFAULT 'مهندس / مساح جيوماتكس',
  bio TEXT,
  years_of_experience INTEGER DEFAULT 1,
  equipment_skills JSONB DEFAULT '[]'::jsonb,
  software_skills JSONB DEFAULT '[]'::jsonb,
  portfolio_url TEXT,
  cv_file_url TEXT,
  hourly_rate TEXT,
  city_or_gov TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. جدول الاستفسارات (inquiries)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID,
  sender_name TEXT,
  sender_phone TEXT,
  receiver_id UUID,
  context_type TEXT DEFAULT 'general',
  context_id UUID,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- المرحلة 2: توحيد أنواع البيانات إلى UUID (DATA TYPE CASTING)
-- ==============================================================================
-- في حال تم استيراد الجداول من CSV وكانت المعرفات من نوع TEXT أو VARCHAR،
-- نقوم بتحويلها بأمان تام إلى UUID عبر regex matching لضمان عدم حدوث operator does not exist: uuid = text.

-- أ. المفاتيح الأساسية (Primary Keys): إذا كانت قيمة الـ id نصاً غير مطابق للـ UUID، يتم توليد gen_random_uuid() فورياً
ALTER TABLE public.providers 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.clients 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.equipment 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.orders 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.manual_payment_requests 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.wallet_transactions 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.services 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.kyc_requests 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.lead_tracking 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

ALTER TABLE public.stolen_registry 
  ALTER COLUMN id TYPE uuid 
  USING (CASE WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid ELSE gen_random_uuid() END);

-- ب. أعمدة المفاتيح الأجنبية (Foreign Keys): تحويلها إلى UUID أو NULL إذا لم تكن مطابقة للشكل السليم
ALTER TABLE public.equipment 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.manual_payment_requests 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.wallet_transactions 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.orders 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.orders 
  ALTER COLUMN client_id TYPE uuid 
  USING (CASE WHEN client_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN client_id::text::uuid ELSE NULL END);

ALTER TABLE public.services 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.kyc_requests 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.lead_tracking 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.stolen_registry 
  ALTER COLUMN reported_by TYPE uuid 
  USING (CASE WHEN reported_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN reported_by::text::uuid ELSE NULL END);

ALTER TABLE public.provider_reviews 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.provider_team 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

ALTER TABLE public.job_postings 
  ALTER COLUMN provider_id TYPE uuid 
  USING (CASE WHEN provider_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN provider_id::text::uuid ELSE NULL END);

-- ج. تحويل أعمدة user_id المرتبطة بنظام التوثيق auth.users
ALTER TABLE public.providers 
  ALTER COLUMN user_id TYPE uuid 
  USING (CASE WHEN user_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::text::uuid ELSE NULL END);

ALTER TABLE public.clients 
  ALTER COLUMN user_id TYPE uuid 
  USING (CASE WHEN user_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::text::uuid ELSE NULL END);

ALTER TABLE public.inapp_notifications 
  ALTER COLUMN user_id TYPE uuid 
  USING (CASE WHEN user_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::text::uuid ELSE NULL END);

-- ==============================================================================
-- المرحلة 3: الدوال الأساسية (BASE FUNCTIONS)
-- ==============================================================================
-- يتم إنشاؤها أولاً قبل تعريف المشغلات (Triggers) لضمان وجودها عند الربط

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- المرحلة 4: دوال العمليات المالية والتحكم (TRANSACTIONAL RPCS)
-- ==============================================================================

-- أ. دالة اعتماد الإيصال اليدوي وشحن الرصيد الفوري (approve_manual_payment)
CREATE OR REPLACE FUNCTION public.approve_manual_payment(
  p_request_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_provider record;
  v_new_balance numeric;
  v_tx_id uuid;
BEGIN
  -- 1. جلب وحبس سجل الطلب لمنع تكرار الاعتماد بالتزامن
  SELECT * INTO v_req
  FROM public.manual_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'طلب الإيداع غير موجود برقم المعرف: %', p_request_id;
  END IF;

  IF v_req.status = 'approved' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_approved', true,
      'message', 'تم اعتماد هذا الطلب وشحنه مسبقاً.'
    );
  END IF;

  -- 2. جلب وحبس سجل المزود
  SELECT * INTO v_provider
  FROM public.providers
  WHERE id = v_req.provider_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ملف المزود المرتبط بالطلب غير موجود برقم: %', v_req.provider_id;
  END IF;

  -- 3. حساب الرصيد الجديد وتحديث جدول المزودين
  v_new_balance := COALESCE(v_provider.wallet_balance, 0) + v_req.amount;

  UPDATE public.providers
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = v_provider.id;

  -- 4. تحديث حالة الطلب إلى معتمد
  UPDATE public.manual_payment_requests
  SET status = 'approved',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_req.id;

  -- 5. تسجيل حركة مالية رسمية في جدول wallet_transactions
  INSERT INTO public.wallet_transactions (
    id,
    provider_id,
    amount,
    tx_type,
    balance_after,
    reference_no,
    notes,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_provider.id,
    v_req.amount,
    'deposit',
    v_new_balance,
    'DEP-' || substring(v_req.id::text, 1, 8) || '-' || extract(epoch from now())::bigint,
    'شحن رصيد يدوي عبر ' || v_req.payment_method || ' (مرجع: ' || v_req.transfer_reference || ')',
    NOW()
  ) RETURNING id INTO v_tx_id;

  -- 6. إرسال إشعار فوري داخل المنصة
  BEGIN
    INSERT INTO public.inapp_notifications (
      user_id,
      title,
      message,
      type,
      link,
      created_at
    ) VALUES (
      COALESCE(v_provider.user_id, v_provider.id),
      'تم شحن رصيد المحفظة بنجاح! 💳',
      'تم اعتماد إيصال التحويل بمبلغ ' || v_req.amount || ' ج.م وإضافته إلى رصيد محفظتك. الرصيد الحالي: ' || v_new_balance || ' ج.م.',
      'success',
      '/provider/dashboard#wallet',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- عدم إيقاف المعاملة المالية في حال تعذر الإشعار
  END;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req.id,
    'amount', v_req.amount,
    'new_balance', v_new_balance,
    'transaction_id', v_tx_id,
    'message', 'تم اعتماد إيصال التحويل وشحن الرصيد بنجاح.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_manual_payment(UUID, TEXT) TO anon, authenticated, service_role;

-- ب. دالة رفض الإيصال اليدوي وتسجيل السبب (reject_manual_payment)
CREATE OR REPLACE FUNCTION public.reject_manual_payment(
  p_request_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_provider record;
BEGIN
  -- 1. جلب وحبس السجل
  SELECT * INTO v_req
  FROM public.manual_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'طلب الإيداع غير موجود برقم المعرف: %', p_request_id;
  END IF;

  -- 2. تحديث الحالة إلى مرفوض
  UPDATE public.manual_payment_requests
  SET status = 'rejected',
      admin_notes = COALESCE(p_reason, admin_notes),
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_req.id;

  -- 3. إرسال إشعار للمزود بتوضيح سبب الرفض
  SELECT * INTO v_provider FROM public.providers WHERE id = v_req.provider_id;
  IF FOUND THEN
    BEGIN
      INSERT INTO public.inapp_notifications (
        user_id,
        title,
        message,
        type,
        link,
        created_at
      ) VALUES (
        COALESCE(v_provider.user_id, v_provider.id),
        'تنبيه: تعذر اعتماد إيصال التحويل ⚠️',
        'تم رفض إيصال التحويل بمبلغ ' || v_req.amount || ' ج.م. السبب: ' || COALESCE(p_reason, 'رقم العملية غير مطابق'),
        'warning',
        '/provider/dashboard#wallet',
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req.id,
    'message', 'تم رفض طلب الشحن وتسجيل السبب بنجاح.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_manual_payment(UUID, TEXT) TO anon, authenticated, service_role;

-- ج. دالة تسجيل نقرات الإعلانات البانر الذرية
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(banner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_banners
  SET clicks = clicks + 1,
      updated_at = NOW()
  WHERE id = banner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_clicks(UUID) TO anon, authenticated, service_role;

-- ==============================================================================
-- المرحلة 5: تنظيف البيانات وإضافة المفاتيح الأجنبية (FOREIGN KEYS & INDEXES)
-- ==============================================================================

-- أ. تنظيف السجلات اليتيمة (Orphan Records) التي تشير إلى معرفات غير موجودة بجدول المزودين أو العملاء
UPDATE public.equipment SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.manual_payment_requests SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.wallet_transactions SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.orders SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.orders SET client_id = NULL 
WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM public.clients WHERE id IS NOT NULL);

UPDATE public.services SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.kyc_requests SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.lead_tracking SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.stolen_registry SET reported_by = NULL 
WHERE reported_by IS NOT NULL AND reported_by NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.provider_reviews SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

UPDATE public.provider_team SET provider_id = NULL 
WHERE provider_id IS NOT NULL AND provider_id NOT IN (SELECT id FROM public.providers WHERE id IS NOT NULL);

-- ب. إضافة قيود المفاتيح الأجنبية بطريقة آمنة لا تتكرر
DO $$
BEGIN
  -- 1. manual_payment_requests -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_manual_payment_provider' AND table_name = 'manual_payment_requests') THEN
    ALTER TABLE public.manual_payment_requests
    ADD CONSTRAINT fk_manual_payment_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 2. equipment -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_equipment_provider' AND table_name = 'equipment') THEN
    ALTER TABLE public.equipment
    ADD CONSTRAINT fk_equipment_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 3. wallet_transactions -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_wallet_transactions_provider' AND table_name = 'wallet_transactions') THEN
    ALTER TABLE public.wallet_transactions
    ADD CONSTRAINT fk_wallet_transactions_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 4. services -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_services_provider' AND table_name = 'services') THEN
    ALTER TABLE public.services
    ADD CONSTRAINT fk_services_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 5. orders -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_orders_provider' AND table_name = 'orders') THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE SET NULL;
  END IF;

  -- 6. orders -> clients
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_orders_client' AND table_name = 'orders') THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_client
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;

  -- 7. kyc_requests -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_kyc_requests_provider' AND table_name = 'kyc_requests') THEN
    ALTER TABLE public.kyc_requests
    ADD CONSTRAINT fk_kyc_requests_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 8. lead_tracking -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_lead_tracking_provider' AND table_name = 'lead_tracking') THEN
    ALTER TABLE public.lead_tracking
    ADD CONSTRAINT fk_lead_tracking_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 9. stolen_registry -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_stolen_registry_provider' AND table_name = 'stolen_registry') THEN
    ALTER TABLE public.stolen_registry
    ADD CONSTRAINT fk_stolen_registry_provider
    FOREIGN KEY (reported_by) REFERENCES public.providers(id) ON DELETE SET NULL;
  END IF;

  -- 10. provider_reviews -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_provider_reviews_provider' AND table_name = 'provider_reviews') THEN
    ALTER TABLE public.provider_reviews
    ADD CONSTRAINT fk_provider_reviews_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;

  -- 11. provider_team -> providers
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_provider_team_provider' AND table_name = 'provider_team') THEN
    ALTER TABLE public.provider_team
    ADD CONSTRAINT fk_provider_team_provider
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ج. إنشاء فهارس التحسين (Performance Indexes)
CREATE INDEX IF NOT EXISTS idx_manual_pay_provider ON public.manual_payment_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_manual_pay_status ON public.manual_payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_manual_pay_created ON public.manual_payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_provider ON public.equipment(provider_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_provider ON public.wallet_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_kyc_provider ON public.kyc_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_lead_tracking_provider ON public.lead_tracking(provider_id);
CREATE INDEX IF NOT EXISTS idx_stolen_registry_sn ON public.stolen_registry(serial_number);
CREATE INDEX IF NOT EXISTS idx_inapp_notifications_user ON public.inapp_notifications(user_id);

-- ==============================================================================
-- المرحلة 6: المشغلات الذكية (TRIGGERS)
-- ==============================================================================

-- أ. Trigger لزيادة الرصيد وتسجيل الحركة تلقائياً حتى لو تم تحديث الطلب عبر استعلام SQL مباشر
CREATE OR REPLACE FUNCTION public.trg_fn_manual_payment_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions 
      WHERE provider_id = NEW.provider_id 
        AND reference_no LIKE 'DEP-%' || substring(NEW.id::text, 1, 8) || '%'
    ) THEN
      UPDATE public.providers
      SET wallet_balance = COALESCE(wallet_balance, 0) + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.provider_id;

      INSERT INTO public.wallet_transactions (
        id, provider_id, amount, tx_type, balance_after, reference_no, notes, created_at
      )
      SELECT 
        gen_random_uuid(),
        NEW.provider_id,
        NEW.amount,
        'deposit',
        p.wallet_balance,
        'DEP-' || substring(NEW.id::text, 1, 8) || '-' || extract(epoch from now())::bigint,
        'شحن رصيد يدوي - اعتماد تلقائي عبر النظام (مرجع: ' || NEW.transfer_reference || ')',
        NOW()
      FROM public.providers p
      WHERE p.id = NEW.provider_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_manual_payment_wallet_update ON public.manual_payment_requests;
CREATE TRIGGER trg_manual_payment_wallet_update
AFTER UPDATE OF status ON public.manual_payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_manual_payment_approved();

-- ب. مشغلات التحديث التلقائي لحقل updated_at
DROP TRIGGER IF EXISTS trg_providers_updated_at ON public.providers;
CREATE TRIGGER trg_providers_updated_at BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_equipment_updated_at ON public.equipment;
CREATE TRIGGER trg_equipment_updated_at BEFORE UPDATE ON public.equipment
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_manual_payments_updated_at ON public.manual_payment_requests;
CREATE TRIGGER trg_manual_payments_updated_at BEFORE UPDATE ON public.manual_payment_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_kyc_updated_at ON public.kyc_requests;
CREATE TRIGGER trg_kyc_updated_at BEFORE UPDATE ON public.kyc_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_ad_banners_updated_at ON public.ad_banners;
CREATE TRIGGER trg_ad_banners_updated_at BEFORE UPDATE ON public.ad_banners
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_global_announcements_updated_at ON public.global_announcements;
CREATE TRIGGER trg_global_announcements_updated_at BEFORE UPDATE ON public.global_announcements
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- المرحلة 7: الحماية والخزائن (RLS & STORAGE BUCKETS / POLICIES)
-- ==============================================================================

-- أ. تفعيل الـ RLS على كل الجداول
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stolen_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- ب. تطبيق سياسات الوصول الشاملة المتوافقة مع مفتاح anon و authenticated
DROP POLICY IF EXISTS "providers_all_access" ON public.providers;
CREATE POLICY "providers_all_access" ON public.providers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "clients_all_access" ON public.clients;
CREATE POLICY "clients_all_access" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "equipment_all_access" ON public.equipment;
CREATE POLICY "equipment_all_access" ON public.equipment FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "orders_all_access" ON public.orders;
CREATE POLICY "orders_all_access" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "services_all_access" ON public.services;
CREATE POLICY "services_all_access" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "manual_payments_all_access" ON public.manual_payment_requests;
CREATE POLICY "manual_payments_all_access" ON public.manual_payment_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "wallet_tx_all_access" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_all_access" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kyc_requests_all_access" ON public.kyc_requests;
CREATE POLICY "kyc_requests_all_access" ON public.kyc_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "lead_tracking_all_access" ON public.lead_tracking;
CREATE POLICY "lead_tracking_all_access" ON public.lead_tracking FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "contact_requests_all_access" ON public.contact_requests;
CREATE POLICY "contact_requests_all_access" ON public.contact_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stolen_registry_all_access" ON public.stolen_registry;
CREATE POLICY "stolen_registry_all_access" ON public.stolen_registry FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ad_banners_all_access" ON public.ad_banners;
CREATE POLICY "ad_banners_all_access" ON public.ad_banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "global_announcements_all_access" ON public.global_announcements;
CREATE POLICY "global_announcements_all_access" ON public.global_announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "inapp_notifications_all_access" ON public.inapp_notifications;
CREATE POLICY "inapp_notifications_all_access" ON public.inapp_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "platform_settings_all_access" ON public.platform_settings;
CREATE POLICY "platform_settings_all_access" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "provider_reviews_all_access" ON public.provider_reviews;
CREATE POLICY "provider_reviews_all_access" ON public.provider_reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "provider_team_all_access" ON public.provider_team;
CREATE POLICY "provider_team_all_access" ON public.provider_team FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "job_postings_all_access" ON public.job_postings;
CREATE POLICY "job_postings_all_access" ON public.job_postings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "job_applications_all_access" ON public.job_applications;
CREATE POLICY "job_applications_all_access" ON public.job_applications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "freelancer_profiles_all_access" ON public.freelancer_profiles;
CREATE POLICY "freelancer_profiles_all_access" ON public.freelancer_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "inquiries_all_access" ON public.inquiries;
CREATE POLICY "inquiries_all_access" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);

-- ج. إعداد وتأمين خزائن الملفات (Storage Buckets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('equipment-images', 'equipment-images', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('provider-images', 'provider-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('attachments', 'attachments', true, 20971520, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('payment-receipts', 'payment-receipts', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('receipts', 'receipts', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('ads', 'ads', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('calibration-certs', 'calibration-certs', true, 15728640, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('kyc-documents', 'kyc-documents', true, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg']),
  ('resumes', 'resumes', true, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- سياسات الوصول لجدول storage.objects
DROP POLICY IF EXISTS "Public Access for Public Buckets" ON storage.objects;
CREATE POLICY "Public Access for Public Buckets"
ON storage.objects FOR SELECT
USING (bucket_id IN (
  'equipment-images', 'provider-images', 'attachments', 'payment-receipts', 
  'receipts', 'ads', 'calibration-certs', 'kyc-documents', 'resumes'
));

DROP POLICY IF EXISTS "Allow Upload to Public Buckets" ON storage.objects;
CREATE POLICY "Allow Upload to Public Buckets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN (
  'equipment-images', 'provider-images', 'attachments', 'payment-receipts', 
  'receipts', 'ads', 'calibration-certs', 'kyc-documents', 'resumes'
));

DROP POLICY IF EXISTS "Allow Update to Public Buckets" ON storage.objects;
CREATE POLICY "Allow Update to Public Buckets"
ON storage.objects FOR UPDATE
USING (bucket_id IN (
  'equipment-images', 'provider-images', 'attachments', 'payment-receipts', 
  'receipts', 'ads', 'calibration-certs', 'kyc-documents', 'resumes'
))
WITH CHECK (bucket_id IN (
  'equipment-images', 'provider-images', 'attachments', 'payment-receipts', 
  'receipts', 'ads', 'calibration-certs', 'kyc-documents', 'resumes'
));

DROP POLICY IF EXISTS "Allow Delete to Public Buckets" ON storage.objects;
CREATE POLICY "Allow Delete to Public Buckets"
ON storage.objects FOR DELETE
USING (bucket_id IN (
  'equipment-images', 'provider-images', 'attachments', 'payment-receipts', 
  'receipts', 'ads', 'calibration-certs', 'kyc-documents', 'resumes'
));

-- ==============================================================================
-- المرحلة 8: تحديث كاش PostgREST الفوري (SCHEMA CACHE RELOAD)
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
