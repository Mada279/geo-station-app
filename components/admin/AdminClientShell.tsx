'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdminSidebar from './AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

export default function AdminClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadPendingCount() {
      try {
        const { count: providersCount } = await supabase
          .from('providers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: paymentsCount } = await supabase
          .from('manual_payment_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        const total = (providersCount || 0) + (paymentsCount || 0);
        if (isMounted) {
          setPendingCount(total);
        }
      } catch {
        // Non-blocking
      }
    }

    loadPendingCount();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col lg:flex-row" style={{ direction: 'rtl' }}>
      {/* Mobile Topbar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-[#061429] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#0F253E] border border-cyan-500/30 text-cyan-300 hover:bg-[#163659] transition text-base"
            aria-label="فتح القائمة الجانبية"
          >
            ☰
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              alt="Survsta Admin"
              src="/images/Designer.png"
              width={110}
              height={32}
              className="object-contain h-7 w-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            لوحة الإدارة
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

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Responsive Admin Sidebar */}
      <AdminSidebar
        pendingCount={pendingCount}
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
