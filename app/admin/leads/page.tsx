'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLeadsPage() {
  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📥 مسار الطلبات وعروض الأسعار</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة الطلبات</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              متابعة وتوجيه طلبات استئجار المعدات وعروض الأسعار بين العملاء والمزوّدين.
            </p>
          </div>
        </div>

        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>طلبات جديدة واردة</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">🔔</span>
            </div>
            <div className="text-2xl font-black text-cyan-400">9 <span className="text-xs text-gray-400 font-normal">طلبات</span></div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">تتطلب توجيه للمزوّدين الأنسب</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>قيد التفاوض والتسعير</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">💬</span>
            </div>
            <div className="text-2xl font-black text-white">14</div>
            <div className="text-[11px] text-amber-300/80 mt-2 font-semibold">عروض أسعار قيد المراجعة</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>صفقات تم إغلاقها</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">🤝</span>
            </div>
            <div className="text-2xl font-black text-white">89 <span className="text-xs text-emerald-400 font-normal">صفقة</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">▲ تسليم واستلام ناجح</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>نسبة تحويل الطلبات</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">📊</span>
            </div>
            <div className="text-2xl font-black text-white">74.2%</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">معدل إغلاق ممتاز</div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">قائمة الطلبات وعروض الأسعار الحالية</h3>
              <p className="text-xs text-gray-400 mt-0.5">متابعة الطلبات المفتوحة وتوزيعها جغرافياً على مزوّدي المعدات</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3.5 py-2 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-xs font-bold text-[#081933] shadow-md hover:brightness-110 transition">
                + إنشاء طلب يدوي
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-gray-300">
              <thead className="bg-[#081933] text-gray-400 border-b border-cyan-500/20 font-bold">
                <tr>
                  <th className="p-3.5">رقم الطلب</th>
                  <th className="p-3.5">الجهة الطالبة</th>
                  <th className="p-3.5">المعدات المطلوبة</th>
                  <th className="p-3.5">موقع المشروع والمدة</th>
                  <th className="p-3.5">الميزانية المقترحة</th>
                  <th className="p-3.5">حالة الطلب</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {[
                  { id: 'ORD-8921', client: 'شركة أوراسكوم للإنشاءات', equipment: 'عدد 2 جهاز GNSS + Base', location: 'العاصمة الإدارية — 3 أسابيع', budget: '42,000 ج.م', status: 'جديد بانتظار العروض', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
                  { id: 'ORD-8919', client: 'مكتب خطيب وعلمي', equipment: 'محطة رصد متكاملة Leica TS16', location: 'العلمين الجديدة — شهرين', budget: '80,000 ج.م', status: 'جاري التفاوض', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                  { id: 'ORD-8910', client: 'مجموعة حسن علام', equipment: 'ميزان قامة دقيق + ملحقات', location: 'السادس من أكتوبر — 10 أيام', budget: '15,000 ج.م', status: 'تم الاتفاق والتوريد', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#081933]/50 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-300">{row.id}</td>
                    <td className="p-3.5 font-bold text-white">{row.client}</td>
                    <td className="p-3.5 text-gray-300">{row.equipment}</td>
                    <td className="p-3.5 text-gray-400">{row.location}</td>
                    <td className="p-3.5 font-bold text-white">{row.budget}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center space-x-2 space-x-reverse">
                      <button className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition">
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
