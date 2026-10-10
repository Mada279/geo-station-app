'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logoutAndRedirect } from '@/utils/logout';
import { supabase } from '@/utils/supabaseClient';

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
    isVerified: boolean;
    loading: boolean;
  }>({
    name: '',
    org: '',
    role: 'شريك معتمد',
    av: '',
    isVerified: false,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadRealSessionProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          if (isMounted) {
            setUserProfile({
              name: 'زائر',
              org: 'منصة Survsta',
              role: 'غير مسجل',
              av: 'ز',
              isVerified: false,
              loading: false,
            });
          }
          return;
        }

        // Query the provider row matching auth user_id or email
        const userEmail = (user.email || '').toLowerCase();
        const filters: string[] = [`user_id.eq.${user.id}`];
        if (userEmail) filters.push(`email.eq.${userEmail}`);

        const { data: providerData } = await supabase
          .from('providers')
          .select('id, name, company_name, organization, status, verification_status')
          .or(filters.join(','))
          .maybeSingle();

        const rawName =
          providerData?.name ||
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          (userEmail ? userEmail.split('@')[0] : '') ||
          'مزوّد معتمد';

        const rawOrg =
          providerData?.company_name ||
          providerData?.organization ||
          providerData?.name ||
          'مكتب مساحي معتمد';

        const isVerified =
          providerData?.status === 'approved' ||
          providerData?.verification_status === 'verified';

        const roleTitle =
          user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin'
            ? 'مدير المنصة'
            : isVerified
            ? 'شريك موثّق'
            : 'شريك معتمد';

        const initials =
          rawName
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part: string) => part[0])
            .join('') || rawName.slice(0, 2) || 'م';

        if (isMounted) {
          setUserProfile({
            name: rawName,
            org: rawOrg,
            role: roleTitle,
            av: initials,
            isVerified,
            loading: false,
          });
        }
      } catch (err) {
        console.error('[ProviderSidebar auth load error]', err);
        if (isMounted) {
          setUserProfile((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    loadRealSessionProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadRealSessionProfile();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
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
          href: '/provider/orders',
          label: 'صندوق الطلبات الواردة',
          icon: '📥',
        },
        {
          href: '/provider/inbox',
          label: 'صندوق الاستفسارات والوارد',
          icon: '💬',
          badge: 'جديد',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        },
        {
          href: '/notifications',
          label: 'مركز الإشعارات والتنبيهات',
          icon: '🔔',
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
          badge: userProfile.isVerified ? 'موثّق ✓' : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        {
          href: '/provider/locations',
          label: 'المواقع والتغطية الجغرافية',
          icon: '📍',
        },
        {
          href: '/provider/verification',
          label: 'توثيق الحساب (KYC)',
          icon: '🛡️',
        },
        {
          href: '/provider/team',
          label: 'الفريق ومسؤولو الاتصال',
          icon: '👥',
        },
      ],
    },
    {
      title: 'النمو والانتشار',
      items: [
        {
          href: '/provider/analytics',
          label: 'تقارير التحليلات والمشاهدات',
          icon: '📈',
        },
        {
          href: '/provider/jobs',
          label: 'الوظائف الهندسية المنشورة',
          icon: '💼',
        },
        {
          href: '/provider/jobs/applications',
          label: 'المتقدمون للوظائف (ATS)',
          icon: '👥',
          badge: 'جديد',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        },
        {
          href: '/provider/reviews',
          label: 'التقييمات وآراء العملاء',
          icon: '⭐',
          badge: '4.9',
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        },
        {
          href: '/provider/analytics',
          label: 'الظهور المميّز والإعلانات',
          icon: '📣',
        },
      ],
    },
    {
      title: 'النظام والمساعدة',
      items: [
        {
          href: '/notifications',
          label: 'الإشعارات والتنبيهات',
          icon: '🔔',
          badge: '3',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        },
        {
          href: '/provider/dashboard#profile',
          label: 'إعدادات الحساب والأمان',
          icon: '⚙️',
        },
      ],
    },
  ];

  const handleNavClick = (e: React.MouseEvent, item: { href: string; label: string }) => {
    if (onClose) onClose();

    // If clicking an anchor link targeting the dashboard (e.g. /provider/dashboard#equipment)
    if (item.href.includes('#')) {
      const [routePath, hashId] = item.href.split('#');
      
      // If user is currently on the dashboard page, smooth scroll to the target ID
      if (pathname === '/provider/dashboard' || pathname === routePath) {
        const el = document.getElementById(hashId);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      // If user is on another route (e.g. /provider/orders), let Next.js navigate to /provider/dashboard#...
      return;
    }
  };

  const handleLogout = () => logoutAndRedirect('/login');

  const isActive = (href: string) => {
    if (href === '/provider/dashboard') {
      return pathname === '/provider/dashboard';
    }
    const cleanHref = href.split('#')[0];
    return pathname === cleanHref || pathname?.startsWith(cleanHref + '/');
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
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#081933] border-l border-amber-500/20 flex flex-col justify-between transition-transform duration-300 shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:translate-x-0 shrink-0 [&::-webkit-scrollbar]:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        style={{ direction: 'rtl' }}
      >
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar [&::-webkit-scrollbar]:hidden p-4 space-y-5">
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
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  userProfile.isVerified
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {userProfile.isVerified ? 'شريك موثّق ✓' : 'حساب نشط'}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1 truncate">
              {userProfile.loading ? (
                <div className="h-3 w-28 bg-white/10 rounded animate-pulse my-0.5" />
              ) : (
                userProfile.org || 'مكتب مساحي معتمد'
              )}
            </div>
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
                      onClick={(e) => handleNavClick(e, item)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
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
                {userProfile.loading ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-950 border-t-transparent animate-spin" />
                ) : (
                  userProfile.av || 'م'
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white truncate max-w-[110px]">
                  {userProfile.loading ? (
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse mb-1" />
                  ) : (
                    userProfile.name || 'المزوّد'
                  )}
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
