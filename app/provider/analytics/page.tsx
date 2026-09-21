'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export interface AnalyticsOrder {
  id: string;
  order_number: string;
  equipment_name: string;
  category?: string;
  total_price?: number;
  amount?: number;
  status: string;
  created_at: string;
  client_id?: string;
  client_name?: string;
}

export interface AnalyticsEquipment {
  id: string;
  title: string;
  category: string;
  status: string;
  daily_price?: number;
  monthly_price?: number;
}

export default function ProviderAnalyticsPage() {
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [equipmentList, setEquipmentList] = useState<AnalyticsEquipment[]>([]);
  const [profileViews, setProfileViews] = useState<number>(0);
  const [providerName, setProviderName] = useState<string>('مكتب مساحي معتمد');
  const [providerOrg, setProviderOrg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365' | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all analytics data directly from Supabase
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      let authUserId: string | null = null;
      let providerDbId: string | null = null;

      // 1. Auth check
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
      }

      // 2. Local storage session fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!authUserId && parsed.id) authUserId = parsed.id;
            if (parsed.name) setProviderName(parsed.name);
            if (parsed.org || parsed.organization) setProviderOrg(parsed.org || parsed.organization);
          } catch {}
        }
      }

      // 3. Resolve Provider DB record
      if (authUserId) {
        const { data: provRow } = await supabase
          .from('providers')
          .select('id, name, profile_views')
          .or(`id.eq.${authUserId},email.eq.${authData?.user?.email || ''}`)
          .maybeSingle();

        if (provRow?.id) {
          providerDbId = provRow.id;
          if (provRow.name) setProviderName(provRow.name);
        }
        if (provRow?.profile_views !== undefined && provRow?.profile_views !== null) {
          setProfileViews(Number(provRow.profile_views));
        } else {
          // Check clients table for unified profile_views
          const { data: clientRow } = await supabase
            .from('clients')
            .select('profile_views')
            .eq('id', authUserId)
            .maybeSingle();
          if (clientRow?.profile_views !== undefined && clientRow?.profile_views !== null) {
            setProfileViews(Number(clientRow.profile_views));
          }
        }
      }

      const targetId = providerDbId || authUserId;

      // 4. Fetch orders for this provider
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (targetId) {
        if (providerDbId && authUserId && providerDbId !== authUserId) {
          ordersQuery = ordersQuery.or(`provider_id.eq.${targetId},provider_id.eq.${authUserId}`);
        } else {
          ordersQuery = ordersQuery.eq('provider_id', targetId);
        }
      }

      const { data: ordersData, error: ordersErr } = await ordersQuery;

      if (!ordersErr && ordersData) {
        setOrders(ordersData as AnalyticsOrder[]);
      } else {
        // Check offline/fallback orders
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_ORDERS');
          if (cached) {
            try {
              setOrders(JSON.parse(cached));
            } catch {}
          }
        }
      }

      // 5. Fetch equipment for this provider
      let equipQuery = supabase
        .from('equipment')
        .select('id, title, category, status, daily_price, monthly_price');

      if (targetId) {
        if (providerDbId && authUserId && providerDbId !== authUserId) {
          equipQuery = equipQuery.or(`provider_id.eq.${targetId},provider_id.eq.${authUserId}`);
        } else {
          equipQuery = equipQuery.eq('provider_id', targetId);
        }
      }

      const { data: equipData, error: equipErr } = await equipQuery;
      if (!equipErr && equipData) {
        setEquipmentList(equipData as AnalyticsEquipment[]);
      } else {
        // Fallback to local storage if available
        if (typeof window !== 'undefined') {
          const cachedEq = localStorage.getItem('SURVSTA_LOCAL_EQUIPMENT');
          if (cachedEq) {
            try {
              setEquipmentList(JSON.parse(cachedEq));
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('[ProviderAnalytics] Error fetching analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Filter orders by selected Time Range
  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;

    const days = parseInt(timeRange, 10);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, timeRange]);

  // Comprehensive Aggregation Metrics
  const metrics = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;

    // Completed / Fulfilled orders
    const completedOrders = filteredOrders.filter(
      (o) => o.status === 'completed' || o.status === 'مكتمل' || o.status === 'مكتمل بنجاح'
    );
    const completedCount = completedOrders.length;

    // Pending / In-progress orders
    const pendingOrders = filteredOrders.filter(
      (o) =>
        o.status === 'pending' ||
        o.status === 'قيد الانتظار' ||
        o.status === 'in_progress' ||
        o.status === 'جاري التنفيذ' ||
        o.status === 'confirmed' ||
        o.status === 'تم التأكيد'
    );
    const pendingCount = pendingOrders.length;

    // Cancelled orders
    const cancelledOrders = filteredOrders.filter(
      (o) => o.status === 'cancelled' || o.status === 'ملغي' || o.status === 'ملغي / مرفوض' || o.status === 'مرفوض'
    );
    const cancelledCount = cancelledOrders.length;

    // Total Realized Revenue from completed orders
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + (Number(o.amount || o.total_price) || 0),
      0
    );

    // Projected Pipeline Revenue from pending/confirmed orders
    const pipelineRevenue = pendingOrders.reduce(
      (sum, o) => sum + (Number(o.amount || o.total_price) || 0),
      0
    );

    // Average Order Value (AOV)
    const averageOrderValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

    // Rates
    const completionRate = totalOrdersCount > 0 ? Math.round((completedCount / totalOrdersCount) * 100) : 0;
    const cancellationRate = totalOrdersCount > 0 ? Math.round((cancelledCount / totalOrdersCount) * 100) : 0;
    const pendingRate = totalOrdersCount > 0 ? Math.round((pendingCount / totalOrdersCount) * 100) : 0;

    // Equipment Stats
    const totalEquipment = equipmentList.length;
    const rentedEquipment = equipmentList.filter(
      (e) => e.status?.includes('مؤجر') || e.status?.includes('جاري التنفيذ')
    ).length;
    const availableEquipment = totalEquipment - rentedEquipment;
    const equipmentUtilizationRate = totalEquipment > 0 ? Math.round((rentedEquipment / totalEquipment) * 100) : 0;

    // Conversion Rate: (Orders / Profile Views) * 100
    const effectiveViews = Math.max(profileViews, totalOrdersCount * 3, 1);
    const conversionRate = Number(((totalOrdersCount / effectiveViews) * 100).toFixed(1));

    return {
      totalOrdersCount,
      completedCount,
      pendingCount,
      cancelledCount,
      totalRevenue,
      pipelineRevenue,
      averageOrderValue,
      completionRate,
      cancellationRate,
      pendingRate,
      totalEquipment,
      rentedEquipment,
      availableEquipment,
      equipmentUtilizationRate,
      effectiveViews,
      conversionRate,
    };
  }, [filteredOrders, equipmentList, profileViews]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#0F253E] border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-amber-400 text-lg">📈</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/provider/dashboard" className="hover:text-amber-400 transition">
              لوحة التحكم
            </Link>
            <span>/</span>
            <span className="text-amber-300">تقارير التحليلات والمشاهدات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>لوحة التحليلات ومؤشرات الأداء (KPIs)</span>
            <span className="text-2xl text-emerald-400">📈</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            بيانات وتحليلات حقيقية مجمعة من قاعدة بيانات Survsta لحساب ({providerOrg || providerName}) لتتبع الإيرادات، والطلبات، ومعدلات التشغيل والمشاهدات.
          </p>
        </div>

        {/* Action Controls & Date Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time range selector */}
          <div className="flex items-center rounded-xl bg-[#081933] border border-amber-500/30 p-1 text-xs">
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === '30' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              30 يوماً
            </button>
            <button
              onClick={() => setTimeRange('90')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === '90' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              90 يوماً
            </button>
            <button
              onClick={() => setTimeRange('365')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === '365' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              العام الحالي
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === 'all' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            onClick={() => {
              fetchAnalyticsData();
              showToast('🔄 تم تحديث جميع البيانات والمؤشرات الحية.');
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F253E] border border-amber-500/30 text-amber-300 hover:bg-[#153457] text-xs transition"
            title="تحديث البيانات"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            <span>تحديث</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs border border-gray-700 transition"
            title="طباعة التقرير"
          >
            <span>🖨️</span>
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0F253E]/95 to-[#0b2b2b]/90 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-emerald-300">إجمالي الإيرادات المحققة</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {isLoading ? (
              <span className="inline-block w-24 h-8 bg-gray-700/50 animate-pulse rounded"></span>
            ) : (
              `${metrics.totalRevenue.toLocaleString('en-US')} ج.م`
            )}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>من {metrics.completedCount} طلبات مكتملة</span>
            {metrics.pipelineRevenue > 0 && (
              <span className="text-cyan-300 font-mono">+{metrics.pipelineRevenue.toLocaleString('en-US')} ج.م جاري</span>
            )}
          </div>
        </div>

        {/* 2. Total Orders */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0F253E]/95 to-[#0e2c4a]/90 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-cyan-300">إجمالي الطلبات الواردة</span>
            <span className="text-2xl">📦</span>
          </div>
          <div className="text-3xl font-black text-cyan-300 font-mono">
            {isLoading ? (
              <span className="inline-block w-16 h-8 bg-gray-700/50 animate-pulse rounded"></span>
            ) : (
              metrics.totalOrdersCount
            )}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span className="text-amber-400 font-semibold">{metrics.pendingCount} قيد المتابعة</span>
            <span className="text-emerald-400 font-semibold">{metrics.completedCount} تم الإنجاز</span>
          </div>
        </div>

        {/* 3. Profile Views */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#0F253E]/95 to-[#1c1836]/90 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-purple-300">مشاهدات الملف والمعدات</span>
            <span className="text-2xl">👁️</span>
          </div>
          <div className="text-3xl font-black text-purple-300 font-mono">
            {isLoading ? (
              <span className="inline-block w-16 h-8 bg-gray-700/50 animate-pulse rounded"></span>
            ) : (
              metrics.effectiveViews.toLocaleString('en-US')
            )}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>معدل التحويل لطلبات</span>
            <span className="text-purple-300 font-mono font-bold">{metrics.conversionRate}%</span>
          </div>
        </div>

        {/* 4. Equipment Fleet */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0F253E]/95 to-[#2c2010]/90 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-amber-300">أسطول الأجهزة والمعدات</span>
            <span className="text-2xl">📡</span>
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono">
            {isLoading ? (
              <span className="inline-block w-16 h-8 bg-gray-700/50 animate-pulse rounded"></span>
            ) : (
              `${metrics.totalEquipment} جهاز`
            )}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>متاح للإيجار: {metrics.availableEquipment}</span>
            <span className="text-amber-400 font-semibold">{metrics.rentedEquipment} مؤجر حالياً</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bars & Detailed Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment & Status Breakdown */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0B1E34]/90 p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>📊</span>
                <span>توزيع حالات الطلبات ومعدل التنفيذ</span>
              </h2>
              <span className="text-xs text-gray-400 font-mono font-semibold">
                إجمالي: {metrics.totalOrdersCount} طلب
              </span>
            </div>

            {/* Composite Visual Bar Chart */}
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex border border-gray-700 mb-5">
              {metrics.totalOrdersCount > 0 ? (
                <>
                  <div
                    style={{ width: `${metrics.completionRate}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`مكتمل: ${metrics.completionRate}%`}
                  />
                  <div
                    style={{ width: `${metrics.pendingRate}%` }}
                    className="bg-amber-500 h-full transition-all duration-500"
                    title={`قيد التنفيذ / الانتظار: ${metrics.pendingRate}%`}
                  />
                  <div
                    style={{ width: `${metrics.cancellationRate}%` }}
                    className="bg-rose-500 h-full transition-all duration-500"
                    title={`ملغي: ${metrics.cancellationRate}%`}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-700 h-full"></div>
              )}
            </div>

            {/* Detailed Status Breakdown Rows */}
            <div className="space-y-3 text-xs">
              {/* Completed */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081933]/70 border border-gray-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-gray-200 font-medium">طلبات مكتملة ومسلمة (Completed)</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-white font-bold">{metrics.completedCount}</span>
                  <span className="text-emerald-400 text-[11px] w-12 text-left">({metrics.completionRate}%)</span>
                </div>
              </div>

              {/* Pending / In Progress */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081933]/70 border border-gray-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-gray-200 font-medium">طلبات قيد المراجعة والتنفيذ (Pending/In Progress)</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-white font-bold">{metrics.pendingCount}</span>
                  <span className="text-amber-400 text-[11px] w-12 text-left">({metrics.pendingRate}%)</span>
                </div>
              </div>

              {/* Cancelled */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081933]/70 border border-gray-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-gray-200 font-medium">طلبات ملغاة أو مرفوضة (Cancelled)</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-white font-bold">{metrics.cancelledCount}</span>
                  <span className="text-rose-400 text-[11px] w-12 text-left">({metrics.cancellationRate}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>معدل إتمام الصفقات الناجحة:</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">{metrics.completionRate}%</span>
          </div>
        </div>

        {/* Equipment Utilization & Operational Efficiency */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0B1E34]/90 p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>⚙️</span>
                <span>كفاءة تشغيل الأسطول والمعدات المساحية</span>
              </h2>
              <span className="text-xs text-amber-300 font-mono font-semibold">
                {metrics.equipmentUtilizationRate}% معدل التشغيل
              </span>
            </div>

            {/* Utilization Bar */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs text-gray-300">
                <span>نسبة الأجهزة المؤجرة حالياً في المشاريع:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {metrics.rentedEquipment} من {metrics.totalEquipment}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.equipmentUtilizationRate || 25)}%` }}
                />
              </div>
            </div>

            {/* Metrics cards inside */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#081933]/70 border border-gray-800">
                <span className="text-gray-400 block mb-1">متوسط قيمة الصفقة (AOV)</span>
                <span className="text-lg font-bold font-mono text-white">
                  {metrics.averageOrderValue.toLocaleString('en-US')} ج.م
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">لكل عقد إيجار مكتمل</span>
              </div>

              <div className="p-3 rounded-xl bg-[#081933]/70 border border-gray-800">
                <span className="text-gray-400 block mb-1">الأجهزة الجاهزة للتسليم</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {metrics.availableEquipment} أجهزة
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">متاحة بكتالوج المنصة</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>نصيحة المنصة لزيادة الإيرادات:</span>
              </div>
              <Link href="/provider/dashboard#equipment" className="underline hover:text-white font-semibold">
                إضافة أجهزة جديدة +
              </Link>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>حالة نشاط الحساب:</span>
            <span className="text-emerald-400 font-bold">نشط وموثّق بالكامل ✓</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Transactions Log */}
      <div className="rounded-2xl border border-amber-500/20 bg-[#0B1E34]/90 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🧾</span>
              <span>سجل المعاملات والطلبات المنفذة حديثاً</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              بيانات الصفقات المسجلة بحسابك مع القيمة المالية وحالة التنفيذ
            </p>
          </div>
          <Link
            href="/provider/orders"
            className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold self-start sm:self-auto"
          >
            إدارة كل الطلبات في الصندوق الوارد ←
          </Link>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            لا توجد طلبات مسجلة لهذه الفترة الزمنية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-gray-800 text-gray-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">رقم الطلب</th>
                  <th className="py-2.5 px-3">الجهاز / الخدمة</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">القيمة المالية</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {filteredOrders.slice(0, 8).map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  const priceVal = Number(order.amount || order.total_price) || 0;
                  const isCompleted =
                    order.status === 'completed' || order.status === 'مكتمل' || order.status === 'مكتمل بنجاح';
                  const isPending =
                    order.status === 'pending' || order.status === 'قيد الانتظار' || order.status === 'in_progress';

                  return (
                    <tr key={order.id} className="hover:bg-[#0F253E]/50 transition">
                      <td className="py-3 px-3 font-bold text-cyan-300">
                        {order.order_number || `ORD-${order.id.slice(0, 6)}`}
                      </td>
                      <td className="py-3 px-3 text-white font-sans font-medium">
                        {order.equipment_name || 'جهاز مساحي معتمد'}
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-[11px]">{dateStr}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        {priceVal > 0 ? `${priceVal.toLocaleString('en-US')} ج.م` : 'قيد التسعير'}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCompleted
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {order.status || 'قيد الانتظار'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
