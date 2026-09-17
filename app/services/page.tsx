'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from '@/components/ContactButton';
import { supabase } from '@/utils/supabaseClient';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  deliverables?: string[];
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  providerCity?: string;
  icon?: string;
  img?: string;
}

const CATEGORY_META: Record<string, { icon: string; img: string; deliverables: string[] }> = {
  'مساحة أرضية': {
    icon: '🗺️',
    img: '/assets/img/totalstation-construction-crane.jpg',
    deliverables: ['لوحات AutoCAD وCivil 3D', 'خرائط خطوط الكنتور', 'ملف إحداثيات النقاط CSV/TXT', 'تقرير فني مساحي'],
  },
  'Reality Capture': {
    icon: '🔦',
    img: '/assets/img/trimble-sx-kit.jpg',
    deliverables: ['سحابة نقاط E57 / LAS', 'نماذج ثلاثية الأبعاد Revit / BIM', 'مخططات أوتوكاد تفصيلية', 'جولة افتراضية بانورامية'],
  },
  'Aerial Survey': {
    icon: '🚁',
    img: '/assets/img/drone-orthophoto-site.jpg',
    deliverables: ['خريطة أورثوفوتو دقيقة Orthomosaic', 'نموذج ارتفاع رقمي DEM / DTM', 'حساب كميات الحفر والردم', 'فيديو جوي توثيقي للمشروع'],
  },
  'مساحة قانونية': {
    icon: '📋',
    img: '/assets/img/drone-subdivision-aerial.jpg',
    deliverables: ['مخطط تقسيم معتمد', 'كشف إحداثيات الأركان والحدود', 'توقيع وتثبيت أوتاد بالـ Total Station', 'ملف التوثيق المساحي'],
  },
  'خدمات فنية': {
    icon: '🛠️',
    img: '/assets/img/calibration-lab-collimators.jpg',
    deliverables: ['تقرير فحص أخطاء الزوايا والمسافات', 'شهادة معايرة معتمدة سارية لمدة عام', 'تنظيف وضبط بصري وميكانيكي', 'ضمان صيانة للأجزاء المستبدلة'],
  },
  'جيوفيزياء وهندسة': {
    icon: '⚡',
    img: '/assets/img/totalstation-earthworks.jpg',
    deliverables: ['خريطة مسارات المرافق GIS / CAD', 'تحديد أعماق الكابلات والمواسير', 'تجنب قطع المرافق أثناء الحفر', 'تقرير خلو مسارات'],
  },
};

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'seed-1',
    title: 'رفع مساحي طبوغرافي',
    category: 'مساحة أرضية',
    description: 'رفع تفصيلي للمناسيب ومعالم الموقع وتضاريس الأرض وإخراج خرائط كنتورية ومقاطع طولية وعرضية دقيقة.',
    deliverables: ['لوحات AutoCAD وCivil 3D', 'خرائط خطوط الكنتور', 'ملف إحداثيات النقاط CSV/TXT', 'تقرير فني مساحي'],
    providerName: 'المجموعة الهندسية للمساحة المتكاملة',
    providerCity: 'القاهرة والجيزة',
    providerPhone: '01033134413',
    icon: '🗺️',
    img: '/assets/img/totalstation-construction-crane.jpg',
  },
  {
    id: 'seed-2',
    title: 'مسح ليزري ثلاثي الأبعاد 3D',
    category: 'Reality Capture',
    description: 'توثيق المنشآت القائمة والآثار والمصانع بسحابة نقاط Point Cloud عالية الكثافة والدقة وإنتاج مخططات As-Built ونماذج BIM.',
    deliverables: ['سحابة نقاط E57 / LAS', 'نماذج ثلاثية الأبعاد Revit / BIM', 'مخططات أوتوكاد تفصيلية', 'جولة افتراضية بانورامية'],
    providerName: 'سرفاي تك للاستشارات ونظم المعلومات',
    providerCity: 'القاهرة والإسكندرية',
    providerPhone: '01033134413',
    icon: '🔦',
    img: '/assets/img/trimble-sx-kit.jpg',
  },
  {
    id: 'seed-3',
    title: 'مسح بالطائرات بدون طيار Drone',
    category: 'Aerial Survey',
    description: 'تغطية جوية فائقة السرعة للمساحات الشاسعة والمحاجر ومسارات الطرق، وإنتاج أورثوفوتو عالي الدقة ونماذج ارتفاع رقمية DEM.',
    deliverables: ['خريطة أورثوفوتو دقيقة Orthomosaic', 'نموذج ارتفاع رقمي DEM / DTM', 'حساب كميات الحفر والردم', 'فيديو جوي توثيقي للمشروع'],
    providerName: 'جيوماتكس مصر للرفع الجوي',
    providerCity: 'الشرقية والدلتا',
    providerPhone: '01033134413',
    icon: '🚁',
    img: '/assets/img/drone-orthophoto-site.jpg',
  },
  {
    id: 'seed-4',
    title: 'تقسيم وفرز أراضي زراعية وعمرانية',
    category: 'مساحة قانونية',
    description: 'إعداد مخططات التقسيم والفرز والتجنيب، وحساب المساحات الصافية والشوارع، وتجهيز المستندات المساحية المعتمدة للشهر العقاري.',
    deliverables: ['مخطط تقسيم معتمد', 'كشف إحداثيات الأركان والحدود', 'توقيع وتثبيت أوتاد بالـ Total Station', 'ملف التوثيق المساحي'],
    providerName: 'مكتب الدلتا للخدمات المساحية والقانونية',
    providerCity: 'طنطا والغربية',
    providerPhone: '01033134413',
    icon: '📋',
    img: '/assets/img/drone-subdivision-aerial.jpg',
  },
  {
    id: 'seed-5',
    title: 'معايرة وصيانة أجهزة المساحة',
    category: 'خدمات فنية',
    description: 'فحص وضبط دقة أجهزة Total Station وموازين القامة والـ GNSS على أجهزة كوليماتور معيارية وإصدار تقارير معايرة معتمدة.',
    deliverables: ['تقرير فحص أخطاء الزوايا والمسافات', 'شهادة معايرة معتمدة سارية لمدة عام', 'تنظيف وضبط بصري وميكانيكي', 'ضمان صيانة للأجزاء المستبدلة'],
    providerName: 'المعمل التخصصي للمعايرة الدقيقة',
    providerCity: 'مدينة نصر، القاهرة',
    providerPhone: '01033134413',
    icon: '🛠️',
    img: '/assets/img/calibration-lab-collimators.jpg',
  },
  {
    id: 'seed-6',
    title: 'كشف وتوثيق المرافق التحت أرضية',
    category: 'جيوفيزياء وهندسة',
    description: 'تحديد مسارات وتعميق كابلات الكهرباء، خطوط الغاز والمياه، والألياف الضوئية باستخدام رادارات اختراق الأرض GPR وكواشف الكابلات.',
    deliverables: ['خريطة مسارات المرافق GIS / CAD', 'تحديد أعماق الكابلات والمواسير', 'تجنب قطع المرافق أثناء الحفر', 'تقرير خلو مسارات'],
    providerName: 'مكتب الأهرام للمسح الهندسي والجيوفيزيائي',
    providerCity: 'الجيزة وأكتوبر',
    providerPhone: '01033134413',
    icon: '⚡',
    img: '/assets/img/totalstation-earthworks.jpg',
  },
];

