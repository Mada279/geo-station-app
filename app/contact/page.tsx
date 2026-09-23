'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import { validateEgyptianPhone } from '@/lib/validations/phone';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'استفسار عام',
    message: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      showToast('⚠️ يرجى ملء الحقول المطلوبة (الاسم، الهاتف، الرسالة).');
      return;
    }

    const phoneValidation = validateEgyptianPhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'رقم الهاتف غير صالح');
      showToast(`⚠️ ${phoneValidation.error}`);
      return;
    }
    const validPhone = phoneValidation.normalized;

    setIsSubmitting(true);
    try {
      // 1. Get current user if logged in
      let senderId: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          senderId = authData.user.id;
        }
      } catch {}

      const formattedMessage = `[نوع الاستفسار: ${formData.type}]\n[البريد الإلكتروني: ${formData.email || 'غير محدد'}]\n\n${formData.message.trim()}`;

      // 2. Insert into inquiries table
      const inquiryPayload = {
        sender_id: senderId,
        sender_name: formData.name.trim(),
        sender_phone: validPhone,
        receiver_id: null, // General platform inquiry targeted at Admin
        context_type: 'general',
        context_id: null,
        message: formattedMessage,
        status: 'unread' as const,
        created_at: new Date().toISOString(),
      };

      const { data: insertedInq, error: inqErr } = await supabase
        .from('inquiries')
        .insert([inquiryPayload])
        .select()
        .single();

      if (inqErr) {
        console.warn('Inquiries table insert notice:', inqErr.message);
      }

      // 3. Trigger inapp_notification for Admin
      try {
        const { data: adminUsers } = await supabase
          .from('clients')
          .select('user_id')
          .limit(1);

        const targetAdminId = adminUsers?.[0]?.user_id || senderId;

        if (targetAdminId) {
          await supabase.from('inapp_notifications').insert([
            {
              user_id: targetAdminId,
              title: `استفسار عام جديد من: ${formData.name.trim()}`,
              message: `تلقيت استفساراً جديداً (${formData.type}) من ${formData.name} (هاتف: ${formData.phone}): "${formData.message.slice(0, 90)}..."`,
              type: 'system',
              link: '/admin/inbox',
              is_read: false,
            },
          ]);
        }
      } catch (notifErr) {
        console.warn('Admin notification notice:', notifErr);
      }

      // 4. Cache in localStorage for offline resilience
      if (typeof window !== 'undefined') {
        try {
          const localStr = localStorage.getItem('SURVSTA_LOCAL_INQUIRIES') || '[]';
          const localList = JSON.parse(localStr);
          localList.unshift({
            id: insertedInq?.id || `gen-${Date.now()}`,
            ...inquiryPayload,
            sender_email: formData.email,
          });
          localStorage.setItem('SURVSTA_LOCAL_INQUIRIES', JSON.stringify(localList));
        } catch {}
      }

      setSubmitted(true);
      showToast('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً');
    } catch (err) {
      console.warn('Contact form submit error:', err);
      setSubmitted(true);
      showToast('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f7fa] text-slate-800" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#0F253E] border border-cyan-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-cyan-400 text-lg">📩</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="محطة عمل وتواصل هندسي"
            className="object-cover"
            fill
            priority
            src="/assets/img/office-cad-workstation.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / تواصل معنا</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">تواصل معنا</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            سواء كنت عميلًا أو مكتبًا أو موردًا أو مركز تدريب — فريقنا جاهز يساعدك ويستقبل استفساراتك واقتراحاتك على مدار الساعة.
          </p>
        </div>
      </section>

      {/* 2. Main Contact Form & Details */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Form Column (2 Cols) */}
            <div className="lg:col-span-2">
              <div className="bg-[#f4f7fa] p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">أرسل رسالتك واستفسارك</h2>

                {submitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                    <span className="text-4xl block">✅</span>
                    <h3 className="text-lg font-bold text-emerald-900">تم إرسال رسالتك بنجاح، سنتواصل معك قريباً!</h3>
                    <p className="text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                      تم تحويل استفسارك إلى فريق الإدارة والدعم الفني في منصة Survsta، وسنقوم بالتواصل معك على رقم هاتفك ({formData.phone}) خلال ساعات العمل.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          phone: '',
                          email: '',
                          type: 'استفسار عام',
                          message: '',
                        });
                      }}
                      className="mt-3 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
                    >
                      إرسال رسالة أخرى
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="م. أحمد الشناوي"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف والواتساب *</label>
                        <input
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (phoneError) setPhoneError(null);
                          }}
                          placeholder="010xxxxxxxx"
                          dir="ltr"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none font-mono text-left transition ${
                            phoneError
                              ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20 bg-red-50/20'
                              : 'border-slate-300 bg-white focus:border-cyan-500'
                          }`}
                        />
                        {phoneError && (
                          <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ {phoneError}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">نوع الاستفسار</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option>استفسار عام</option>
                          <option>دعم فني</option>
                          <option>خدمة الشركاء والتسجيل</option>
                          <option>الإعلانات والظهور المميّز</option>
                          <option>شكوى أو بلاغ عن جهة</option>
                          <option>شراكة استراتيجية أو تعاون</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل الرسالة والاستفسار *</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="اكتب تفاصيل طلبك أو استفسارك هنا..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none leading-relaxed"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-[#00d2ff] hover:bg-cyan-400 text-[#041527] font-black py-3.5 text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                          <span>جاري إرسال الرسالة...</span>
                        </>
                      ) : (
                        <>
                          <span>إرسال الرسالة للإدارة</span>
                          <span>←</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar Details (1 Col) */}
            <div>
              <div className="bg-[#f4f7fa] p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">قنوات التواصل المباشرة (واتساب)</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">الدعم الفني:</span>
                      <a
                        href="https://wa.me/201033134413?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%81%D8%B1%D9%8A%D9%82%20%D8%A7%D9%84%D8%AF%D8%B9%D9%85%20%D8%A7%D9%84%D9%81%D9%86%D9%8A%20%D9%84%D9%85%D9%86%D8%B5%D8%A9%20Survsta"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>واتساب الدعم الفني</span>
                      </a>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">خدمة الشركاء:</span>
                      <a
                        href="https://wa.me/201033134413?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%81%D8%B1%D9%8A%D9%82%20%D8%B4%D8%B1%D9%83%D8%A7%D8%A1%20Survsta%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>واتساب الشركاء</span>
                      </a>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">الإعلانات:</span>
                      <a
                        href="https://wa.me/201033134413?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A8%D8%A7%D9%82%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A5%D8%B9%D9%84%D8%A7%D9%86%20%D9%88%D8%A7%D9%84%D8%B8%D9%87%D9%88%D8%B1%20%D8%A7%D9%84%D9%85%D9%85%D9%8A%D8%B2"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>واتساب الإعلانات</span>
                      </a>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">مواعيد العمل:</span>
                      <span className="text-slate-800">السبت — الخميس، 9ص — 5م</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-slate-600">المقر:</span>
                      <span className="text-slate-800">جمهورية مصر العربية</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">هل أنت مزوّد خدمة أو مكتب مساحي؟</h4>
                  <p className="text-xs text-slate-600 mb-3">سجّل جهتك مباشرة عبر بوابة الشركاء بدل انتظار الرد.</p>
                  <Link
                    href="/onboarding"
                    className="block text-center rounded-xl bg-[#081933] text-white py-2.5 text-xs font-bold hover:bg-[#0F253E] transition"
                  >
                    انضم كشريك الآن
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Quick Alternatives & Response Times */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">قبل ما تراسلنا</span>
              <h2 className="text-2xl font-bold text-slate-900">إجابات سريعة قد توفّر عليك الانتظار</h2>
            </div>
            <Link
              href="/help"
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition flex items-center gap-1"
            >
              <span>مركز المساعدة والأسئلة</span>
              <span>←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">🙋</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">أنا عميل وأريد مزوّد خدمة</h3>
              <p className="text-sm text-slate-600 mb-4">لا تحتاج مراسلتنا — أرسل احتياجك مباشرة وسنوجّهه للجهات المؤهلة في نطاقك الجغرافي.</p>
              <Link href="/directory" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg transition">
                تصفح مكاتب المساحة
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">أريد تسجيل مكتبي أو شركتي</h3>
              <p className="text-sm text-slate-600 mb-4">التسجيل ذاتي وسهل عبر نموذج الشركاء، ويراجعه فريق التوثيق خلال 48 ساعة عمل.</p>
              <Link href="/onboarding" className="inline-block px-4 py-2 bg-[#081933] hover:bg-[#0F253E] text-white text-xs font-bold rounded-lg transition">
                سجّل شركتك مجاناً
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">لدي بلاغ عن بيانات خاطئة</h3>
              <p className="text-sm text-slate-600 mb-4">استخدم زر «الإبلاغ» داخل ملف الجهة مباشرة — يصل البلاغ فوراً للمدققين الإداريين.</p>
              <Link
                href="/help"
                className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition border border-slate-300"
              >
                إرسال بلاغ فوري
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">زمن الرد المتوقع</div>
              <div className="text-sm font-bold text-slate-900">خلال ساعات العمل</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">طلبات الشركاء</div>
              <div className="text-sm font-bold text-slate-900">حتى 48 ساعة عمل</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">البلاغات والشكاوى</div>
              <div className="text-sm font-bold text-slate-900">مراجعة خلال 24 ساعة</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">نطاق التغطية</div>
              <div className="text-sm font-bold text-slate-900">كافة محافظات مصر</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
