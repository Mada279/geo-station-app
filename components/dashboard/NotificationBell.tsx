'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export interface InAppNotification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<string | undefined>(userId);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Resolve User ID if not provided
  useEffect(() => {
    if (userId) {
      setActiveUserId(userId);
      return;
    }

    async function resolveUser() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          setActiveUserId(authData.user.id);
          return;
        }

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.id) setActiveUserId(parsed.id);
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Error resolving user for NotificationBell:', err);
      }
    }

    resolveUser();
  }, [userId]);

  // 2. Fetch Notifications & Unread Count
  const fetchNotifications = async (uid?: string) => {
    const targetUid = uid || activeUserId;
    setIsLoading(true);

    try {
      let query = supabase
        .from('inapp_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);

      if (targetUid) {
        query = query.or(`user_id.eq.${targetUid},user_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setNotifications(data);
        const unread = data.filter((n: InAppNotification) => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        // Fallback demo notification for fresh dev environments
        const fallbackList: InAppNotification[] = [
          {
            id: 'welcome-demo-notif',
            title: 'مرحباً بك في منصة Survsta الرقمية',
            message: 'مركز الإشعارات والتنبيهات نشط الآن لمتابعة الطلبات والتوظيف والأجهزة المساحية.',
            type: 'system',
            is_read: false,
            link: '/notifications',
            created_at: new Date().toISOString(),
          },
        ];
        setNotifications(fallbackList);
        setUnreadCount(1);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    fetchNotifications(activeUserId);

    // Generate unique channel instance ID to prevent collisions across multiple bell instances or React StrictMode
    const channelName = `inapp_notifs_${activeUserId || 'guest'}_${Math.random().toString(36).substring(2, 9)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inapp_notifications',
        },
        () => {
          fetchNotifications(activeUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUserId]);

  // 3. Mark All as Read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      if (activeUserId) {
        await supabase
          .from('inapp_notifications')
          .update({ is_read: true })
          .eq('user_id', activeUserId);
      } else {
        await supabase
          .from('inapp_notifications')
          .update({ is_read: true })
          .eq('is_read', false);
      }
    } catch (err) {
      console.warn('Mark all read notice:', err);
    }
  };

  // 4. Mark Single Item as Read and Navigate if link present
  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await supabase
          .from('inapp_notifications')
          .update({ is_read: true })
          .eq('id', notif.id);
      } catch (err) {
        console.warn('Mark read notice:', err);
      }
    }

    setIsOpen(false);

    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getTypeVisual = (type: string) => {
    switch (type) {
      case 'order':
      case 'rental':
        return {
          icon: '🛒',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          label: 'طلب حجز',
        };
      case 'job':
      case 'application':
        return {
          icon: '💼',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          label: 'توظيف',
        };
      case 'success':
      case 'approval':
        return {
          icon: '✅',
          badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
          label: 'اعتماد',
        };
      case 'warning':
        return {
          icon: '⚠️',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          label: 'تنبيه',
        };
      default:
        return {
          icon: '🔔',
          badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          label: 'إشعار',
        };
    }
  };

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} dir="rtl">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        title="مركز الإشعارات والتنبيهات"
        aria-label="Notifications"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Dynamic Red Badge Indicator for Unread Notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-600 border border-rose-500 text-[10px] font-black text-white shadow-lg shadow-rose-600/50 animate-pulse font-mono">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-gray-800 bg-[#081933] shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#061429]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>🔔</span>
                <span>الإشعارات</span>
              </span>
              {unreadCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold font-mono">
                  {unreadCount} غير مقروء
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  لا توجد تنبيهات جديدة
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="divide-y divide-gray-800/80 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>جاري تحديث الإشعارات...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 space-y-2">
                <div className="text-2xl">📭</div>
                <p>لا توجد إشعارات حتى الآن</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const visual = getTypeVisual(notif.type);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition hover:bg-slate-800/50 cursor-pointer ${
                      !notif.is_read
                        ? 'bg-cyan-950/30 border-r-2 border-cyan-500'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs border shadow-sm ${visual.badgeClass}`}
                      >
                        {visual.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs font-bold truncate ${
                              !notif.is_read ? 'text-white' : 'text-slate-300'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                            {new Date(notif.created_at).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-800/40">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${visual.badgeClass}`}
                          >
                            {visual.label}
                          </span>

                          {notif.link && (
                            <span className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5">
                              <span>الانتقال والتفاصيل</span>
                              <span>←</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer - Link to Dedicated Notifications Page */}
          <div className="p-3 bg-[#061429] border-t border-gray-800 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/60 rounded-xl transition"
            >
              <span>عرض مركز الإشعارات بالكامل</span>
              <span>←</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
