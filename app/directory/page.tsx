'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Provider {
  id: number;
  slug: string;
  name: string;
  type: string;
  cat: string;
  gov: string;
  city: string;
  rate: number;
  reviews: number;
  since: number;
  staff: string;
  resp: string;
  ver: string[];
  featured: boolean;
  img: string;
  svc: string[];
  about: string;
}

const PROVIDERS_DATA: Provider[] = [
  {
    id: 1,
    slug: 'elite-survey',
    name: 'مكتب النخبة للمساحة والجيوماتكس',
    type: 'مكتب مساحة معتمد',
    cat: 'offices',
    gov: 'الإسكندرية',
    city: 'سموحة',
    rate: 4.8,
    reviews: 64,
    since: 2012,
    staff: '12 مهندس وفني',
    resp: 'خلال ساعة',
    ver: ['ملف موثّق', 'نشاط موثّق'],
    featured: true,
    img: '/assets/img/hero-engineering-office.jpg',
    svc: ['رفع مساحي طبوغرافي', 'تقسيم وفرز أراضي', 'حصر كميات وحفريات', 'إعداد خرائط GIS'],
    about: 'مكتب متخصص في أعمال المساحة الأرضية والتقسيم وأعمال GIS، يخدم الإسكندرية والمحافظات المجاورة بفريق ميداني وأجهزة Leica وTopcon الحديثة.',
  },
  {
    id: 2,
    slug: 'delta-geomatics',
    name: 'دلتا جيوماتكس للحلول المتكاملة',
    type: 'شركة مساحة وهندسة',
    cat: 'companies',
    gov: 'القاهرة',
    city: 'مدينة نصر',
    rate: 4.6,
    reviews: 118,
    since: 2008,
    staff: '38 موظف',
    resp: 'خلال 3 ساعات',
    ver: ['ملف موثّق', 'نشاط موثّق', 'معدات موثّقة'],
    featured: true,
    img: '/assets/img/office-survey-team.jpg',
    svc: ['مسح ليزري ثلاثي الأبعاد', 'As-Built Documentation', 'مسح بالطائرات بدون طيار Drone', 'نمذجة BIM'],
    about: 'شركة جيوماتكس متكاملة تعمل في كبرى مشروعات البنية التحتية والمنشآت الصناعية، بقدرات Reality Capture ومسح جوي معتمد.',
  },
  {
    id: 3,
    slug: 'nile-instruments',
    name: 'النيل لأجهزة ومعدات المساحة',
    type: 'مورد وموزع معتمد',
    cat: 'suppliers',
    gov: 'القاهرة',
    city: 'وسط البلد',
    rate: 4.4,
    reviews: 87,
    since: 2015,
    staff: '9 موظفين',
    resp: 'خلال يوم',
    ver: ['ملف موثّق'],
    featured: false,
    img: '/assets/img/survey-instruments-studio.jpg',
    svc: ['بيع أجهزة جديدة', 'تأجير أجهزة مساحة', 'قطع غيار وملحقات أصلية', 'دعم فني وضمان'],
    about: 'مورد معتمد لأجهزة Total Station وGNSS والملحقات، مع خدمات تأجير مرنة ودعم فني لشركات المقاولات داخل القاهرة والجيزة.',
  },
  {
    id: 4,
    slug: 'precision-cal',
    name: 'مركز الدقة لمعايرة وصيانة الأجهزة',
    type: 'مركز معايرة معتمد',
    cat: 'calibration',
    gov: 'الجيزة',
    city: 'الهرم',
    rate: 4.9,
    reviews: 39,
    since: 2017,
    staff: '6 فنيين متخصصين',
    resp: 'خلال ساعتين',
    ver: ['ملف موثّق', 'نشاط موثّق'],
    featured: false,
    img: '/assets/img/calibration-lab-collimators.jpg',
    svc: ['معايرة Total Station', 'معايرة أجهزة الميزان الرقمي', 'صيانة وإصلاح بوردات', 'إصدار شهادات معايرة سنوية'],
    about: 'مركز فني متخصص في معايرة وصيانة أجهزة المساحة بدقة ميكرونية، وفق معايير الجودة الدولية مع إصدار تقرير فني معتمد لكل جهاز.',
  },
  {
    id: 5,
    slug: 'geo-academy-eg',
    name: 'جيو أكاديمي للتدريب الهندسي',
    type: 'مركز تدريب وتأهيل',
    cat: 'training',
    gov: 'الإسكندرية',
    city: 'العصافرة',
    rate: 4.7,
    reviews: 52,
    since: 2019,
    staff: '7 مدربين معتمدين',
    resp: 'خلال ساعتين',
    ver: ['ملف موثّق'],
    featured: false,
    img: '/assets/img/calibration-training-lab.jpg',
    svc: ['دبلومة Civil 3D', 'AutoCAD للمساحين', 'GNSS RTK الميداني', 'QGIS وأساسيات التحليل المكاني'],
    about: 'مركز تدريب تطبيقي يقدم برامج ميدانية ومعملية للمهندسين والمساحين وحديثي التخرج، بتدريب عملي على أجهزة حقيقية في الموقع.',
  },
  {
    id: 6,
    slug: 'alex-survey-office',
    name: 'مكتب الإسكندرية للاستشارات المساحية',
    type: 'مكتب مساحة معتمد',
    cat: 'offices',
    gov: 'الإسكندرية',
    city: 'سيدي جابر',
    rate: 4.5,
    reviews: 41,
    since: 2016,
    staff: '8 مهندسين',
    resp: 'خلال ساعة',
    ver: ['ملف موثّق', 'نشاط موثّق'],
    featured: false,
    img: '/assets/img/office-cad-workstation.jpg',
    svc: ['توقيع محاور المنشآت', 'رفع شبكات الصرف والمياه', 'رفع شواطئ وبحيرات', 'تثبيت نقاط روبير'],
    about: 'خدمات مساحية بحرية وبرية متكاملة للقطاعين العام والخاص في الساحل الشمالي والإسكندرية والبحيرة.',
  },
];

