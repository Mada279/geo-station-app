'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { GlobalAnnouncement } from '@/services/announcementService';
import { normalizeUser, AuthenticatedUser } from '@/lib/auth/userNormalizer';
import InstallPwaButton from '@/components/InstallPwaButton';

interface NavbarProps {
  user?: AuthenticatedUser | null;
  initialAnnouncement?: GlobalAnnouncement | null;
  isDismissedInitial?: boolean;
}

function getActiveSession(): AuthenticatedUser | null {
  if (typeof window === 'undefined') return null;

  // 1. Check localStorage first
  try {
    const raw = localStorage.getItem('SURVSTA_AUTH_USER');
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeUser(parsed);
      if (normalized) return normalized;
    }
  } catch {}

  // 2. Check cookies
  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith('survsta_session=')) {
        const val = trimmed.substring('survsta_session='.length);
        const decoded = decodeURIComponent(val);
        try {
          const parsed = JSON.parse(decoded);
          const normalized = normalizeUser(parsed);
          if (normalized) return normalized;
        } catch {
          if (decoded && decoded !== 'undefined') {
            return normalizeUser({ email: decoded });
          }
        }
      }
      if (trimmed.startsWith('user_role=')) {
        const role = trimmed.substring('user_role='.length);
        if (role && role !== 'undefined') {
          return normalizeUser({ role });
        }
      }
    }
  } catch {}

  return null;
}

