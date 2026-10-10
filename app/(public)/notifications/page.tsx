'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

interface InAppNotification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_METADATA: Record<
  string,
  { label: string; icon: string; badgeClass: string; borderClass: string }
> = {
  order: {
    label: 'حجز ومعدات',
    icon: '🛒',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderClass: 'hover:border-cyan-500/50',
  },
  rental: {
    label: 'تأجير أجهزة',
    icon: '📡',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderClass: 'hover:border-cyan-500/50',
  },
  job: {
    label: 'وظائف وتوظيف',
    icon: '💼',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'hover:border-emerald-500/50',
  },
  application: {
    label: 'طلب توظيف (ATS)',
    icon: '📄',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'hover:border-emerald-500/50',
  },
  approval: {
    label: 'اعتماد وموافقة',
    icon: '✅',
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
    borderClass: 'hover:border-green-500/50',
  },
  success: {
    label: 'تأكيد العملية',
    icon: '🎉',
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
    borderClass: 'hover:border-green-500/50',
  },
  warning: {
    label: 'تنبيه أمني ومراجعة',
    icon: '⚠️',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'hover:border-amber-500/50',
  },
  system: {
    label: 'إشعار النظام',
    icon: '🔔',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    borderClass: 'hover:border-blue-500/50',
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('customer');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Resolve User & Load Notifications
  const loadNotifications = async (targetUid?: string | null) => {
    setIsLoading(true);
    try {
      let currentUid = targetUid !== undefined ? targetUid : userId;

      // Inspect auth if userId not ready
      if (!currentUid) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          currentUid = authData.user.id;
          setUserId(authData.user.id);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.id) {
                currentUid = parsed.id;
                setUserId(parsed.id);
              }
              if (parsed.role) setUserRole(parsed.role);
            } catch {}
          }
        }
      }

      // Query Supabase
      let query = supabase
        .from('inapp_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentUid) {
        query = query.or(`user_id.eq.${currentUid},user_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        setNotifications(data);
      } else {
        // Realistic initial notification items for interactive experience
        setNotifications([
          {
            id: 'demo-notif-1',
            title: 'تم قبول طلب حجز جهاز Leica TS16',
            message: 'وافق مكتب الشرق الهندسي على طلب استئجار جهاز المحطة المتكاملة لمدة 5 أيام، يرجى مراجعة تفاصيل التسليم.',
            type: 'order',
            link: '/client/orders',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: 'demo-notif-2',
            title: 'تحديث حالة طلب التوظيف: مهندس مساحة موقع',
            message: 'تمت مراجعة ملفك وسيرتك الذاتية من قبل شركة النخبة للمقاولات والمساحة، وتم نقله إلى مرحلة "تم الاطلاع".',
            type: 'job',
            link: '/freelancer/applications',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
          {
            id: 'demo-notif-3',
            title: 'طلب حجز معدة مساحية جديد وارد',
            message: 'قام أحد العملاء بطلب استئجار جهاز استقبال الأقمار الصناعية Trimble R12 RTK. يرجى تأكيد التوفر وموعد التسليم.',
            type: 'rental',
            link: '/provider/orders',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 3600 * 8).toISOString(),
          },
          {
            id: 'demo-notif-4',
            title: 'تم تفعيل الملف المهني المتقدم والسيرة الذاتية',
            message: 'أصبح ملفك المهني معتمد ومتاحاً الآن في سوق الوظائف المساحية ومسؤولي التوظيف عبر منصة Survsta.',
            type: 'approval',
            link: '/freelancer/profile',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
          },
          {
            id: 'demo-notif-5',
            title: 'تحديث أمني: توثيق الحساب الموحد',
            message: 'تم تسجيل الدخول بنجاح إلى حسابك الهندسي. يمكنك إدارة المعدات والطلبات ومتابعة التحديثات اللحظية.',
            type: 'system',
            link: '/dashboard',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Notifications load notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen to real-time events with a unique channel name
    const channelName = `notifications_page_${userId || 'guest'}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inapp_notifications' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 2. Mark Single Notification as Read
  const handleItemClick = async (notif: InAppNotification) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );

      try {
        await supabase
          .from('inapp_notifications')
          .update({ is_read: true })
          .eq('id', notif.id);
      } catch (err) {
        console.warn('Update notification read error:', err);
      }
    }

    if (notif.link) {
      router.push(notif.link);
    }
  };

  // 3. Mark Single Read/Unread Toggle
  const toggleReadStatus = async (e: React.MouseEvent, notif: InAppNotification) => {
    e.stopPropagation();
    const newStatus = !notif.is_read;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: newStatus } : n))
    );

    try {
      await supabase
        .from('inapp_notifications')
        .update({ is_read: newStatus })
        .eq('id', notif.id);

      showToast(newStatus ? 'تم تحديد الإشعار كمقروء' : 'تم تحديد الإشعار كغير مقروء');
    } catch (err) {
      console.warn('Toggle status error:', err);
    }
  };

  // 4. Mark All as Read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      if (userId) {
        await supabase
          .from('inapp_notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);
      } else {
        await supabase
          .from('inapp_notifications')
          .update({ is_read: true })
          .eq('is_read', false);
      }

      showToast('✓ تم تحديد كافة الإشعارات كمقروءة.');
    } catch (err) {
      console.warn('Mark all error:', err);
      showToast('حدث خطأ أثناء تحديث الإشعارات.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  // 5. Delete Single Notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await supabase.from('inapp_notifications').delete().eq('id', id);
      showToast('تم حذف الإشعار بنجاح.');
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  // 6. Send Quick Test Notification (Helper for Testing)
  const handleCreateTestNotification = async () => {
    try {
      const newNotif = {
        user_id: userId || null,
        title: 'إشعار فوري جديد من منصة Survsta',
        message: 'تم إرسال هذا الإشعار التجريبي للتحقق من التنبيهات الفورية وشارة الجرس.',
        type: 'system',
        link: '/equipment',
        is_read: false,
      };

      const { data, error } = await supabase
        .from('inapp_notifications')
        .insert([newNotif])
        .select()
        .single();

      if (!error && data) {
        setNotifications((prev) => [data, ...prev]);
        showToast('✓ تم إنشاء وتوصيل إشعار تجريبي جديد بنجاح!');
      } else {
        // Fallback local addition
        const localItem: InAppNotification = {
          ...newNotif,
          id: `local-test-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [localItem, ...prev]);
        showToast('✓ تم إنشاء إشعار تجريبي محلي.');
      }
    } catch (err) {
      console.warn('Test notif error:', err);
    }
  };

  // Filter calculations
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((notif) => {
    // Type / status filter
    if (filterType === 'unread' && notif.is_read) return false;
    if (filterType === 'order' && notif.type !== 'order' && notif.type !== 'rental') return false;
    if (filterType === 'job' && notif.type !== 'job' && notif.type !== 'application') return false;
    if (filterType === 'system' && notif.type !== 'system' && notif.type !== 'approval' && notif.type !== 'warning') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = notif.title.toLowerCase().includes(q);
      const matchMsg = notif.message.toLowerCase().includes(q);
      return matchTitle || matchMsg;
    }

    return true;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;

      return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#081933] text-gray-100 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-[#0F253E]/80 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg">
                  🔔
                </span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  مركز الإشعارات والتنبيهات الحية
                </span>
                {unreadCount > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/40 font-black font-mono animate-pulse">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                تنبيهات الحساب والمعاملات
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
                تابع مستجدات طلبات حجز المعدات، تحديثات التوظيف وقبول المرشحين، والتنبيهات المباشرة من شركاء المساحة والجيوماتكس.
              </p>
            </div>

            {/* Actions: Mark All as Read & Add Demo Alert */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/25 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>✓</span>
                  <span>{isMarkingAll ? 'جاري التحديث...' : 'تحديد الكل كمقروء'}</span>
                </button>
              )}

              <button
                onClick={handleCreateTestNotification}
                className="px-3.5 py-2.5 bg-[#081933] hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-gray-800 hover:border-gray-700 transition flex items-center gap-1.5"
                title="إنشاء إشعار تجريبي للتحقق الفوري"
              >
                <span>➕</span>
                <span>إشعار تجريبي</span>
              </button>

              <button
                onClick={() => loadNotifications()}
                className="p-2.5 bg-[#081933] hover:bg-slate-800 text-gray-400 hover:text-cyan-400 rounded-xl border border-gray-800 transition"
                title="تحديث القائمة"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-[#0F253E]/60 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'كافة الإشعارات', count: notifications.length },
              { id: 'unread', label: 'غير المقروءة', count: unreadCount },
              {
                id: 'order',
                label: 'الحجوزات والطلبات',
                count: notifications.filter((n) => n.type === 'order' || n.type === 'rental').length,
              },
              {
                id: 'job',
                label: 'الوظائف والـ ATS',
                count: notifications.filter((n) => n.type === 'job' || n.type === 'application').length,
              },
              {
                id: 'system',
                label: 'تنبيهات النظام',
                count: notifications.filter((n) => n.type === 'system' || n.type === 'approval' || n.type === 'warning').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  filterType === tab.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-[#081933] text-gray-400 hover:text-white border border-gray-800/80 hover:border-gray-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    filterType === tab.id ? 'bg-black/20 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الإشعارات..."
              className="w-full bg-[#081933] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 transition pl-8"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</span>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="rounded-2xl border border-gray-800 bg-[#0F253E]/40 p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">جاري تحميل وتحديث قائمة الإشعارات...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-[#0F253E]/20 p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/60 text-gray-400 text-3xl flex items-center justify-center mx-auto">
              📭
            </div>
            <h3 className="text-base font-bold text-white">لا توجد إشعارات مطابقة حالياً</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {filterType === 'unread'
                ? 'رائع! لقد اطلعت على كافة الإشعارات والتنبيهات.'
                : 'لم يتم العثور على أي إشعارات مسجلة تطابق محددات البحث الحالية.'}
            </p>
            {filterType !== 'all' && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                عرض كافة الإشعارات
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const meta = TYPE_METADATA[notif.type] || TYPE_METADATA.system;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`group rounded-2xl border transition-all duration-200 p-4 sm:p-5 cursor-pointer relative ${
                    !notif.is_read
                      ? 'bg-gradient-to-r from-cyan-950/40 via-[#0F253E]/90 to-[#0F253E] border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                      : 'bg-[#0F253E]/40 hover:bg-[#0F253E]/70 border-gray-800/80 hover:border-gray-700'
                  } ${meta.borderClass}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Visual Icon Badge */}
                    <div
                      className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-lg border shadow-sm ${meta.badgeClass}`}
                    >
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm sm:text-base font-bold transition ${
                              !notif.is_read
                                ? 'text-white'
                                : 'text-slate-300 group-hover:text-white'
                            }`}
                          >
                            {notif.title}
                          </h3>

                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          )}
                        </div>

                        {/* Timestamp & Type Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${
                          !notif.is_read ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        {notif.message}
                      </p>

                      {/* Footer Row: Actions & Link */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 mt-2 text-xs">
                        <div>
                          {notif.link ? (
                            <span className="inline-flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 font-bold transition">
                              <span>الانتقال والتفاصيل</span>
                              <span>←</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500 font-medium">
                              إشعار داخلي
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleReadStatus(e, notif)}
                            className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[11px] font-medium transition"
                            title={notif.is_read ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                          >
                            {notif.is_read ? 'تحديد كغير مقروء' : '✓ تحديد كمقروء'}
                          </button>

                          <button
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs transition"
                            title="حذف الإشعار"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-cyan-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-cyan-300 shadow-2xl animate-slide-up flex items-center gap-2">
            <span>🔔</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
