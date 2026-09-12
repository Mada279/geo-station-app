'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/15 bg-[#081933] text-gray-300 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand & Description */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center" aria-label="Survsta">
              <Image
                alt="Survsta"
                className="object-contain w-[160px] h-auto"
                height={48}
                src="/images/Designer.png"
                width={160}
              />
            </Link>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس في مصر — دليل، سوق أجهزة، خدمات، تدريب ووظائف في مكان واحد.
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide">استكشف</h4>
            <ul className="space-y-2.5 text-sm">
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

          {/* For Partners */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide">للشركاء</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-cyan-400 transition-colors">
                  🔐 تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-cyan-400 transition-colors">
                  ✨ انضم كشريك
                </Link>
              </li>
              <li>
                <Link href="/provider/dashboard" className="hover:text-cyan-400 transition-colors">
                  📊 بوابة المزوّد
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition-colors">
                  🛡️ لوحة الإدارة
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform / Support */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide">المنصة</h4>
            <ul className="space-y-2.5 text-sm">
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

        <div className="mt-12 pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>© 2026 Survsta — جميع الحقوق محفوظة.</div>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="font-semibold text-gray-400">Coreviazone</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
