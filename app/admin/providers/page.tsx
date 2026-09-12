'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminProvidersPage() {
  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>🏢 شركاء المنصة وشبكة التوريد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">المزوّدون</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              إدارة شبكة مكاتب وشركات المساحة المعتمدة والمعدات المسجلة لديهم.
            </p>
          </div>
        </div>

        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي المزوّدين المعتمدين</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">🏢</span>
            </div>
            <div className="text-2xl font-black text-white">148 <span className="text-xs text-cyan-300 font-normal">مكتب وشركة</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">▲ تغطية 21 محافظة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>مزوّدون نشطون هذا الأسبوع</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-white">112</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">جاهزية فورية لتسليم المعدات</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>معدل تقييم الخدمة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⭐</span>
            </div>
            <div className="text-2xl font-black text-white">4.89 <span className="text-xs text-gray-400 font-normal">/ 5.0</span></div>
            <div className="text-[11px] text-amber-300 mt-2 font-semibold">بناءً على 410 تقييم معتمد</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>أجهزة متاحة للإيجار الآن</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">📡</span>
            </div>
            <div className="text-2xl font-black text-white">312 <span className="text-xs text-gray-400 font-normal">جهاز</span></div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">توتال ستيشن، GNSS، ليفل، ليزر</div>
          </div>
        </div>

        {/* Providers Directory Table */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">دليل مزوّدي الخدمات والمعدات</h3>
              <p className="text-xs text-gray-400 mt-0.5">عرض وتعديل وتجميد حسابات المزوّدين المعتمدين</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="ابحث باسم المزوّد، المحافظة..."
                className="rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              <select className="rounded-xl border border-cyan-500/30 bg-[#081933] px-3 py-2 text-xs text-gray-300 focus:outline-none">
                <option>كافة المحافظات</option>
                <option>القاهرة</option>
                <option>الجيزة</option>
                <option>الإسكندرية</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-gray-300">
              <thead className="bg-[#081933] text-gray-400 border-b border-cyan-500/20 font-bold">
                <tr>
                  <th className="p-3.5">اسم المزوّد / الشركة</th>
                  <th className="p-3.5">المحافظة والمقر</th>
                  <th className="p-3.5">مسؤول الاتصال</th>
                  <th className="p-3.5">المعدات المسجلة</th>
                  <th className="p-3.5">التقييم</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {[
                  { name: 'مكتب الأهرام للمساحة الهندسية', city: 'القاهرة — مدينة نصر', contact: 'م. أحمد الشناوي', count: '14 جهاز', rating: '4.9 ★', status: 'نشط', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                  { name: 'جيو تكنولوجي مصر', city: 'الجيزة — الدقي', contact: 'م. كريم عادل', count: '9 أجهزة', rating: '4.8 ★', status: 'نشط', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                  { name: 'الإسكندرية للمسح البحري والبري', city: 'الإسكندرية — سموحة', contact: 'م. حسام الدين', count: '18 جهاز', rating: '5.0 ★', status: 'نشط', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                  { name: 'مؤسسة النيل للخدمات المساحية', city: 'أسيوط — شارع الجمهورية', contact: 'م. طارق بدوي', count: '6 أجهزة', rating: '4.7 ★', status: 'قيد التحديث', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#081933]/50 transition">
                    <td className="p-3.5 font-bold text-white">{row.name}</td>
                    <td className="p-3.5 text-gray-300">{row.city}</td>
                    <td className="p-3.5 text-gray-400">{row.contact}</td>
                    <td className="p-3.5 font-semibold text-cyan-300">{row.count}</td>
                    <td className="p-3.5 font-bold text-amber-400">{row.rating}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center space-x-2 space-x-reverse">
                      <button className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition">
                        الملف الكامل
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
