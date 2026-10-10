-- ============================================================================
-- Migration: 0003_secure_financial_functions.sql
-- Purpose: Fix Critical Vulnerabilities C2, C3, and C4 from Architecture & Security Audit
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Fix C2 (Financial Vulnerability - Secure Financial RPC Functions)
-- ----------------------------------------------------------------------------

-- Recreate approve_manual_payment with strict platform admin authorization check
CREATE OR REPLACE FUNCTION public.approve_manual_payment(
    p_request_id uuid,
    p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_provider_id uuid;
    v_amount numeric;
    v_status text;
BEGIN
    -- SECURITY CHECK (C2): Must be platform administrator
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only platform admins can approve payments.';
    END IF;

    -- Fetch and lock request row
    SELECT provider_id, amount, status INTO v_provider_id, v_amount, v_status
    FROM public.manual_payment_requests 
    WHERE id = p_request_id
    FOR UPDATE;
    
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Request not found'; 
    END IF;
    
    IF v_status != 'pending' THEN 
        RAISE EXCEPTION 'Request is not pending'; 
    END IF;

    -- 1. Update payment request status
    UPDATE public.manual_payment_requests 
    SET status = 'approved', 
        admin_notes = coalesce(p_admin_notes, admin_notes), 
        reviewed_at = NOW(),
        updated_at = NOW() 
    WHERE id = p_request_id;

    -- 2. Update provider wallet balance (Survsta providers table)
    UPDATE public.providers 
    SET wallet_balance = coalesce(wallet_balance, 0) + v_amount, 
        updated_at = NOW() 
    WHERE id = v_provider_id;

    -- 3. Update provider_wallets table if exists in schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_wallets') THEN
        EXECUTE 'UPDATE public.provider_wallets SET balance = balance + $1, updated_at = NOW() WHERE provider_id = $2'
        USING v_amount, v_provider_id;
    END IF;

    -- 4. Record transaction in wallet_transactions if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_transactions') THEN
        INSERT INTO public.wallet_transactions (
            provider_id, amount, tx_type, notes, created_at
        ) VALUES (
            v_provider_id, v_amount, 'deposit', 
            coalesce(p_admin_notes, 'شحن يدوي معتمد من الإدارة'), 
            NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'request_id', p_request_id, 
        'provider_id', v_provider_id, 
        'amount', v_amount
    );
END;
$$;

-- Recreate reject_manual_payment with strict platform admin authorization check
CREATE OR REPLACE FUNCTION public.reject_manual_payment(
    p_request_id uuid,
    p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status text;
BEGIN
    -- SECURITY CHECK (C2): Must be platform administrator
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only platform admins can reject payments.';
    END IF;

    SELECT status INTO v_status 
    FROM public.manual_payment_requests 
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Request not found'; 
    END IF;
    
    IF v_status != 'pending' THEN 
        RAISE EXCEPTION 'Request is not pending'; 
    END IF;

    UPDATE public.manual_payment_requests 
    SET status = 'rejected', 
        admin_notes = coalesce(p_admin_notes, admin_notes), 
        reviewed_at = NOW(),
        updated_at = NOW() 
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true, 
        'request_id', p_request_id, 
        'status', 'rejected'
    );
END;
$$;

-- Secure execution privileges (revoke from anon/public, grant strictly to authenticated and service_role)
REVOKE EXECUTE ON FUNCTION public.approve_manual_payment(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_manual_payment(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.approve_manual_payment(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_manual_payment(uuid, text) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 2. Fix C3 & C4 (Drop Wide-Open Policies & Secure KYC / Financial RLS)
-- ----------------------------------------------------------------------------

-- Drop dangerous wide-open _all_access policies across tables
DROP POLICY IF EXISTS "manual_payments_all_access" ON public.manual_payment_requests;
DROP POLICY IF EXISTS "kyc_requests_all_access" ON public.kyc_requests;
DROP POLICY IF EXISTS "orders_all_access" ON public.orders;
DROP POLICY IF EXISTS "wallet_tx_all_access" ON public.wallet_transactions;
DROP POLICY IF EXISTS "services_all_access" ON public.services;
DROP POLICY IF EXISTS "stolen_all_access" ON public.stolen_registry;
DROP POLICY IF EXISTS "leads_all_access" ON public.lead_tracking;
DROP POLICY IF EXISTS "notif_all_access" ON public.inapp_notifications;
DROP POLICY IF EXISTS "announcements_all_access" ON public.global_announcements;

-- Drop wide-open KYC policies on provider_kyc_documents (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_kyc_documents') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for KYC documents" ON public.provider_kyc_documents';
        EXECUTE 'DROP POLICY IF EXISTS "Enable insert for KYC documents" ON public.provider_kyc_documents';
        EXECUTE 'DROP POLICY IF EXISTS "Enable update for KYC documents" ON public.provider_kyc_documents';
        EXECUTE 'DROP POLICY IF EXISTS "Enable delete for KYC documents" ON public.provider_kyc_documents';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_select_policy" ON public.provider_kyc_documents';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_insert_policy" ON public.provider_kyc_documents';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_update_policy" ON public.provider_kyc_documents';

        EXECUTE 'ALTER TABLE public.provider_kyc_documents ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "kyc_select_policy" ON public.provider_kyc_documents FOR SELECT TO authenticated USING (auth.uid() = provider_id OR public.is_platform_admin())';
        EXECUTE 'CREATE POLICY "kyc_insert_policy" ON public.provider_kyc_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id)';
        EXECUTE 'CREATE POLICY "kyc_update_policy" ON public.provider_kyc_documents FOR UPDATE TO authenticated USING (auth.uid() = provider_id OR public.is_platform_admin())';
    END IF;
END $$;

-- Drop wide-open policies and apply strict RLS on kyc_requests table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kyc_requests') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Providers can view their own KYC requests" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Providers can submit KYC requests" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Allow update on KYC requests" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "Allow delete on KYC requests" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc: owner read" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc: owner insert" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc: admin update" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc: admin all" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_requests_select_policy" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_requests_insert_policy" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_requests_update_policy" ON public.kyc_requests';
        EXECUTE 'DROP POLICY IF EXISTS "kyc_requests_admin_all" ON public.kyc_requests';

        EXECUTE 'ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "kyc_requests_select_policy" ON public.kyc_requests FOR SELECT TO authenticated USING (provider_id = public.current_provider_id() OR public.is_platform_admin())';
        EXECUTE 'CREATE POLICY "kyc_requests_insert_policy" ON public.kyc_requests FOR INSERT TO authenticated WITH CHECK (provider_id = public.current_provider_id())';
        EXECUTE 'CREATE POLICY "kyc_requests_update_policy" ON public.kyc_requests FOR UPDATE TO authenticated USING (public.is_platform_admin())';
        EXECUTE 'CREATE POLICY "kyc_requests_admin_all" ON public.kyc_requests FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin())';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Notify PostgREST schema cache
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
