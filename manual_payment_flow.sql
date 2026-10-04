-- ============================================================
-- Survsta Platform: Manual Payment Flow (Vodafone Cash & InstaPay)
-- 1. Tables: manual_payment_requests, wallet_transactions
-- 2. Storage: payment-receipts bucket & policies
-- 3. Atomic Functions: approve_manual_payment, reject_manual_payment
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure providers table has wallet_balance column
ALTER TABLE providers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0.00;

-- 2. Ensure wallet_transactions table exists
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  lead_id UUID,
  amount NUMERIC NOT NULL,
  tx_type TEXT NOT NULL, -- 'deposit', 'lead_charge', 'refund', 'adjustment'
  balance_after NUMERIC NOT NULL,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_provider ON wallet_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

-- 3. Table: manual_payment_requests
CREATE TABLE IF NOT EXISTS manual_payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vodafone_cash', 'instapay', 'Vodafone Cash', 'InstaPay')),
  transfer_reference TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_provider ON manual_payment_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON manual_payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created ON manual_payment_requests(created_at DESC);

-- Enable RLS
ALTER TABLE manual_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for manual_payment_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'manual_payment_requests' AND policyname = 'Allow public read on manual_payment_requests'
  ) THEN
    CREATE POLICY "Allow public read on manual_payment_requests" ON manual_payment_requests FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on manual_payment_requests" ON manual_payment_requests FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update on manual_payment_requests" ON manual_payment_requests FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'Allow public read on wallet_transactions'
  ) THEN
    CREATE POLICY "Allow public read on wallet_transactions" ON wallet_transactions FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on wallet_transactions" ON wallet_transactions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 4. Supabase Storage Bucket: payment-receipts
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage object policies for payment-receipts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Payment Receipts Public Select'
  ) THEN
    CREATE POLICY "Payment Receipts Public Select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Payment Receipts Public Insert'
  ) THEN
    CREATE POLICY "Payment Receipts Public Insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Payment Receipts Public Update'
  ) THEN
    CREATE POLICY "Payment Receipts Public Update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'payment-receipts');
  END IF;
END $$;

-- ============================================================
-- 5. Secure Function: approve_manual_payment
-- ============================================================
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
  -- 1. Fetch & lock request row to prevent race conditions
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

  -- 2. Fetch & lock provider row
  SELECT * INTO v_provider
  FROM public.providers
  WHERE id = v_req.provider_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ملف المزود المرتبط بالطلب غير موجود برقم: %', v_req.provider_id;
  END IF;

  -- 3. Calculate new balance & update provider
  v_new_balance := coalesce(v_provider.wallet_balance, 0) + v_req.amount;

  UPDATE public.providers
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = v_provider.id;

  -- 4. Mark payment request as approved
  UPDATE public.manual_payment_requests
  SET status = 'approved',
      admin_notes = coalesce(p_admin_notes, admin_notes),
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_req.id;

  -- 5. Insert transaction entry in wallet_transactions
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

  -- 6. Send in-app notification to provider
  BEGIN
    INSERT INTO public.inapp_notifications (
      user_id,
      title,
      message,
      type,
      link,
      created_at
    ) VALUES (
      coalesce(v_provider.user_id, v_provider.id),
      'تم شحن رصيد المحفظة بنجاح! 💳',
      'تم اعتماد إيصال التحويل بمبلغ ' || v_req.amount || ' ج.م وإضافته إلى رصيد محفظتك. الرصيد الحالي: ' || v_new_balance || ' ج.م.',
      'success',
      '/provider/dashboard#wallet',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Notification failure should not abort the financial transaction
    NULL;
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

-- ============================================================
-- 6. Secure Function: reject_manual_payment
-- ============================================================
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
BEGIN
  SELECT * INTO v_req
  FROM public.manual_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'طلب الإيداع غير موجود برقم المعرف: %', p_request_id;
  END IF;

  UPDATE public.manual_payment_requests
  SET status = 'rejected',
      admin_notes = p_reason,
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_req.id;

  -- Notify provider of rejection
  BEGIN
    INSERT INTO public.inapp_notifications (
      user_id,
      title,
      message,
      type,
      link,
      created_at
    ) VALUES (
      v_req.provider_id,
      'تنبيه بخصوص إيصال التحويل ⚠️',
      'تعذر اعتماد إيصال التحويل بمبلغ ' || v_req.amount || ' ج.م. سبب الرفض: ' || coalesce(p_reason, 'البيانات غير واضحة أو رقم العملية غير مطابق'),
      'warning',
      '/provider/dashboard#wallet',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req.id,
    'message', 'تم رفض الطلب وتسجيل الملاحظات.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_manual_payment(UUID, TEXT) TO anon, authenticated, service_role;
