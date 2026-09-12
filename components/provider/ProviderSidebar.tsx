'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface ProviderSidebarProps {
  equipmentCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ProviderSidebar({
  equipmentCount,
  isOpen = false,
  onClose,
}: ProviderSidebarProps) {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{
    name: string;
    org: string;
    role: string;
    av: string;
  }>({
    name: 'م. أحمد النجار',
    org: 'مكتب النخبة للمساحة',
    role: 'مدير الحساب',
    av: 'أن',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserProfile({
            name: parsed.name || 'م. أحمد النجار',
            org: parsed.org || parsed.organization || 'مكتب النخبة للمساحة',
            role: parsed.role === 'admin' ? 'مدير النظام' : 'شريك معتمد',
            av: parsed.av || (parsed.name ? parsed.name.slice(0, 2) : 'أن'),
          });
        }
      } catch {
        // fallback
      }
    }
  }, []);

  const navGroups = [
    {
      title: 'العمليات والتشغيل',
      items: [
        {
          href: '/provider/dashboard',
          label: 'لوحة التحكم العامة',
          icon: '📊',
        },
        {
          href: '/provider/dashboard#equipment',
          label: 'إدارة الأجهزة والمعدات',
          icon: '📡',
          badge: equipmentCount !== undefined ? String(equipmentCount) : undefined,
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        },
        {
          href: '/provider/dashboard#leads',
          label: 'صندوق الطلبات الواردة',
          icon: '📥',
          badge: '4 جديد',
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        {
          href: '/provider/dashboard#services',
          label: 'الخدمات المساحية',
          icon: '🧭',
        },
      ],
    },
    {
      title: 'الملف والاعتماد',
      items: [
        {
          href: '/provider/dashboard#profile',
          label: 'ملف الجهة والمكتب',
          icon: '🏢',
          badge: 'موثّق ✓',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        {
          href: '/provider/dashboard#locations',
          label: 'المواقع والتغطية الجغرافية',
          icon: '📍',
        },
        {
          href: '/provider/dashboard#team',
          label: 'الفريق ومسؤولو الاتصال',
          icon: '👥',
        },
      ],
    },
    {
      title: 'النمو والانتشار',
      items: [
        {
          href: '/provider/dashboard#analytics',
          label: 'تقارير التحليلات والمشاهدات',
          icon: '📈',
        },
        {
          href: '/provider/dashboard#jobs',
          label: 'الوظائف الهندسية المنشورة',
          icon: '💼',
        },
        {
          href: '/provider/dashboard#reviews',
          label: 'التقييمات وآراء العملاء',
          icon: '⭐',
          badge: '4.9',
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        },
        {
          href: '/provider/dashboard#ads',
          label: 'الظهور المميّز والإعلانات',
          icon: '📣',
        },
      ],
    },
    {
      title: 'النظام والمساعدة',
      items: [
        {
          href: '/provider/dashboard#notifications',
          label: 'الإشعارات والتنبيهات',
          icon: '🔔',
          badge: '3',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
        {
          href: '/provider/dashboard#settings',
          label: 'إعدادات الحساب والأمان',
          icon: '⚙️',
        },
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
    if (href === '/provider/dashboard') {
      return pathname === '/provider/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#081933] border-l border-amber-500/20 flex flex-col justify-between transition-transform duration-300 shadow-2xl lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        style={{ direction: 'rtl' }}
      >
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <Link href="/provider/dashboard" className="inline-flex items-center gap-2">
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
                aria-label="إغلاق القائمة"
              >
                ✕
              </button>
            )}
          </div>

          {/* Context Badge */}
          <div className="rounded-xl border border-amber-500/20 bg-[#0F253E] p-3 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">بوابة المزوّد</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                شريك نشط
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1 truncate">{userProfile.org}</div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6 text-sm">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider">
                  {group.title}
                </div>
                {group.items.map((item, itemIdx) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                        active
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                          : 'text-gray-300 hover:bg-[#0F253E] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-xs">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-gray-800 text-gray-300'
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

        {/* User Profile & Quick Actions Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-[#061429] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-gray-950 text-xs shadow-md">
                {userProfile.av}
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white truncate max-w-[110px]">
                  {userProfile.name}
                </div>
                <div className="text-[10px] text-gray-400">{userProfile.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition border border-red-500/20"
              title="تسجيل الخروج"
            >
              🚪 خروج
            </button>
          </div>

          <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
            <Link href="/" className="hover:text-cyan-400 transition flex items-center gap-1">
              <span>🌐</span>
              <span>الموقع العام</span>
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/admin" className="hover:text-amber-400 transition flex items-center gap-1">
              <span>🛡️</span>
              <span>لوحة الإدارة</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
