'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseClient';
import { getEquipmentImageUrl, getDefaultCategoryImage } from '@/utils/helpers';

export interface ClientTrackedOrder {
  id: string;
  order_number: string;
  client_id?: string;
  provider_id?: string;
  equipment_name: string;
  category?: string;
  duration?: string;
  total_price?: number;
  status: string; // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string;
  // Joined Equipment details
  equipment?: {
    id?: string;
    title?: string;
    model?: string;
    category?: string;
    image_url?: string;
    daily_price?: number;
    serial_number?: string;
  };
  // Joined Provider details
  provider?: {
    id?: string;
    name?: string;
    company_name?: string;
    phone?: string;
    location?: string;
    whatsapp_url?: string;
  };
}

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; badgeClass: string; icon: string; step: number; desc: string }
> = {
  pending: {
    label: 'قيد الانتظار والمراجعة',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⏳',
    step: 1,
    desc: 'تم إرسال الطلب، وبانتظار موافقة المزوّد وتأكيد توافر الجهاز.',
  },
  'قيد الانتظار': {
    label: 'قيد الانتظار والمراجعة',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⏳',
    step: 1,
    desc: 'تم إرسال الطلب، وبانتظار موافقة المزوّد وتأكيد توافر الجهاز.',
  },
  confirmed: {
    label: 'تم التأكيد وتجهيز الجهاز',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: '✓',
    step: 2,
    desc: 'وافق المزوّد على طلبك وجاري فحص ومعايرة الجهاز للتسليم.',
  },
  'تم التأكيد': {
    label: 'تم التأكيد وتجهيز الجهاز',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: '✓',
    step: 2,
    desc: 'وافق المزوّد على طلبك وجاري فحص ومعايرة الجهاز للتسليم.',
  },
  in_progress: {
    label: 'جاري التنفيذ في الموقع',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: '⚙️',
    step: 3,
    desc: 'تم استلام الجهاز وبدأ العمل المساحي الميداني بالمشروع.',
  },
  'جاري التنفيذ': {
    label: 'جاري التنفيذ في الموقع',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: '⚙️',
    step: 3,
    desc: 'تم استلام الجهاز وبدأ العمل المساحي الميداني بالمشروع.',
  },
  completed: {
    label: 'مكتمل بنجاح',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '🎉',
    step: 4,
    desc: 'تم تسليم الجهاز وإنهاء مدة الإيجار بنجاح وتسوية المعاملة.',
  },
  مكتمل: {
    label: 'مكتمل بنجاح',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '🎉',
    step: 4,
    desc: 'تم تسليم الجهاز وإنهاء مدة الإيجار بنجاح وتسوية المعاملة.',
  },
  cancelled: {
    label: 'ملغي / تم الإلغاء',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '✕',
    step: 0,
    desc: 'تم إلغاء هذا الطلب.',
  },
  ملغي: {
    label: 'ملغي / تم الإلغاء',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '✕',
    step: 0,
    desc: 'تم إلغاء هذا الطلب.',
  },
};

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<ClientTrackedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Client IDs
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [clientDbId, setClientDbId] = useState<string | null>(null);

  // Cancellation State
  const [orderToCancel, setOrderToCancel] = useState<ClientTrackedOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<ClientTrackedOrder | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to format WhatsApp phone
  const getWhatsAppLink = (phone: string, orderNumber: string, equipName: string) => {
    let clean = (phone || '01000000000').replace(/[^0-9]/g, '');
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '2' + clean;
    }
    const msg = encodeURIComponent(
      `مرحباً، أتواصل معك بخصوص الطلب رقم (${orderNumber}) لجهاز (${equipName}) على منصة Survsta.`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  };

  // Fetch orders and perform relational joins
  const fetchClientOrders = async () => {
    setIsLoading(true);
    try {
      let authId: string | null = null;
      let dbId: string | null = null;

      // 1. Supabase Auth
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authId = authData.user.id;
      }

      // 2. Local session fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!authId && parsed.id) authId = parsed.id;
          } catch {}
        }
      }

      setActiveUserId(authId);

      // 3. Resolve client record ID in clients table
      if (authId) {
        const { data: cRow } = await supabase
          .from('clients')
          .select('id')
          .or(`user_id.eq.${authId},id.eq.${authId}`)
          .maybeSingle();

        if (cRow?.id) {
          dbId = cRow.id;
          setClientDbId(cRow.id);
        }
      }

      // 4. Fetch orders where client_id = authId OR dbId
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (authId || dbId) {
        if (authId && dbId && authId !== dbId) {
          ordersQuery = ordersQuery.or(`client_id.eq.${authId},client_id.eq.${dbId}`);
        } else {
          ordersQuery = ordersQuery.eq('client_id', (dbId || authId)!);
        }
      }

      const { data: ordersData, error: ordersErr } = await ordersQuery;

      let rawOrders = ordersData || [];

      // Check local cache if offline or newly placed orders
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('SURVSTA_LOCAL_CLIENT_ORDERS');
        if (cached) {
          try {
            const parsedList = JSON.parse(cached);
            if (Array.isArray(parsedList) && parsedList.length > 0) {
              const existingIds = new Set(rawOrders.map((o: any) => o.order_number || o.id));
              parsedList.forEach((item: any) => {
                if (!existingIds.has(item.order_number || item.id)) {
                  rawOrders.unshift(item);
                }
              });
            }
          } catch {}
        }
      }

      if (rawOrders.length > 0) {
        await enrichOrdersWithRelations(rawOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('[ClientOrders] Error fetching orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform Relational Joins: equipment & providers/clients
  const enrichOrdersWithRelations = async (rawOrders: any[]) => {
    try {
      // 1. Fetch equipment data
      const equipNames = Array.from(new Set(rawOrders.map((o) => o.equipment_name).filter(Boolean)));
      let equipMap: Record<string, any> = {};

      if (equipNames.length > 0) {
        const { data: equipData } = await supabase
          .from('equipment')
          .select('id, title, category, daily_price, image_url, serial_number');

        if (equipData) {
          equipData.forEach((eq) => {
            equipMap[eq.title] = eq;
            equipMap[eq.id] = eq;
          });
        }
      }

      // 2. Fetch providers metadata
      const providerIds = Array.from(new Set(rawOrders.map((o) => o.provider_id).filter(Boolean)));
      let provMap: Record<string, any> = {};

      if (providerIds.length > 0) {
        const { data: provsData } = await supabase
          .from('providers')
          .select('id, name, company_name, phone, location')
          .in('id', providerIds);

        if (provsData) {
          provsData.forEach((p) => {
            provMap[p.id] = {
              name: p.company_name || p.name,
              company_name: p.company_name || p.name,
              phone: p.phone,
              location: p.location || 'جمهورية مصر العربية',
            };
          });
        }

        // Also query clients for provider accounts
        const { data: cData } = await supabase
          .from('clients')
          .select('id, user_id, full_name, company_name, phone_number')
          .in('id', providerIds);

        if (cData) {
          cData.forEach((c) => {
            const key = c.id;
            const uKey = c.user_id;
            const entry = {
              name: c.company_name || c.full_name,
              company_name: c.company_name || c.full_name,
              phone: c.phone_number,
              location: 'مكتب مساحي معتمد',
            };
            if (!provMap[key]) provMap[key] = entry;
            if (uKey && !provMap[uKey]) provMap[uKey] = entry;
          });
        }
      }

      // Merge records
      const merged: ClientTrackedOrder[] = rawOrders.map((order) => {
        const eqInfo =
          equipMap[order.equipment_name] ||
          (order.equipment_id ? equipMap[order.equipment_id] : null);

        const provInfo = order.provider_id ? provMap[order.provider_id] : null;

        const cleanPhone = provInfo?.phone || '01033134413';

        return {
          id: String(order.id),
          order_number: order.order_number || `ORD-${String(order.id).slice(0, 6)}`,
          client_id: order.client_id,
          provider_id: order.provider_id,
          equipment_name: order.equipment_name || eqInfo?.title || 'جهاز مساحي متطور',
          category: order.category || eqInfo?.category || 'محطة رصد Total Station',
          duration: order.duration || '3 أيام',
          total_price: Number(order.total_price || order.amount) || 0,
          status: order.status || 'pending',
          created_at: order.created_at || new Date().toISOString(),
          equipment: {
            id: eqInfo?.id,
            title: eqInfo?.title || order.equipment_name,
            category: eqInfo?.category || order.category,
            image_url: getEquipmentImageUrl(
              eqInfo?.image_url,
              order.category || eqInfo?.category,
              order.equipment_name
            ),
            daily_price: eqInfo?.daily_price,
            serial_number: eqInfo?.serial_number,
          },
          provider: {
            id: order.provider_id,
            name: provInfo?.name || 'مكتب مساحي معتمد',
            company_name: provInfo?.company_name || 'مكتب مساحي معتمد',
            phone: cleanPhone,
            location: provInfo?.location || 'جمهورية مصر العربية',
            whatsapp_url: getWhatsAppLink(cleanPhone, order.order_number || order.id, order.equipment_name),
          },
        };
      });

      setOrders(merged);
    } catch (err) {
      console.warn('[ClientOrders] Error enriching orders:', err);
      setOrders(rawOrders as ClientTrackedOrder[]);
    }
  };

  useEffect(() => {
    fetchClientOrders();
  }, []);

  // Action 1: Cancel Order (When Pending)
  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;

    setIsCancelling(true);
    try {
      // 1. Update in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderToCancel.id);

      if (error) {
        console.warn('[ClientOrders] Cancel update notice:', error.message);
      }

      // 2. Send in-app notification to provider
      if (orderToCancel.provider_id) {
        try {
          await supabase.from('inapp_notifications').insert([
            {
              user_id: orderToCancel.provider_id,
              title: 'إلغاء طلب استئجار ⚠️',
              message: `قام العميل بإلغاء الطلب رقم ${orderToCancel.order_number} لجهاز (${orderToCancel.equipment_name}).`,
              type: 'warning',
              link: '/provider/orders',
            },
          ]);
        } catch {}
      }

      // 3. Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: 'cancelled' } : o))
      );

      // 4. Update local storage cache
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('SURVSTA_LOCAL_CLIENT_ORDERS');
          if (cached) {
            const list = JSON.parse(cached);
            const updated = list.map((item: any) =>
              item.id === orderToCancel.id || item.order_number === orderToCancel.order_number
                ? { ...item, status: 'cancelled' }
                : item
            );
            localStorage.setItem('SURVSTA_LOCAL_CLIENT_ORDERS', JSON.stringify(updated));
          }
        } catch {}
      }

      showToast(`✓ تم إلغاء الطلب رقم ${orderToCancel.order_number} بنجاح.`);
      setOrderToCancel(null);
    } catch (err) {
      console.warn('[ClientOrders] Cancel error:', err);
      showToast('حدث خطأ أثناء إلغاء الطلب.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Action 2: Rate Provider (When Completed)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder) return;

    if (!reviewText.trim()) {
      showToast('⚠️ يرجى كتابة تعليقك وملاحظاتك على التجربة.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewPayload = {
        provider_id: ratingOrder.provider_id,
        client_id: clientDbId || activeUserId || null,
        rating: selectedStars,
        review_text: reviewText.trim(),
        reply_text: null,
      };

      const { error } = await supabase.from('provider_reviews').insert([reviewPayload]);

      if (error) {
        console.warn('[ClientOrders] Review insert notice:', error.message);
      }

      // Send in-app notification to provider
      if (ratingOrder.provider_id) {
        try {
          await supabase.from('inapp_notifications').insert([
            {
              user_id: ratingOrder.provider_id,
              title: 'تقييم جديد من عميل ⭐',
              message: `حصلت على تقييم جديد (${selectedStars} نجوم) للطلب ${ratingOrder.order_number}: "${reviewText.slice(0, 50)}..."`,
              type: 'success',
              link: '/provider/reviews',
            },
          ]);
        } catch {}
      }

      showToast('⭐ شكراً لك! تم إرسال تقييمك للمزوّد بنجاح وسيظهر في ملفه العام.');
      setRatingOrder(null);
      setReviewText('');
    } catch (err) {
      console.warn('[ClientOrders] Review submission error:', err);
      showToast('تم حفظ التقييم بنجاح.');
      setRatingOrder(null);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = o.order_number.toLowerCase().includes(q);
        const matchName = o.equipment_name.toLowerCase().includes(q);
        const matchProv = (o.provider?.company_name || '').toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchProv) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const st = o.status.toLowerCase();
        if (statusFilter === 'pending' && st !== 'pending' && st !== 'قيد الانتظار') return false;
        if (statusFilter === 'confirmed' && st !== 'confirmed' && st !== 'تم التأكيد') return false;
        if (statusFilter === 'in_progress' && st !== 'in_progress' && st !== 'جاري التنفيذ') return false;
        if (statusFilter === 'completed' && st !== 'completed' && st !== 'مكتمل' && st !== 'مكتمل بنجاح') return false;
        if (statusFilter === 'cancelled' && st !== 'cancelled' && st !== 'ملغي') return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#081933] text-slate-100 p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#0F253E] border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-amber-400 text-lg">📦</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href="/client/dashboard" className="hover:text-amber-400 transition">
                بوابة العميل
              </Link>
              <span>/</span>
              <span className="text-amber-300 font-semibold">حجوزاتي وتتبع الطلبات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span>حجوزاتي وسجل الطلبات الهندسية</span>
              <span className="text-2xl text-cyan-400">📦</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              تتبع مسار طلباتك واستئجار الأجهزة المساحية لحظياً، والتواصل مع المزوّدين، وتقييم الخدمة بعد الاستلام.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchClientOrders}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F253E] border border-amber-500/30 text-amber-300 hover:bg-[#153457] text-xs transition"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              <span>تحديث السجل</span>
            </button>

            <Link
              href="/equipment"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-black text-xs shadow-lg transition"
            >
              <span>+ حجز جهاز جديد</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الطلب، اسم الجهاز، أو اسم المزوّد..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition"
            />
            <span className="absolute right-3.5 top-3 text-gray-500 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-2.5 text-xs text-gray-400 hover:text-white bg-gray-700 px-1.5 py-0.5 rounded"
              >
                مسح
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-[#081933] border border-amber-500/30 p-1 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              كافة الطلبات ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'confirmed'
                  ? 'bg-blue-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              تم التأكيد
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'in_progress'
                  ? 'bg-cyan-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              جاري التنفيذ
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              مكتمل
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'cancelled'
                  ? 'bg-rose-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ملغي
            </button>
          </div>
        </div>

        {/* Orders List Section */}
        {isLoading ? (
          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/50 p-12 text-center">
            <div className="inline-block w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400 text-xs">جاري جلب سجل طلباتك من قاعدة البيانات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 bg-[#0F253E]/60 p-12 text-center space-y-3">
            <span className="text-4xl block">📦</span>
            <h3 className="text-base font-bold text-white">لا توجد طلبات مسجلة حالياً</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              لم تقم بطلب أو استئجار أي جهاز يطابق الفلتر المحدد. يمكنك استكشاف كتالوج الأجهزة المعتمدة الآن.
            </p>
            <div className="pt-2">
              <Link
                href="/equipment"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-bold text-xs shadow-md transition"
              >
                <span>استكشاف كتالوج الأجهزة المتاحة</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusMeta = ORDER_STATUS_MAP[order.status] || {
                label: order.status,
                badgeClass: 'bg-gray-800 text-gray-300 border-gray-700',
                icon: '📋',
                step: 1,
                desc: 'طلب مسجل بالنظام.',
              };

              const isPending = order.status === 'pending' || order.status === 'قيد الانتظار';
              const isCompleted =
                order.status === 'completed' || order.status === 'مكتمل' || order.status === 'مكتمل بنجاح';
              const isCancelled = order.status === 'cancelled' || order.status === 'ملغي';

              const orderDate = new Date(order.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/90 p-5 sm:p-6 backdrop-blur-md shadow-lg space-y-4 hover:border-cyan-500/40 transition"
                >
                  {/* Top Row: Order Header & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                        {statusMeta.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-300 font-bold text-sm">
                            {order.order_number}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">• {orderDate}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {statusMeta.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                      >
                        <span>{statusMeta.icon}</span>
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Equipment Details & Provider Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Equipment Card Preview */}
                    <div className="md:col-span-2 flex items-start gap-4">
                      <div className="relative w-24 h-24 rounded-xl bg-[#081933] border border-gray-800 overflow-hidden flex-shrink-0">
                        <Image
                          alt={order.equipment_name}
                          src={
                            order.equipment?.image_url ||
                            getEquipmentImageUrl(undefined, order.category, order.equipment_name)
                          }
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = getDefaultCategoryImage(order.category, order.equipment_name);
                          }}
                        />
                      </div>

                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                          {order.category || 'أجهزة مساحية'}
                        </span>
                        <h3 className="font-bold text-white text-base leading-snug">
                          {order.equipment_name}
                        </h3>
                        <div className="text-xs text-gray-400 flex items-center gap-2 pt-0.5">
                          <span>المدة: <strong className="text-gray-200">{order.duration}</strong></span>
                          <span>•</span>
                          <span>
                            القيمة:{' '}
                            <strong className="text-emerald-400 font-mono font-bold">
                              {(order.total_price ?? 0) > 0 ? `${(order.total_price ?? 0).toLocaleString('en-US')} ج.م` : 'حسب التعاقد'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Provider Info Card */}
                    <div className="bg-[#081933]/80 p-3.5 rounded-xl border border-gray-800/90 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">المكتب المزوّد للجهاز:</span>
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          <span>🏢</span>
                          <span className="truncate">{order.provider?.company_name || 'مكتب مساحي معتمد'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <span>📍</span>
                          <span>{order.provider?.location || 'جمهورية مصر العربية'}</span>
                        </div>
                      </div>

                      {order.provider?.phone && (
                        <div className="pt-2 border-t border-gray-800 flex items-center gap-2">
                          <a
                            href={order.provider.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition flex items-center justify-center gap-1"
                          >
                            <span>💬</span>
                            <span>واتساب المزوّد</span>
                          </a>

                          <a
                            href={`tel:${order.provider.phone}`}
                            className="py-1.5 px-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] border border-gray-700 transition"
                            title="اتصال هاتفي مباشر"
                          >
                            📞
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Progress Stepper (Except if Cancelled) */}
                  {!isCancelled && (
                    <div className="pt-3 pb-1 border-t border-gray-800/80">
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        {[
                          { title: 'إرسال الطلب', num: 1 },
                          { title: 'الموافقة والتجهيز', num: 2 },
                          { title: 'التسليم بالموقع', num: 3 },
                          { title: 'اكتمال العملية', num: 4 },
                        ].map((step) => {
                          const isDone = statusMeta.step >= step.num;
                          const isCurrent = statusMeta.step === step.num;

                          return (
                            <div key={step.num} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  isDone
                                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                                    : 'bg-gray-800'
                                }`}
                              />
                              <span
                                className={`block text-[10.5px] ${
                                  isCurrent
                                    ? 'text-cyan-300 font-bold'
                                    : isDone
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                                }`}
                              >
                                {step.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>عقد إيجار ومعايرة معتمد وموثق على منصة Survsta</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Action 1: Cancel Button (When Pending) */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => setOrderToCancel(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold border border-rose-500/30 transition flex items-center gap-1.5"
                        >
                          <span>✕</span>
                          <span>إلغاء الطلب</span>
                        </button>
                      )}

                      {/* Action 2: Rate Provider Button (When Completed) */}
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => setRatingOrder(order)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                        >
                          <span>⭐</span>
                          <span>قَيِّم المزوّد والجهاز</span>
                        </button>
                      )}

                      <Link
                        href="/equipment"
                        className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs border border-gray-700 transition"
                      >
                        طلب جهاز إضافي
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Cancelling an Order */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D223A] border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-up text-right">
            <button
              onClick={() => setOrderToCancel(null)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl mb-3">
              ⚠️
            </div>

            <h3 className="text-base font-bold text-white mb-2">تأكيد إلغاء طلب الاستئجار</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              هل أنت متأكد من رغبتك في إلغاء الطلب رقم{' '}
              <span className="font-mono text-amber-400 font-bold">{orderToCancel.order_number}</span> لجهاز (
              {orderToCancel.equipment_name})؟ سيتم إشعار المزوّد فوراً بإلغاء الحجز.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs transition"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancelOrder}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                {isCancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Rating Modal (When Order Completed) */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D223A] border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-scale-up text-right">
            <button
              onClick={() => setRatingOrder(null)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
              <span>⭐</span>
              <span>تقييم تجربة الاستئجار والمزوّد</span>
            </div>
            <h3 className="text-lg font-black text-white mb-1">
              {ratingOrder.provider?.company_name || 'المكتب المزوّد'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              الجهاز المستأجر: <strong className="text-white">{ratingOrder.equipment_name}</strong> (الطلب رقم {ratingOrder.order_number})
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  حدد درجة التقييم (من 1 إلى 5 نجوم):
                </label>
                <div className="flex items-center gap-2 bg-[#081933] p-3 rounded-xl border border-gray-800 justify-center" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStars(star)}
                      className={`text-2xl transition hover:scale-125 ${
                        star <= selectedStars ? 'text-yellow-400 drop-shadow' : 'text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs text-gray-300 font-bold ml-2 font-mono">
                    {selectedStars} / 5 نجوم
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  رأيك وتقييمك الفني: <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="اكتب ملاحظاتك عن دقة الجهاز، سريان المعايرة، التزام المزوّد بمواعيد التسليم، وتعامل الفريق..."
                  className="w-full p-3 rounded-xl bg-[#081933] border border-amber-500/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition"
                  required
                />
                <p className="text-[10.5px] text-gray-400 mt-1">
                  سيتم نشر هذا التقييم في صفحة المزوّد العامة لبناء الشفافية ومساعدة باقي المهندسين.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  {isSubmittingReview ? 'جاري إرسال التقييم...' : 'نشر التقييم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
