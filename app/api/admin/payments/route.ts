import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { resolveStoredFileUrls } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx || ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    // 1. Fetch payment requests with joined provider data using supabaseAdmin
    const { data: payData, error: payErr } = await supabaseAdmin
      .from('manual_payment_requests')
      .select(`
        *,
        provider:providers(id, name, company_name, phone, email, wallet_balance)
      `)
      .order('created_at', { ascending: false });

    if (payErr) {
      console.warn('[api/admin/payments] Direct join failed, falling back to multi-step fetch:', payErr.message);

      const { data: rawRequests, error: rawErr } = await supabaseAdmin
        .from('manual_payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawErr) {
        return NextResponse.json({ error: rawErr.message }, { status: 500 });
      }

      if (!rawRequests || rawRequests.length === 0) {
        return NextResponse.json({ requests: [] });
      }

      const providerIds = Array.from(new Set(rawRequests.map((p) => p.provider_id).filter(Boolean)));
      const providersMap = new Map<string, any>();

      if (providerIds.length > 0) {
        const { data: provData } = await supabaseAdmin
          .from('providers')
          .select('id, name, company_name, phone, email, wallet_balance')
          .in('id', providerIds);

        if (provData) {
          provData.forEach((prov) => providersMap.set(prov.id, prov));
        }
      }

      const merged = rawRequests.map((item) => ({
        ...item,
        provider: providersMap.get(item.provider_id) || null,
      }));

      const resolved = await resolveStoredFileUrls(merged, ['receipt_url']);
      return NextResponse.json({ requests: resolved });
    }

    if (!payData || payData.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    // 2. Normalize provider object
    const normalized = payData.map((item: any) => {
      let provObj = null;
      if (item.provider) {
        provObj = Array.isArray(item.provider) ? item.provider[0] : item.provider;
      }
      return {
        ...item,
        provider: provObj || null,
      };
    });

    // 3. Fallback for any records where join was null but provider_id is valid
    const missingProvIds = normalized
      .filter((r) => !r.provider && r.provider_id)
      .map((r) => r.provider_id);

    if (missingProvIds.length > 0) {
      const uniqueMissing = Array.from(new Set(missingProvIds));
      const { data: missingProviders } = await supabaseAdmin
        .from('providers')
        .select('id, name, company_name, phone, email, wallet_balance')
        .in('id', uniqueMissing);

      if (missingProviders && missingProviders.length > 0) {
        const map = new Map(missingProviders.map((p) => [p.id, p]));
        normalized.forEach((req) => {
          if (!req.provider && map.has(req.provider_id)) {
            req.provider = map.get(req.provider_id);
          }
        });
      }
    }

    const resolved = await resolveStoredFileUrls(normalized, ['receipt_url']);
    return NextResponse.json({ requests: resolved });
  } catch (err: any) {
    console.error('[api/admin/payments] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
