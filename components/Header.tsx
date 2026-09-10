'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'provider' | 'customer';
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md py-4">
      <div className="mx-auto flex min-h-[90px] md:min-h-[100px] max-w-[1400px] w-full items-center justify-between px-4 sm:px-6 lg:px-8 flex-nowrap gap-4">
        
        {/* Brand Logo - Required exact code */}
        <Link 
          href="/" 
          className="flex items-center w-auto shrink-0 transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg"
          style={{ minWidth: '250px' }}
          aria-label="Survsta Home"
        >
          <Image
            alt="Survsta"
            className="object-contain w-[240px] md:w-[260px] h-auto"
            height={75}
            priority
            src="/images/Designer.png"
            style={{ maxHeight: '80px', minWidth: '240px' }}
            width={260}
          />
        </Link>

        {/* Desktop Navigation Links (Arabic) */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 text-sm font-medium text-gray-300 flex-nowrap shrink-0">
          <Link href="/" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            الرئيسية
          </Link>
          <Link href="/directory" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            الدليل
          </Link>
          <Link href="/equipment" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            الأجهزة
          </Link>
          <Link href="/services" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            الخدمات
          </Link>
          <Link href="/map" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            الخريطة
          </Link>
          <Link href="/academy" className="whitespace-nowrap transition-colors hover:text-cyan-400 flex items-center gap-1 px-1.5 py-1">
            <span>Academy</span>
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              قريباً
            </span>
          </Link>
          <Link href="/jobs" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            الوظائف
          </Link>
          <Link href="/about" className="whitespace-nowrap transition-colors hover:text-cyan-400 px-1.5 py-1">
            عن المنصة
          </Link>
        </nav>

        {/* User Actions / Auth Controls */}
        <div className="hidden md:flex items-center gap-3 shrink-0 flex-nowrap">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Link
                  href="/admin/users"
                  className="rounded-lg bg-gray-900 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-gray-800 transition"
                >
                  لوحة الإدارة
                </Link>
              )}
              {user.role === 'provider' && (
                <Link
                  href="/provider/dashboard"
                  className="rounded-lg bg-gray-900 border border-amber-500/30 px-3.5 py-1.5 text-xs font-semibold text-amber-400 hover:bg-gray-800 transition"
                >
                  بوابة المزوّد
                </Link>
              )}
              <span className="text-xs text-gray-400">{user.name}</span>
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
            <>
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-medium text-gray-300 hover:text-white transition"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/join"
                className="whitespace-nowrap rounded-lg bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-gray-950 shadow-sm shadow-cyan-500/20 hover:bg-cyan-400 transition"
              >
                انضم كشريك
              </Link>
            </>
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
        <div className="md:hidden border-b border-gray-800 bg-gray-950 px-4 py-4 space-y-3 text-right">
          <Link href="/" className="block py-2 text-sm text-gray-300 hover:text-cyan-400">
            الرئيسية
          </Link>
          <Link href="/directory" className="block py-2 text-sm text-gray-300 hover:text-cyan-400">
            الدليل
          </Link>
          <Link href="/equipment" className="block py-2 text-sm text-gray-300 hover:text-cyan-400">
            الأجهزة
          </Link>
          <Link href="/services" className="block py-2 text-sm text-gray-300 hover:text-cyan-400">
            الخدمات
          </Link>
          <Link href="/academy" className="block py-2 text-sm text-gray-300 hover:text-cyan-400">
            Academy (قريباً)
          </Link>
          <div className="pt-3 border-t border-gray-900 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-center py-2 text-sm text-gray-300 bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/join"
              className="text-center py-2 text-sm font-semibold text-gray-950 bg-cyan-500 rounded-lg hover:bg-cyan-400"
            >
              انضم كشريك
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
export { Navbar as Header };