export default function ServicesPage() {
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('الكل');

  const categories = ['الكل', 'مساحة أرضية', 'Reality Capture', 'Aerial Survey', 'مساحة قانونية', 'خدمات فنية', 'جيوفيزياء وهندسة'];

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      setIsLoading(true);
      try {
        let fetchedServices: ServiceItem[] = [];

        // 1. Attempt live query from Supabase
        try {
          const { data: joinedData, error: joinError } = await supabase
            .from('services')
            .select('*, providers(id, name, phone, city, location)')
            .order('created_at', { ascending: false });

          if (!joinError && joinedData && joinedData.length > 0) {
            fetchedServices = joinedData.map((row: any) => {
              const prov = row.providers;
              const cat = row.category || 'مساحة أرضية';
              const meta = CATEGORY_META[cat] || {
                icon: '🧭',
                img: '/assets/img/totalstation-construction-crane.jpg',
                deliverables: ['تقرير فني تفصيلي', 'مخططات مساحية رقمية', 'تسليم معتمد'],
              };
              return {
                id: String(row.id),
                title: row.title || 'خدمة مساحية معتمدة',
                category: cat,
                description: row.description || '',
                deliverables: meta.deliverables,
                providerId: row.provider_id || prov?.id,
                providerName: prov?.name || 'مكتب مساحي معتمد',
                providerPhone: prov?.phone || '01033134413',
                providerCity: prov?.city || prov?.location || 'متاح بجميع المحافظات',
                icon: meta.icon,
                img: meta.img,
              };
            });
          } else {
            // Fallback: Query services table directly if relation join failed
            const { data: rawServices } = await supabase
              .from('services')
              .select('*')
              .order('created_at', { ascending: false });

            if (rawServices && rawServices.length > 0) {
              const { data: provList } = await supabase
                .from('providers')
                .select('id, name, phone, city, location');

              const provMap = new Map<string, any>();
              if (provList) {
                provList.forEach((p) => provMap.set(String(p.id), p));
              }

              fetchedServices = rawServices.map((row: any) => {
                const prov = row.provider_id ? provMap.get(String(row.provider_id)) : null;
                const cat = row.category || 'مساحة أرضية';
                const meta = CATEGORY_META[cat] || {
                  icon: '🧭',
                  img: '/assets/img/totalstation-construction-crane.jpg',
                  deliverables: ['تقرير فني تفصيلي', 'مخططات مساحية رقمية', 'تسليم معتمد'],
                };
                return {
                  id: String(row.id),
                  title: row.title || 'خدمة مساحية معتمدة',
                  category: cat,
                  description: row.description || '',
                  deliverables: meta.deliverables,
                  providerId: row.provider_id || prov?.id,
                  providerName: prov?.name || 'مكتب مساحي معتمد',
                  providerPhone: prov?.phone || '01033134413',
                  providerCity: prov?.city || prov?.location || 'متاح بجميع المحافظات',
                  icon: meta.icon,
                  img: meta.img,
                };
              });
            }
          }
        } catch (supabaseErr) {
          console.warn('[ServicesPage] Supabase fetch error:', supabaseErr);
        }

        // 2. Check offline local storage services for real-time testing
        let localServices: ServiceItem[] = [];
        try {
          const raw = localStorage.getItem('SURVSTA_LOCAL_SERVICES');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localServices = parsed.map((item: any) => {
                const cat = item.category || 'مساحة أرضية';
                const meta = CATEGORY_META[cat] || {
                  icon: '🧭',
                  img: '/assets/img/totalstation-construction-crane.jpg',
                  deliverables: ['تقرير فني تفصيلي', 'مخططات مساحية رقمية', 'تسليم معتمد'],
                };
                return {
                  id: item.id || `local-${Math.random()}`,
                  title: item.title,
                  category: cat,
                  description: item.description,
                  deliverables: meta.deliverables,
                  providerId: item.provider_id || 'my-office',
                  providerName: 'مكتبك المساحي المعتمد',
                  providerPhone: '01033134413',
                  providerCity: 'القاهرة والجيزة',
                  icon: meta.icon,
                  img: meta.img,
                };
              });
            }
          }
        } catch {}

        // 3. Combine live services, local storage, and seed services
        const combined = [...localServices, ...fetchedServices];
        if (combined.length > 0) {
          const existingTitles = new Set(combined.map((s) => s.title.toLowerCase().trim()));
          const extraSeed = DEFAULT_SERVICES.filter(
            (s) => !existingTitles.has(s.title.toLowerCase().trim())
          );
          if (isMounted) {
            setServicesList([...combined, ...extraSeed]);
          }
        } else {
          if (isMounted) {
            setServicesList(DEFAULT_SERVICES);
          }
        }
      } catch (err) {
        console.error('[ServicesPage] Error loading services:', err);
        if (isMounted) setServicesList(DEFAULT_SERVICES);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredServices = selectedCat === 'الكل'
    ? servicesList
    : servicesList.filter((s) => s.category === selectedCat);

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
      <section className="relative w-full py-8 bg-white border-b border-slate-200">
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
          
          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-96 flex flex-col justify-between p-6">
                  <div className="h-44 bg-slate-200 rounded-xl mb-4 w-full" />
                  <div className="space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                  </div>
                  <div className="h-10 bg-slate-200 rounded-lg mt-6 w-full" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">لا توجد خدمات متاحة في هذا القسم حالياً</h3>
              <p className="text-xs text-slate-500 mb-6">
                يمكنك التبديل إلى قسم آخر أو إرسال طلب احتياج مخصص وسنقوم بربطك بالمكاتب المؤهلة فوراً.
              </p>
              <button
                onClick={() => setSelectedCat('الكل')}
                className="rounded-xl bg-[#081933] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0F253E] transition"
              >
                عرض كل الخدمات
              </button>
            </div>
          ) : (
            /* Services Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 w-full bg-slate-100">
                      <Image
                        alt={svc.title}
                        className="object-cover"
                        fill
                        src={svc.img || '/assets/img/totalstation-construction-crane.jpg'}
                      />
                      <span className="absolute top-3 right-3 bg-[#081933]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded backdrop-blur-sm">
                        {svc.category}
                      </span>
                      <span className="absolute bottom-3 right-3 bg-cyan-400 text-black text-xs font-extrabold px-2.5 py-1 rounded shadow">
                        {svc.icon || '🧭'} {svc.providerCity || 'معتمد'}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">{svc.title}</h3>
                      </div>

                      {svc.providerName && (
                        <div className="flex items-center gap-1 text-xs text-cyan-700 font-semibold mb-3">
                          <span>🏢</span>
                          <span>{svc.providerName}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed mb-4 min-h-[36px] line-clamp-3">
                        {svc.description}
                      </p>

                      {svc.deliverables && svc.deliverables.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <span className="block text-[11px] font-bold text-slate-700 mb-2">المخرجات الأساسية:</span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {svc.deliverables.map((d, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="text-cyan-600 font-bold">✓</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      href={`/directory?q=${encodeURIComponent(svc.title)}`}
                      className="text-xs font-bold text-cyan-700 hover:text-cyan-900 whitespace-nowrap"
                    >
                      عرض المكاتب ←
                    </Link>
                    <div>
                      <ContactButton
                        providerId={svc.providerId || svc.id}
                        equipmentTitle={svc.title}
                        phoneNumber={svc.providerPhone || '01033134413'}
                        className="rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-3.5 py-2 text-xs font-bold transition shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
