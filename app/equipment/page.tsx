'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '@/components/ContactButton';
import { supabase } from '@/utils/supabaseClient';
import { getEquipmentImageUrl, getDefaultCategoryImage } from '@/utils/helpers';

interface EquipmentItem {
  id: string | number;
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
  year: number | string;
  desc: string;
  specs: Record<string, string>;
  providerName?: string;
  providerPhone?: string;
  providerId?: string;
}

export default function EquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // Fetch dynamic equipment records from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadSupabaseEquipment() {
      setIsLoading(true);
      try {
        // Fetch equipment
        const { data: eqData, error: eqError } = await supabase
          .from('equipment')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch providers for office metadata lookup
        const { data: provData } = await supabase
          .from('providers')
          .select('id, name, location, phone');

        const provMap = new Map<string, any>();
        if (provData) {
          provData.forEach((p) => {
            provMap.set(String(p.id), p);
          });
        }

        if (eqError) {
          console.warn('[EquipmentPage] Supabase error:', eqError.message);
        }

        if (isMounted && eqData && eqData.length > 0) {
          const mapped: EquipmentItem[] = eqData.map((row: any, idx: number) => {
            const provider = row.provider_id ? provMap.get(String(row.provider_id)) : null;
            const provName = provider?.name || 'مكتب مساحي معتمد';
            const provPhone = provider?.phone || '01033134413';
            const provGov = row.governorate || provider?.location?.split('—')[0]?.trim() || 'القاهرة';

            // Determine brand
            let brand = row.brand || '';
            if (!brand) {
              const t = (row.title || '').toLowerCase();
              if (t.includes('leica')) brand = 'Leica';
              else if (t.includes('topcon')) brand = 'Topcon';
              else if (t.includes('trimble')) brand = 'Trimble';
              else if (t.includes('stonex')) brand = 'Stonex';
              else if (t.includes('sokkia')) brand = 'Sokkia';
              else if (t.includes('nikon')) brand = 'Nikon';
              else if (t.includes('faro')) brand = 'FARO';
              else if (t.includes('dji')) brand = 'DJI';
              else brand = 'أخرى';
            }

            // Determine modes
            const modes: string[] = [];
            if (row.daily_price || row.monthly_price) modes.push('rent');
            if (row.sale_price) modes.push('sale');
            if (modes.length === 0) modes.push('rent');

            // Price formatting
            let displayPrice = 'حسب العرض';
            let unit = '';
            if (row.daily_price) {
              displayPrice = Number(row.daily_price).toLocaleString('en-US');
              unit = 'جنيه / يوم';
            } else if (row.sale_price) {
              displayPrice = `${Number(row.sale_price).toLocaleString('en-US')} ج.م`;
              unit = '(للبيع)';
            } else if (row.monthly_price) {
              displayPrice = Number(row.monthly_price).toLocaleString('en-US');
              unit = 'جنيه / شهر';
            }

            return {
              id: row.id || idx + 1,
              slug: `eq-${row.id || idx + 1}`,
              title: row.title || 'جهاز مساحي متطور',
              cat: row.category || 'Total Station',
              brand: brand,
              cond: row.condition || 'جديد / بحالة ممتازة',
              modes: modes,
              price: displayPrice,
              unit: unit,
              gov: provGov,
              cal: row.calibration_date ? `سارية حتى ${row.calibration_date}` : 'شهادة معايرة معتمدة',
              avail: row.status || 'متاح الآن',
              img: getEquipmentImageUrl(row.image_url, row.category, row.title),
              year: row.year || 2024,
              desc: row.description || `جهاز مساحي عالي الدقة لفحص ومتابعة الأعمال الإنشائية والمساحية، معتمد وموثق في شبكة Survsta لدى ${provName}.`,
              specs: row.specs || {
                'الفئة': row.category || 'أجهزة مساحية',
                'المكتب': provName,
                'الحالة': row.condition || 'ممتاز',
                'الضمان': 'فحص وتشغيل',
              },
              providerName: provName,
              providerPhone: provPhone,
              providerId: row.provider_id ? String(row.provider_id) : undefined,
            };
          });

          setEquipmentList(mapped);
        } else if (isMounted) {
          setEquipmentList([]);
        }
      } catch (err) {
        console.warn('[EquipmentPage] Error fetching data:', err);
        if (isMounted) setEquipmentList([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSupabaseEquipment();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((item) => {
      const matchQuery =
        !searchTerm ||
        item.title.includes(searchTerm) ||
        item.desc.includes(searchTerm) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMode = !selectedMode || item.modes.includes(selectedMode);
      const matchCat = !selectedCat || item.cat === selectedCat || (selectedCat === 'Total Station' && item.cat.includes('توتال'));
      const matchGov = !selectedGov || item.gov.includes(selectedGov);
      const matchBrand = !selectedBrand || item.brand === selectedBrand;
      return matchQuery && matchMode && matchCat && matchGov && matchBrand;
    });
  }, [equipmentList, searchTerm, selectedMode, selectedCat, selectedGov, selectedBrand]);

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
                  {isLoading ? (
                    'جاري استرجاع الأجهزة من السحابة...'
                  ) : (
                    <>معروض <span className="text-cyan-700">{filteredEquipment.length}</span> جهاز ومعدة</>
                  )}
                </span>
                <span className="text-slate-500">محدّث بانتظام وفق أحدث عروض الموردين في قاعدة البيانات</span>
              </div>

              {/* Loading Skeletons */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse flex flex-col justify-between">
                      <div>
                        <div className="h-48 bg-slate-200 w-full"></div>
                        <div className="p-5 space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-5 bg-slate-300 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                          <div className="h-16 bg-slate-100 rounded-lg"></div>
                        </div>
                      </div>
                      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="h-6 bg-slate-200 rounded w-24"></div>
                        <div className="h-8 bg-slate-300 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredEquipment.length === 0 && (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
                  <span className="text-4xl block mb-2">📡</span>
                  <p className="font-bold text-base text-slate-800">لا توجد أجهزة مطابقة للبحث حالياً</p>
                  <p className="text-xs text-slate-500">
                    لم يتم العثور على أجهزة مطابقة للفلاتر الحالية. جرّب مسح الفلاتر أو تصفح كافة الفئات.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/join"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 px-5 py-2 text-xs font-bold transition shadow-sm"
                    >
                      <span>+</span>
                      <span>سجل كمزوّد واعرض أول جهاز مساحي</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Live Cards */}
              {!isLoading && filteredEquipment.length > 0 && (
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
                            unoptimized
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = getDefaultCategoryImage(item.cat, item.title);
                            }}
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

                          <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                          
                          {item.providerName && (
                            <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1 font-medium">
                              <span>🏢 المزوّد:</span>
                              <span className="text-slate-700 font-semibold">{item.providerName}</span>
                            </div>
                          )}

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

                        <ContactButton
                          providerId={`equipment-${item.id}`}
                          equipmentTitle={item.title}
                          phoneNumber={item.providerPhone || '01033134413'}
                          className="rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-3.5 py-2 font-bold text-xs transition shadow-sm"
                        />
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
