'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/15 bg-[#040C18] text-gray-300 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Column 1 (Far Right in RTL): Brand & App Download Badges */}
          <div className="space-y-4">
            <Link href="/" className="inline-block" aria-label="Survsta">
              <Image
                alt="Survsta"
                className="object-contain w-[160px] h-auto"
                height={48}
                src="/images/Designer.png"
                width={160}
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس في مصر — دليل، سوق أجهزة، خدمات، تدريب ووظائف في مكان واحد.
            </p>
            {/* App Store & Google Play buttons side-by-side */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              {/* Google Play */}
              <Link
                href="/mobile-app"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white border border-slate-800 hover:border-slate-600 transition shadow-sm"
                dir="ltr"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 512 512" aria-hidden="true" fill="none">
                  <path fill="#4285F4" d="M47.6 12.5C42.6 17.8 39.7 26 39.7 36.6v438.8c0 10.6 2.9 18.8 7.9 24.1l1.5 1.4L295 255.9v-5.8L49.1 11.1z"/>
                  <path fill="#FBBC04" d="m377 337.8-82-82v-5.8l82.1-82.1 1.8 1.1 97.2 55.2c27.8 15.8 27.8 41.6 0 57.4l-97.2 55.2z"/>
                  <path fill="#EA4335" d="m378.9 336.7-83.9-83.9L47.6 499.5c9.2 9.7 24.3 10.9 41.4 1.2l289.9-164"/>
                  <path fill="#34A853" d="M378.9 168.9 89 5C71.9-4.7 56.8-3.5 47.6 6.2L295 252.8z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="block text-[9.5px] text-slate-400">متاح قريبًا على</span>
                  <b className="block text-[11px] font-bold text-white">Google Play</b>
                </div>
              </Link>

              {/* App Store */}
              <Link
                href="/mobile-app"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white border border-slate-800 hover:border-slate-600 transition shadow-sm"
                dir="ltr"
              >
                <svg className="w-5 h-5 shrink-0 fill-current text-white" viewBox="0 0 384 512" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="block text-[9.5px] text-slate-400">متاح قريبًا على</span>
                  <b className="block text-[11px] font-bold text-white">App Store</b>
                </div>
              </Link>
            </div>
          </div>

          {/* Column 2: استكشف */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide">استكشف</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/directory" className="hover:text-cyan-400 transition-colors">
                  دليل المكاتب والشركات
                </Link>
              </li>
              <li>
                <Link href="/equipment" className="hover:text-cyan-400 transition-colors">
                  سوق الأجهزة
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-cyan-400 transition-colors">
                  الخدمات المساحية
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-cyan-400 transition-colors">
                  الخريطة التفاعلية
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5">
                  <span>Academy</span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                    قريباً
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-cyan-400 transition-colors">
                  الوظائف
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: الشركاء */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide">الشركاء</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/login" className="hover:text-cyan-400 transition-colors">
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-cyan-400 transition-colors">
                  فتح حساب جديد
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-cyan-400 transition-colors">
                  سجّل مكتبك أو شركتك
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">
                  كيف تعمل المنصة
                </Link>
              </li>
              <li>
                <Link href="/provider/dashboard" className="hover:text-cyan-400 transition-colors">
                  بوابة مزود الخدمة
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition-colors">
                  لوحة الإدارة
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 (Far Left in RTL): المنصة */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide">المنصة</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-cyan-400 transition-colors">
                  المساعدة والأسئلة
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-cyan-400 transition-colors">
                  الأسئلة الشائعة (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>© 2026 Survsta — جميع الحقوق محفوظة.</div>
          <div dir="ltr" className="flex flex-col items-center sm:items-start text-left">
            <span className="text-slate-400">Powered by Mohamed Farag</span>
            <span className="text-red-500 font-bold tracking-wide">Coreviazone</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
