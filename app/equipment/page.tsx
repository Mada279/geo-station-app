'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface EquipmentItem {
  id: number;
  slug: string;
  title: string;
  cat: string;
  brand: string;
  cond: string;
  modes: string[];
  price: string;
  unit: string;
  gov: string;
  cal: string;
  avail: string;
  img: string;
  year: number;
  desc: string;
  specs: Record<string, string>;
}

const EQUIPMENT_DATA: EquipmentItem[] = [
  {
    id: 1,
    slug: 'leica-ts16',
    title: 'Leica TS16 Total Station الروبوتي',
    cat: 'Total Station',
    brand: 'Leica',
    cond: 'مستعمل — ممتاز',
    modes: ['rent'],
    price: '500',
    unit: 'جنيه / يوم',
    gov: 'الإسكندرية',
    cal: 'سارية حتى 04/2026',
    avail: 'متاح الآن',
    img: '/assets/img/leica-ts16-product.jpg',
    year: 2021,
    desc: 'جهاز Total Station روبوتيك بدقة زاوية 1" وتتبع أوتوماتيكي للعاكس، مناسب لأعمال التوقيع والرفع الدقيق.',
    specs: { 'دقة الزاوية': '1 ثانية', 'المدى بدون عاكس': '1000 م', 'الشاشة': 'لمس ملوّن', 'الحزمة': 'جهاز + حامل + عاكس + شاحن' },
  },
  {
    id: 2,
    slug: 'topcon-gt1200',
    title: 'Topcon GT-1200 روبوتيك فائق السرعة',
    cat: 'Total Station',
    brand: 'Topcon',
    cond: 'جديد بالضمان',
    modes: ['sale'],
    price: 'حسب العرض',
    unit: '',
    gov: 'القاهرة',
    cal: 'شهادة مصنع معتمدة',
    avail: 'متاح بالمخزن',
    img: '/assets/img/topcon-gt1200-product.jpg',
    year: 2025,
    desc: 'جهاز روبوتيك بحجم مدمج وتقنية UltraTrac لتتبع العاكس في البيئات المزدحمة، مثالي لمواقع التنفيذ الإنشائية.',
    specs: { 'دقة الزاوية': '1 ثانية', 'المدى بدون عاكس': '1000 م', 'الوزن': '5.1 كجم', 'الضمان': 'سنتان من الوكيل' },
  },
  {
    id: 3,
    slug: 'gnss-rtk-set',
    title: 'طقم GNSS RTK — Stonex S900',
    cat: 'GNSS / RTK',
    brand: 'Stonex',
    cond: 'مستعمل — جيد جدًا',
    modes: ['rent', 'sale'],
    price: '1,100',
    unit: 'جنيه / يوم',
    gov: 'الجيزة',
    cal: 'سارية حديثة',
    avail: 'متاح للحجز',
    img: '/assets/img/stonex-s900-product.jpg',
    year: 2022,
    desc: 'طقم GNSS كامل (Base + Rover) مع كنترولر ميداني وشرائح تصحيح، يدعم الشبكات المصرية للتصحيح اللحظي بدقة سنتيمترية.',
    specs: { 'القنوات': '800+ قناة', 'الدقة الأفقية': '8 مم + 1ppm', 'الكنترولر': 'مضمّن', 'المدة الدنيا': '3 أيام' },
  },
  {
    id: 4,
    slug: 'faro-focus',
    title: 'FARO Focus 3D ماسح ليزري رقمي',
    cat: 'Laser Scanner',
    brand: 'FARO',
    cond: 'مستعمل — ممتاز',
    modes: ['rent'],
    price: '2,800',
    unit: 'جنيه / يوم',
    gov: 'القاهرة',
    cal: 'سارية حتى 01/2026',
    avail: 'متاح الآن',
    img: '/assets/img/trimble-sx-kit.jpg',
    year: 2020,
    desc: 'ماسح ليزري ثابت لتوثيق المنشآت وأعمال As-Built ونمذجة BIM، يُسلّم مع حامل ثقيل وكرات مرجعية.',
    specs: { 'المدى': 'حتى 150 م', 'السرعة': '976,000 نقطة/ث', 'المخرجات': 'سحابة نقاط E57', 'الملحقات': 'حامل + أهداف مرجعية' },
  },
  {
    id: 5,
    slug: 'dji-m300',
    title: 'DJI Matrice 300 RTK طائرة مسح جوي',
    cat: 'Drone',
    brand: 'DJI',
    cond: 'مستعمل — ممتاز',
    modes: ['rent'],
    price: '3,500',
    unit: 'جنيه / يوم',
    gov: 'القاهرة',
    cal: 'فحص دوري',
    avail: 'متاح بمشغل معتمد',
    img: '/assets/img/drone-orthophoto-site.jpg',
    year: 2022,
    desc: 'طائرة مسح جوي بدقة RTK مع كاميرا مسح P1 عالية الدقة، تُؤجَّر مع طيار ومشغل معتمد للمساحات الكبيرة.',
    specs: { 'زمن الطيران': 'حتى 45 دقيقة', 'الكاميرا': 'Zenmuse P1 45MP', 'التصاريح': 'معتمدة', 'المخرجات': 'أورثوفوتو + DEM' },
  },
  {
    id: 6,
    slug: 'nikon-auto-level',
    title: 'جهاز ميزان أوتوماتيك Nikon AX-2S',
    cat: 'أجهزة ميزان',
    brand: 'Nikon',
    cond: 'جديد',
    modes: ['sale'],
    price: 'حسب العرض',
    unit: '',
    gov: 'الإسكندرية',
    cal: 'شهادة مصنع',
    avail: 'متاح للتسليم',
    img: '/assets/img/auto-level-site.jpg',
    year: 2025,
    desc: 'جهاز ميزان أوتوماتيك خفيف ودقيق لأعمال المناسيب والمطابقات في مواقع التنفيذ، مقاوم للأتربة والماء.',
    specs: { 'التكبير': '24x', 'دقة الكيلومتر': '2.0 مم', 'المقاومة': 'IPX6', 'يشمل': 'شاقول + قامة + حامل' },
  },
  {
    id: 7,
    slug: 'trimble-r12i',
    title: 'Trimble R12i GNSS بنظام IMU المائل',
    cat: 'GNSS / RTK',
    brand: 'Trimble',
    cond: 'مستعمل — كالجديد',
    modes: ['rent', 'sale'],
    price: '1,200',
    unit: 'جنيه / يوم',
    gov: 'الإسكندرية',
    cal: 'سارية حتى 07/2026',
    avail: 'متاح الآن',
    img: '/assets/img/gnss-rtk-case-kit.jpg',
    year: 2023,
    desc: 'جهاز GNSS فائق التطور بتقنية IMU للقياس المائل دون تسوية الفقاعة، يختصر زمن الرفع الميداني إلى النصف.',
    specs: { 'IMU': 'مدمج — قياس مائل', 'الدقة': '8 مم + 1ppm', 'التوافق': 'شبكات RTK', 'يشمل': 'كنترولر + عصا كربون' },
  },
  {
    id: 8,
    slug: 'accessories-kit',
    title: 'حزمة حوامل ثقيلة وعواكس وأكسسوارات',
    cat: 'ملحقات وأكسسوارات',
    brand: 'Spectra',
    cond: 'جديد بالكرتونة',
    modes: ['sale'],
    price: 'حسب الحزمة',
    unit: '',
    gov: 'القاهرة',
    cal: 'لا ينطبق',
    avail: 'متاح فوراً',
    img: '/assets/img/survey-accessories-kit.jpg',
    year: 2025,
    desc: 'حزمة متكاملة من الحوامل الخشبية والألومنيوم الثقيلة والعواكس والشواخص لتجهيز أطقم المساحة.',
    specs: { 'المحتويات': '3 حوامل + 2 عاكس + شواخص', 'الخامة': 'ألومنيوم مقوّى', 'الضمان': 'سنة', 'التوصيل': 'متاح لكافة المحافظات' },
  },
];

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  const filteredEquipment = useMemo(() => {
    return EQUIPMENT_DATA.filter((item) => {
      const matchQuery =
        !searchTerm ||
        item.title.includes(searchTerm) ||
        item.desc.includes(searchTerm) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMode = !selectedMode || item.modes.includes(selectedMode);
      const matchCat = !selectedCat || item.cat === selectedCat;
      const matchGov = !selectedGov || item.gov === selectedGov;
      const matchBrand = !selectedBrand || item.brand === selectedBrand;
      return matchQuery && matchMode && matchCat && matchGov && matchBrand;
    });
  }, [searchTerm, selectedMode, selectedCat, selectedGov, selectedBrand]);

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero Section */}
      <section className="bg-[#081933] text-white py-12 lg:py-16 border-b border-cyan-500/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / سوق الأجهزة</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">سوق الأجهزة والمعدات المساحية</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            عروض بيع وإيجار لأجهزة Total Station، GNSS RTK، الموازين، والماسحات الليزرية من موردين ومكاتب معتمدة في مصر.
          </p>
        </div>
      </section>

      {/* 2. Main Equipment Content */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Filters */}
            <div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">تصفية الأجهزة</h3>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedMode('');
                      setSelectedCat('');
                      setSelectedGov('');
                      setSelectedBrand('');
                    }}
                    className="text-xs text-cyan-700 hover:underline font-semibold"
                  >
                    مسح الفلاتر
                  </button>
                </div>

                {/* Text Search */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">بحث</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Leica, Trimble, RTK..."
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3.5 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Offer Mode (Rent / Sale) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العرض</label>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">بيع وإيجار</option>
                    <option value="rent">إيجار فقط</option>
                    <option value="sale">بيع فقط</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">فئة الجهاز</label>
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">كل الفئات</option>
                    <option value="Total Station">Total Station</option>
                    <option value="GNSS / RTK">GNSS / RTK</option>
                    <option value="Laser Scanner">Laser Scanner</option>
                    <option value="Drone">Drone مساحي</option>
                    <option value="أجهزة ميزان">أجهزة ميزان</option>
                    <option value="ملحقات وأكسسوارات">ملحقات وأكسسوارات</option>
                  </select>
                </div>

                {/* Governorate */}
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
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الماركة المصنعة</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Leica', 'Topcon', 'Trimble', 'Stonex', 'FARO', 'DJI', 'Nikon'].map((b) => (
                      <button
                        key={b}
                        onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition ${
                          selectedBrand === b
                            ? 'bg-cyan-700 text-white border-cyan-700 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Equipment Grid */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  معروض <span className="text-cyan-700">{filteredEquipment.length}</span> جهاز ومعدة
                </span>
                <span className="text-slate-500">محدّث بانتظام وفق أحدث عروض الموردين</span>
              </div>

              {filteredEquipment.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <span className="text-4xl block mb-2">📡</span>
                  <p className="font-bold text-base text-slate-800">لا توجد أجهزة مطابقة للبحث</p>
                  <p className="text-xs mt-1">جرّب اختيار ماركة أو فئة أخرى.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image banner */}
                        <div className="relative h-48 w-full bg-slate-100">
                          <Image
                            alt={item.title}
                            className="object-cover"
                            fill
                            src={item.img}
                          />
                          <div className="absolute top-3 right-3 flex gap-1.5">
                            {item.modes.map((m, i) => (
                              <span
                                key={i}
                                className={`text-[10px] font-black px-2 py-0.5 rounded shadow ${
                                  m === 'rent'
                                    ? 'bg-cyan-500 text-black'
                                    : 'bg-amber-400 text-black'
                                }`}
                              >
                                {m === 'rent' ? 'إيجار' : 'بيع'}
                              </span>
                            ))}
                          </div>
                          <span className="absolute bottom-3 right-3 bg-[#081933]/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
                            📍 {item.gov}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-cyan-700">{item.brand}</span>
                            <span className="text-slate-500 text-[11px]">موديل {item.year} — {item.cond}</span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                            {item.desc}
                          </p>

                          {/* Quick specs */}
                          <div className="bg-[#f4f7fa] p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-[11px] mb-2">
                            {Object.entries(item.specs).slice(0, 4).map(([k, v], i) => (
                              <div key={i} className="truncate">
                                <span className="text-slate-500">{k}: </span>
                                <span className="font-semibold text-slate-800">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-[10.5px] text-emerald-700 font-semibold mt-1">
                            ✔ المعايرة: {item.cal}
                          </div>
                        </div>
                      </div>

                      {/* Footer CTA & Price */}
                      <div className="px-5 py-3.5 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-base font-black text-slate-900">
                            {item.price} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">{item.avail}</div>
                        </div>

                        <Link
                          href="/contact"
                          className="rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-4 py-2 font-bold text-xs transition"
                        >
                          تواصل مع المورد
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
