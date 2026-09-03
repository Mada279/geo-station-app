-- ==============================================================================
--   GEO STATION PLATFORM — POSTGRESQL / SUPABASE BACKEND SCRIPTS
--   1. Row Level Security (RLS) Policies
--   2. Database Functions & Triggers (Wallet Pay-Per-Lead & Auto Ratings)
--   3. Storage Buckets & Access Policies
-- ==============================================================================

-- تفعيل الامتدادات الأساسية (إن لم تكن مفعلة مسبقاً)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 0. الدوال المساعدة الأمنية (Helper Security Functions)
-- ==============================================================================

-- دالة للتحقق مما إذا كان المستخدم الحالي Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
      AND role = 'super_admin' 
      AND status = 'active'
  );
$$;

-- دالة للحصول على provider_id الخاص بالمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_provider_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.providers
  WHERE user_id = auth.uid();
$$;

-- ==============================================================================
-- 1. سياسات الأمان على مستوى الصفوف (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- أ. جدول المزودين (providers)
-- ------------------------------------------------------------------------------
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- القراءة متاحة للجميع لتصفح ملفات المكاتب والشركات
CREATE POLICY "providers_select_public"
ON public.providers
FOR SELECT
USING (true);

-- التعديل محصور بصاحب الحساب الموثق فقط
CREATE POLICY "providers_update_owner"
ON public.providers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin())
WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- الإدراج يتم عند إنشاء حساب مزود جديد
CREATE POLICY "providers_insert_owner"
ON public.providers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- ب. جدول الأجهزة وسوق المعدات (equipment)
-- ------------------------------------------------------------------------------
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- القراءة متاحة للعامة للاطلاع على المعدات والأسعار وشهادات المعايرة
CREATE POLICY "equipment_select_public"
ON public.equipment
FOR SELECT
USING (true);

-- التعديل مقتصر على المزود المالك للجهاز
CREATE POLICY "equipment_update_owner"
ON public.equipment
FOR UPDATE
TO authenticated
USING (provider_id = public.get_current_provider_id() OR public.is_super_admin())
WITH CHECK (provider_id = public.get_current_provider_id() OR public.is_super_admin());

-- إضافة جهاز جديد للمكتب الخاص به
CREATE POLICY "equipment_insert_owner"
ON public.equipment
FOR INSERT
TO authenticated
WITH CHECK (provider_id = public.get_current_provider_id());