export default function DirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  const filteredProviders = useMemo(() => {
    return PROVIDERS_DATA.filter((p) => {
      const matchQuery =
        !searchTerm ||
        p.name.includes(searchTerm) ||
        p.about.includes(searchTerm) ||
        p.svc.some((s) => s.includes(searchTerm));
      const matchCat = !selectedCat || p.cat === selectedCat;
      const matchGov = !selectedGov || p.gov === selectedGov;
      const matchVer = !onlyVerified || p.ver.length >= 2;
      return matchQuery && matchCat && matchGov && matchVer;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rate - a.rate;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });
  }, [searchTerm, selectedCat, selectedGov, onlyVerified, sortBy]);

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero / Header Banner */}
      <section className="bg-[#081933] text-white py-12 lg:py-16 border-b border-cyan-500/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / الدليل</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">دليل مكاتب وشركات المساحة في مصر</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            ابحث وقارن بين مكاتب المساحة المعتمدة، شركات الجيوماتكس، موردي الأجهزة، ومراكز المعايرة والتدريب الموثقة.
          </p>
        </div>
      </section>

      {/* 2. Main Directory Content & Filters */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Filters (1 Col) */}
            <div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">تصفية النتائج</h3>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCat('');
                      setSelectedGov('');
                      setOnlyVerified(false);
                      setSortBy('relevance');
                    }}
                    className="text-xs text-cyan-700 hover:underline font-semibold"
                  >
                    إعادة ضبط
                  </button>
                </div>

                {/* Search Text Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">بحث بالاسم أو الخدمة</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="مثال: رفع مساحي، سموحة..."
                      className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3.5 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Provider Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الجهة</label>
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">جميع الأنواع</option>
                    <option value="offices">مكاتب مساحة</option>
                    <option value="companies">شركات مساحة وهندسة</option>
                    <option value="suppliers">موردو أجهزة ومعدات</option>
                    <option value="calibration">مراكز معايرة وصيانة</option>
                    <option value="training">مراكز تدريب وأكاديميات</option>
                  </select>
                </div>

                {/* Governorate Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المحافظة</label>
                  <select
                    value={selectedGov}
                    onChange={(e) => setSelectedGov(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">كل المحافظات</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="البحيرة">البحيرة</option>
                    <option value="مطروح">مطروح</option>
                    <option value="الدقهلية">الدقهلية</option>
                  </select>
                </div>

                {/* Verification Checkbox */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={onlyVerified}
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>جهات بتوثيق متقدّم فقط ✔</span>
                  </label>
                </div>

              </div>
            </div>

            {/* Results Grid (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <span className="font-bold text-slate-700">
                  تم العثور على <span className="text-cyan-700">{filteredProviders.length}</span> جهة مساحية
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-slate-500">ترتيب حسب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="relevance">الأكثر صلة</option>
                    <option value="rating">الأعلى تقييماً</option>
                    <option value="reviews">الأكثر تقييمات</option>
                    <option value="featured">المميز أولاً</option>
                  </select>
                </div>
              </div>

              {/* Cards List */}
              {filteredProviders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <span className="text-4xl block mb-2">🔍</span>
                  <p className="font-bold text-base text-slate-800">لا توجد جهات مطابقة لهذه الفلاتر</p>
                  <p className="text-xs mt-1">جرّب تقليل شروط البحث أو اختيار محافظة أخرى.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProviders.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image banner */}
                        <div className="relative h-44 w-full bg-slate-100">
                          <Image
                            alt={p.name}
                            className="object-cover"
                            fill
                            src={p.img}
                          />
                          {p.featured && (
                            <span className="absolute top-3 right-3 bg-amber-400 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow">
                              ⭐ مميّز
                            </span>
                          )}
                          <span className="absolute bottom-3 right-3 bg-[#081933]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm">
                            📍 {p.gov} — {p.city}
                          </span>
                        </div>

                        {/* Card details */}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                              {p.type}
                            </span>
                            {p.ver.map((v, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded"
                              >
                                ✔ {v}
                              </span>
                            ))}
                          </div>

                          <h3 className="font-bold text-slate-900 text-lg mb-2">{p.name}</h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                            {p.about}
                          </p>

                          {/* Services chips */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {p.svc.slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="text-[10.5px] bg-[#f4f7fa] text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"
                              >
                                {s}
                              </span>
                            ))}
                            {p.svc.length > 3 && (
                              <span className="text-[10.5px] text-slate-400 py-0.5">
                                +{p.svc.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="px-5 py-3.5 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500 font-bold">★ {p.rate}</span>
                          <span className="text-slate-400">({p.reviews} تقييم)</span>
                        </div>

                        <Link
                          href="/contact"
                          className="rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-4 py-1.5 font-bold text-xs transition"
                        >
                          طلب تواصل
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
