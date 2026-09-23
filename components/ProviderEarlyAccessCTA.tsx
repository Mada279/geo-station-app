import React from 'react';
import Link from 'next/link';

export default function ProviderEarlyAccessCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#081933] via-[#0b1e3d] to-[#081933] text-white py-14 lg:py-18 border-y border-cyan-500/30" dir="rtl">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-0 right-1/4 -mt-16 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-16 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          {/* Subtle Tag / Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs sm:text-sm font-black text-amber-300 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>دعوة خاصة لمكاتب وشركات المساحة وموردي الأجهزة</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            🚀 اغتنم الفرصة: كُن من أوائل المكاتب المساحية المعتمدة في Survsta
          </h2>

          {/* Subheading */}
          <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            نستعد حالياً لإطلاق أضخم حملة تسويقية موجهة لكبرى شركات المقاولات والمهندسين في مصر. بادر بتسجيل مكتبك وتوثيق أجهزتك اليوم، لتضمن ظهورك في صدارة نتائج البحث فور تدفق طلبات الإيجار والشراء!
          </p>

          {/* 3 Pillars / Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right pt-4">
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg hover:border-cyan-500/40 transition">
              <div className="text-2xl mb-2">🌟</div>
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">أولوية الظهور</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                الحسابات المبكرة تحظى بترتيب متقدم في عرض الأجهزة والمعدات للعملاء.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg hover:border-cyan-500/40 transition">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">توثيق مجاني وسريع</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                أولوية قصوى لمراجعة أوراق مكتبك ومنحك &quot;علامة التوثيق&quot;.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg hover:border-cyan-500/40 transition">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">جاهزية تامة</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                ارفع أجهزتك وكن مستعداً لاستقبال الطلبات فور الإطلاق الجماهيري.
              </p>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-8 py-3.5 text-base font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <span>انضم الآن كمزوّد معتمد</span>
              <span className="text-lg">←</span>
            </Link>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-400">
            ✓ التسجيل مجاني وبلا أي رسوم اشتراك خفية • التحقق من الهوية والأوراق الهندسية خلال 24 ساعة
          </p>

        </div>
      </div>
    </section>
  );
}
