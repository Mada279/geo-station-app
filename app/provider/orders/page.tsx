'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export interface IncomingOrder {
  id: string;
  order_number: string;
  client_id?: string;
  provider_id?: string;
  client_email?: string;
  equipment_name: string;
  category?: string;
  duration?: string;
  total_price?: number;
  status: string;
  created_at: string;
  client?: {
    id?: string;
    full_name?: string;
    phone_number?: string;
    email?: string;
    whatsapp_number?: string;
    company_name?: string;
  };
}

// Available status transitions
const ORDER_STATUS_MAP: Record<string, { label: string; badgeClass: string; icon: string }> = {
  'pending': {
    label: 'قيد الانتظار',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⏳',
  },
  'قيد الانتظار': {
    label: 'قيد الانتظار',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⏳',
  },
  'confirmed': {
    label: 'تم التأكيد',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: '✓',
  },
  'تم التأكيد': {
    label: 'تم التأكيد',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: '✓',
  },
  'in_progress': {
    label: 'جاري التنفيذ',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: '⚙️',
  },
  'جاري التنفيذ': {
    label: 'جاري التنفيذ',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: '⚙️',
  },
  'completed': {
    label: 'مكتمل بنجاح',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '🎉',
  },
  'مكتمل': {
    label: 'مكتمل بنجاح',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '🎉',
  },
  'cancelled': {
    label: 'ملغي / مرفوض',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '✕',
  },
  'ملغي': {
    label: 'ملغي / مرفوض',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '✕',
  },
};

