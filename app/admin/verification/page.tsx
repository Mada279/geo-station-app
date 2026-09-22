'use client';

import React from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';


export default function AdminVerificationPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>🔎 تدقيق الوثائق والتراخيص</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">مركز التوثيق</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              مراجعة السجلات التجارية للمكاتب المساحية وشهادات المعايرة السنوية للأجهزة الهندسية.
            </p>
          </div>
          <Link
            href="/admin/kyc"
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <span>🛡️</span>
            <span>نظام توثيق الشركات والـ KYC المتقدم ←</span>
          </Link>
        </div>

        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>وثائق قيد التدقيق الفني</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⏳</span>
            </div>
            <div className="text-2xl font-black text-amber-400">12 <span className="text-xs text-gray-400 font-normal">وثيقة</span></div>
            <div className="text-[11px] text-amber-300/80 mt-2 font-semibold">تتطلب مراجعة من الإدارة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>مزوّدون موثقون بالكامل</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">✅</span>
            </div>
            <div className="text-2xl font-black text-white">136 <span className="text-xs text-gray-400 font-normal">مكتب</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">سجل تجاري وبطاقة ضريبية معتمدة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>شهادات معايرة سارية</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">📐</span>
            </div>
            <div className="text-2xl font-black text-white">95.4%</div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">معتمدة من مراكز المعايرة الرسمية</div>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>تنبيهات انتهاء المعايرة</span>
              <span className="p-2 rounded-xl bg-red-500/10 text-red-400 text-base">⚠️</span>
            </div>
            <div className="text-2xl font-black text-red-400">5 <span className="text-xs text-gray-400 font-normal">أجهزة</span></div>
            <div className="text-[11px] text-red-300/80 mt-2 font-semibold">تنتهي خلال 15 يوماً</div>
          </div>
        </div>

        {/* Verification Queue Table */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/50 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">قائمة الوثائق المقدمة للتحقق</h3>
              <p className="text-xs text-gray-400 mt-0.5">شهادات المعايرة والسجلات الضريبية والتجارية الجديدة</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                12 وثيقة معلقة
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-200 bg-slate-900">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 text-slate-300">اسم الجهة / المزوّد</th>
                  <th className="p-3.5 text-slate-300">نوع المستند</th>
                  <th className="p-3.5 text-slate-300">رقم المستند / السيريال</th>
                  <th className="p-3.5 text-slate-300">تاريخ التقديم</th>
                  <th className="p-3.5 text-slate-300">الحالة</th>
                  <th className="p-3.5 text-slate-300 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { provider_name: 'مكتب الدلتا للهندسة والمساحة', type: 'شهادة معايرة محطة رصد متكاملة TS07', ref: 'CAL-2026-894', date: 'منذ 2 ساعة', status: 'قيد الفحص' },
                  { provider_name: 'الشركة الهندسية للتجهيزات الجيوديسية', type: 'السجل التجاري والبطاقة الضريبية', ref: 'CR-104928', date: 'اليوم 10:30 ص', status: 'بانتظار المراجعة' },
                  { provider_name: 'سرفاي تك للمقاولات والمساحة', type: 'شهادة معايرة جهاز GNSS R12i', ref: 'CAL-2026-103', date: 'أمس', status: 'معتمد مبدئياً' },
                ].map((doc: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-semibold text-slate-200">
                      <span className="font-semibold text-white">
                        {doc.provider_name || doc.provider?.company_name || doc.provider?.name || 'مزود غير معروف'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-200">{doc.type}</td>
                    <td className="p-3.5 font-mono text-slate-300">{doc.ref}</td>
                    <td className="p-3.5 text-slate-400">{doc.date}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                        doc.status === 'قيد الفحص' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        doc.status === 'بانتظار المراجعة' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center space-x-2 space-x-reverse">
                      <button className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition">
                        معاينة الوثيقة
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold transition">
                        اعتماد
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
