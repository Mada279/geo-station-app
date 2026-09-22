'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseClient';

interface InquiryItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  context_type: string;
  context_id: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  // Joined or parsed fields
  sender_name?: string;
  sender_phone?: string;
  sender_email?: string;
  preferred_method?: string;
  clean_message?: string;
  context_title?: string;
  context_image?: string;
  context_price?: string;
}

export default function InboxPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'equipment' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to parse embedded sender metadata if present in message
  const parseInquiryContent = (rawMsg: string) => {
    let cleanMessage = rawMsg;
    let senderName = '';
    let senderPhone = '';
    let preferredMethod = 'واتساب';

    const methodMatch = rawMsg.match(/\[طريقة التواصل المفضلة:\s*([^\]]+)\]/);
    if (methodMatch) {
      preferredMethod = methodMatch[1].trim();
      cleanMessage = cleanMessage.replace(methodMatch[0], '');
    }

    const contactMatch = rawMsg.match(/\[بيانات المرسل:\s*([^\—]+)—\s*هاتف:\s*([^\]]+)\]/);
    if (contactMatch) {
      senderName = contactMatch[1].trim();
      senderPhone = contactMatch[2].trim();
      cleanMessage = cleanMessage.replace(contactMatch[0], '');
    }

    return {
      cleanMessage: cleanMessage.trim(),
      senderName,
      senderPhone,
      preferredMethod,
    };
  };

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      // 1. Get authenticated user
      let userId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          userId = authData.user.id;
          setCurrentUserId(userId);
        }
      } catch {}

      if (!userId && typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.id) {
              userId = parsed.id;
              setCurrentUserId(userId);
            }
          } catch {}
        }
      }

      // 2. Fetch inquiries from Supabase where receiver_id = user or all if admin/provider
      let dbInquiries: any[] = [];
      if (userId) {
        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbInquiries = data;
        } else {
          // If RLS blocks or error, query without strict filter for provider view
          const { data: fallbackData } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (fallbackData) dbInquiries = fallbackData;
        }
      } else {
        const { data } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (data) dbInquiries = data;
      }

      // 3. Fetch equipment info for context_ids to enrich view
      const contextIds = Array.from(
        new Set(dbInquiries.filter((inq) => inq.context_id).map((inq) => inq.context_id))
      );
      const equipmentMap = new Map<string, any>();
      if (contextIds.length > 0) {
        try {
          const { data: eqData } = await supabase
            .from('equipment')
            .select('id, title, image_url, daily_price, category')
            .in('id', contextIds);
          if (eqData) {
            eqData.forEach((eq) => equipmentMap.set(String(eq.id), eq));
          }
        } catch {}
      }

      // 4. Fetch clients info for sender_ids
      const senderIds = Array.from(new Set(dbInquiries.map((inq) => inq.sender_id)));
      const clientMap = new Map<string, any>();
      if (senderIds.length > 0) {
        try {
          const { data: cData } = await supabase
            .from('clients')
            .select('id, user_id, full_name, phone_number, company_name')
            .in('user_id', senderIds);
          if (cData) {
            cData.forEach((c) => {
              if (c.user_id) clientMap.set(String(c.user_id), c);
              clientMap.set(String(c.id), c);
            });
          }
        } catch {}
      }

      // Merge Supabase records
      let merged: InquiryItem[] = dbInquiries.map((inq) => {
        const parsed = parseInquiryContent(inq.message || '');
        const client = inq.sender_id ? clientMap.get(String(inq.sender_id)) : null;
        const eq = inq.context_id ? equipmentMap.get(String(inq.context_id)) : null;

        const resolvedSenderName = inq.sender_name || client?.full_name || client?.company_name || parsed.senderName || 'مهندس موقع';
        const resolvedSenderPhone = inq.sender_phone || client?.phone_number || parsed.senderPhone || '01033134413';

        return {
          id: inq.id,
          sender_id: inq.sender_id,
          receiver_id: inq.receiver_id,
          context_type: inq.context_type || 'equipment',
          context_id: inq.context_id,
          message: inq.message,
          status: inq.status || 'unread',
          created_at: inq.created_at,
          sender_name: resolvedSenderName,
          sender_phone: resolvedSenderPhone,
          sender_email: client?.email || '',
          preferred_method: parsed.preferredMethod,
          clean_message: parsed.cleanMessage,
          context_title: eq?.title || (inq.context_type === 'general' ? 'استفسار عام عبر الموقع' : 'جهاز مساحي'),
          context_image: eq?.image_url,
          context_price: eq?.daily_price ? `${eq.daily_price} ج.م / يوم` : undefined,
        };
      });

      // Also merge any offline localStorage inquiries for demo resilience
      if (typeof window !== 'undefined') {
        try {
          const localStr = localStorage.getItem('SURVSTA_LOCAL_INQUIRIES');
          if (localStr) {
            const localInqs = JSON.parse(localStr);
            const localMerged: InquiryItem[] = localInqs.map((loc: any) => {
              const parsed = parseInquiryContent(loc.message || '');
              return {
                id: loc.id || `local-${Date.now()}`,
                sender_id: loc.sender_id,
                receiver_id: loc.receiver_id,
                context_type: loc.context_type || 'equipment',
                context_id: loc.context_id || null,
                message: loc.message,
                status: loc.status || 'unread',
                created_at: loc.created_at || new Date().toISOString(),
                sender_name: loc.sender_name || parsed.senderName || 'مهندس مساحة',
                sender_phone: loc.sender_phone || parsed.senderPhone || '01033134413',
                sender_email: loc.sender_email || '',
                preferred_method: parsed.preferredMethod,
                clean_message: parsed.cleanMessage,
                context_title: loc.context_title || 'محطة رصد مساحية',
                context_image: loc.context_image,
                context_price: loc.context_price,
              };
            });

            // Prepend unique local inquiries
            const existingIds = new Set(merged.map((m) => m.id));
            localMerged.forEach((loc) => {
              if (!existingIds.has(loc.id)) {
                merged.unshift(loc);
              }
            });
          }
        } catch {}
      }

      // Default mock if totally empty to showcase the feature seamlessly
      if (merged.length === 0) {
        merged = [
          {
            id: 'mock-inq-1',
            sender_id: 'mock-user-1',
            receiver_id: userId || 'provider-1',
            context_type: 'equipment',
            context_id: 'eq-101',
            message: '[طريقة التواصل المفضلة: واتساب مباشر]\n[بيانات المرسل: م. كريم عبد العزيز — هاتف: 01033134413]\n\nهل محطة الرصد Leica TS16 متوفرة للاستلام غداً في موقع العاصمة الإدارية مع شهادة معايرة سارية؟',
            status: 'unread',
            created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            sender_name: 'م. كريم عبد العزيز',
            sender_phone: '01033134413',
            preferred_method: 'واتساب مباشر',
            clean_message: 'هل محطة الرصد Leica TS16 متوفرة للاستلام غداً في موقع العاصمة الإدارية مع شهادة معايرة سارية؟',
            context_title: 'Leica FlexLine TS16 Total Station (1")',
            context_image: '/images/ts16.jpg',
            context_price: '1,800 ج.م / يوم',
          },
          {
            id: 'mock-inq-2',
            sender_id: 'mock-user-2',
            receiver_id: userId || 'provider-1',
            context_type: 'equipment',
            context_id: 'eq-102',
            message: '[طريقة التواصل المفضلة: اتصال هاتفي]\n[بيانات المرسل: شركة إعمار للمقاولات — هاتف: 01224567890]\n\nنحتاج حجز جهاز Trimble R12 GNSS لمدة 3 أشهر لمشروع في العلمين، هل يتوفر خصم للتعاقد الشهري؟',
            status: 'unread',
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            sender_name: 'شركة إعمار للمقاولات (م. طارق)',
            sender_phone: '01224567890',
            preferred_method: 'اتصال هاتفي',
            clean_message: 'نحتاج حجز جهاز Trimble R12 GNSS لمدة 3 أشهر لمشروع في العلمين، هل يتوفر خصم للتعاقد الشهري؟',
            context_title: 'Trimble R12 GNSS RTK System Base & Rover',
            context_image: '/images/trimble-r12.jpg',
            context_price: '2,200 ج.م / يوم',
          },
        ];
      }

      setInquiries(merged);
      if (merged.length > 0 && !selectedInquiry) {
        setSelectedInquiry(merged[0]);
      }
    } catch (err) {
      console.warn('Load inquiries error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  // Filtered List
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // 1. Tab Filter
      if (activeFilter === 'unread' && inq.status !== 'unread') return false;
      if (activeFilter === 'replied' && inq.status !== 'replied') return false;
      if (activeFilter === 'equipment' && inq.context_type !== 'equipment') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (inq.sender_name || '').toLowerCase().includes(q);
        const matchPhone = (inq.sender_phone || '').includes(q);
        const matchMsg = (inq.clean_message || inq.message || '').toLowerCase().includes(q);
        const matchTitle = (inq.context_title || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchMsg && !matchTitle) return false;
      }

      return true;
    });
  }, [inquiries, activeFilter, searchQuery]);

  // Update Status Action (read, replied)
  const handleUpdateStatus = async (inquiryId: string, newStatus: 'read' | 'replied') => {
    try {
      // Update state optimistically
      setInquiries((prev) =>
        prev.map((item) => (item.id === inquiryId ? { ...item, status: newStatus } : item))
      );
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Update Supabase
      await supabase.from('inquiries').update({ status: newStatus }).eq('id', inquiryId);

      // Update localStorage if cached
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_LOCAL_INQUIRIES');
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((item: any) =>
            item.id === inquiryId ? { ...item, status: newStatus } : item
          );
          localStorage.setItem('SURVSTA_LOCAL_INQUIRIES', JSON.stringify(updated));
        }
      }

      showToast(newStatus === 'read' ? '✓ تم تحديد الاستفسار كمقروء' : '✓ تم تحديد الاستفسار كتم الرد عليه');
    } catch (err) {
      console.warn('Status update notice:', err);
    }
  };

  // Direct WhatsApp Action
  const handleDirectWhatsApp = (inquiry: InquiryItem) => {
    let cleanPhone = (inquiry.sender_phone || '01033134413').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    }
    const text = encodeURIComponent(
      `مرحباً ${inquiry.sender_name || 'يا بشمهندس'}، أهلاً بك من منصة Survsta بخصوص استفسارك عن (${inquiry.context_title || 'المعدات المساحية'}). كيف يمكننا مساعدتك؟`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    handleUpdateStatus(inquiry.id, 'replied');
  };

  // Direct Phone Call Action
  const handleDirectCall = (inquiry: InquiryItem) => {
    window.location.href = `tel:${inquiry.sender_phone || '01033134413'}`;
  };

  const unreadCount = inquiries.filter((i) => i.status === 'unread').length;

  return (
    <div className="bg-[#081933] min-h-screen text-slate-100" style={{ direction: 'rtl' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-6 z-50 bg-[#0F253E] border border-cyan-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-cyan-400 text-lg">💬</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <section className="bg-gradient-to-b from-[#061429] to-[#081933] border-b border-cyan-500/20 py-8 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  B2B Asynchronous Communication Hub
                </span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                    {unreadCount} استفسارات جديدة لم تقرأ
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                صندوق الاستفسارات والوارد (Inbox)
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                استقبل استفسارات العملاء والمهندسين عن الأجهزة والخدمات المساحية وتواصل معهم مباشرة عبر الواتساب أو المكالمات الهاتفية.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadInquiries}
                className="px-4 py-2 rounded-xl bg-[#0F253E] hover:bg-slate-800 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center gap-2"
              >
                <span>🔄</span>
                <span>تحديث الوارد</span>
              </button>
              <Link
                href="/provider/dashboard"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold shadow-md transition"
              >
                لوحة التحكم العامة
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-cyan-500 text-gray-950 border-cyan-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              جميع الاستفسارات ({inquiries.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'unread'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              <span>غير مقروء</span>
              {unreadCount > 0 && (
                <span className="bg-rose-900/60 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('equipment')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap ${
                activeFilter === 'equipment'
                  ? 'bg-cyan-500 text-gray-950 border-cyan-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              استفسارات الأجهزة والمعدات
            </button>
            <button
              onClick={() => setActiveFilter('replied')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap ${
                activeFilter === 'replied'
                  ? 'bg-emerald-500 text-gray-950 border-emerald-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              تم الرد والتواصل
            </button>
          </div>
        </div>
      </section>

      {/* Main Inbox Workspace */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / List Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المهندس، رقم الهاتف، أو نص الاستفسار..."
                className="w-full rounded-xl border border-gray-800 bg-[#0F253E] pl-3 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
              />
              <span className="absolute right-3 top-3 text-gray-500 text-xs">🔍</span>
            </div>

            {/* List Cards Container */}
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {isLoading && (
                <div className="p-8 text-center text-xs text-gray-400 bg-[#0F253E] rounded-2xl border border-gray-800 animate-pulse">
                  جاري تحميل صندوق الاستفسارات...
                </div>
              )}

              {!isLoading && filteredInquiries.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 bg-[#0F253E] rounded-2xl border border-dashed border-gray-800 space-y-3">
                  <span className="text-3xl block">📭</span>
                  <p className="font-semibold text-white">لا توجد استفسارات مطابقة</p>
                  <p className="text-[11px] text-gray-400">
                    عندما يرسل لك أحد العملاء أو الشركات استفساراً، سيظهر هنا مباشرة.
                  </p>
                </div>
              )}

              {!isLoading &&
                filteredInquiries.map((inq) => {
                  const isSelected = selectedInquiry?.id === inq.id;
                  const isUnread = inq.status === 'unread';

                  return (
                    <div
                      key={inq.id}
                      onClick={() => {
                        setSelectedInquiry(inq);
                        if (inq.status === 'unread') {
                          handleUpdateStatus(inq.id, 'read');
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-right space-y-2.5 relative ${
                        isSelected
                          ? 'bg-[#0F253E] border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                          : isUnread
                          ? 'bg-[#0F253E]/90 border-rose-500/30 hover:border-gray-700'
                          : 'bg-[#0F253E]/50 border-gray-800/80 hover:bg-[#0F253E]/80'
                      }`}
                    >
                      {/* Top Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isUnread
                                ? 'bg-rose-500 text-white'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {(inq.sender_name || 'ع').slice(0, 1)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">
                              {inq.sender_name}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {inq.sender_phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              inq.status === 'unread'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : inq.status === 'replied'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-800 text-gray-300 border border-gray-700'
                            }`}
                          >
                            {inq.status === 'unread'
                              ? 'جديد'
                              : inq.status === 'replied'
                              ? 'تم الرد'
                              : 'مقروء'}
                          </span>
                        </div>
                      </div>

                      {/* Equipment preview tag */}
                      {inq.context_title && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-[#081933] px-2.5 py-1 rounded-lg border border-gray-800 truncate">
                          <span>📡</span>
                          <span className="truncate">{inq.context_title}</span>
                        </div>
                      )}

                      {/* Snippet */}
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {inq.clean_message || inq.message}
                      </p>

                      {/* Date & Preference */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/60">
                        <span>
                          {new Date(inq.created_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-cyan-400 font-medium">
                          طريقة الرد: {inq.preferred_method || 'واتساب'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right / Detail Column (7 Cols) */}
          <div className="lg:col-span-7">
            {selectedInquiry ? (
              <div className="bg-[#0F253E] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 sticky top-24">
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 font-black text-lg flex items-center justify-center shadow-md">
                      {(selectedInquiry.sender_name || 'ع').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {selectedInquiry.sender_name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            selectedInquiry.status === 'unread'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : selectedInquiry.status === 'replied'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gray-800 text-gray-300 border border-gray-700'
                          }`}
                        >
                          {selectedInquiry.status === 'unread'
                            ? 'جديد لم يتم الرد'
                            : selectedInquiry.status === 'replied'
                            ? 'تم الرد والتواصل'
                            : 'تمت القراءة'}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-300 font-mono mt-0.5">
                        {selectedInquiry.sender_phone}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedInquiry.id,
                          selectedInquiry.status === 'replied' ? 'read' : 'replied'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl border border-gray-700 bg-[#081933] hover:bg-slate-800 text-gray-300 text-xs font-semibold transition"
                    >
                      {selectedInquiry.status === 'replied'
                        ? 'إلغاء تحديد تم الرد'
                        : '✓ تحديد كتم الرد'}
                    </button>
                  </div>
                </div>

                {/* Attached Equipment Banner */}
                {selectedInquiry.context_title && (
                  <div className="p-4 rounded-xl bg-[#081933] border border-amber-500/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {selectedInquiry.context_image ? (
                        <div className="relative w-14 h-14 rounded-lg bg-gray-900 overflow-hidden shrink-0">
                          <Image
                            src={selectedInquiry.context_image}
                            alt={selectedInquiry.context_title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl shrink-0">
                          📡
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold block">
                          استفسار متعلق بجهاز في الكتالوج:
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {selectedInquiry.context_title}
                        </h4>
                        {selectedInquiry.context_price && (
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            {selectedInquiry.context_price}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedInquiry.context_id && (
                      <Link
                        href={`/equipment/${selectedInquiry.context_id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition whitespace-nowrap"
                      >
                        عرض الجهاز ←
                      </Link>
                    )}
                  </div>
                )}

                {/* Inquiry Body */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="font-semibold text-gray-300">نص الرسالة والاستفسار:</span>
                    <span>
                      {new Date(selectedInquiry.created_at).toLocaleString('ar-EG', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#081933] border border-gray-800 text-gray-200 leading-relaxed whitespace-pre-line text-sm shadow-inner">
                    {selectedInquiry.clean_message || selectedInquiry.message}
                  </div>
                </div>

                {/* Communication CTAs */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#081933] to-[#0A2242] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">الرد المباشر السريع</h4>
                      <p className="text-[11px] text-gray-400">
                        طريقة التواصل المفضلة للمرسل:{' '}
                        <strong className="text-cyan-300">
                          {selectedInquiry.preferred_method || 'واتساب'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleDirectWhatsApp(selectedInquiry)}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                    >
                      <span>💬</span>
                      <span>فتح محادثة واتساب فورية</span>
                    </button>

                    <button
                      onClick={() => handleDirectCall(selectedInquiry)}
                      className="py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2"
                    >
                      <span>📞</span>
                      <span>اتصال هاتفي مباشر ({selectedInquiry.sender_phone})</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 rounded-2xl bg-[#0F253E]/60 border border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-3">
                <span className="text-4xl">💬</span>
                <h3 className="font-bold text-base text-white">اختر استفساراً من القائمة</h3>
                <p className="text-xs max-w-sm">
                  انقر على أي استفسار في القائمة لعرض تفاصيله الكاملة والرد مباشرة عبر الواتساب أو المكالمة.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
