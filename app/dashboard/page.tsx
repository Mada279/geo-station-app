'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export default function UnifiedDashboardPage() {
  const [activeModules, setActiveModules] = useState<string[]>(['client']);
  const [modulesMap, setModulesMap] = useState<Record<string, string>>({ client: 'active' });
  const [userName, setUserName] = useState<string>('مستخدم سيرفستا');
  const [userEmail, setUserEmail] = useState<string>('');
  const [ordersCount, setOrdersCount] = useState<number>(0);

  const parseModulesData = (raw: any) => {
    if (Array.isArray(raw) && raw.length > 0) {
      setActiveModules(raw);
      const map: Record<string, string> = {};
      raw.forEach((m) => (map[m] = 'active'));
      setModulesMap(map);
    } else if (raw && typeof raw === 'object') {
      const keys = Object.keys(raw).filter(
        (k) => raw[k] === 'active' || raw[k] === 'pending'
      );
      if (keys.length > 0) {
        setActiveModules(keys);
        setModulesMap(raw);
      }
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          if (user.user_metadata?.full_name || user.user_metadata?.name) {
            setUserName(user.user_metadata.full_name || user.user_metadata.name);
          }

          if (user.user_metadata?.active_modules) {
            parseModulesData(user.user_metadata.active_modules);
          }

          const { data: clientRow } = await supabase
            .from('clients')
            .select('id, full_name, active_modules')
            .eq('user_id', user.id)
            .maybeSingle();

          if (clientRow) {
            if (clientRow.full_name) setUserName(clientRow.full_name);
            if (clientRow.active_modules) {
              parseModulesData(clientRow.active_modules);
            }

            // Count client orders
            const { count } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', clientRow.id);

            if (typeof count === 'number') {
              setOrdersCount(count);
            }
          }
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.name) setUserName(parsed.name);
              if (parsed.email) setUserEmail(parsed.email);
              if (parsed.active_modules) {
                parseModulesData(parsed.active_modules);
              }
            } catch {}
          }
        }
      } catch (e) {
        console.error('Error loading dashboard overview:', e);
      }
    }

    loadData();
  }, []);

  const hasClient = activeModules.includes('client');
  const hasFreelancer = activeModules.includes('freelancer');
  const hasProvider = activeModules.includes('provider');
  const isProviderPending = modulesMap['provider'] === 'pending';

  return (
    <div className="space-y-8" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                حساب موحد نشط
              </span>
              <span className="text-xs text-slate-400 font-mono">{userEmail || 'جلسة معتمدة'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              مرحباً بك، {userName} 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              هذه لوحة التحكم الموحدة الخاصة بك. يمكنك إدارة حجوزات الأجهزة، التقديم على فرص العمل، أو استثمار معداتك من شاشة واحدة دون الحاجة لحسابات متعددة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>تخصيص الأدوار</span>
            </Link>

            <Link
              href="/client/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>إعدادات الهاتف والأمان</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Modules Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Client Card */}
        <div
          className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            hasClient
              ? 'bg-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-950/40'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${hasClient ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {hasClient ? 'مفعّل في حسابك' : 'غير مفعل'}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">طالب خدمة (عميل)</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                استئجار أجهزة Total Station وGPS، إرسال طلبات المشروعات المساحية للشركات.
              </p>
            </div>

            {hasClient && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">إجمالي الحجوزات:</span>
                <span className="font-bold font-mono text-cyan-400">{ordersCount} طلبات</span>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 mt-4 flex items-center gap-3">
            {hasClient ? (
              <>
                <Link
                  href="/dashboard/orders"
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition"
                >
                  طلباتي وحجوزاتي ←
                </Link>
                <Link
                  href="/equipment"
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  طلب جهاز
                </Link>
              </>
            ) : (
              <Link
                href="/onboarding"
                className="w-full text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                + تفعيل دور العميل
              </Link>
            )}
          </div>
        </div>

        {/* Module 2: Freelancer Card */}
        <div
          className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            hasFreelancer
              ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${hasFreelancer ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {hasFreelancer ? 'مفعّل في حسابك' : 'غير مفعل'}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">مستقل / مسّاح محترف</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                الملف المهني الهندسي، التقديم على الوظائف وعقود العمل الميدانية اليومية والمشروعات.
              </p>
            </div>

            {hasFreelancer && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">حالة السيرة الذاتية:</span>
                <span className="font-bold text-emerald-400">متاحة لأصحاب الأعمال ✓</span>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 mt-4 flex items-center gap-3">
            {hasFreelancer ? (
              <>
                <Link
                  href="/dashboard/freelancer"
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition"
                >
                  ملفي المهني (CV) ←
                </Link>
                <Link
                  href="/jobs"
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  الوظائف
                </Link>
              </>
            ) : (
              <Link
                href="/onboarding"
                className="w-full text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                + تفعيل دور المستقل
              </Link>
            )}
          </div>
        </div>

        {/* Module 3: Provider Card */}
        <div
          className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            hasProvider
              ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/40'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                hasProvider
                  ? isProviderPending
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hasProvider
                  ? isProviderPending
                    ? 'قيد المراجعة ⏳'
                    : 'مفعّل في حسابك'
                  : 'غير مفعل'}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">مزود خدمة / تأجير</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                استثمار الأجهزة المساحية وتأجيرها لشركات المقاولات، وإدارة الكتالوج المؤسسي.
              </p>
            </div>

            {hasProvider && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">حالة دور المزود:</span>
                {isProviderPending ? (
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>بانتظار الاعتماد من الإدارة</span>
                  </span>
                ) : (
                  <span className="font-bold text-amber-400">إدارة الأجهزة والأسعار</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 mt-4 flex items-center gap-3">
            {hasProvider ? (
              <Link
                href="/provider/dashboard"
                className={`w-full text-center py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isProviderPending
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/30 text-amber-300'
                }`}
              >
                <span>{isProviderPending ? 'متابعة حالة الاعتماد ⏳' : 'كتالوج ومبيعات المزود ←'}</span>
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="w-full text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                + تفعيل دور المزود
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Info Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">هل ترغب في تغيير أو إضافة أدوار جديدة؟</h3>
            <p className="text-xs text-slate-400">
              يمكنك في أي لحظة النقر على "تخصيص الأدوار" وتفعيل أي دور جديد يظهر تلقائياً في شريطك الجانبي.
            </p>
          </div>
        </div>

        <Link
          href="/onboarding"
          className="whitespace-nowrap px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          تعديل الأدوار الآن
        </Link>
      </div>
    </div>
  );
}
