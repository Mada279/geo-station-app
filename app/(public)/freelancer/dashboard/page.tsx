'use client';

import React from 'react';
import Link from 'next/link';

export default function FreelancerDashboardHub() {
  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-100 p-6 sm:p-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
          <Link href="/dashboard" className="hover:text-emerald-400">الرئيسية</Link>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">بوابة المهندس والمستقل</span>
        </div>
        <h1 className="text-3xl font-black text-white">بوابة المهندس والمساح المستقل</h1>
        <p className="text-sm text-slate-400 mt-1">
          إدارة ملفك المهني، تتبع طلبات التوظيف وقبول الشركات، واستكشاف أحدث الفرص المساحية في مصر.
        </p>
      </div>

      {/* Main Action Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Applications Tracking */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 space-y-4 transition shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-2xl font-bold">
            📋
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
              طلبات التوظيف والقبول
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              متابعة السير الذاتية التي تقدمت بها، والاطلاع على قرارات القبول والتواصل الفوري مع الشركات عبر واتساب.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/freelancer/applications"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
            >
              <span>فتح مركز تتبع الطلبات ←</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Professional Profile / CV */}
        <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 space-y-4 transition shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-2xl font-bold">
            👤
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
              الملف المهني وسابقة الأعمال (CV)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              تحديث بيانات الخبرات بالأجهزة المساحية (Total Station, GPS)، الأجر اليومي، وحالة التفرغ للمشروعات.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/dashboard/freelancer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline"
            >
              <span>تعديل السيرة الذاتية المهنية ←</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Browse Jobs Market */}
        <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 space-y-4 transition shadow-xl group">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-2xl font-bold">
            🌐
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition">
              سوق الوظائف المساحية
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              استعراض وظائف المواقع والـ GIS المنشورة حالياً من الشركات والمكاتب المعتمدة في مختلف المحافظات.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
            >
              <span>تصفح كافة الوظائف الشاغرة ←</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
