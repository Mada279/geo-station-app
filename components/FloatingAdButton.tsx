'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingAdButton() {
  const pathname = usePathname();

  // Hide on admin, provider dashboard, or when already on /join
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/provider/dashboard') || pathname === '/join') {
    return null;
  }

  return (
    <Link
      href="/join"
      className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-40 group flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-[#F4B400] to-amber-400 px-5 py-3 text-slate-950 font-bold shadow-xl shadow-amber-500/25 border border-amber-300/60 hover:brightness-110 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      aria-label="نشر إعلان جديد"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-amber-400 text-base font-black leading-none group-hover:rotate-90 transition-transform duration-200 shadow-sm">
        +
      </span>
      <span className="text-xs sm:text-sm font-extrabold tracking-wide whitespace-nowrap">
        نشر إعلان
      </span>
    </Link>
  );
}
