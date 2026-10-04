import { supabase } from '@/utils/supabaseClient';

export interface ProviderSuspensionMeta {
  provider_id: string;
  is_suspended: boolean;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  admin_notes?: string | null;
  updated_at: string;
}

const META_KEY = 'providers_control_metadata';

/**
 * Lazy auto-restore calculation.
 * Returns true if provider is currently suspended and has not yet expired.
 */
export function isProviderActiveSuspended(meta?: ProviderSuspensionMeta | null): boolean {
  if (!meta || !meta.is_suspended) return false;
  if (meta.suspended_until) {
    const expiry = new Date(meta.suspended_until);
    if (new Date() >= expiry) {
      // Suspension has expired! Lazy restore
      return false;
    }
  }
  return true;
}

/**
 * Fetches all suspension metadata as a Map of provider_id -> ProviderSuspensionMeta
 */
export async function getProvidersSuspensionMetaMap(): Promise<Map<string, ProviderSuspensionMeta>> {
  const map = new Map<string, ProviderSuspensionMeta>();

  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', META_KEY)
      .maybeSingle();

    if (!error && data && data.setting_value && typeof data.setting_value === 'object') {
      const records = data.setting_value as Record<string, ProviderSuspensionMeta>;
      Object.entries(records).forEach(([id, meta]) => {
        map.set(String(id), meta);
      });
    }
  } catch (err) {
    console.warn('[ProviderControl] Warning fetching suspension map:', err);
  }

  return map;
}

/**
 * Suspends or Restores a provider (God Mode action)
 */
export async function setProviderSuspension({
  providerId,
  isSuspended,
  suspendedUntil = null,
  suspensionReason = null,
  adminNotes = null,
  providerEmail = null,
}: {
  providerId: string;
  isSuspended: boolean;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  adminNotes?: string | null;
  providerEmail?: string | null;
}): Promise<{ success: boolean; error?: any }> {
  const now = new Date().toISOString();
  const idStr = String(providerId);

  try {
    // 1. Update providers table status if possible
    const statusVal = isSuspended ? 'suspended' : 'approved';
    try {
      await supabase
        .from('providers')
        .update({
          status: statusVal,
          // also try updating native columns if migration was executed
          is_suspended: isSuspended,
          suspended_until: suspendedUntil,
          suspension_reason: suspensionReason,
          admin_notes: adminNotes,
        })
        .eq('id', idStr);
    } catch {}

    // Fallback: If native columns don't exist yet, update status column alone
    try {
      await supabase
        .from('providers')
        .update({ status: statusVal })
        .eq('id', idStr);
    } catch {}

    // Also update clients table if email provided
    if (providerEmail) {
      try {
        await supabase
          .from('clients')
          .update({ status: statusVal })
          .eq('email', providerEmail.toLowerCase().trim());
      } catch {}
    }

    // 2. Persist full suspension control record in platform_settings
    const { data } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', META_KEY)
      .maybeSingle();

    let allMeta: Record<string, ProviderSuspensionMeta> = {};
    if (data && data.setting_value && typeof data.setting_value === 'object') {
      allMeta = { ...(data.setting_value as Record<string, ProviderSuspensionMeta>) };
    }

    allMeta[idStr] = {
      provider_id: idStr,
      is_suspended: isSuspended,
      suspended_until: suspendedUntil,
      suspension_reason: suspensionReason,
      admin_notes: adminNotes,
      updated_at: now,
    };

    const { error: saveErr } = await supabase
      .from('platform_settings')
      .upsert(
        {
          setting_key: META_KEY,
          setting_value: allMeta,
          description: 'سجل حظر وإيقاف المزوّدين والمكاتب في منصة Survsta (God Mode)',
          updated_at: now,
        },
        { onConflict: 'setting_key' }
      );

    if (saveErr) throw saveErr;

    // 3. Trigger In-App Notification automatically
    try {
      await supabase.from('inapp_notifications').insert({
        user_id: idStr,
        title: isSuspended ? '⚠️ تنبيه: تم تعليق حساب المزود الخاص بك' : '✅ تم استعادة وتفعيل حسابك',
        message: isSuspended
          ? `تم إيقاف حسابك من قبل إدارة المنصة.${suspensionReason ? ` السبب: ${suspensionReason}.` : ''}${
              suspendedUntil ? ` مدة الإيقاف حتى: ${new Date(suspendedUntil).toLocaleDateString('ar-EG')}.` : ' الحظر دائم لحين مراجعة الإدارة.'
            }`
          : 'تم تفعيل حسابك بنجاح من قبل إدارة المنصة وعادت كافة أجهزتك ووظائفك للظهور في السوق.',
        type: isSuspended ? 'warning' : 'approval',
        link: '/provider/dashboard',
      });
    } catch (notifErr) {
      console.warn('[ProviderControl] In-app notification insert notice:', notifErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[ProviderControl] Error updating provider suspension:', err);
    return { success: false, error: err };
  }
}
