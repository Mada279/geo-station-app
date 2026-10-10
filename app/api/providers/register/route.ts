import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { egyptianPhoneSchema } from '@/lib/validations/phone';
import { buildProviderEmail, sendPlatformEmail } from '@/lib/email/providerEmail';
import { clientIpOf, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'يرجى إدخال الاسم').max(150),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: egyptianPhoneSchema,
  password: z.string().min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف').max(128),
  organization: z.string().trim().max(200).optional(),
  governorate: z.string().trim().max(100).optional(),
  location: z.string().trim().max(300).optional(),
  equipmentPhotos: z.array(z.string().trim().max(600)).max(8).optional(),
});

/**
 * Provider sign-up runs server-side so the auth user and the providers row are
 * created together with a service-role client: the RLS insert policy only
 * accepts a row whose email matches the caller, which a brand-new signup cannot
 * satisfy from the browser when email confirmation is enabled.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpOf(request);
  if (!rateLimit(`register:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'تم تجاوز حد محاولات التسجيل. يرجى المحاولة بعد 10 دقائق.' },
      { status: 429 }
    );
  }

  let payload: z.infer<typeof registerSchema>;
  try {
    payload = registerSchema.parse(await request.json().catch(() => null));
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'بيانات التسجيل غير صالحة';
    return NextResponse.json({ error: message || 'بيانات التسجيل غير صالحة' }, { status: 400 });
  }

  const photos = payload.equipmentPhotos || [];
  const displayName = payload.organization
    ? `${payload.organization} (${payload.name})`
    : payload.name;
  const fullLocation = payload.location
    ? `${payload.governorate || ''} — ${payload.location}`.trim()
    : payload.governorate || '';

  const { data: existingProvider } = await supabaseAdmin
    .from('providers')
    .select('id')
    .ilike('email', payload.email)
    .maybeSingle();
  const { data: existingClient } = await supabaseAdmin
    .from('clients')
    .select('id')
    .ilike('email', payload.email)
    .maybeSingle();

  if (existingProvider || existingClient) {
    return NextResponse.json(
      { error: 'هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول مباشرة.' },
      { status: 409 }
    );
  }

  const { data: autoApproveRow } = await supabaseAdmin
    .from('platform_settings')
    .select('setting_value')
    .eq('setting_key', 'auto_approve_providers')
    .maybeSingle();

  const isAutoApproved =
    autoApproveRow?.setting_value === true || autoApproveRow?.setting_value === 'true';

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      name: displayName,
      role: 'provider',
      phone: payload.phone,
      organization: payload.organization || displayName,
    },
    app_metadata: { role: 'provider' },
  });

  if (authError || !authData?.user) {
    const message = authError?.message || 'تعذر إنشاء بيانات الدخول';
    if (message.includes('already been registered') || message.includes('already exists')) {
      return NextResponse.json(
        { error: 'هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول مباشرة.' },
        { status: 409 }
      );
    }
    console.error('[ProvidersRegisterAPI] Auth creation failed:', message);
    return NextResponse.json({ error: 'تعذر إنشاء حساب الدخول، يرجى المحاولة لاحقاً.' }, { status: 500 });
  }

  const userId = authData.user.id;

  const { data: providerRow, error: insertError } = await supabaseAdmin
    .from('providers')
    .insert([
      {
        user_id: userId,
        name: displayName,
        email: payload.email,
        phone: Number(payload.phone),
        location: fullLocation || null,
        status: isAutoApproved ? 'approved' : 'pending',
        coverage_areas: payload.governorate ? [payload.governorate] : [],
        logo_url: photos.length > 0 ? photos[0] : null,
        equipment_photos: photos,
      },
    ])
    .select('id, status')
    .single();

  if (insertError || !providerRow) {
    // Never leave an auth user without its profile row behind.
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.error('[ProvidersRegisterAPI] Provider insert failed:', insertError);
    return NextResponse.json(
      { error: 'تعذر حفظ بيانات المكتب: ' + (insertError?.message || 'خطأ غير معروف') },
      { status: 500 }
    );
  }

  try {
    const { subject, html } = await buildProviderEmail({
      actionType: 'welcome',
      recipientName: displayName,
      userType: 'provider',
    });
    await sendPlatformEmail(payload.email, subject, html);
  } catch (mailErr) {
    console.warn('[ProvidersRegisterAPI] Welcome mail skipped:', mailErr);
  }

  return NextResponse.json({
    success: true,
    providerId: providerRow.id,
    email: payload.email,
    status: providerRow.status,
    autoApproved: isAutoApproved,
  });
}
