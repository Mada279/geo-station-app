'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Course {
  slug: string;
  title: string;
  lvl: string;
  hours: string;
  center: string;
  img: string;
  desc: string;
  price: string;
}

const COURSES_DATA: Course[] = [
  {
    slug: 'civil3d',
    title: 'Civil 3D للمساحين والمهندسين',
    lvl: 'متوسط',
    hours: '18 ساعة تطبيقية',
    center: 'جيو أكاديمي مصر',
    img: '/assets/img/gis-blueprints-desk.jpg',
    desc: 'إنشاء السطوح والمحاور والمقاطع وحساب كميات الحفر والردم على مشروع طريق وبنية تحتية كامل من البداية للتسليم.',
    price: '3,500 جنيه',
  },
  {
    slug: 'gnss-field',
    title: 'تشغيل أجهزة GNSS RTK ميدانياً',
    lvl: 'مبتدئ — متوسط',
    hours: '12 ساعة عملية',
    center: 'جيو أكاديمي مصر',
    img: '/assets/img/gnss-monument-hilltop.jpg',
    desc: 'ضبط أجهزة الـ Base والـ Rover، الاتصال بشبكات التصحيح CORS، الرفع والتوقيع الميداني، ومعالجة أخطاء الرصد الشائعة.',
    price: '2,200 جنيه',
  },
  {
    slug: 'ts-processing',
    title: 'معالجة بيانات Total Station وحساب الميزانيات',
    lvl: 'متوسط',
    hours: '10 ساعات معملية',
    center: 'دلتا جيوماتكس',
    img: '/assets/img/office-cad-workstation.jpg',
    desc: 'من التحميل الخام من الجهاز إلى الرسم النهائي: التصحيحات الجوية، خطأ القفل، ضبط شبكات الترافرس، وتجهيز لوحات الأوتوكاد.',
    price: '1,800 جنيه',
  },
  {
    slug: 'qgis-basics',
    title: 'أساسيات التحليل المكاني باستخدام QGIS',
    lvl: 'مبتدئ',
    hours: '15 ساعة',
    center: 'جيو أكاديمي مصر',
    img: '/assets/img/gis-planning-center.jpg',
    desc: 'بناء الطبقات المكانية Vector وRaster، أنظمة الإحداثيات والتحويلات، والتحليل المكاني وإخراج خرائط احترافية متكاملة.',
    price: '2,000 جنيه',
  },
  {
    slug: 'drone-mapping',
    title: 'المسح الجوي بالدرون ومعالجة الصور Photogrammetry',
    lvl: 'متقدم',
    hours: '20 ساعة',
    center: 'دلتا جيوماتكس',
    img: '/assets/img/drone-subdivision-aerial.jpg',
    desc: 'تخطيط الطلعات الجوية، تثبيت ورصد نقاط التحكم الأرضية GCPs، ومعالجة سحابة النقاط والأورثوفوتو على برامج Pix4D وAgisoft.',
    price: '4,800 جنيه',
  },
];

export default function AcademyPage() {
  const [notified, setNotified] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOrPhone) setNotified(true);
  };

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Launch Hero Banner */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 text-4xl mb-4 shadow-lg shadow-amber-500/20">
            🎓
          </div>
          <div>
            <span className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              قريباً — إطلاق مرحلي رسمي
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            أكاديمية Survsta التعليمية
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6">
            منصة التدريب والتأهيل العملي الأولى لقطاع المساحة والجيوماتكس في مصر — تدريب ميداني حقيقي على الأجهزة والبرمجيات المتطورة.
          </p>

          {/* Quick notify form */}
          <div className="max-w-md mx-auto">
            {notified ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
                ✔ تم تسجيلك! ستصلك دعوة حضور مجانية عند إطلاق أولى الورش التدريبية.
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="سجل بريدك أو رقمك لتنبيهك..."
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#F4B400] text-black font-bold px-5 py-2 text-xs hover:brightness-105 transition shrink-0"
                >
                  نبّهني فور الإطلاق
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 2. What to Expect in Academy (4 Pillars) */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">ماذا ستجد في الأكاديمية فور انطلاقها؟</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">برامج مصممة لردم الفجوة بين الدراسة الأكاديمية واحتياجات مواقع العمل الحقيقية.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-[#f4f7fa]">
              <div className="text-2xl mb-2 text-amber-600">✔</div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">تدريب عملي وميداني</h3>
              <p className="text-xs text-slate-600">ممارسة مباشرة على أجهزة Total Station وGNSS RTK والدرون في مشاريع قائمة.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-[#f4f7fa]">
              <div className="text-2xl mb-2 text-amber-600">✔</div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">برامج هندسية متقدمة</h3>
              <p className="text-xs text-slate-600">إتقان Civil 3D وAutoCAD للمساحين وQGIS ونمذجة BIM ومعالجة السحب النقطية.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-[#f4f7fa]">
              <div className="text-2xl mb-2 text-amber-600">✔</div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">شهادات معتمدة</h3>
              <p className="text-xs text-slate-600">شهادات إتمام واختبارات كفاءة تصدر من مراكز تدريب وشركات شريكة موثوقة.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-[#f4f7fa]">
              <div className="text-2xl mb-2 text-amber-600">✔</div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">ربط مباشر بسوق العمل</h3>
              <p className="text-xs text-slate-600">ترشيح مباشر للمتفوقين للمكاتب والشركات الشريكة الباحثة عن مسّاحين مؤهلين.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Preview of Upcoming Courses */}
      <section className="py-14 bg-[#f4f7fa] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-3">
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">معاينة المسارات</span>
              <h2 className="text-2xl font-bold text-slate-900">أبرز البرامج التدريبية المعتمدة</h2>
            </div>
            <span className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200">
              📌 التسجيل المسبق سيفتح قريباً للمسجلين
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES_DATA.map((course) => (
              <div
                key={course.slug}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image
                      alt={course.title}
                      className="object-cover"
                      fill
                      src={course.img}
                    />
                    <span className="absolute top-3 right-3 bg-[#081933]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      {course.lvl}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-cyan-500 text-black text-[11px] font-bold px-2 py-0.5 rounded shadow">
                      ⏱ {course.hours}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="text-[11px] text-cyan-700 font-bold mb-1">{course.center}</div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">{course.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                      {course.desc}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{course.price}</span>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-cyan-700 font-bold hover:underline"
                  >
                    حجز مقعد مبكر ←
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
