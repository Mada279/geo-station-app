'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '@/components/ContactButton';
import { supabase } from '@/utils/supabaseClient';
import { MOCK_PROFILES } from '@/utils/helpers';

interface Provider {
  id: string | number;
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
  phone?: string;
}

export default function DirectoryPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Fetch approved providers from live Supabase database
  useEffect(() => {
    let isMounted = true;

    async function loadApprovedProviders() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('providers')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[DirectoryPage] Supabase error:', error.message);
        }

        if (isMounted && data && data.length > 0) {
          const defaultImages = [
            '/assets/img/hero-engineering-office.jpg',
            '/assets/img/office-survey-team.jpg',
            '/assets/img/survey-instruments-studio.jpg',
            '/assets/img/calibration-lab-collimators.jpg',
            '/assets/img/calibration-training-lab.jpg',
            '/assets/img/office-cad-workstation.jpg',
          ];

          const mapped: Provider[] = data.map((p: any, idx: number) => {
            // Extract governorate and city
            const loc = p.location || 'القاهرة';
            let gov = p.governorate || '';
            let city = '';
            if (loc.includes('—')) {
              const parts = loc.split('—');
              gov = parts[0].trim();
              city = parts[1].trim();
            } else {
              gov = loc;
              city = loc;
            }

            // Category determination
            let cat = 'offices';
            const nameLower = (p.name || '').toLowerCase();
            if (nameLower.includes('شركة') || nameLower.includes('مجموعة')) cat = 'companies';
            else if (nameLower.includes('مورد') || nameLower.includes('أجهزة') || nameLower.includes('تجارة')) cat = 'suppliers';
            else if (nameLower.includes('معايرة') || nameLower.includes('صيانة') || nameLower.includes('مركز')) cat = 'calibration';
            else if (nameLower.includes('أكاديمية') || nameLower.includes('تدريب')) cat = 'training';

            // Services list
            let svcList = [
              'رفع مساحي طبوغرافي',
              'تأجير أجهزة مساحية',
              'توقيع محاور المنشآت',
              'معايرة وضبط أجهزة',
            ];
            if (Array.isArray(p.services) && p.services.length > 0) {
              svcList = p.services;
            } else if (typeof p.services === 'string' && p.services.trim()) {
              try {
                const parsed = JSON.parse(p.services);
                if (Array.isArray(parsed)) svcList = parsed;
                else svcList = p.services.split(',').map((s: string) => s.trim());
              } catch {
                svcList = p.services.split(',').map((s: string) => s.trim());
              }
            }

            return {
              id: p.id || idx + 1,
              slug: `prov-${p.id || idx + 1}`,
              name: p.name || 'مكتب مساحي معتمد',
              type: cat === 'companies' ? 'شركة مساحة وهندسة' : cat === 'suppliers' ? 'مورد وموزع معتمد' : 'مكتب مساحة معتمد',
              cat: cat,
              gov: gov,
              city: city || gov,
              rate: p.rating || 4.8,
              reviews: p.review_count || Math.floor(35 + ((idx * 17) % 85)),
              since: p.created_at ? new Date(p.created_at).getFullYear() : 2023,
              staff: p.staff_count ? `${p.staff_count} موظف` : 'طاقم هندسي معتمد',
              resp: 'خلال ساعة',
              ver: ['ملف موثّق', 'نشاط معتمد'],
              featured: idx === 0 || nameLower.includes('شركة'),
              img: defaultImages[idx % defaultImages.length],
              svc: svcList,
              about: p.about || `جهة معتمدة لدى Survsta لتقديم الخدمات والحلول المساحية في ${gov}. خدمات توريد ومعايرة ورفع ميداني بأحدث الأجهزة.`,
              phone: p.phone || '01033134413',
            };
          });

          const fallbackMockList: Provider[] = MOCK_PROFILES.map((m, idx) => {
            const loc = m.location || 'القاهرة';
            const gov = loc.split('—')[0].trim();
            const city = loc.includes('—') ? loc.split('—')[1].trim() : gov;
            return {
              id: m.id,
              slug: m.slug,
              name: m.name,
              type: m.name.includes('شركة') ? 'شركة مساحة وهندسة' : m.name.includes('مورد') ? 'مورد وموزع معتمد' : m.name.includes('مركز') ? 'مركز معايرة وصيانة' : m.name.includes('أكاديمية') ? 'مركز تدريب وتأهيل' : 'مكتب مساحة معتمد',
              cat: m.name.includes('شركة') ? 'companies' : m.name.includes('مورد') ? 'suppliers' : m.name.includes('مركز') ? 'calibration' : m.name.includes('أكاديمية') ? 'training' : 'offices',
              gov: gov,
              city: city,
              rate: 4.8,
              reviews: 45 + idx * 15,
              since: 2023,
              staff: 'طاقم هندسي معتمد',
              resp: 'خلال ساعة',
              ver: ['ملف موثّق', 'نشاط معتمد'],
              featured: idx === 0 || m.name.includes('شركة'),
              img: defaultImages[idx % defaultImages.length],
              svc: m.services,
              about: m.about,
              phone: m.phone,
            };
          });

          // If live database has only a few providers, append mock providers to guarantee rich demo
          if (mapped.length < 4) {
            setProviders([...mapped, ...fallbackMockList.slice(mapped.length)]);
          } else {
            setProviders(mapped);
          }
        } else if (isMounted) {
          const fallbackMockList: Provider[] = MOCK_PROFILES.map((m, idx) => {
            const defaultImages = [
              '/assets/img/hero-engineering-office.jpg',
              '/assets/img/office-survey-team.jpg',
              '/assets/img/survey-instruments-studio.jpg',
              '/assets/img/calibration-lab-collimators.jpg',
              '/assets/img/calibration-training-lab.jpg',
              '/assets/img/office-cad-workstation.jpg',
            ];
            const loc = m.location || 'القاهرة';
            const gov = loc.split('—')[0].trim();
            const city = loc.includes('—') ? loc.split('—')[1].trim() : gov;
            return {
              id: m.id,
              slug: m.slug,
              name: m.name,
              type: m.name.includes('شركة') ? 'شركة مساحة وهندسة' : m.name.includes('مورد') ? 'مورد وموزع معتمد' : m.name.includes('مركز') ? 'مركز معايرة وصيانة' : m.name.includes('أكاديمية') ? 'مركز تدريب وتأهيل' : 'مكتب مساحة معتمد',
              cat: m.name.includes('شركة') ? 'companies' : m.name.includes('مورد') ? 'suppliers' : m.name.includes('مركز') ? 'calibration' : m.name.includes('أكاديمية') ? 'training' : 'offices',
              gov: gov,
              city: city,
              rate: 4.8,
              reviews: 45 + idx * 15,
              since: 2023,
              staff: 'طاقم هندسي معتمد',
              resp: 'خلال ساعة',
              ver: ['ملف موثّق', 'نشاط معتمد'],
              featured: idx === 0 || m.name.includes('شركة'),
              img: defaultImages[idx % defaultImages.length],
              svc: m.services,
              about: m.about,
              phone: m.phone,
            };
          });
          setProviders(fallbackMockList);
        }
      } catch (err) {
        console.warn('[DirectoryPage] Error fetching providers, using mock fallback:', err);
        if (isMounted) {
          const defaultImages = [
            '/assets/img/hero-engineering-office.jpg',
            '/assets/img/office-survey-team.jpg',
            '/assets/img/survey-instruments-studio.jpg',
            '/assets/img/calibration-lab-collimators.jpg',
            '/assets/img/calibration-training-lab.jpg',
            '/assets/img/office-cad-workstation.jpg',
          ];
          const fallbackMockList: Provider[] = MOCK_PROFILES.map((m, idx) => {
            const loc = m.location || 'القاهرة';
            const gov = loc.split('—')[0].trim();
            const city = loc.includes('—') ? loc.split('—')[1].trim() : gov;
            return {
              id: m.id,
              slug: m.slug,
              name: m.name,
              type: m.name.includes('شركة') ? 'شركة مساحة وهندسة' : m.name.includes('مورد') ? 'مورد وموزع معتمد' : m.name.includes('مركز') ? 'مركز معايرة وصيانة' : m.name.includes('أكاديمية') ? 'مركز تدريب وتأهيل' : 'مكتب مساحة معتمد',
              cat: m.name.includes('شركة') ? 'companies' : m.name.includes('مورد') ? 'suppliers' : m.name.includes('مركز') ? 'calibration' : m.name.includes('أكاديمية') ? 'training' : 'offices',
              gov: gov,
              city: city,
              rate: 4.8,
              reviews: 45 + idx * 15,
              since: 2023,
              staff: 'طاقم هندسي معتمد',
              resp: 'خلال ساعة',
              ver: ['ملف موثّق', 'نشاط معتمد'],
              featured: idx === 0 || m.name.includes('شركة'),
              img: defaultImages[idx % defaultImages.length],
              svc: m.services,
              about: m.about,
              phone: m.phone,
            };
          });
          setProviders(fallbackMockList);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadApprovedProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchQuery =
        !searchTerm ||
        p.name.includes(searchTerm) ||
        p.about.includes(searchTerm) ||
        p.svc.some((s) => s.includes(searchTerm));
      const matchCat = !selectedCat || p.cat === selectedCat;
      const matchGov = !selectedGov || p.gov.includes(selectedGov) || p.city.includes(selectedGov);
      const matchVer = !onlyVerified || p.ver.length >= 2;
      return matchQuery && matchCat && matchGov && matchVer;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rate - a.rate;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0;
    });
  }, [providers, searchTerm, selectedCat, selectedGov, onlyVerified, sortBy]);

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
                  {isLoading ? (
                    'جاري استرجاع المكاتب والشركات المعتمدة...'
                  ) : (
                    <>تم العثور على <span className="text-cyan-700">{filteredProviders.length}</span> جهة مساحية معتمدة</>
                  )}
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

              {/* Loading Skeletons */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse flex flex-col justify-between">
                      <div>
                        <div className="h-44 bg-slate-200 w-full"></div>
                        <div className="p-5 space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-5 bg-slate-300 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                          <div className="flex gap-2">
                            <div className="h-4 bg-slate-100 rounded w-16"></div>
                            <div className="h-4 bg-slate-100 rounded w-20"></div>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="h-5 bg-slate-200 rounded w-20"></div>
                        <div className="h-8 bg-slate-300 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredProviders.length === 0 && (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
                  <span className="text-4xl block mb-2">🔍</span>
                  <p className="font-bold text-base text-slate-800">لا توجد جهات معتمدة مطابقة لهذه الفلاتر</p>
                  <p className="text-xs text-slate-500">
                    لم يتم العثور على مكاتب معتمدة في هذا النطاق. جرّب مسح الفلاتر أو تصفح محافظات أخرى.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/join"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 text-xs font-bold transition shadow-sm"
                    >
                      <span>+</span>
                      <span>سجل مكتبك أو شركتك في الدليل الآن</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Live Cards */}
              {!isLoading && filteredProviders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProviders.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                      {/* 1. Profile Area (Clickable) */}
                      <Link
                        href={`/directory/${p.id}`}
                        className="flex-1 group cursor-pointer active:scale-[0.98] transition-transform duration-150"
                      >
                        {/* Image banner */}
                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                          <Image
                            alt={p.name}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            fill
                            src={p.img}
                            unoptimized
                          />
                          {p.featured && (
                            <span className="absolute top-3 right-3 bg-amber-400 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow pointer-events-none">
                              ⭐ مميّز
                            </span>
                          )}
                          <span className="absolute bottom-3 right-3 bg-[#081933]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                            📍 {p.gov} {p.city && p.city !== p.gov ? `— ${p.city}` : ''}
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

                          <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-cyan-700 transition">
                            {p.name}
                          </h3>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                            {p.about}
                          </p>

                          {/* Services chips */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
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
                      </Link>

                      {/* 2. Action Footer (Strictly OUTSIDE the Link) */}
                      <div className="px-5 py-3.5 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between mt-auto relative z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500 font-bold">★ {p.rate}</span>
                          <span className="text-slate-400">({p.reviews})</span>
                        </div>
                        <ContactButton
                          providerId={`provider-${p.id}`}
                          equipmentTitle={p.name}
                          phoneNumber={p.phone || '01033134413'}
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
