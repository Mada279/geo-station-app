import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export const dynamic = 'force-dynamic';

const deleteSchema = z.object({ id: z.string().trim().min(1).max(120) });

export async function DELETE(req: NextRequest) {
  // Identity comes from the Supabase session cookie only. The old
  // survsta_session / user_role cookies were unsigned and client-writable.
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json(
      { error: 'غير مصرح: يجب تسجيل الدخول أولاً لإتمام عملية الحذف.' },
      { status: 401 }
    );
  }

  let payload: z.infer<typeof deleteSchema>;
  try {
    payload = deleteSchema.parse(await req.json().catch(() => null));
  } catch {
    return NextResponse.json(
      { error: 'معرّف الجهاز (id) مطلوب لإتمام عملية الحذف.' },
      { status: 400 }
    );
  }

  try {
    const { data: item, error: lookupError } = await supabaseAdmin
      .from('equipment')
      .select('id, title, provider_id')
      .eq('id', payload.id)
      .maybeSingle();

    if (lookupError) {
      console.error('[API Equipment DELETE lookup error]:', lookupError);
      return NextResponse.json({ error: 'تعذر التحقق من ملكية الجهاز.' }, { status: 500 });
    }
    if (!item) {
      return NextResponse.json({ error: 'الجهاز غير موجود أو تم حذفه مسبقاً.' }, { status: 404 });
    }

    const isOwner = !!ctx.providerId && String(item.provider_id) === ctx.providerId;
    if (ctx.role !== 'admin' && !isOwner) {
      return NextResponse.json(
        { error: 'غير مصرح: يمكنك حذف الأجهزة المملوكة لمكتبك فقط.' },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin.from('equipment').delete().eq('id', payload.id);
    if (error) {
      console.error('[API Equipment DELETE Error]:', error);
      return NextResponse.json(
        { error: error.message || 'تعذر حذف الجهاز من قاعدة البيانات.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الجهاز بنجاح من قاعدة البيانات.',
      deleted: [{ id: item.id, title: item.title }],
    });
  } catch (err: any) {
    console.error('[API Equipment DELETE Exception]:', err);
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع أثناء معالجة طلب الحذف.' },
      { status: 500 }
    );
  }
}
