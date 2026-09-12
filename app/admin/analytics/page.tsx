'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminAnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📈 ذكاء الأعمال والتحليلات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">تحليلات المنصة</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              مؤشرات الأداء التفاعلية، حجم الطلبات وتوزيع النشاط الجغرافي للمعدات والمساحين.
            </p>
          </div>
        </div>

        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي قيمة الطلبات التقديرية</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">💰</span>
            </div>
            <div className="text-2xl font-black text-white">2,840,000 <span className="text-xs text-cyan-300 font-normal">ج.م</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold flex items-center gap-1">
              <span>▲ +18.4%</span>
              <span className="text-gray-400 font-normal">مقارنة بالشهر السابق</span>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>معدل إشغال المعدات المساحية</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">📡</span>
            </div>
            <div className="text-2xl font-black text-white">78.6%</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold flex items-center gap-1">
              <span>▲ +5.2%</span>
              <span className="text-gray-400 font-normal">طلب مرتفع على GNSS</span>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>عقود الإيجار المنجزة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">📝</span>
            </div>
            <div className="text-2xl font-black text-white">342 <span className="text-xs text-gray-400 font-normal">عقد</span></div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">94% نسبة رضا العملاء</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>متوسط زمن الاستجابة</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-white">3.8 <span className="text-xs text-gray-400 font-normal">ساعات</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">▼ -25% تسريع الردود</div>
          </div>
        </div>

        {/* Charts & Analytics Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">حجم الطلبات والنمو الشهري (2026)</h3>
                <p className="text-xs text-gray-400 mt-0.5">مقارنة الطلبات المكتملة بعروض الأسعار الصادرة</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">بيانات محدثة</span>
            </div>
            
            <div className="space-y-3 pt-2">
              {[
                { month: 'يناير', requests: 45, completed: 38, pct: '84%' },
                { month: 'فبراير', requests: 62, completed: 54, pct: '87%' },
                { month: 'مارس (الحالي)', requests: 88, completed: 76, pct: '92%' },
              ].map((row, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-300">
                    <span>{row.month}</span>
                    <span className="text-cyan-400">{row.completed} مكتمل من {row.requests} طلب ({row.pct})</span>
                  </div>
                  <div className="w-full bg-[#081933] rounded-full h-3.5 overflow-hidden border border-cyan-500/10">
                    <div
                      className="bg-gradient-to-l from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: row.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-cyan-500/20 pb-4">أكثر الأجهزة طلباً</h3>
            <div className="space-y-3">
              {[
                { name: 'Leica TS07 Total Station', share: '38%', count: '130 عملية' },
                { name: 'Trimble R12i GNSS System', share: '29%', count: '99 عملية' },
                { name: 'Topcon OS-101 Total Station', share: '18%', count: '62 عملية' },
                { name: 'CHCNAV i73+ GNSS Receiver', share: '15%', count: '51 عملية' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#081933]/60 border border-cyan-500/10">
                  <div>
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{item.count}</div>
                  </div>
                  <span className="text-xs font-extrabold text-cyan-300 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">{item.share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
