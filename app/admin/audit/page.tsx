'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminAuditPage() {
  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📜 الأمان وسجل النشاطات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">سجل التدقيق</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              سجل زمني مفصل لكافة العمليات الحساسة وتغييرات الصلاحيات وحركات البيانات.
            </p>
          </div>
        </div>

        
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي السجلات اليوم</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">📜</span>
            </div>
            <div className="text-2xl font-black text-white">1,420 <span className="text-xs text-cyan-300 font-normal">حدث</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">تغطية أمنية شاملة لجميع الحركات</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>عمليات المشرفين</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">🛡️</span>
            </div>
            <div className="text-2xl font-black text-white">28 <span className="text-xs text-gray-400 font-normal">إجراء إداري</span></div>
            <div className="text-[11px] text-purple-300 mt-2 font-semibold">اعتماد، تعديل، حذف، تغيير أدوار</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>محاولات اختراق أو وصول محظور</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">🔒</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">0 <span className="text-xs text-gray-400 font-normal">تهديدات</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">الحماية والجدار الناري نشط بالكامل</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>حالة تشفير السجلات</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">🔑</span>
            </div>
            <div className="text-2xl font-black text-white">SHA-256</div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">غير قابلة للتلاعب أو التعديل</div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">السجل الزمني للأحداث (Audit Trail)</h3>
              <p className="text-xs text-gray-400 mt-0.5">توثيق كل حركة بالوقت، المنفذ، العنوان البرمجي، والتفاصيل</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-[#081933] text-xs font-bold text-gray-300 hover:text-white transition">
                تصدير السجل كـ CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-gray-300">
              <thead className="bg-[#081933] text-gray-400 border-b border-cyan-500/20 font-bold">
                <tr>
                  <th className="p-3.5">نوع العملية</th>
                  <th className="p-3.5">المستخدم / المشرف</th>
                  <th className="p-3.5">الهدف / المورد</th>
                  <th className="p-3.5">عنوان IP</th>
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {[
                  { action: 'اعتماد مزوّد خدمة جديد', user: 'admin@survsta.com', target: 'providers (id: 489)', ip: '197.34.12.89', time: 'منذ 8 دقائق', status: 'ناجح', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                  { action: 'تعديل صلاحيات مستخدم', user: 'admin@survsta.com', target: 'users (role -> admin)', ip: '197.34.12.89', time: 'منذ 25 دقيقة', status: 'ناجح', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                  { action: 'تسجيل مزوّد عبر بوابة الانضمام', user: 'public_lead', target: 'providers (محمد علي)', ip: '156.204.81.12', time: 'منذ ساعتين', status: 'مسجل', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
                  { action: 'توليد كود تحقق OTP', user: 'system_auth', target: 'sms_gateway (854921)', ip: '10.0.4.1', time: 'منذ 3 ساعات', status: 'مرسل', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#081933]/50 transition font-mono">
                    <td className="p-3.5 font-sans font-bold text-white">{row.action}</td>
                    <td className="p-3.5 text-cyan-300 font-sans">{row.user}</td>
                    <td className="p-3.5 text-gray-400">{row.target}</td>
                    <td className="p-3.5 text-gray-400">{row.ip}</td>
                    <td className="p-3.5 text-gray-400 font-sans">{row.time}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-bold border ${row.color}`}>
                        {row.status}
                      </span>
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