-- حذف الجهاز بواسطة صاحبه
CREATE POLICY "equipment_delete_owner"
ON public.equipment
FOR DELETE
TO authenticated
USING (provider_id = public.get_current_provider_id() OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- ج. جدول طلبات التواصل والربط (leads)
-- ------------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- المزود يرى فقط الطلبات الموجهة إليه، والعميل يرى طلباته الخاصة، والأدمن يرى الجميع
CREATE POLICY "leads_select_parties"
ON public.leads
FOR SELECT
TO authenticated
USING (
  provider_id = public.get_current_provider_id()
  OR client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  OR public.is_super_admin()
);

-- المزود يمكنه تحديث حالة الطلبات الموجهة إليه فقط (مثل: قيد التفاوض، مغلق)
CREATE POLICY "leads_update_provider"
ON public.leads
FOR UPDATE
TO authenticated
USING (provider_id = public.get_current_provider_id() OR public.is_super_admin())
WITH CHECK (provider_id = public.get_current_provider_id() OR public.is_super_admin());

-- السماح للعملاء والزوار المسجلين بإنشاء طلبات جديدة
CREATE POLICY "leads_insert_client"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- د. جدول حركات المحفظة المالية (wallet_transactions)
-- ------------------------------------------------------------------------------
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- المزود يرى كشف حساب حركاته المالية فقط
CREATE POLICY "wallet_tx_select_provider"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (
  provider_id = public.get_current_provider_id()
  OR public.is_super_admin()
);

-- منع أي إدراج أو تعديل أو حذف مباشر من الـ Frontend لحماية النزاهة المالية
-- (العمليات تتم حصراً عبر الدوال المخزنة SECURITY DEFINER وبوابات الدفع الرسمية)

-- ------------------------------------------------------------------------------
-- هـ. جدول سجل التدقيق الأمني (audit_logs)
-- ------------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- مقتصر تماماً ومحصور فقط على حسابات Super Admin
CREATE POLICY "audit_logs_select_super_admin_only"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- منع التعديل أو الحذف نهائياً (Append-Only Table)
-- الإدراج يتم برمجياً عبر الـ Triggers والدوال السحابية


-- ==============================================================================
-- 2. أتمتة العمليات (FUNCTIONS & TRIGGERS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- أ. دالة فتح الطلب وخصم الرصيد (Pay-Per-Lead Wallet Deduction)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.open_lead_and_charge(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead record;
  v_provider record;
  v_new_balance decimal(12,2);
  v_tx_id uuid;
  v_caller_uid uuid := auth.uid();
BEGIN
  -- 1. جلب بيانات الطلب وقفل السجل لضمان الحماية من التزامن (Prevent Race Conditions)
  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'خطأ: الطلب غير موجود برقم المعرف: %', p_lead_id;
  END IF;

  -- 2. جلب بيانات المزود وقفل سجل المحفظة
  SELECT * INTO v_provider
  FROM public.providers
  WHERE id = v_lead.provider_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'خطأ: ملف المزود المرتبط بالطلب غير مسجل';
  END IF;

  -- 3. التحقق من أمان الصلاحيات (يجب أن يكون صاحب المكتب أو Super Admin)
  IF v_provider.user_id <> v_caller_uid AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'غير مصرح لك بفتح هذا الطلب — ليس تابعاً لحسابك';
  END IF;

  -- 4. التحقق مما إذا كان الطلب قد فُتح وخُصمت رسومه مسبقاً (Idempotent Execution)
  IF v_lead.is_charged AND v_lead.status <> 'new' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_charged', true,
      'message', 'الطلب مفتوح بالفعل ومخصوم مسبقاً',
      'lead_id', v_lead.id,
      'status', v_lead.status,
      'opened_at', v_lead.opened_at
    );
  END IF;

  -- 5. فحص كفاية رصيد المحفظة لرسوم الطلب
  IF v_lead.fee_amount > 0 THEN
    IF v_provider.wallet_balance < v_lead.fee_amount THEN
      RAISE EXCEPTION 'رصيد المحفظة غير كافٍ. الرصيد الحالي: % ج.م، التكلفة المطلوبة: % ج.م. يرجى شحن الرصيد أولاً',
        v_provider.wallet_balance, v_lead.fee_amount;
    END IF;

    -- خصم الرصيد
    v_new_balance := v_provider.wallet_balance - v_lead.fee_amount;

    UPDATE public.providers
    SET wallet_balance = v_new_balance,
        updated_at = now()
    WHERE id = v_provider.id;

    -- تسجيل الحركة المالية في سجل المحفظة
    INSERT INTO public.wallet_transactions (
      id,
      provider_id,
      lead_id,
      amount,
      tx_type,
      balance_after,
      reference_no,
      notes,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_provider.id,
      v_lead.id,
      -v_lead.fee_amount,
      'lead_charge',
      v_new_balance,
      'LEAD-FEE-' || substring(v_lead.id::text, 1, 8) || '-' || extract(epoch from now())::bigint,
      'رسوم فتح بيانات الاتصال لطلب #' || coalesce(v_lead.lead_number::text, '') || ' - ' || v_lead.subject,
      now()
    ) RETURNING id INTO v_tx_id;
  ELSE
    v_new_balance := v_provider.wallet_balance;
  END IF;

  -- 6. تحديث حالة الطلب وتسجيل لحظة الفتح لحساب الـ SLA
  UPDATE public.leads
  SET status = 'opened',
      is_charged = true,
      opened_at = coalesce(opened_at, now()),
      updated_at = now()
  WHERE id = v_lead.id;

  -- 7. توثيق العملية في سجل التدقيق الأمني (Audit Log)
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    entity,
    entity_id,
    before_state,
    after_state,
    note,
    created_at
  ) VALUES (
    v_caller_uid,
    'provider',
    'WALLET_ADJUST',
    'leads',
    v_lead.id::text,
    jsonb_build_object('status', v_lead.status, 'is_charged', v_lead.is_charged),
    jsonb_build_object('status', 'opened', 'is_charged', true, 'fee_amount', v_lead.fee_amount, 'new_wallet_balance', v_new_balance),
    'فتح طلب تواصل مع خصم رسوم الليد',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead.id,
    'status', 'opened',
    'fee_deducted', v_lead.fee_amount,
    'remaining_balance', v_new_balance,
    'transaction_id', v_tx_id
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- ب. زناد الحساب التلقائي للتقييمات (Auto-Calculate Provider Ratings)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id uuid;
  v_avg decimal(3,2);
  v_count int;
BEGIN
  -- تحديد المزود المستهدف بناءً على نوع العملية
  IF TG_OP = 'DELETE' THEN
    v_provider_id := OLD.provider_id;
  ELSE
    v_provider_id := NEW.provider_id;
  END IF;

  -- حساب المتوسط الإحصائي والعدد الكلي للتقييمات المعتمدة والمنشورة فقط
  SELECT 
    coalesce(round(avg(rating)::numeric, 2), 0.00),
    count(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE provider_id = v_provider_id
    AND status = 'published';

  -- تحديث ملف المزود تلقائياً
  UPDATE public.providers
  SET avg_rating = v_avg,
      reviews_count = v_count,
      updated_at = now()
  WHERE id = v_provider_id;

  RETURN NULL;
END;
$$;

-- إنشاء Trigger لمراقبة الإدراج والتعديل والحذف في جدول التقييمات
DROP TRIGGER IF EXISTS trg_sync_provider_rating ON public.reviews;
CREATE TRIGGER trg_sync_provider_rating
AFTER INSERT OR UPDATE OF rating, status OR DELETE
ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_provider_rating();


-- ==============================================================================
-- 3. إعداد مساحات التخزين وسياسات الملفات (SUPABASE STORAGE BUCKETS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- أ. إنشاء الـ Buckets الثلاثة في Supabase Storage
-- ------------------------------------------------------------------------------

-- 1. صور الأجهزة والمعدات (عامة للقراءة)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-images',
  'equipment-images',
  true,
  5242880, -- 5 MB كحد أقصى للصورة
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. شهادات وتقارير المعايرة الفنية (عامة للقراءة لتعزيز الشفافية والمصداقية)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'calibration-certs',
  'calibration-certs',
  true,
  10485760, -- 10 MB للمستندات والشهادات الممسوحة ضوئياً
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. السير الذاتية للمتقدمين على الوظائف (خاصة ومحمية بالكامل)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- ب. سياسات الوصول لحاويات التخزين (Storage Object Policies)
-- ------------------------------------------------------------------------------

-- 1. سياسات bucket صور الأجهزة (equipment-images)
CREATE POLICY "equipment_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-images');

CREATE POLICY "equipment_images_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'equipment-images' 
  AND (public.get_current_provider_id() IS NOT NULL OR public.is_super_admin())
);

CREATE POLICY "equipment_images_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'equipment-images' 
  AND (public.get_current_provider_id() IS NOT NULL OR public.is_super_admin())
);

-- 2. سياسات bucket شهادات المعايرة (calibration-certs)
CREATE POLICY "calibration_certs_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'calibration-certs');

CREATE POLICY "calibration_certs_insert_provider"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'calibration-certs'
  AND (public.get_current_provider_id() IS NOT NULL OR public.is_super_admin())
);

-- 3. سياسات bucket السير الذاتية (resumes) — سرية ومحمية
-- القراءة مسموحة فقط لـ: (1) المتقدم صاحب السيرة أو (2) صاحب العمل ناشر الوظيفة أو (3) Super Admin
CREATE POLICY "resumes_select_applicant_and_job_owner"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND (
    -- أ. المتقدم صاحب الملف (إذا كان مسجلاً بالمنصة ومسار الملف يبدأ بـ auth.uid)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- ب. المزود / الشركة صاحبة الوظيفة التي تم التقديم عليها
    EXISTS (
      SELECT 1 
      FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      JOIN public.providers p ON p.id = j.provider_id
      WHERE p.user_id = auth.uid()
        AND ja.resume_url LIKE '%' || name
    )
    OR
    -- ج. الإدارة العليا
    public.is_super_admin()
  )
);

-- الرفع متاح للمستخدمين المسجلين المتقدمين للوظائف
CREATE POLICY "resumes_insert_applicant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');