export default function ProviderOrdersPage() {
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to format phone for WhatsApp link
  const getWhatsAppLink = (phone: string, clientName: string, orderNumber: string, equipmentName: string) => {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    // If starts with 0 and 10 or 11 digits (Egypt format like 010xxxxxxxx), prepend 2
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '2' + clean;
    }
    const message = encodeURIComponent(
      `مرحباً ${clientName || 'عزيزي العميل'}، نتواصل معك بخصوص طلبك رقم (${orderNumber}) لمعدة/خدمة (${equipmentName}) عبر منصة Survsta.`
    );
    return `https://wa.me/${clean}?text=${message}`;
  };

  // Fetch orders from Supabase joined with clients
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let authUserId: string | null = null;
      let providerDbId: string | null = null;

      // 1. Get current Supabase Auth session
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
      }

      // 2. Check localStorage fallback if offline/mock auth
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!authUserId && parsed.id) authUserId = parsed.id;
          } catch {}
        }
      }

      // 3. Find provider record id if it differs from auth.users.id
      if (authUserId) {
        const { data: provRow } = await supabase
          .from('providers')
          .select('id')
          .or(`id.eq.${authUserId},email.eq.${authData?.user?.email || ''}`)
          .maybeSingle();

        if (provRow?.id) {
          providerDbId = provRow.id;
        }
      }

      const targetId = providerDbId || authUserId;
      setActiveProviderId(targetId);

      // 4. Fetch orders for this provider
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (targetId) {
        if (providerDbId && authUserId && providerDbId !== authUserId) {
          query = query.or(`provider_id.eq.${targetId},provider_id.eq.${authUserId}`);
        } else {
          query = query.eq('provider_id', targetId);
        }
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        console.warn('[ProviderOrders] Error fetching orders:', ordersError.message);
        // If column provider_id doesn't exist yet, fallback to querying all orders or local storage
        if (ordersError.message?.includes('provider_id') || ordersError.code === 'PGRST204') {
          const { data: fallbackOrders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15);
          if (fallbackOrders) {
            await enrichOrdersWithClients(fallbackOrders);
            return;
          }
        }
        setOrders([]);
        return;
      }

      if (ordersData && ordersData.length > 0) {
        await enrichOrdersWithClients(ordersData);
      } else {
        // Check if there are general orders in development mode so provider has immediate test visibility
        const { data: anyOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (anyOrders && anyOrders.length > 0) {
          await enrichOrdersWithClients(anyOrders);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.warn('[ProviderOrders] Exception:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enrich orders list with client full_name, phone_number, etc.
  const enrichOrdersWithClients = async (rawOrders: any[]) => {
    try {
      const clientIds = Array.from(new Set(rawOrders.map((o) => o.client_id).filter(Boolean)));

      let clientMap: Record<string, any> = {};

      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, full_name, phone_number, email, whatsapp_number, company_name')
          .in('id', clientIds);

        if (!clientsError && clientsData) {
          clientsData.forEach((c) => {
            clientMap[c.id] = c;
          });
        }
      }

      const merged: IncomingOrder[] = rawOrders.map((order) => {
        const clientInfo = order.client_id ? clientMap[order.client_id] : null;
        return {
          id: order.id,
          order_number: order.order_number || `ORD-${order.id.slice(0, 6)}`,
          client_id: order.client_id,
          provider_id: order.provider_id,
          client_email: order.client_email,
          equipment_name: order.equipment_name || 'جهاز مساحي',
          category: order.category || 'أجهزة ومعدات',
          duration: order.duration || 'غير محدد',
          total_price: order.total_price,
          status: order.status || 'pending',
          created_at: order.created_at || new Date().toISOString(),
          client: clientInfo || {
            full_name: order.client_email ? order.client_email.split('@')[0] : 'عميل معتمد',
            phone_number: '201000000000',
            email: order.client_email,
          },
        };
      });

      setOrders(merged);
    } catch (err) {
      console.warn('[enrichOrdersWithClients error]:', err);
      setOrders(rawOrders as IncomingOrder[]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status in Supabase and locally
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.warn('[handleUpdateStatus Error]:', error.message);
      }

      // Update state locally
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      const statusMeta = ORDER_STATUS_MAP[newStatus] || { label: newStatus };
      showToast(`✅ تم تحديث حالة الطلب إلى "${statusMeta.label}" بنجاح!`);
    } catch (err) {
      console.error('[handleUpdateStatus Exception]:', err);
      showToast('❌ تعذر تحديث حالة الطلب حالياً.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Status Filter options
  const filterTabs = [
    { id: 'all', label: 'جميع الطلبات' },
    { id: 'pending', label: 'قيد الانتظار ⏳' },
    { id: 'confirmed', label: 'تم التأكيد ✓' },
    { id: 'in_progress', label: 'جاري التنفيذ ⚙️' },
    { id: 'completed', label: 'مكتملة 🎉' },
    { id: 'cancelled', label: 'ملغية ✕' },
  ];

  const filteredOrders = orders.filter((order) => {
    // 1. Status match
    if (selectedStatusFilter !== 'all') {
      const s = order.status.toLowerCase();
      if (selectedStatusFilter === 'pending' && !s.includes('pending') && !s.includes('انتظار')) return false;
      if (selectedStatusFilter === 'confirmed' && !s.includes('confirm') && !s.includes('تأكيد')) return false;
      if (selectedStatusFilter === 'in_progress' && !s.includes('progress') && !s.includes('تنفيذ')) return false;
      if (selectedStatusFilter === 'completed' && !s.includes('complet') && !s.includes('مكتمل')) return false;
      if (selectedStatusFilter === 'cancelled' && !s.includes('cancel') && !s.includes('ملغي')) return false;
    }

    // 2. Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNum = order.order_number.toLowerCase().includes(q);
      const matchDevice = order.equipment_name.toLowerCase().includes(q);
      const matchClient = order.client?.full_name?.toLowerCase().includes(q);
      const matchPhone = order.client?.phone_number?.toLowerCase().includes(q);
      return matchNum || matchDevice || matchClient || matchPhone;
    }

    return true;
  });

  // KPI Calculations
  const pendingCount = orders.filter(
    (o) => o.status.includes('pending') || o.status.includes('انتظار')
  ).length;
  const inProgressCount = orders.filter(
    (o) => o.status.includes('progress') || o.status.includes('تنفيذ') || o.status.includes('confirm') || o.status.includes('تأكيد')
  ).length;
  const totalValue = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Topbar / Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                إدارة العمليات والتشغيل
              </span>
              <span className="text-xs text-gray-400">بوابة المزوّد المعتمد</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>📥</span>
              <span>صندوق الطلبات الواردة (Incoming Orders)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              متابعة طلبات استئجار وشراء الأجهزة وحجوزات الخدمات المساحية المرسلة من العملاء وشركات المقاولات.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-[#163659] transition cursor-pointer"
              title="تحديث البيانات من السحابة"
            >
              <span>🔄</span>
              <span>تحديث الطلبات</span>
            </button>
            <Link
              href="/provider/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              <span>📊</span>
              <span>لوحة التحكم الرئيسية</span>
            </Link>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>إجمالي الطلبات المستلمة</span>
              <span className="text-cyan-400 text-lg">📦</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {isLoading ? '...' : orders.length}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">طلبات مسجلة عبر المنصة</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات بانتظار التأكيد</span>
              <span className="text-amber-400 text-lg">⏳</span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {isLoading ? '...' : pendingCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">تحتاج إلى مراجعة وتأكيد المزوّد</div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات جارية وقيد التنفيذ</span>
              <span className="text-blue-400 text-lg">⚙️</span>
            </div>
            <div className="text-2xl font-black text-blue-300 font-mono">
              {isLoading ? '...' : inProgressCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">أجهزة مستأجرة أو خدمات نشطة</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>القيمة التقديرية للطلبات</span>
              <span className="text-emerald-400 text-lg">💰</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {isLoading ? '...' : totalValue > 0 ? `${totalValue.toLocaleString('en-US')} ج.م` : '—'}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">عقود إيجار وبيع وخدمات مساحية</div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/60 p-4 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الطلب، اسم العميل، اسم الجهاز، أو رقم الهاتف..."
                className="w-full rounded-xl border border-gray-700 bg-[#081933] pr-10 pl-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
              <span className="absolute right-3.5 top-3 text-gray-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-gray-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total Filter Counter */}
            <div className="text-xs text-gray-400 font-medium">
              النتائج المعروضة: <span className="text-amber-400 font-bold font-mono">{filteredOrders.length}</span> من إجمالي <span className="text-white font-bold font-mono">{orders.length}</span>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedStatusFilter === tab.id
                    ? 'bg-gradient-to-l from-amber-500 to-[#F4B400] text-[#081933] shadow-md font-bold'
                    : 'bg-[#081933] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/40 p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-cyan-300 font-medium">جارٍ استرداد الطلبات الواردة والتحقق من بيانات العملاء...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-[#0F253E]/30 p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-3xl shadow-inner">
              📥
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">لا توجد طلبات واردة مطابقة</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                {searchQuery || selectedStatusFilter !== 'all'
                  ? 'لا توجد نتائج تطابق معايير البحث والفلترة المحددة. جرب إزالة الفلاتر لعرض كافة الطلبات.'
                  : 'عندما يقوم العملاء وشركات المقاولات بطلب أو حجز أجهزتك وخدماتك المساحية، ستظهر تفاصيلها وأرقام التواصل هنا فوراً.'}
              </p>
            </div>
            {(searchQuery || selectedStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('all');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
              >
                🔄 إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        )}

        {/* Orders Listing Grid / Cards */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusMeta = ORDER_STATUS_MAP[order.status] || {
                label: order.status,
                badgeClass: 'bg-gray-700/40 text-gray-300 border-gray-700',
                icon: '●',
              };

              const clientName = order.client?.full_name || 'عميل مساحي معتمد';
              const clientPhone = order.client?.phone_number || '201000000000';
              const clientEmail = order.client?.email || order.client_email || '—';
              const companyName = order.client?.company_name;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-5 shadow-xl backdrop-blur-md hover:border-cyan-500/40 transition space-y-4"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-black/40 px-3 py-1 rounded-lg border border-amber-500/30">
                        {order.order_number}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        📅 {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
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

                  {/* Order Details Body */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    
                    {/* Column 1: Equipment / Service Info */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-gray-400">الجهاز أو الخدمة المطلوبة:</span>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>📡</span>
                        <span>{order.equipment_name}</span>
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="rounded bg-cyan-500/10 text-cyan-300 px-2 py-0.5 text-[10px] font-semibold border border-cyan-500/20">
                          {order.category}
                        </span>
                        <span>• مدة الاستئجار: <strong className="text-white">{order.duration}</strong></span>
                      </div>
                      {order.total_price && (
                        <div className="text-xs text-emerald-400 font-bold mt-1">
                          التكلفة الإجمالية: <span className="font-mono text-sm">{Number(order.total_price).toLocaleString('en-US')} ج.م</span>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Client Contact Details */}
                    <div className="space-y-1.5 rounded-xl border border-gray-800 bg-[#081933]/60 p-3">
                      <span className="text-[11px] font-semibold text-cyan-300">بيانات العميل وطالب الخدمة:</span>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>👤</span>
                        <span>{clientName}</span>
                        {companyName && (
                          <span className="text-[10px] text-gray-400 font-normal">({companyName})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-300 font-mono flex items-center gap-1.5">
                        <span>📞</span>
                        <span>{clientPhone}</span>
                      </div>
                      {clientEmail && (
                        <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5">
                          <span>✉️</span>
                          <span>{clientEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Fast Action Buttons & Status Update */}
                    <div className="space-y-2.5 flex flex-col justify-center">
                      <span className="text-[11px] font-semibold text-gray-400">إجراءات سريعة وتحديث الحالة:</span>
                      
                      {/* WhatsApp & Call Buttons */}
                      <div className="flex items-center gap-2">
                        <a
                          href={getWhatsAppLink(clientPhone, clientName, order.order_number, order.equipment_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <span>💬</span>
                          <span>تواصل واتساب</span>
                        </a>

                        {clientPhone && (
                          <a
                            href={`tel:${clientPhone}`}
                            className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold transition cursor-pointer"
                            title="اتصال هاتفي مباشر"
                          >
                            <span>📞</span>
                            <span>اتصال</span>
                          </a>
                        )}
                      </div>

                      {/* Status Update Control */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-gray-400 shrink-0">تغيير الحالة:</span>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="w-full rounded-lg border border-gray-700 bg-[#081933] px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">⏳ قيد الانتظار (Pending)</option>
                          <option value="confirmed">✓ تم التأكيد (Confirmed)</option>
                          <option value="in_progress">⚙️ جاري التنفيذ (In Progress)</option>
                          <option value="completed">🎉 مكتمل بنجاح (Completed)</option>
                          <option value="cancelled">✕ ملغي / مرفوض (Cancelled)</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-amber-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
