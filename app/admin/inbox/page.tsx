'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

interface AdminInquiryItem {
  id: string;
  sender_id: string | null;
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  receiver_id: string | null;
  context_type: string;
  context_id: string | null;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  inquiry_category?: string;
  clean_message?: string;
}

export default function AdminInboxPage() {
  const [inquiries, setInquiries] = useState<AdminInquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'general' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to extract clean text and category from message format
  const parseMessage = (rawMsg: string) => {
    let cleanMessage = rawMsg;
    let category = 'استفسار عام';
    let email = '';

    const typeMatch = rawMsg.match(/\[نوع الاستفسار:\s*([^\]]+)\]/);
    if (typeMatch) {
      category = typeMatch[1].trim();
      cleanMessage = cleanMessage.replace(typeMatch[0], '');
    }

    const emailMatch = rawMsg.match(/\[البريد الإلكتروني:\s*([^\]]+)\]/);
    if (emailMatch) {
      email = emailMatch[1].trim();
      cleanMessage = cleanMessage.replace(emailMatch[0], '');
    }

    return {
      cleanMessage: cleanMessage.trim(),
      category,
      email,
    };
  };

  const loadAdminInquiries = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch general inquiries from Supabase
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      let list: AdminInquiryItem[] = [];

      if (!error && data) {
        list = data.map((item: any) => {
          const parsed = parseMessage(item.message || '');
          return {
            id: item.id,
            sender_id: item.sender_id,
            sender_name: item.sender_name || 'زائر / عميل للمنصة',
            sender_phone: item.sender_phone || '01033134413',
            sender_email: parsed.email || '',
            receiver_id: item.receiver_id,
            context_type: item.context_type || 'general',
            context_id: item.context_id,
            message: item.message,
            status: item.status || 'unread',
            created_at: item.created_at || new Date().toISOString(),
            inquiry_category: parsed.category,
            clean_message: parsed.cleanMessage,
          };
        });
      }

      // 2. Also check localStorage for any local guest submissions
      if (typeof window !== 'undefined') {
        try {
          const localStr = localStorage.getItem('SURVSTA_LOCAL_INQUIRIES');
          if (localStr) {
            const localItems = JSON.parse(localStr);
            const mappedLocal: AdminInquiryItem[] = localItems.map((loc: any) => {
              const parsed = parseMessage(loc.message || '');
              return {
                id: loc.id || `loc-${Date.now()}`,
                sender_id: loc.sender_id || null,
                sender_name: loc.sender_name || 'زائر للمنصة',
                sender_phone: loc.sender_phone || '01033134413',
                sender_email: loc.sender_email || parsed.email,
                receiver_id: loc.receiver_id || null,
                context_type: loc.context_type || 'general',
                context_id: loc.context_id || null,
                message: loc.message,
                status: loc.status || 'unread',
                created_at: loc.created_at || new Date().toISOString(),
                inquiry_category: parsed.category,
                clean_message: parsed.cleanMessage,
              };
            });

            const existingIds = new Set(list.map((m) => m.id));
            mappedLocal.forEach((m) => {
              if (!existingIds.has(m.id)) list.unshift(m);
            });
          }
        } catch {}
      }

      // Default sample general inquiries if completely empty
      if (list.length === 0) {
        list = [
          {
            id: 'admin-sample-1',
            sender_id: null,
            sender_name: 'م. حسام الدين عبد الله',
            sender_phone: '01012345678',
            sender_email: 'hossam@surveying-eg.com',
            receiver_id: null,
            context_type: 'general',
            context_id: null,
            message: '[نوع الاستفسار: خدمة الشركاء والتسجيل]\n[البريد الإلكتروني: hossam@surveying-eg.com]\n\nنحن شركة مقاولات كبرى في القاهرة ولدينا أسطول مكون من 15 جهاز Total Station وGPS ونرغب في الانضمام كشريك معتمد، ما هي اشتراطات التوثيق؟',
            status: 'unread',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            inquiry_category: 'خدمة الشركاء والتسجيل',
            clean_message: 'نحن شركة مقاولات كبرى في القاهرة ولدينا أسطول مكون من 15 جهاز Total Station وGPS ونرغب في الانضمام كشريك معتمد، ما هي اشتراطات التوثيق؟',
          },
          {
            id: 'admin-sample-2',
            sender_id: null,
            sender_name: 'شركة النور للمقاولات العامة',
            sender_phone: '01123456789',
            sender_email: 'info@alnoor-co.com',
            receiver_id: null,
            context_type: 'general',
            context_id: null,
            message: '[نوع الاستفسار: الإعلانات والظهور المميّز]\n[البريد الإلكتروني: info@alnoor-co.com]\n\nنرغب في حجز بانر إعلاني في الصفحة الرئيسية للأجهزة والمعدات المساحية، نرجو إرسال باقات الأسعار.',
            status: 'unread',
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            inquiry_category: 'الإعلانات والظهور المميّز',
            clean_message: 'نرغب في حجز بانر إعلاني في الصفحة الرئيسية للأجهزة والمعدات المساحية، نرجو إرسال باقات الأسعار.',
          },
        ];
      }

      setInquiries(list);
      if (list.length > 0 && !selectedInquiry) {
        setSelectedInquiry(list[0]);
      }
    } catch (err) {
      console.warn('Admin inbox error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminInquiries();
  }, []);

  // Filtered
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (activeTab === 'unread' && inq.status !== 'unread') return false;
      if (activeTab === 'replied' && inq.status !== 'replied') return false;
      if (activeTab === 'general' && inq.context_type !== 'general') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = inq.sender_name.toLowerCase().includes(q);
        const matchPhone = inq.sender_phone.includes(q);
        const matchMsg = (inq.clean_message || inq.message).toLowerCase().includes(q);
        const matchType = (inq.inquiry_category || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchMsg && !matchType) return false;
      }

      return true;
    });
  }, [inquiries, activeTab, searchQuery]);

  // Mark status action
  const handleUpdateStatus = async (id: string, newStatus: 'unread' | 'read' | 'replied') => {
    try {
      setInquiries((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it))
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      await supabase.from('inquiries').update({ status: newStatus }).eq('id', id);

      if (typeof window !== 'undefined') {
        try {
          const localStr = localStorage.getItem('SURVSTA_LOCAL_INQUIRIES');
          if (localStr) {
            const list = JSON.parse(localStr);
            const updated = list.map((it: any) =>
              it.id === id ? { ...it, status: newStatus } : it
            );
            localStorage.setItem('SURVSTA_LOCAL_INQUIRIES', JSON.stringify(updated));
          }
        } catch {}
      }

      showToast(
        newStatus === 'read'
          ? '✓ تم التحديد كمقروء'
          : newStatus === 'replied'
          ? '✓ تم التحديد كتم الرد'
          : '✓ تم التحديد كغير مقروء'
      );
    } catch (err) {
      console.warn('Status update notice:', err);
    }
  };

  // Direct WhatsApp Action
  const handleDirectWhatsApp = (inquiry: AdminInquiryItem) => {
    let cleanPhone = (inquiry.sender_phone || '01033134413').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    }
    const msg = encodeURIComponent(
      `مرحباً ${inquiry.sender_name}، أهلاً بك من إدارة منصة Survsta بخصوص رسالتك عبر صفحة تواصل معنا (${inquiry.inquiry_category || 'استفسار عام'}). كيف يمكننا خدمتك؟`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    handleUpdateStatus(inquiry.id, 'replied');
  };

  const unreadCount = inquiries.filter((i) => i.status === 'unread').length;

  return (
    <div className="flex h-screen bg-[#081933] text-slate-100 overflow-hidden" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-6 z-50 bg-[#0F253E] border border-cyan-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-cyan-400 text-lg">🛡️</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <header className="bg-gradient-to-b from-[#061429] to-[#081933] border-b border-cyan-500/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  Admin Central Inquiries & Contact Hub
                </span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                    {unreadCount} استفسارات جديدة
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                صندوق استفسارات المنصة والإدارة (Admin Inbox)
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                استقبل كافة الرسائل والاستفسارات العامة وبلاغات الشركاء المرسلة عبر صفحة «تواصل معنا» وتواصل معهم مباشرة عبر الواتساب.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadAdminInquiries}
                className="px-4 py-2 rounded-xl bg-[#0F253E] hover:bg-slate-800 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center gap-2"
              >
                <span>🔄</span>
                <span>تحديث الوارد</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-gray-950 border-cyan-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              جميع الرسائل ({inquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'unread'
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
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-cyan-500 text-gray-950 border-cyan-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              استفسارات «تواصل معنا» العامة
            </button>
            <button
              onClick={() => setActiveTab('replied')}
              className={`px-4 py-2 rounded-xl border font-bold transition whitespace-nowrap ${
                activeTab === 'replied'
                  ? 'bg-emerald-500 text-gray-950 border-emerald-400 shadow-md'
                  : 'bg-[#0F253E] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              تم الرد والتواصل
            </button>
          </div>
        </header>

        {/* Workspace Columns */}
        <main className="flex-1 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List Column */}
            <div className="lg:col-span-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الراسل، رقم الهاتف، أو نص الاستفسار..."
                  className="w-full rounded-xl border border-gray-800 bg-[#0F253E] pl-3 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
                />
                <span className="absolute right-3 top-3 text-gray-500 text-xs">🔍</span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {isLoading && (
                  <div className="p-8 text-center text-xs text-gray-400 bg-[#0F253E] rounded-2xl border border-gray-800 animate-pulse">
                    جاري تحميل استفسارات الإدارة...
                  </div>
                )}

                {!isLoading && filteredInquiries.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400 bg-[#0F253E] rounded-2xl border border-dashed border-gray-800 space-y-3">
                    <span className="text-3xl block">📭</span>
                    <p className="font-semibold text-white">لا توجد رسائل مطابقة</p>
                    <p className="text-[11px] text-gray-400">
                      كل الرسائل الواردة من صفحة تواصل معنا ستظهر هنا فور إرسالها.
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isUnread
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {(inq.sender_name || 'ز').slice(0, 1)}
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

                        {/* Category Tag */}
                        {inq.inquiry_category && (
                          <div className="inline-flex items-center gap-1.5 text-[10.5px] text-cyan-300 bg-[#081933] px-2.5 py-0.5 rounded-lg border border-cyan-500/20 font-medium">
                            <span>🏷️</span>
                            <span>{inq.inquiry_category}</span>
                          </div>
                        )}

                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                          {inq.clean_message || inq.message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/60">
                          <span>
                            {new Date(inq.created_at).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-gray-400 font-mono">
                            {inq.sender_email || 'بدون إيميل'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Detail Column */}
            <div className="lg:col-span-7">
              {selectedInquiry ? (
                <div className="bg-[#0F253E] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 sticky top-8">
                  {/* Header Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 font-black text-lg flex items-center justify-center shadow-md">
                        {(selectedInquiry.sender_name || 'ز').slice(0, 2)}
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
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                          <span className="font-mono text-cyan-300 font-bold">
                            📞 {selectedInquiry.sender_phone}
                          </span>
                          {selectedInquiry.sender_email && (
                            <span className="font-mono text-gray-300">
                              ✉️ {selectedInquiry.sender_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            selectedInquiry.id,
                            selectedInquiry.status === 'read' ? 'unread' : 'read'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-gray-700 bg-[#081933] hover:bg-slate-800 text-gray-300 text-xs font-semibold transition"
                      >
                        {selectedInquiry.status === 'read' ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                      </button>
                    </div>
                  </div>

                  {/* Context Info */}
                  <div className="p-3.5 rounded-xl bg-[#081933] border border-gray-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">تصنيف الاستفسار:</span>
                      <span className="font-bold text-cyan-300">
                        {selectedInquiry.inquiry_category || 'استفسار عام'}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-400 block text-[11px]">تاريخ الاستلام:</span>
                      <span className="text-gray-300 font-mono">
                        {new Date(selectedInquiry.created_at).toLocaleString('ar-EG', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="space-y-2 text-xs">
                    <span className="font-semibold text-gray-300">تفاصيل ونص الرسالة:</span>
                    <div className="p-4 rounded-2xl bg-[#081933] border border-gray-800 text-gray-200 leading-relaxed whitespace-pre-line text-sm shadow-inner min-h-[120px]">
                      {selectedInquiry.clean_message || selectedInquiry.message}
                    </div>
                  </div>

                  {/* Response Action Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#081933] to-[#0A2242] border border-cyan-500/30 space-y-3">
                    <h4 className="text-xs font-bold text-white">إجراءات الرد والتواصل الفوري</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => handleDirectWhatsApp(selectedInquiry)}
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                      >
                        <span>💬</span>
                        <span>واتساب مباشر ({selectedInquiry.sender_phone})</span>
                      </button>

                      <a
                        href={`tel:${selectedInquiry.sender_phone}`}
                        className="py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2"
                      >
                        <span>📞</span>
                        <span>اتصال هاتفي مباشر</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 rounded-2xl bg-[#0F253E]/60 border border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-3">
                  <span className="text-4xl">🛡️</span>
                  <h3 className="font-bold text-base text-white">اختر استفساراً لمعاينته</h3>
                  <p className="text-xs max-w-sm">
                    انقر على أي استفسار في القائمة للرد عليه ومتابعته مباشرة مع العميل أو الشريك.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
