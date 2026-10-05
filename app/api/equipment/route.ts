import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    // 1. Session verification from cookies or authorization header
    const sessionCookie = req.cookies.get('survsta_session')?.value;
    const roleCookie = req.cookies.get('user_role')?.value;
    const authHeader = req.headers.get('authorization');

    const hasValidSession = !!(sessionCookie || roleCookie || (authHeader && authHeader.startsWith('Bearer ')));

    if (!hasValidSession) {
      return NextResponse.json(
        { error: 'غير مصرح: يجب تسجيل الدخول أولاً لإتمام عملية الحذف.' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { error: 'معرّف الجهاز (id) مطلوب لإتمام عملية الحذف.' },
        { status: 400 }
      );
    }

    const { id } = body;

    // 3. Perform admin deletion bypassing RLS
    const { data, error } = await supabaseAdmin
      .from('equipment')
      .delete()
      .eq('id', id)
      .select('id');

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
      deleted: data,
    });
  } catch (err: any) {
    console.error('[API Equipment DELETE Exception]:', err);
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع أثناء معالجة طلب الحذف.' },
      { status: 500 }
    );
  }
}
