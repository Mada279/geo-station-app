'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import ClientTrustBadge from '@/components/provider/ClientTrustBadge';
import { driver, Driver, DriveStep } from 'driver.js';

interface DemoOrder {
  id: string;
  equipmentTitle: string;
  equipmentCategory: string;
  clientName: string;
  clientType: string;
  trustLevel: 'trusted' | 'new';
  completedRentals: number;
  duration: string;
  amount: string;
  status: 'active' | 'pending' | 'completed';
  statusText: string;
  date: string;
}

const DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'DEMO-101',
    equipmentTitle: 'Total Station Leica TS07 (دقة 1 ثانية)',
    equipmentCategory: 'أجهزة محطة الرصد المتكاملة',
    clientName: 'شركة النيل للمقاولات العامة',
    clientType: 'شركة معتمدة',
    trustLevel: 'trusted',
    completedRentals: 8,
    duration: '7 أيام (موقع العاصمة الإدارية)',
    amount: '5,600 ج.م',
    status: 'active',
    statusText: 'مؤكد وجارٍ التنفيذ',
    date: 'منذ ساعتين',
  },
  {
    id: 'DEMO-102',
    equipmentTitle: 'مستقبل GPS RTK Trimble R12 Base & Rover',
    equipmentCategory: 'أنظمة الأقمار الصناعية GNSS',
    clientName: 'م. أحمد محمود',
    clientType: 'استشاري مساحة وطرق',
    trustLevel: 'new',
    completedRentals: 0,
    duration: '3 أيام (مشروع الساحل الشمالي)',
    amount: '4,200 ج.م',
    status: 'pending',
    statusText: 'طلب جديد بانتظار موافقتك',
    date: 'منذ 35 دقيقة',
  },
  {
    id: 'DEMO-103',
    equipmentTitle: 'ميزان قامة بصري Sokkia B40A + قامة ألومنيوم',
    equipmentCategory: 'أجهزة الميزان والقياس البصري',
    clientName: 'مكتب الدلتا للأعمال المساحية',
    clientType: 'مكتب مساحي مسجل',
    trustLevel: 'trusted',
    completedRentals: 5,
    duration: '15 يوماً (مشروع الدلتا الجديدة)',
    amount: '2,250 ج.م',
    status: 'completed',
    statusText: 'مكتمل ومستلم',
    date: 'أمس',
  },
];

