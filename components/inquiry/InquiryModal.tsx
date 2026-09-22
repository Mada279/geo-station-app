'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseClient';

export interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName?: string;
  contextType?: 'equipment' | 'service' | 'general';
  contextId?: string;
  contextTitle?: string;
  contextImage?: string;
  contextPrice?: string;
  onSuccess?: () => void;
}

const QUICK_PRESETS = [
  'هل الجهاز متاح للاستلام الميداني غداً؟',
  'ما هي شروط التأمين واستلام شهادة المعايرة؟',
  'هل يتوفر خصم على الباقات الشهرية أو التعاقدات الطويلة؟',
  'أرغب في الاستفسار عن الملحقات المرفقة (ترايبود، برزم، بطاريات إضافية).',
];

export default function InquiryModal({
  isOpen,
  onClose,
  receiverId,
  receiverName = 'المكتب المزوّد',
  contextType = 'equipment',
  contextId,
  contextTitle,
  contextImage,
  contextPrice,
  onSuccess,
}: InquiryModalProps) {
  const [senderId, setSenderId] = useState<string | null>(null);
  const [senderName, setSenderName] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'call' | 'email'>('whatsapp');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill sender information if authenticated
  useEffect(() => {
    async function loadSenderInfo() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          setSenderId(authData.user.id);
          const meta = authData.user.user_metadata || {};
          if (meta.full_name || meta.name) setSenderName(meta.full_name || meta.name);
          if (meta.phone) setSenderPhone(meta.phone);
          if (authData.user.email) setSenderEmail(authData.user.email);
        }

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (!senderId && parsed.id) setSenderId(parsed.id);
              if (!senderName && parsed.name) setSenderName(parsed.name);
              if (!senderPhone && parsed.phone) setSenderPhone(parsed.phone);
              if (!senderEmail && parsed.email) setSenderEmail(parsed.email);
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Sender info load error:', err);
      }
    }

    if (isOpen) {
      loadSenderInfo();
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const cleanMsg = message.trim();
      if (!cleanMsg) {
        throw new Error('يرجى كتابة نص الاستفسار.');
      }
      if (!senderPhone.trim()) {
        throw new Error('يرجى إدخال رقم الهاتف / الواتساب للتواصل.');
      }

      const formattedMessage = `[طريقة التواصل المفضلة: ${
        preferredContact === 'whatsapp' ? 'واتساب' : preferredContact === 'call' ? 'اتصال هاتفي' : 'البريد الإلكتروني'
      }]\n[بيانات المرسل: ${senderName || 'عميل'} — هاتف: ${senderPhone}]\n\n${cleanMsg}`;

      const inquiryRecord = {
        sender_id: senderId || null,
        sender_name: senderName.trim() || 'عميل مساحة',
        sender_phone: senderPhone.trim(),
        receiver_id: receiverId || null,
        context_type: contextType,
        context_id: contextId || null,
        message: formattedMessage,
        status: 'unread' as const,
        created_at: new Date().toISOString(),
      };

      // 1. Insert into Supabase inquiries table
      const { data: insertedInquiry, error: insertErr } = await supabase
        .from('inquiries')
        .insert([inquiryRecord])
        .select()
        .single();

      if (insertErr) {
        console.warn('Supabase inquiries insert notice:', insertErr.message);
      }

      // 2. Insert In-App Notification for receiver
      try {
        await supabase.from('inapp_notifications').insert([
          {
            user_id: receiverId,
            title: `استفسار جديد عن: ${contextTitle || 'المعدات المساحية'}`,
            message: `أرسل لك العميل "${senderName || 'عميل مساحة'}" استفساراً جديداً: "${cleanMsg.slice(0, 100)}..."`,
            type: 'order',
            link: '/inbox',
            is_read: false,
          },
        ]);
      } catch (notifErr) {
        console.warn('Inquiry notification notice:', notifErr);
      }

      // 3. Fallback to localStorage
      if (typeof window !== 'undefined') {
        const storedInquiries = localStorage.getItem('SURVSTA_LOCAL_INQUIRIES') || '[]';
        try {
          const parsed = JSON.parse(storedInquiries);
          parsed.unshift({
            ...inquiryRecord,
            id: insertedInquiry?.id || `inq-${Date.now()}`,
            sender_name: senderName || 'مهندس موقع',
            sender_phone: senderPhone,
            sender_email: senderEmail,
            context_title: contextTitle,
            context_image: contextImage,
            receiver_name: receiverName,
          });
          localStorage.setItem('SURVSTA_LOCAL_INQUIRIES', JSON.stringify(parsed));
        } catch {}
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر إرسال الاستفسار حالياً. يرجى المحاولة لاحقاً.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg transition"
          >
            ✕
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-lg flex items-center justify-center">
              💬
            </span>
            <div>
              <h3 className="text-base font-bold text-white">طلب استفسار / تواصل مباشر</h3>
              <p className="text-[11px] text-gray-400">
                إرسال استفسار فني وتجاري إلى: <span className="text-amber-400 font-bold">{receiverName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Item Context Preview Card */}
        {contextTitle && (
          <div className="bg-[#0F253E] border border-gray-800 rounded-xl p-3 flex items-center gap-3">
            {contextImage ? (
              <div className="relative w-14 h-14 rounded-lg bg-[#081933] overflow-hidden shrink-0">
                <Image
                  src={contextImage}
                  alt={contextTitle}
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
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-gray-400 block font-medium">بخصوص:</span>
              <h4 className="text-xs font-bold text-white truncate">{contextTitle}</h4>
              {contextPrice && (
                <span className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5 block">
                  {contextPrice}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            ⚠️ {error}
          </div>
        )}

        {/* Success State */}
        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">تم إرسال استفسارك بنجاح!</h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
              وصل استفسارك إلى صندوق وارد <span className="text-amber-400 font-bold">({receiverName})</span>، وسيتم التواصل معك مباشرة عبر {preferredContact === 'whatsapp' ? 'واتساب' : preferredContact === 'call' ? 'مكالمة هاتفية' : 'البريد الإلكتروني'}.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Sender Contact Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  اسم المهندس / الجهة الطالبة <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="مثال: م. أحمد عبد العزيز"
                  className="w-full p-2.5 rounded-xl bg-[#0F253E] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  رقم الهاتف والواتساب <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full p-2.5 rounded-xl bg-[#0F253E] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-gray-400 mb-1.5 font-medium">
                طريقة التواصل والرد المفضلة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whatsapp', label: 'واتساب مباشر', icon: '💬' },
                  { id: 'call', label: 'اتصال هاتفي', icon: '📞' },
                  { id: 'email', label: 'إيميل', icon: '✉️' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreferredContact(m.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold flex items-center justify-center gap-1 transition ${
                      preferredContact === m.id
                        ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50 shadow'
                        : 'bg-[#0F253E] text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Inquiry Presets */}
            <div>
              <span className="text-[11px] text-gray-400 block mb-1">
                استفسارات شائعة (انقر للإضافة الفورية):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessage(preset)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-[#0F253E] hover:bg-slate-800 text-gray-300 hover:text-cyan-300 border border-gray-800 transition text-right"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                نص الاستفسار الفني / الميداني <span className="text-cyan-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب استفسارك هنا، مثل: مدة المشروع، متطلبات ملحقات الرصد، شهادة المعايرة، أو موقع العمل..."
                className="w-full p-3 rounded-xl bg-[#0F253E] border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            {/* Footer Submit */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-[11px] text-gray-500">
                🔒 يتم الرد مباشرة عبر صندوق وارد المزوّد
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <span>إرسال الاستفسار للمزوّد</span>
                      <span>←</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
