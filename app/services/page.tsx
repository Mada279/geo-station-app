'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Service {
  slug: string;
  title: string;
  cat: string;
  icon: string;
  providersCount: number;
  img: string;
  desc: string;
  deliverables: string[];
}

const SERVICES_DATA: Service[] = [
  {
    slug: 'topographic',
    title: 'رفع مساحي طبوغرافي',
    cat: 'مساحة أرضية',
    icon: '🗺️',
    providersCount: 24,
    img: '/assets/img/totalstation-construction-crane.jpg',
    desc: 'رفع تفصيلي للمناسيب ومعالم الموقع وتضاريس الأرض وإخراج خرائط كنتورية ومقاطع طولية وعرضية دقيقة.',
    deliverables: ['لوحات AutoCAD وCivil 3D', 'خرائط خطوط الكنتور', 'ملف إحداثيات النقاط CSV/TXT', 'تقرير فني مساحي'],
  },
  {
    slug: 'laser-scan',
    title: 'مسح ليزري ثلاثي الأبعاد 3D',
    cat: 'Reality Capture',
    icon: '🔦',
    providersCount: 9,
    img: '/assets/img/trimble-sx-kit.jpg',
    desc: 'توثيق المنشآت القائمة والآثار والمصانع بسحابة نقاط Point Cloud عالية الكثافة والدقة وإنتاج مخططات As-Built ونماذج BIM.',
    deliverables: ['سحابة نقاط E57 / LAS', 'نماذج ثلاثية الأبعاد Revit / BIM', 'مخططات أوتوكاد تفصيلية', 'جولة افتراضية بانورامية'],
  },
  {
    slug: 'drone-survey',
    title: 'مسح بالطائرات بدون طيار Drone',
    cat: 'Aerial Survey',
    icon: '🚁',
    providersCount: 12,
    img: '/assets/img/drone-orthophoto-site.jpg',
    desc: 'تغطية جوية فائقة السرعة للمساحات الشاسعة والمحاجر ومسارات الطرق، وإنتاج أورثوفوتو عالي الدقة ونماذج ارتفاع رقمية DEM.',
    deliverables: ['خريطة أورثوفوتو دقيقة Orthomosaic', 'نموذج ارتفاع رقمي DEM / DTM', 'حساب كميات الحفر والردم', 'فيديو جوي توثيقي للمشروع'],
  },
  {
    slug: 'subdivision',
    title: 'تقسيم وفرز أراضي زراعية وعمرانية',
    cat: 'مساحة قانونية',
    icon: '📋',
    providersCount: 18,
    img: '/assets/img/drone-subdivision-aerial.jpg',
    desc: 'إعداد مخططات التقسيم والفرز والتجنيب، وحساب المساحات الصافية والشوارع، وتجهيز المستندات المساحية المعتمدة للشهر العقاري.',
    deliverables: ['مخطط تقسيم معتمد', 'كشف إحداثيات الأركان والحدود', 'توقيع وتثبيت أوتاد بالـ Total Station', 'ملف التوثيق المساحي'],
  },
  {
    slug: 'calibration-svc',
    title: 'معايرة وصيانة أجهزة المساحة',
    cat: 'خدمات فنية',
    icon: '🛠️',
    providersCount: 7,
    img: '/assets/img/calibration-lab-collimators.jpg',
    desc: 'فحص وضبط دقة أجهزة Total Station وموازين القامة والـ GNSS على أجهزة كوليماتور معيارية وإصدار تقارير معايرة معتمدة.',
    deliverables: ['تقرير فحص أخطاء الزوايا والمسافات', 'شهادة معايرة معتمدة سارية لمدة عام', 'تنظيف وضبط بصري وميكانيكي', 'ضمان صيانة للأجزاء المستبدلة'],
  },
  {
    slug: 'utility-mapping',
    title: 'كشف وتوثيق المرافق التحت أرضية',
    cat: 'جيوفيزياء وهندسة',
    icon: '⚡',
    providersCount: 6,
    img: '/assets/img/totalstation-earthworks.jpg',
    desc: 'تحديد مسارات وتعميق كابلات الكهرباء، خطوط الغاز والمياه، والألياف الضوئية باستخدام رادارات اختراق الأرض GPR وكواشف الكابلات.',
    deliverables: ['خريطة مسارات المرافق GIS / CAD', 'تحديد أعماق الكابلات والمواسير', 'تجنب قطع المرافق أثناء الحفر', 'تقرير خلو مسارات'],
  },
];

