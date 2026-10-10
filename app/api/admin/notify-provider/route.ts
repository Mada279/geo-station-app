import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/serverAuth';
import { buildProviderEmail, sendPlatformEmail } from '@/lib/email/providerEmail';

export const dynamic = 'force-dynamic';

const notifySchema = z.object({
  providerEmail: z.email().optional(),
  email: z.email().optional(),
  providerName: z.string().trim().max(150).optional(),
  name: z.string().trim().max(150).optional(),
  actionType: z.enum(['suspended', 'approved', 'needs_revision', 'restored', 'welcome']),
  userType: z.enum(['provider', 'client', 'engineer']).optional(),
  reason: z.string().trim().max(2000).optional(),
  suspendedUntil: z.string().trim().max(64).optional(),
});

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'غير مصرح: يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }

  let payload: z.infer<typeof notifySchema>;
  try {
    payload = notifySchema.parse(await request.json());
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'بيانات الطلب غير صالحة';
    return NextResponse.json({ error: message || 'بيانات الطلب غير صالحة' }, { status: 400 });
  }

  const recipientEmail = (payload.providerEmail || payload.email || '').trim().toLowerCase();
  const recipientName = (payload.providerName || payload.name || 'شريكنا العزيز').trim();
  const isAdmin = ctx.role === 'admin';

  // A non-admin may only trigger the welcome mail addressed to their own account
  // (the onboarding flow does exactly that). Every administrative action —
  // suspension, approval, revision requests — stays admin-only.
  if (!isAdmin && (payload.actionType !== 'welcome' || recipientEmail !== ctx.email)) {
    return NextResponse.json(
      { error: 'غير مصرح: هذا الإجراء متاح لإدارة المنصة فقط.' },
      { status: 403 }
    );
  }

  try {
    const { subject, html } = await buildProviderEmail({
      actionType: payload.actionType,
      recipientName,
      userType: payload.userType,
      reason: payload.reason,
      suspendedUntil: payload.suspendedUntil,
    });

    const result = await sendPlatformEmail(recipientEmail, subject, html);

    if (result.warning) {
      return NextResponse.json({ success: true, warning: result.warning });
    }
    if (!result.sent) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[NotifyProviderAPI] Error sending email:', err);
    return NextResponse.json(
      { error: err?.message || 'فشل إرسال البريد الإلكتروني' },
      { status: 500 }
    );
  }
}
