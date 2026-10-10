import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export const dynamic = 'force-dynamic';

const notifySchema = z.object({
  title: z.string().trim().min(3).max(150),
  message: z.string().trim().min(3).max(1000),
  type: z.enum(['system', 'info', 'success', 'warning', 'approval']).default('system'),
  link: z.string().trim().max(300).optional(),
});

// RLS only lets a signed-in user notify themselves or the counterpart of one of
// their orders, so anything aimed at the admin inbox has to be written with the
// service role from here.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const hits = (recent.get(userId) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(userId, hits);
    return true;
  }
  hits.push(now);
  recent.set(userId, hits);
  return false;
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'غير مصرح: يجب تسجيل الدخول أولاً.' }, { status: 401 });
  }

  if (isRateLimited(ctx.user.id)) {
    return NextResponse.json(
      { error: 'لقد أرسلت تنبيهات كثيرة خلال الدقيقة الأخيرة، حاول بعد قليل.' },
      { status: 429 }
    );
  }

  let payload: z.infer<typeof notifySchema>;
  try {
    payload = notifySchema.parse(await request.json());
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'بيانات الطلب غير صالحة';
    return NextResponse.json({ error: message || 'بيانات الطلب غير صالحة' }, { status: 400 });
  }

  const { data: admins, error: adminsError } = await supabaseAdmin
    .from('platform_admins')
    .select('id');

  if (adminsError) {
    return NextResponse.json({ error: 'تعذر تحديد مستلمي التنبيه.' }, { status: 500 });
  }

  const adminIds = (admins || []).map((a: { id: string }) => a.id).filter(Boolean);
  if (adminIds.length === 0) {
    return NextResponse.json({ error: 'لا يوجد مستلمون مسجلون للتنبيه.' }, { status: 404 });
  }

  const sender = `${ctx.name} (${ctx.email})`;
  const { error } = await supabaseAdmin.from('inapp_notifications').insert(
    adminIds.map((userId: string) => ({
      user_id: userId,
      title: payload.title,
      message: `${payload.message}\n— من: ${sender}`,
      type: payload.type,
      link: payload.link || null,
      is_read: false,
    }))
  );

  if (error) {
    return NextResponse.json({ error: `تعذر حفظ التنبيه: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, delivered: adminIds.length });
}