export default function ServicesPage() {
  const [selectedCat, setSelectedCat] = useState('الكل');

  const categories = ['الكل', 'مساحة أرضية', 'Reality Capture', 'Aerial Survey', 'مساحة قانونية', 'خدمات فنية', 'جيوفيزياء وهندسة'];

  const filteredServices = selectedCat === 'الكل'
    ? SERVICES_DATA
    : SERVICES_DATA.filter((s) => s.cat === selectedCat);

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="الخدمات المساحية والجيوماتكس"
            className="object-cover"
            fill
            priority
            src="/assets/img/totalstation-construction-crane.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / الخدمات</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">الخدمات المساحية والجيوماتكس</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            اختر الخدمة التي تحتاجها لمشروعك لعرض المكاتب والشركات المؤهلة والمعتمدة لتنفيذها داخل محافظتك.
          </p>
        </div>
      </section>

      {/* 2. Categories Filter */}
      <section className="py-8 bg-white border-b border-slate-200 sticky top-[72px] z-20 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full transition ${
                  selectedCat === cat
                    ? 'bg-[#081933] text-white shadow-sm'
                    : 'bg-[#f4f7fa] text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Services Grid */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((svc) => (
              <div
                key={svc.slug}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100">
                    <Image
                      alt={svc.title}
                      className="object-cover"
                      fill
                      src={svc.img}
                    />
                    <span className="absolute top-3 right-3 bg-[#081933]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded backdrop-blur-sm">
                      {svc.cat}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-cyan-400 text-black text-xs font-extrabold px-2.5 py-1 rounded shadow">
                      {svc.icon} {svc.providersCount} جهة منفذة
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{svc.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{svc.desc}</p>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="block text-[11px] font-bold text-slate-700 mb-2">المخرجات الأساسية:</span>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {svc.deliverables.map((d, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-cyan-600">✓</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/directory?q=${encodeURIComponent(svc.title)}`}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900"
                  >
                    عرض المكاتب المنفذة ←
                  </Link>
                  <Link
                    href="/contact"
                    className="rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-3.5 py-1.5 text-xs font-bold transition"
                  >
                    طلب عرض سعر
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Need Request Helper Section */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
              <Image
                alt="أجهزة وأعمال مساحية دقيقة"
                className="object-cover"
                fill
                src="/assets/img/totalstation-bridge-project.jpg"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">
                مش متأكد من الخدمة المناسبة؟
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                اشرح المشكلة، وإحنا نوصّلك بالجهة الصح
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
                مش لازم تكون عارف المصطلح الهندسي الدقيق للخدمة. اكتب طبيعة العمل والموقع والمخرجات اللي محتاجها، والمنصة توجّه طلبك للمكاتب والشركات المؤهلة في نطاقك.
              </p>
              <ul className="space-y-2 text-sm text-slate-700 mb-6 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>توجيه مجاني بالكامل وبدون التزام مالي.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>عروض أسعار من أكثر من مكتب معتمد للمقارنة والاختيار.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>بياناتك لا تُشارك إلا بموافقتك المباشرة.</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="inline-block rounded-lg bg-[#F4B400] text-black font-bold px-6 py-3 text-sm hover:brightness-105 transition shadow-md"
              >
                أضف احتياجك الهندسي الآن
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
