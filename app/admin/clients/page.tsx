'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';


export default function AdminClientsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>👥 إدارة المستفيدين وحسابات العملاء</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">العملاء</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              إدارة حسابات شركات المقاولات، المكاتب الاستشارية، والمهندسين المسجلين.
            </p>
          </div>
        </div>

        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي حسابات العملاء</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">👥</span>
            </div>
            <div className="text-2xl font-black text-white">480 <span className="text-xs text-cyan-300 font-normal">جهة مسجلة</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">▲ +32 عميل هذا الشهر</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>شركات مقاولات فئة أولى</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">🏗️</span>
            </div>
            <div className="text-2xl font-black text-white">68 <span className="text-xs text-gray-400 font-normal">شركة كبرى</span></div>
            <div className="text-[11px] text-purple-300 mt-2 font-semibold">مشاريع البنية التحتية والمحاور</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>طلبات تأجير جارية</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">📦</span>
            </div>
            <div className="text-2xl font-black text-white">54 <span className="text-xs text-gray-400 font-normal">طلب نشط</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">موزعة على مواقع المشاريع</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>معدل تكرار الطلب</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">🔄</span>
            </div>
            <div className="text-2xl font-black text-white">64%</div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">عملاء دائمون بعقود متكررة</div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/50 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">سجل حسابات العملاء</h3>
              <p className="text-xs text-gray-400 mt-0.5">عرض وتفاصيل الجهات الطالبة للخدمات والمعدات المساحية</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="ابحث باسم الشركة أو المهندس..."
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              <select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-gray-300 focus:outline-none">
                <option>كافة التصنيفات</option>
                <option>مكاتب استشارية</option>
                <option>شركات مقاولات</option>
                <option>مهندسون أفراد</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-200 bg-slate-900">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 text-slate-300">اسم الجهة / العميل</th>
                  <th className="p-3.5 text-slate-300">التصنيف</th>
                  <th className="p-3.5 text-slate-300">مسؤول المشتريات / المساحة</th>
                  <th className="p-3.5 text-slate-300">الهاتف</th>
                  <th className="p-3.5 text-slate-300">إجمالي العقود</th>
                  <th className="p-3.5 text-slate-300">الحالة</th>
                  <th className="p-3.5 text-slate-300 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { name: 'شركة المقاولون العرب (فرع المعادي)', type: 'مقاولات فئة أولى', contact: 'م. مصطفى كمال', phone: '01019283746', contracts: '18 عقد', status: 'نشط', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                  { name: 'دار الهندسة للاستشارات', type: 'مكتب استشاري', contact: 'م. سارة محمود', phone: '01293847561', contracts: '11 عقد', status: 'نشط', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                  { name: 'رواد الهندسة الحديثة RME', type: 'مقاولات فئة أولى', contact: 'م. تامر جلال', phone: '01128475938', contracts: '24 عقد', status: 'نشط', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                  { name: 'مكتب مصر للمساحة والخرائط', type: 'مكتب هندسي', contact: 'م. يوسف فتحي', phone: '01594837261', contracts: '5 عقود', status: 'نشط', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-bold text-white">{row.name}</td>
                    <td className="p-3.5 text-cyan-200 font-semibold">{row.type}</td>
                    <td className="p-3.5 text-slate-200">{row.contact}</td>
                    <td className="p-3.5 font-mono text-slate-300">{row.phone}</td>
                    <td className="p-3.5 font-bold text-white">{row.contracts}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center space-x-2 space-x-reverse">
                      <button className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition">
                        سجل الطلبات
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