export default function DemoSandboxPage() {
  const driverInstanceRef = useRef<Driver | null>(null);

  const startDemoTour = () => {
    if (typeof window === 'undefined') return;

    // Clean up any existing instances or overlays
    try {
      const existingOverlay = document.querySelector('.driver-overlay');
      if (existingOverlay) existingOverlay.remove();
      const existingPopover = document.querySelector('.driver-popover');
      if (existingPopover) existingPopover.remove();
      document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple', 'driver-no-scroll');
    } catch {}

    const demoSteps: DriveStep[] = [
      {
        element: '#demo-welcome-banner',
        popover: {
          title: 'مرحباً بك في النسخة التجريبية! ✨',
          description: 'هكذا ستبدو لوحة تحكمك الحقيقية كمزوّد خدمات وأجهزة مساحية فور انضمامك إلى Survsta.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#demo-trust-badges',
        popover: {
          title: 'مؤشر الثقة الذكي 🛡️',
          description: 'يوضح لك مدى التزام العميل وسجله التعاقدي قبل الموافقة على تأجير معداتك المساحية لحماية استثماراتك.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#demo-wallet-card',
        popover: {
          title: 'المحفظة الرقمية الآمنة 💳',
          description: 'تابع رصيدك واستقبل مستحقاتك لحظياً بأمان تام عبر فودافون كاش وإنستاباي دون أي تعقيدات.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#demo-cta-register',
        popover: {
          title: 'ابدأ الآن مجاناً! 🚀',
          description: 'انضم لأكبر شبكة مساحية في مصر وابدأ في استقبال طلبات التأجير والشراء اليوم بدون رسوم اشتراك.',
          side: 'bottom',
          align: 'center',
        },
      },
    ];

    setTimeout(() => {
      try {
        const d = driver({
          animate: true,
          smoothScroll: true,
          allowClose: true,
          allowKeyboardControl: true,
          skipMissingElement: true,
          waitForElement: 1200,
          overlayColor: 'rgba(8, 25, 51, 0.82)',
          overlayOpacity: 0.85,
          stagePadding: 8,
          stageRadius: 16,
          popoverClass: 'survsta-driver-popover',
          showProgress: true,
          nextBtnText: 'التالي ←',
          prevBtnText: '→ السابق',
          doneBtnText: 'إنهاء الجولة ✓',
          progressText: 'خطوة {{current}} من {{total}}',
          steps: demoSteps,
        });

        driverInstanceRef.current = d;
        d.drive(0);
      } catch (err) {
        console.warn('[DemoTour] Error starting demo driver:', err);
      }
    }, 150);
  };

  useEffect(() => {
    // Auto-start demo marketing tour on load with brief delay
    const timer = setTimeout(() => {
      startDemoTour();
    }, 850);

    return () => {
      clearTimeout(timer);
      try {
        driverInstanceRef.current?.destroy();
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* 1. Public Sandbox Notice Banner */}
        <div
          id="demo-welcome-banner"
          className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0F253E] via-[#0d2238] to-[#0A1A2F] p-4 sm:p-5 shadow-2xl backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl border border-cyan-500/40 shadow-inner">
                🎮
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-black text-cyan-300 border border-cyan-500/30">
                    بيئة العرض التوضيحي (Public Sandbox)
                  </span>
                  <span className="text-xs text-amber-400 font-bold hidden sm:inline">
                    • بيانات تجريبية حية
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  أنت تشاهد محاكاة تفاعلية للوحة تحكم المزوّد في منصة Survsta. استكشف سهولة إدارة الطلبات ومؤشرات الأمان.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={startDemoTour}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-300 transition shadow-md shadow-amber-950/20 cursor-pointer"
              >
                <span>🧭</span>
                <span>إعادة تشغيل الجولة</span>
              </button>

              <Link
                id="demo-cta-register"
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition"
              >
                <span>انضم إلينا وسجل الآن</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Mock Dashboard Topbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={startDemoTour}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
            >
              <span>+</span>
              <span>إضافة جهاز جديد (تجريبي)</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-300 shadow-lg shadow-emerald-950/30"
            >
              <span>💳</span>
              <span>شحن المحفظة (5,000 ج.م)</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 px-3.5 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition"
            >
              <span>🌐</span>
              <span>العودة للرئيسية</span>
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-end">
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                ✓ حساب تجريبي معتمد
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">لوحة تحكم المزوّد (عرض تفاعلي)</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
              <span>مكتب الإسكندرية للأجهزة المساحية • م. حسام الدين</span>
            </p>
          </div>
        </div>

        {/* 3. Mock KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Revenue KPI */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="text-emerald-300 font-semibold">إجمالي الإيرادات</span>
              <span className="text-emerald-400 text-lg">💰</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              15,400 ج.م
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-1">من 13 معاملة إيجار مكتملة</div>
          </div>

          {/* Active Orders KPI */}
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="text-cyan-300 font-semibold">الطلبات النشطة</span>
              <span className="text-cyan-400 text-lg">📥</span>
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              3 طلبات
            </div>
            <div className="text-[11px] text-cyan-400/90 mt-1">معدات قيد التشغيل الميداني</div>
          </div>

          {/* Equipment Count KPI */}
          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>الأجهزة المنشورة</span>
              <span className="text-amber-400 text-lg">📡</span>
            </div>
            <div className="text-2xl font-black text-amber-300">
              6 أجهزة
            </div>
            <div className="text-[11px] text-gray-400 mt-1">معروضة للبيع والتأجير</div>
          </div>

          {/* Provider Rating KPI */}
          <div className="rounded-2xl border border-yellow-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="text-yellow-300 font-semibold">تقييم المزوّد</span>
              <span className="text-yellow-400 text-lg">⭐</span>
            </div>
            <div className="text-2xl font-black text-yellow-300 font-mono">
              4.9 / 5.0
            </div>
            <div className="text-[11px] text-yellow-400/90 mt-1">استناداً إلى 14 تقييماً موثقاً</div>
          </div>

          {/* Wallet Balance Card (Step 3 Target) */}
          <div
            id="demo-wallet-card"
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0F253E] to-[#0b382c]/40 p-4 backdrop-blur-md shadow-lg"
          >
            <div className="flex justify-between items-center text-xs text-emerald-300 mb-1 font-bold">
              <span>رصيد المحفظة</span>
              <span className="text-emerald-400 text-lg">💳</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              5,000 ج.م
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center justify-between">
              <span>فودافون كاش & إنستاباي</span>
              <span className="text-xs">⚡</span>
            </div>
          </div>
        </div>

        {/* 4. Mock Orders / Rental Requests Section with Trust Badges (Step 2 Target) */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/60 p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">صندوق طلبات التأجير والشراء</h2>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                  3 طلبات واردة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                نظام Survsta الذكي يزوّدك بمؤشرات المخاطر وسجل المستأجر قبل تسليم أجهزتك.
              </p>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>تحديث فوري للطلبات</span>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 pr-2 font-bold">الجهاز المطلوب</th>
                  <th className="pb-3 font-bold" id="demo-trust-badges">
                    العميل ومؤشر الثقة (Trust Badge)
                  </th>
                  <th className="pb-3 font-bold">المدة والمشروع</th>
                  <th className="pb-3 font-bold">القيمة</th>
                  <th className="pb-3 font-bold">الحالة</th>
                  <th className="pb-3 pl-2 text-center font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {DEMO_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 pr-2">
                      <div className="font-bold text-white text-sm">{order.equipmentTitle}</div>
                      <div className="text-[11px] text-slate-400">{order.equipmentCategory}</div>
                    </td>

                    <td className="py-4">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-200">{order.clientName}</div>
                        <ClientTrustBadge
                          trustLevel={order.trustLevel}
                          completedRentals={order.completedRentals}
                        />
                      </div>
                    </td>

                    <td className="py-4 text-slate-300 font-medium">
                      <div>{order.duration}</div>
                      <div className="text-[10px] text-slate-500">{order.date}</div>
                    </td>

                    <td className="py-4 font-mono font-bold text-emerald-400 text-sm">
                      {order.amount}
                    </td>

                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          order.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : order.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                            : 'bg-slate-700/40 text-slate-300 border-slate-600'
                        }`}
                      >
                        {order.statusText}
                      </span>
                    </td>

                    <td className="py-4 pl-2 text-center">
                      <button
                        type="button"
                        onClick={startDemoTour}
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-900/60 transition"
                      >
                        <span>معاينة العقد</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Bottom Conversion Call To Action */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-l from-amber-500/10 via-[#0F253E] to-[#0F253E] p-6 text-center space-y-4">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-3xl">🚀</span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              جاهز لتحويل أجهزتك وخدماتك المساحية إلى مصدر دخل مستمر؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              انضم لمئات المهندسين ومكاتب المساحة في مصر. التسجيل مجاني بالكامل ولا يستغرق سوى دقيقتين.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-8 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition"
            >
              <span>سجّل حسابك كمزوّد معتمد مجاناً</span>
              <span>←</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              <span>العودة إلى الصفحة الرئيسية</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
