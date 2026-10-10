import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { egyptianPhoneSchema } from '@/lib/validations/phone';
import { clientIpOf, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const orderSchema = z.object({
  equipmentId: z.string().trim().min(1).max(120),
  rentalType: z.enum(['daily', 'monthly']),
  // Days for a daily rental, months for a monthly one.
  duration: z.coerce.number().int().min(1).max(365),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البدء غير صالح')
    .optional(),
  clientName: z.string().trim().min(2, 'يرجى إدخال الاسم').max(150),
  clientPhone: egyptianPhoneSchema,
  clientEmail: z.email().optional().or(z.literal('')),
  projectLocation: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const BLOCKED_EQUIPMENT_STATUS = ['مؤجر', 'rented', 'قيد الصيانة', 'مرفوض', 'sold', 'مبيع'];

function generateOrderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${stamp}-${suffix}`;
}

/**
 * The only place an order is created. The price is recomputed from the stored
 * equipment rates, so a caller can never submit their own amount, and the
 * client identity comes from the session rather than the request body.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpOf(request);
  if (!rateLimit(`orders:${ip}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'تم تجاوز الحد المسموح لطلبات الحجز. يرجى المحاولة بعد قليل.' },
      { status: 429 }
    );
  }

  let payload: z.infer<typeof orderSchema>;
  try {
    payload = orderSchema.parse(await request.json().catch(() => null));
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'بيانات الطلب غير صالحة';
    return NextResponse.json({ error: message || 'بيانات الطلب غير صالحة' }, { status: 400 });
  }

  const { data: item, error: itemError } = await supabaseAdmin
    .from('equipment')
    .select('id, title, category, daily_price, monthly_price, provider_id, is_flagged_stolen, status')
    .eq('id', payload.equipmentId)
    .maybeSingle();

  if (itemError) {
    console.error('[OrdersAPI] Equipment lookup error:', itemError);
    return NextResponse.json({ error: 'تعذر التحقق من بيانات الجهاز.' }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json({ error: 'الجهاز غير متاح أو تم حذفه.' }, { status: 404 });
  }
  if (item.is_flagged_stolen || BLOCKED_EQUIPMENT_STATUS.includes((item.status || '').trim())) {
    return NextResponse.json({ error: 'هذا الجهاز غير متاح للحجز حالياً.' }, { status: 409 });
  }

  let providerId: string | null = item.provider_id ? String(item.provider_id) : null;
  if (providerId) {
    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('id, status')
      .eq('id', providerId)
      .maybeSingle();

    if (provider && ['suspended', 'blocked', 'rejected'].includes(provider.status || '')) {
      return NextResponse.json(
        { error: 'المكتب المالك لهذا الجهاز موقوف حالياً ولا يستقبل طلبات.' },
        { status: 409 }
      );
    }
    if (!provider) providerId = null;
  }

  const dailyRate = item.daily_price != null ? Number(item.daily_price) : null;
  const monthlyRate = item.monthly_price != null ? Number(item.monthly_price) : null;
  const isMonthly = payload.rentalType === 'monthly';

  const unitRate = isMonthly
    ? monthlyRate ?? (dailyRate != null ? dailyRate * 30 : 0)
    : dailyRate ?? (monthlyRate != null ? Math.ceil(monthlyRate / 30) : 0);

  const totalAmount = unitRate * payload.duration;
  const rentalDays = isMonthly ? payload.duration * 30 : payload.duration;
  const durationLabel = `${payload.duration} ${isMonthly ? 'شهر' : 'يوم'}${
    payload.startDate ? ` - تاريخ البدء: ${payload.startDate}` : ''
  }`;

  // Guests can book, but a signed-in caller is linked to their real profile.
  const ctx = await getAuthContext();

  const orderRow = {
    order_number: generateOrderNumber(),
    provider_id: providerId,
    client_id: ctx?.clientId || null,
    client_name: payload.clientName,
    client_phone: payload.clientPhone,
    client_email: payload.clientEmail || ctx?.email || null,
    equipment_id: String(item.id),
    equipment_name: item.title,
    category: item.category,
    duration: durationLabel,
    rental_type: payload.rentalType,
    rental_days: rentalDays,
    start_date: payload.startDate || null,
    notes: [payload.projectLocation ? `موقع المشروع: ${payload.projectLocation}` : '', payload.notes || '']
      .filter(Boolean)
      .join(' | ') || null,
    total_amount: totalAmount,
    status: 'pending',
  };

  // The unique index on order_number makes a collision fail loudly instead of
  // silently overwriting; three attempts is far more than enough.
  let inserted: any = null;
  let lastError: any = null;
  for (let attempt = 0; attempt < 3 && !inserted; attempt += 1) {
    if (attempt > 0) orderRow.order_number = generateOrderNumber();
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([orderRow])
      .select('id, order_number, total_amount, status')
      .single();

    if (error) {
      lastError = error;
      if (error.code !== '23505') break;
      continue;
    }
    inserted = data;
  }

  if (!inserted) {
    console.error('[OrdersAPI] Insert failed:', lastError);
    return NextResponse.json(
      { error: lastError?.message || 'تعذر تسجيل طلب الحجز، يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }

  if (providerId) {
    const { error: notifError } = await supabaseAdmin.from('inapp_notifications').insert([
      {
        user_id: providerId,
        title: 'طلب استئجار جديد 📥',
        message: `طلب استئجار جديد لجهاز (${item.title}) بقيمة ${totalAmount.toLocaleString(
          'en-US'
        )} ج.م من ${payload.clientName} (${payload.clientPhone}).`,
        type: 'info',
        link: '/provider/orders',
      },
    ]);
    if (notifError) console.warn('[OrdersAPI] Provider notification skipped:', notifError.message);
  }

  return NextResponse.json({
    success: true,
    orderNumber: inserted.order_number,
    orderId: inserted.id,
    totalAmount: Number(inserted.total_amount ?? totalAmount),
    currency: 'EGP',
    unitRate,
    rentalType: payload.rentalType,
    duration: payload.duration,
    status: inserted.status,
  });
}
