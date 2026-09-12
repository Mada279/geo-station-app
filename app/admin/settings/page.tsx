'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminSettingsPage() {
  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>⚙️ تفضيلات المنصة والربط التقني</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إعدادات النظام</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              تهيئة وتخصيص سياسات المنصة، بوابات الإشعارات، ومعايير قبول الأجهزة.
            </p>
          </div>
        </div>

        
        {/* Connection & Health Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>قاعدة بيانات Supabase</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xl font-bold text-emerald-400">متصلة (Live)</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">Latency: 38ms</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>بوابة الدفع والفوترة</span>
              <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs">💳</span>
            </div>
            <div className="text-xl font-bold text-white">نشطة</div>
            <div className="text-[11px] text-cyan-300 mt-1">الجنيه المصري (EGP)</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>خدمة الرسائل SMS OTP</span>
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 text-xs">📱</span>
            </div>
            <div className="text-xl font-bold text-white">مفعلة</div>
            <div className="text-[11px] text-purple-300 mt-1">رصيد الرسائل: 8,420</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>النسخ الاحتياطي التلقائي</span>
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs">🛡️</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">يوميًا (Daily)</div>
            <div className="text-[11px] text-gray-400 mt-1">آخر نسخة: اليوم 03:00 ص</div>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Platform Settings */}
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-cyan-500/20 pb-3 flex items-center gap-2">
              <span>🌐</span>
              <span>الإعدادات العامة وسياسات التأجير</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">اسم المنصة الرسمي</label>
                <input
                  type="text"
                  defaultValue="Survsta — منصة الأجهزة والخدمات المساحية"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">الحد الأدنى لمدة حجز الأجهزة</label>
                <select className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2.5 text-white focus:outline-none">
                  <option>يوم واحد (24 ساعة)</option>
                  <option>3 أيام</option>
                  <option>أسبوع كامل</option>
                </select>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-cyan-500/10">
                <div>
                  <div className="font-bold text-white">إلزامية شهادة المعايرة السنوية</div>
                  <div className="text-gray-400 text-[11px]">منع إدراج أي جهاز لا يحمل شهادة معايرة سارية</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-cyan-500 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Security & Sessions */}
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-cyan-500/20 pb-3 flex items-center gap-2">
              <span>🔒</span>
              <span>أمان المشرفين وإدارة الجلسات</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">مهلة انتهاء الجلسة عند عدم النشاط</label>
                <select className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2.5 text-white focus:outline-none">
                  <option>ساعتان (موصى به)</option>
                  <option>4 ساعات</option>
                  <option>8 ساعات</option>
                  <option>24 ساعة</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">البريد الإلكتروني للإشعارات العاجلة</label>
                <input
                  type="email"
                  defaultValue="admin@survsta.com"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-cyan-500/10">
                <div>
                  <div className="font-bold text-white">تسجيل التدقيق الصارم (Strict Audit)</div>
                  <div className="text-gray-400 text-[11px]">حفظ كافة استعلامات القراءة والكتابة وعناوين IP</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-cyan-500 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-xs font-black text-[#081933] shadow-lg shadow-cyan-500/20 hover:brightness-110 transition">
            حفظ إعدادات النظام
          </button>
        </div>

      </div>
    </div>
  );
}
