'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProviderSidebar from './ProviderSidebar';

export default function ProviderClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#081933] text-gray-100 flex flex-col lg:flex-row" style={{ direction: 'rtl' }}>
      {/* Mobile Topbar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-amber-500/20 bg-[#061429] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#0F253E] border border-amber-500/30 text-amber-400 hover:bg-[#163659] transition text-base"
            aria-label="فتح القائمة الجانبية"
          >
            ☰
          </button>
          <Link href="/provider/dashboard" className="flex items-center gap-2">
            <Image
              alt="Survsta"
              src="/images/Designer.png"
              width={110}
              height={32}
              className="object-contain h-7 w-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            بوابة المزوّد
          </span>
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs"
            title="الموقع العام"
          >
            🌐
          </Link>
        </div>
      </header>

      {/* Responsive Provider Sidebar */}
      <ProviderSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
