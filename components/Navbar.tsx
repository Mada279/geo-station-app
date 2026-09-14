'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'provider' | 'customer';
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sticky top-0 left-0 z-50 w-full">
      {/* Top Announcement / Utility Bar */}
      <div className="bg-[#0F253E] text-slate-300 text-xs border-b border-white/10 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[12px] truncate">
            <span>📍</span>
            <span>نخدم حاليًا: الإسكندرية والقاهرة والجيزة — التوسع تباعًا لباقي المحافظات</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 text-[12px] font-medium text-slate-300 shrink-0">
            <Link href="/mobile-app" className="hover:text-white transition whitespace-nowrap">حمل التطبيق</Link>
            <Link href="/help" className="hover:text-white transition whitespace-nowrap">المساعدة</Link>
            <Link href="/contact" className="hover:text-white transition whitespace-nowrap">تواصل معنا</Link>
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition font-semibold whitespace-nowrap">دخول الشركاء</Link>
          </div>
        </div>
      </div>

      {/* Main Header / Navbar */}
      <header className="border-b border-cyan-500/15 bg-[#081933]/95 backdrop-blur-md text-white transition-colors">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg shrink-0"
            aria-label="Survsta Home"
          >
            <Image
              alt="Survsta"
              className="object-contain w-[150px] sm:w-[160px] h-auto"
              height={48}
              priority
              src="/images/Designer.png"
              width={160}
            />
          </Link>

          {/* Desktop Navigation Links - Exact Right-to-Left Order */}
          <nav className="flex max-md:hidden items-center gap-3 lg:gap-5 text-sm font-medium text-gray-300">
            <Link
              href="/"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              href="/directory"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/directory' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              الدليل
            </Link>
            <Link
              href="/equipment"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/equipment' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              الأجهزة
            </Link>
            <Link
              href="/services"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/services' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              الخدمات
            </Link>
            <Link
              href="/map"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/map' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              الخريطة
            </Link>
            <Link
              href="/academy"
              className={`whitespace-nowrap transition-colors flex items-center gap-1 px-1 py-1 ${
                pathname === '/academy' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              <span>Academy</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                قريباً
              </span>
            </Link>
            <Link
              href="/jobs"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/jobs' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              الوظائف
            </Link>
            <Link
              href="/about"
              className={`whitespace-nowrap transition-colors px-1 py-1 ${
                pathname === '/about' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-gray-300 hover:text-cyan-400'
              }`}
            >
              عن المنصة
            </Link>
          </nav>

          {/* Left Actions: "انضم الآن" (Solid Gold/Yellow) + "دخول" (Outline/Ghost) */}
          <div className="flex max-md:hidden items-center gap-3 shrink-0">
            <Link
              href="/join"
              className="rounded-lg bg-[#F4B400] px-5 py-2 text-sm font-bold text-black shadow-sm hover:brightness-105 transition whitespace-nowrap"
            >
              انضم الآن
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={user.role === 'admin' ? '/admin' : '/provider/dashboard'}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition whitespace-nowrap"
                >
                  {user.role === 'admin' ? 'لوحة الإدارة' : 'لوحة التحكم'}
                </Link>
                <button
                  onClick={() => {
                    document.cookie = "survsta_session=; path=/; max-age=0";
                    document.cookie = "user_role=; path=/; max-age=0";
                    window.location.href = "/login";
                  }}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition"
                >
                  خروج
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-white/40 text-white hover:bg-white/10 hover:border-white px-4 py-2 text-sm font-semibold transition whitespace-nowrap"
              >
                دخول
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-900 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-gray-800 bg-[#081933] px-4 py-4 space-y-3 text-right">
            <Link href="/" className={`block py-2 text-sm ${pathname === '/' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              الرئيسية
            </Link>
            <Link href="/directory" className={`block py-2 text-sm ${pathname === '/directory' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              الدليل
            </Link>
            <Link href="/equipment" className={`block py-2 text-sm ${pathname === '/equipment' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              الأجهزة
            </Link>
            <Link href="/services" className={`block py-2 text-sm ${pathname === '/services' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              الخدمات
            </Link>
            <Link href="/map" className={`block py-2 text-sm ${pathname === '/map' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              الخريطة
            </Link>
            <Link href="/academy" className={`block py-2 text-sm ${pathname === '/academy' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              Academy (قريباً)
            </Link>
            <Link href="/jobs" className={`block py-2 text-sm ${pathname === '/jobs' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              الوظائف
            </Link>
            <Link href="/about" className={`block py-2 text-sm ${pathname === '/about' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}>
              عن المنصة
            </Link>
            <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
              <Link
                href="/join"
                className="text-center py-2.5 text-sm font-bold text-black bg-[#F4B400] rounded-lg hover:brightness-105"
              >
                انضم الآن
              </Link>
              <Link
                href="/login"
                className="text-center py-2 text-sm font-semibold text-white border border-white/40 rounded-lg hover:bg-white/10"
              >
                دخول
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
export { Navbar as Header };

