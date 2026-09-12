import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminEquipmentPage() {
  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <div className="border-b border-cyan-500/20 pb-4">
          <h1 className="text-2xl font-black text-white">مراجعة الأجهزة والمعدات</h1>
          <p className="text-xs text-gray-400 mt-1">فحص مواصفات وسجلات معايرة أجهزة التوتال ستيشن والـ GNSS.</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-8 text-center text-gray-400 text-xs">
          جميع الأجهزة المدرجة حالياً معتمدة وسارية المعايرة.
        </div>
      </div>
    </div>
  );
}