export default function Navbar({
  user,
  initialAnnouncement = null,
  isDismissedInitial = false,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(Boolean(user));
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(user || null);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(initialAnnouncement);
  const [isDismissed, setIsDismissed] = useState<boolean>(isDismissedInitial);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  // Announcement dismiss cookie detection
  useEffect(() => {
    if (announcement) {
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`survsta_banner_dismissed_${announcement.id}=`));
      if (cookieValue) {
        setIsDismissed(true);
      }
    }
  }, [announcement]);

  const handleDismissAnnouncement = () => {
    if (!announcement) return;
    setIsDismissed(true);
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `survsta_banner_dismissed_${announcement.id}=true; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  const syncUserToCookiesAndStorage = (norm: AuthenticatedUser | null) => {
    if (!norm) {
      document.cookie = 'survsta_session=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('SURVSTA_AUTH_USER');
      }
      return;
    }

    try {
      document.cookie = `survsta_session=${encodeURIComponent(JSON.stringify({
        id: norm.id,
        email: norm.email,
        name: norm.name,
        role: norm.role,
        org: norm.organization,
        modules: norm.modules,
      }))}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_role=${norm.role}; path=/; max-age=86400; SameSite=Lax`;

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify(norm));
      }
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Check local session first
      const local = getActiveSession();
      if (local && isMounted) {
        setCurrentUser(local);
        setIsAuthResolved(true);
      }

      // 2. Fetch live Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const fallbackRole = local?.role || currentUser?.role;
          let norm = normalizeUser(session.user, fallbackRole);
          if (norm && norm.role !== 'admin' && norm.role !== 'provider' && session.user.email) {
            try {
              const { data: provRow } = await supabase
                .from('providers')
                .select('id, name, status')
                .eq('email', session.user.email.toLowerCase().trim())
                .maybeSingle();
              if (provRow && provRow.status !== 'blocked' && provRow.status !== 'rejected') {
                norm.role = 'provider';
                if (provRow.name) norm.organization = provRow.name;
              }
            } catch {}
          }
          if (norm) {
            setCurrentUser(norm);
            syncUserToCookiesAndStorage(norm);
          }
        } else if (!local && isMounted) {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('[Navbar Auth Check]:', err);
      } finally {
        if (isMounted) {
          setIsAuthResolved(true);
        }
      }
    }

    checkAuth();

    // 3. Supabase Auth real-time listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        syncUserToCookiesAndStorage(null);
      } else if (session?.user) {
        const local = getActiveSession();
        const fallbackRole = local?.role || currentUser?.role;
        let norm = normalizeUser(session.user, fallbackRole);
        if (norm && norm.role !== 'admin' && norm.role !== 'provider' && session.user.email) {
          try {
            const { data: provRow } = await supabase
              .from('providers')
              .select('id, name, status')
              .eq('email', session.user.email.toLowerCase().trim())
              .maybeSingle();
            if (provRow && provRow.status !== 'blocked' && provRow.status !== 'rejected') {
              norm.role = 'provider';
              if (provRow.name) norm.organization = provRow.name;
            }
          } catch {}
        }
        if (norm) {
          setCurrentUser(norm);
          syncUserToCookiesAndStorage(norm);
        }
      } else {
        const local = getActiveSession();
        setCurrentUser(local);
      }
      setIsAuthResolved(true);
    });

    // 4. Cross-tab synchronization via BroadcastChannel & Storage event
    let authChannel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        authChannel = new BroadcastChannel('survsta_auth_channel');
        authChannel.onmessage = (msgEvent) => {
          if (msgEvent.data?.type === 'AUTH_STATE_CHANGED') {
            checkAuth();
          } else if (msgEvent.data?.type === 'LOGOUT') {
            setCurrentUser(null);
            syncUserToCookiesAndStorage(null);
          }
        };
      }
    } catch {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'SURVSTA_AUTH_USER' || e.key?.startsWith('sb-')) {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      if (authChannel) authChannel.close();
    };
  }, []);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);

    try {
      await supabase.auth.signOut();
    } catch {}

    syncUserToCookiesAndStorage(null);
    setCurrentUser(null);

    // Notify other open tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('survsta_auth_channel');
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
      }
    } catch {}

    window.location.href = '/login';
  };

  const dashboardHref =
    currentUser?.role === 'admin'
      ? '/admin'
      : currentUser?.role === 'provider'
      ? '/provider/dashboard'
      : '/dashboard';

  const roleLabel =
    currentUser?.role === 'admin'
      ? 'مدير المنصة'
      : currentUser?.role === 'provider'
      ? 'مزوّد خدمة'
      : 'عميل مسجل';

  return (
    <div className="relative w-full">
      {/* Top Announcement / Utility Bar */}
      {(!announcement || !announcement.is_active || isDismissed) ? (
        /* Fallback Default Bar */
        <div className="relative z-10 bg-[#0B1120] text-slate-300 text-xs border-b border-white/10 py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[12px] truncate">
              <span>📍</span>
              <span>نخدم حالياً: الإسكندرية والقاهرة والجيزة — التوسع تباعاً لباقي المحافظات</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-5 text-[12px] font-medium text-slate-300 shrink-0">
              <InstallPwaButton variant="topbar" />
              <Link href="/help" className="hover:text-white transition whitespace-nowrap">المساعدة</Link>
              <Link href="/contact" className="hover:text-white transition whitespace-nowrap">تواصل معنا</Link>
              {isAuthResolved && currentUser ? (
                <Link href={dashboardHref} className="text-amber-400 hover:text-amber-300 transition font-semibold whitespace-nowrap">
                  لوحة التحكم ({roleLabel})
                </Link>
              ) : (
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition font-semibold whitespace-nowrap">
                  دخول الشركاء
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic Announcement Bar */
        <div
          className={`relative z-10 text-xs border-b py-1.5 px-4 sm:px-6 lg:px-8 transition-colors ${
            announcement.theme_type === 'promo'
              ? 'bg-gradient-to-r from-amber-950 via-[#1a1306] to-amber-950 text-amber-100 border-amber-500/30'
              : announcement.theme_type === 'alert'
              ? 'bg-gradient-to-r from-rose-950 via-[#1f0b12] to-rose-950 text-rose-100 border-rose-500/30'
              : announcement.theme_type === 'maintenance'
              ? 'bg-gradient-to-r from-purple-950 via-[#180a24] to-purple-950 text-purple-100 border-purple-500/30'
              : 'bg-[#0B1120] text-slate-300 border-white/10'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[12px] min-w-0 flex-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                  announcement.theme_type === 'promo'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : announcement.theme_type === 'alert'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : announcement.theme_type === 'maintenance'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {announcement.theme_type === 'promo'
                  ? 'عرض'
                  : announcement.theme_type === 'alert'
                  ? 'تنبيه'
                  : announcement.theme_type === 'maintenance'
                  ? 'صيانة'
                  : 'إعلان'}
              </span>
              <span className="truncate font-medium">{announcement.message_ar}</span>
              {announcement.cta_text && announcement.cta_link && (
                <Link
                  href={announcement.cta_link}
                  className="mr-2 text-cyan-400 hover:text-cyan-300 underline font-semibold shrink-0 whitespace-nowrap"
                >
                  {announcement.cta_text} ←
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 sm:gap-5 text-[12px] font-medium text-slate-300 shrink-0">
              <Link href="/mobile-app" className="hover:text-white transition whitespace-nowrap max-sm:hidden">حمل التطبيق</Link>
              <Link href="/help" className="hover:text-white transition whitespace-nowrap max-sm:hidden">المساعدة</Link>
              <Link href="/contact" className="hover:text-white transition whitespace-nowrap max-sm:hidden">تواصل معنا</Link>
              {isAuthResolved && currentUser ? (
                <Link href={dashboardHref} className="text-amber-400 hover:text-amber-300 transition font-semibold whitespace-nowrap">
                  لوحة التحكم ({roleLabel})
                </Link>
              ) : (
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition font-semibold whitespace-nowrap">
                  دخول الشركاء
                </Link>
              )}
              <button
                type="button"
                onClick={handleDismissAnnouncement}
                aria-label="إغلاق الإعلان"
                className="text-slate-400 hover:text-white p-0.5 rounded transition text-xs font-bold"
                title="إخفاء الإعلان"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="w-full border-b border-cyan-500/15 bg-[#081933] text-white shadow-xl transition-colors">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center transition-opacity hover:opacity-95 outline-none focus:outline-none focus-visible:outline-none rounded-lg shrink-0"
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

          {/* Desktop Navigation Links */}
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

          {/* Desktop Left Actions: Unauthenticated (Login/Join) OR Authenticated (Avatar Dropdown) */}
          <div className="flex max-md:hidden items-center gap-3 shrink-0 min-w-[140px] justify-end">
            {!isAuthResolved ? (
              <div className="h-9 w-28 opacity-0 pointer-events-none" />
            ) : currentUser ? (
              <div className="flex items-center gap-3">
                <InstallPwaButton variant="navbar" />
                <NotificationBell userId={currentUser.id} />

                {/* Dashboard Quick Button */}
                <Link
                  href={dashboardHref}
                  className="rounded-lg bg-gradient-to-l from-amber-500 to-[#F4B400] px-4 py-2 text-xs lg:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/10 hover:brightness-105 transition whitespace-nowrap"
                >
                  لوحة التحكم
                </Link>

                {/* User Profile Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    aria-label="قائمة الملف الشخصي"
                    aria-expanded={isProfileDropdownOpen}
                  >
                    <div className="relative">
                      {currentUser.avatarUrl ? (
                        <Image
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border border-cyan-400/40"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                          {currentUser.initials}
                        </div>
                      )}
                      {/* Active status dot */}
                      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#081933]" />
                    </div>

                    <div className="text-right hidden xl:block max-w-[110px]">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-amber-400 truncate leading-tight">
                        {roleLabel}
                      </p>
                    </div>

                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180 text-white' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu Modal */}
                  {isProfileDropdownOpen && (
                    <div
                      className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#0B1528] border border-cyan-500/20 shadow-2xl p-2 text-right z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      dir="rtl"
                    >
                      {/* User Header Summary */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow">
                            {currentUser.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                            <p className="text-[11px] text-slate-400 truncate font-mono" dir="ltr">{currentUser.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">الدور الحالي:</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300">
                            {roleLabel}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Links */}
                      <div className="space-y-1 text-xs font-medium">
                        {currentUser.role === 'provider' ? (
                          <>
                            <Link
                              href="/provider/dashboard"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 font-bold transition shadow-sm"
                            >
                              <span>🔭</span>
                              <span>لوحة تحكم المزود ومعداتي</span>
                            </Link>
                            <Link
                              href="/provider/dashboard#equipment"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition"
                            >
                              <span>📦</span>
                              <span>كتالوج ومخزون الأجهزة</span>
                            </Link>
                            <Link
                              href="/provider/locations"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition"
                            >
                              <span>📍</span>
                              <span>مناطق التغطية الجغرافية</span>
                            </Link>
                            <div className="my-1 border-t border-white/5" />
                            <Link
                              href="/dashboard"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition text-[11px]"
                            >
                              <span>📊</span>
                              <span>تخصيص الأدوار (اللوحة العامة)</span>
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={dashboardHref}
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition"
                          >
                            <span>📊</span>
                            <span>لوحة التحكم الرئيسية</span>
                          </Link>
                        )}

                        {currentUser.role === 'admin' && (
                          <Link
                            href="/admin/payments"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-emerald-300 hover:bg-emerald-950/40 transition"
                          >
                            <span>💳</span>
                            <span>إدارة المدفوعات والتحويلات</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout Action */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>تسجيل الخروج من المنصة</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <InstallPwaButton variant="navbar" />
                <Link
                  href="/onboarding"
                  className="rounded-lg bg-[#F4B400] px-5 py-2 text-sm font-bold text-black shadow-sm hover:brightness-105 transition whitespace-nowrap"
                >
                  انضم الآن
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/40 text-white hover:bg-white/10 hover:border-white px-4 py-2 text-sm font-semibold transition whitespace-nowrap"
                >
                  دخول
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions: Notification Bell + Hamburger Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser && <NotificationBell userId={currentUser.id} />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-900 hover:text-white"
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
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-gray-800 bg-[#081933] px-4 py-4 space-y-3 text-right">
            {/* Authenticated User Card in Mobile Drawer */}
            {currentUser && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/20 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {currentUser.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              الرئيسية
            </Link>
            <Link
              href="/directory"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/directory' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              الدليل
            </Link>
            <Link
              href="/equipment"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/equipment' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              الأجهزة
            </Link>
            <Link
              href="/services"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/services' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              الخدمات
            </Link>
            <Link
              href="/map"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/map' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              الخريطة
            </Link>
            <Link
              href="/academy"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/academy' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              Academy (قريباً)
            </Link>
            <Link
              href="/jobs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/jobs' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              الوظائف
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block py-2 text-sm ${pathname === '/about' ? 'text-cyan-400 font-bold' : 'text-gray-300 hover:text-cyan-400'}`}
            >
              عن المنصة
            </Link>

            <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
              <InstallPwaButton variant="mobile" />
              {!isAuthResolved ? (
                <div className="h-10 w-full opacity-0 pointer-events-none" />
              ) : currentUser ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2.5 text-sm font-bold text-black bg-[#F4B400] rounded-lg hover:brightness-105"
                  >
                    الانتقال للوحة التحكم ({roleLabel})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-center py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/onboarding"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2.5 text-sm font-bold text-black bg-[#F4B400] rounded-lg hover:brightness-105"
                  >
                    انضم الآن
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2 text-sm font-semibold text-white border border-white/40 rounded-lg hover:bg-white/10"
                  >
                    دخول
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

export { Navbar as Header };
