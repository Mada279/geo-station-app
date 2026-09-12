'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  pendingCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ pendingCount = 0, isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: 'نظرة عامة',
      items: [
        { href: '/admin', label: 'لوحة الإدارة', icon: '🛡️' },
        { href: '/admin/analytics', label: 'تحليلات المنصة', icon: '📈' },
      ],
    },
    {
      title: 'المراجعة والاعتماد',
      items: [
        {
          href: '/admin/approvals',
          label: 'طابور الاعتمادات',
          icon: '✅',
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        { href: '/admin/equipment', label: 'مراجعة الأجهزة', icon: '📡' },
        { href: '/admin/verification', label: 'مركز التوثيق', icon: '🔎' },
      ],
    },
    {
      title: 'إدارة البيانات',
      items: [
        { href: '/admin/providers', label: 'المزوّدون', icon: '🏢' },
        { href: '/admin/users', label: 'المستخدمون والصلاحيات', icon: '👤' },
        { href: '/admin/clients', label: 'العملاء', icon: '👥' },
      ],
    },
    {
      title: 'المتابعة والنظام',
      items: [
        { href: '/admin/leads', label: 'إدارة الطلبات', icon: '📥' },
        { href: '/admin/audit', label: 'سجل التدقيق', icon: '📜' },
        { href: '/admin/settings', label: 'إعدادات النظام', icon: '⚙️' },
      ],
    },
  ];

  const handleLogout = () => {
    document.cookie = 'survsta_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('SURVSTA_AUTH_USER');
      localStorage.setItem('SURVSTA_LOGGED_OUT', '1');
      window.location.href = '/login';
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#081933] border-l border-cyan-500/20 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
      style={{ direction: 'rtl' }}
    >
      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <Link href="/admin" className="inline-flex items-center gap-2">
            <Image
              alt="Survsta"
              src="/images/Designer.png"
              width={140}
              height={45}
              className="object-contain h-9 w-auto"
              priority
            />
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          )}
        </div>

        {/* User / Org Context */}
        <div className="rounded-xl bg-[#0F253E] border border-cyan-500/30 p-3 text-right">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Survsta Admin
          </div>
          <div className="text-[11px] text-cyan-300/80 mt-0.5">بيئة التشغيل — الإصدار 1.0 (Live)</div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-4 text-xs font-semibold">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="text-[11px] text-gray-400 px-3 py-1 font-bold">
                {group.title}
              </div>
              {group.items.map((item, iIdx) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      active
                        ? 'bg-gradient-to-l from-cyan-500/20 to-cyan-500/10 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Utility Actions */}
      <div className="p-4 border-t border-cyan-500/20 space-y-1 text-xs">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
        >
          <span>🌐</span>
          <span>عرض الموقع العام</span>
        </Link>
        <Link
          href="/provider/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
        >
          <span>🔀</span>
          <span>بوابة المزوّد</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition text-right font-semibold"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
