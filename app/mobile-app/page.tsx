'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function MobileAppPage() {
  const [notified, setNotified] = useState(false);
  const [contactInput, setContactInput] = useState('');

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactInput) {
      setNotified(true);
    }
  };

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="تطبيق الموبايل للمساحة"
            className="object-cover"
            fill
            priority
            src="/assets/img/office-cad-workstation.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / تطبيق الموبايل</div>
          <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold mb-3">
            📱 متاح قريبًا على المتاجر
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Survsta في جيبك<br />أينما كان موقع العمل
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            نفس المنصة بتجربة مصمّمة للميدان: بحث بالقرب منك، إشعارات فورية بطلبات التواصل، وإدارة إدراجاتك من الموقع مباشرة.
          </p>

          {/* Store Badges */}
          <div className="flex items-center gap-3 mt-8 flex-wrap">
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-black text-white border border-slate-700 shadow-md cursor-pointer hover:border-slate-500 transition"
              dir="ltr"
            >
              <svg className="w-6 h-6" viewBox="0 0 512 512" aria-hidden="true" fill="none">
                <path fill="#4285F4" d="M47.6 12.5C42.6 17.8 39.7 26 39.7 36.6v438.8c0 10.6 2.9 18.8 7.9 24.1l1.5 1.4L295 255.9v-5.8L49.1 11.1z"/>
                <path fill="#FBBC04" d="m377 337.8-82-82v-5.8l82.1-82.1 1.8 1.1 97.2 55.2c27.8 15.8 27.8 41.6 0 57.4l-97.2 55.2z"/>
                <path fill="#EA4335" d="m378.9 336.7-83.9-83.9L47.6 499.5c9.2 9.7 24.3 10.9 41.4 1.2l289.9-164"/>
                <path fill="#34A853" d="M378.9 168.9 89 5C71.9-4.7 56.8-3.5 47.6 6.2L295 252.8z"/>
              </svg>
              <div className="text-left leading-tight">
                <span className="block text-[10px] text-slate-400">متاح قريبًا على</span>
                <b className="block text-xs font-bold text-white">Google Play</b>
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-black text-white border border-slate-700 shadow-md cursor-pointer hover:border-slate-500 transition"
              dir="ltr"
            >
              <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 384 512" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <div className="text-left leading-tight">
                <span className="block text-[10px] text-slate-400">متاح قريبًا على</span>
                <b className="block text-xs font-bold text-white">App Store</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Grid */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">مميزات التطبيق</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">مصمّم لطبيعة العمل الميداني</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">بحث بالقرب منك</h3>
              <p className="text-sm text-slate-600">نتائج فورية بناءً على إحداثيات موقعك الحالي في الموقع الهندسي دون إدخال يدوي.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">إشعارات فورية</h3>
              <p className="text-sm text-slate-600">تنبيه لحظي بأي طلب تواصل جديد أو رد من العميل حتى لا يفوتك أي مشروع مستعجل.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">📷</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">إضافة إدراج بالكاميرا</h3>
              <p className="text-sm text-slate-600">صوّر الجهاز أو المعدة وأضف بياناتها وحالة المعايرة من موقع العمل مباشرة بضغطة واحدة.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">📶</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">وضع الاتصال الضعيف</h3>
              <p className="text-sm text-slate-600">تصفّح البيانات المحفوظة محليًا وأكمل الإرسال بسلاسة عند عودة تغطية الشبكة في المناطق النائية.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تواصل أسرع</h3>
              <p className="text-sm text-slate-600">اتصال هاتفي مباشر أو محادثة واتساب بضغطة واحدة بعد قبول طلب العميل دون وسيط.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">🗂️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">كل حسابك معك</h3>
              <p className="text-sm text-slate-600">الملف والمعدات والطلبات والتحليلات والتقييمات في جيبك بتطبيق خفيف وسريع الاستجابة.</p>
            </div>
          </div>

          {/* Notify Me Box */}
          <div className="mt-12 max-w-2xl mx-auto bg-[#f4f7fa] p-8 rounded-2xl border border-slate-200 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">نبّهني عند إطلاق التطبيق</h3>
            <p className="text-sm text-slate-600 mb-6">اترك بريدك أو رقمك وسنرسل لك رابط التحميل المباشر أول ما ينزل على المتاجر.</p>

            {notified ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm font-bold">
                ✅ تم تسجيلك بنجاح! سنرسل لك إشعاراً فور إطلاق التطبيق.
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
                <input
                  required
                  type="text"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  placeholder="بريدك الإلكتروني أو رقم هاتفك"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-[#041527] font-extrabold px-6 py-3 text-sm shadow-md transition"
                >
                  نبّهني فور الإطلاق
                </button>
              </form>
            )}

            <p className="text-xs text-slate-400 mt-4">حتى ذلك الحين، الموقع الإلكتروني يعمل بكامل مميزاته وشاشاته على الهاتف والكمبيوتر.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
