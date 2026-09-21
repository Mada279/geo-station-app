'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'استفسار عام',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
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
            سواء كنت عميلًا أو مكتبًا أو موردًا أو مركز تدريب — فريقنا جاهز يساعدك.
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
                <h2 className="text-2xl font-bold text-slate-900 mb-6">أرسل رسالتك</h2>

                {submitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-3xl block mb-2">✅</span>
                    <h3 className="text-lg font-bold text-emerald-900 mb-1">تم استلام رسالتك بنجاح!</h3>
                    <p className="text-sm text-emerald-800">سنقوم بمراجعة استفسارك والتواصل معك عبر الهاتف أو البريد الإلكتروني خلال يوم عمل واحد.</p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition"
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
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                        <input
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="01xxxxxxxxx"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">نوع الاستفسار</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل الرسالة *</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="اكتب تفاصيل طلبك أو استفسارك هنا..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-[#041527] font-extrabold py-3 text-sm shadow-md transition"
                    >
                      إرسال الرسالة
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar Details (1 Col) */}
            <div>
              <div className="bg-[#f4f7fa] p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">قنوات التواصل المباشرة</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">الدعم الفني:</span>
                      <a href="mailto:support@survsta.com" className="text-cyan-700 font-medium hover:underline">support@survsta.com</a>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">خدمة الشركاء:</span>
                      <a href="mailto:partners@survsta.com" className="text-cyan-700 font-medium hover:underline">partners@survsta.com</a>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">الإعلانات:</span>
                      <a href="mailto:ads@survsta.com" className="text-cyan-700 font-medium hover:underline">ads@survsta.com</a>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">مواعيد العمل:</span>
                      <span className="text-slate-800">السبت — الخميس، 9ص — 5م</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-slate-600">المقر:</span>
                      <span className="text-slate-800">الإسكندرية، مصر</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">هل أنت مزوّد خدمة؟</h4>
                  <p className="text-xs text-slate-600 mb-3">سجّل جهتك مباشرة عبر بوابة الشركاء بدل انتظار الرد.</p>
                  <Link
                    href="/onboarding"
                    className="block text-center rounded-lg bg-[#081933] text-white py-2.5 text-xs font-bold hover:bg-[#0F253E] transition"
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
              <a href="mailto:support@survsta.com?subject=Report%20Issue" className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition">
                إرسال بلاغ فوري
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">زمن الرد المتوقع</div>
              <div className="text-sm font-bold text-slate-900">يوم عمل واحد</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">طلبات الشركاء</div>
              <div className="text-sm font-bold text-slate-900">حتى 48 ساعة عمل</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">البلاغات والشكاوى</div>
              <div className="text-sm font-bold text-slate-900">مراجعة خلال 48 ساعة</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">نطاق التغطية</div>
              <div className="text-sm font-bold text-slate-900">الإسكندرية والقاهرة والجيزة</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
