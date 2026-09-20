'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ContactButton from '@/components/ContactButton';
import { supabase } from '@/utils/supabaseClient';
import { getEquipmentImageUrl, getDefaultCategoryImage, findMockProvider } from '@/utils/helpers';

interface ProviderData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: string;
  created_at?: string;
  about?: string;
  services?: string[];
}

interface EquipmentData {
  id: string;
  title: string;
  category: string;
  daily_price?: number | null;
  monthly_price?: number | null;
  sale_price?: number | null;
  image_url?: string;
  condition?: string;
  year?: number | string;
  description?: string;
}

interface ServiceData {
  id: string;
  title: string;
  category: string;
  description?: string;
}

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params?.id as string;

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentData[]>([]);
  const [servicesList, setServicesList] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProviderDetails() {
      if (!providerId) return;
      setIsLoading(true);

      try {
        // 1. Attempt Supabase fetch for live provider
        let provData: any = null;
        try {
          const { data, error } = await supabase
            .from('providers')
            .select('*')
            .eq('id', providerId)
            .maybeSingle();

          if (!error && data) {
            provData = data;
          }
        } catch (dbErr) {
          console.warn('[ProviderProfilePage] Supabase provider check:', dbErr);
        }

        if (provData) {
          // Hydrate live provider from Supabase
          let svcList: string[] = [];
          if (Array.isArray(provData.services)) {
            svcList = provData.services;
          } else if (typeof provData.services === 'string') {
            try {
              const parsed = JSON.parse(provData.services);
              if (Array.isArray(parsed)) svcList = parsed;
              else svcList = provData.services.split(',').map((s: string) => s.trim());
            } catch {
              svcList = provData.services.split(',').map((s: string) => s.trim());
            }
          }

          if (isMounted) {
            setProvider({
              id: String(provData.id),
              name: provData.name || 'مكتب مساحي معتمد',
              email: provData.email,
              phone: provData.phone || '01033134413',
              location: provData.location || 'القاهرة',
              status: provData.status || 'approved',
              created_at: provData.created_at,
              about: provData.about || `جهة مساحية متخصصة ومعتمدة على منصة Survsta لتقديم أرقى الحلول الهندسية وخدمات الرفع الطبوغرافي والمعايرة في نطاق ${provData.location || 'الجمهورية'}.`,
              services: svcList.length > 0 ? svcList : ['رفع مساحي طبوغرافي', 'تأجير أجهزة Total Station', 'شبكات GNSS'],
            });
          }

          // Fetch provider's live equipment
          try {
            const { data: eqData } = await supabase
              .from('equipment')
              .select('*')
              .eq('provider_id', providerId)
              .order('created_at', { ascending: false });

            if (isMounted && eqData && eqData.length > 0) {
              setEquipmentList(
                eqData.map((e: any) => ({
                  id: String(e.id),
                  title: e.title || 'جهاز مساحي معتمد',
                  category: e.category || 'Total Station',
                  daily_price: e.daily_price,
                  monthly_price: e.monthly_price,
                  sale_price: e.sale_price,
                  image_url: e.image_url,
                  condition: e.condition || 'ممتاز',
                  year: e.year || 2024,
                  description: e.description,
                }))
              );
            }
          } catch {}

          // Fetch provider's live services
          try {
            const { data: sData } = await supabase
              .from('services')
              .select('*')
              .eq('provider_id', providerId)
              .order('created_at', { ascending: false });

            if (isMounted && sData && sData.length > 0) {
              setServicesList(
                sData.map((s: any) => ({
                  id: String(s.id),
                  title: s.title,
                  category: s.category || 'مساحة أرضية',
                  description: s.description,
                }))
              );
            }
          } catch {}

        } else {
          // 2. Fallback check: Match mock provider from MOCK_PROFILES
          const mock = findMockProvider(providerId);
          if (isMounted && mock) {
            setProvider({
              id: mock.id,
              name: mock.name,
              email: mock.email,
              phone: mock.phone,
              location: mock.location,
              status: mock.status,
              created_at: mock.created_at,
              about: mock.about,
              services: mock.services,
            });
            setEquipmentList(
              mock.equipment.map((e) => ({
                id: e.id,
                title: e.title,
                category: e.category,
                daily_price: e.daily_price,
                monthly_price: e.monthly_price,
                sale_price: e.sale_price,
                image_url: e.image_url,
                condition: e.condition,
                year: e.year,
                description: e.description,
              }))
            );
            setServicesList(mock.servicesList);
          }
        }
      } catch (err) {
        console.warn('[ProviderProfilePage] Error loading details, using mock fallback:', err);
        const mock = findMockProvider(providerId);
        if (isMounted && mock) {
          setProvider({
            id: mock.id,
            name: mock.name,
            email: mock.email,
            phone: mock.phone,
            location: mock.location,
            status: mock.status,
            created_at: mock.created_at,
            about: mock.about,
            services: mock.services,
          });
          setEquipmentList(mock.equipment);
          setServicesList(mock.servicesList);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProviderDetails();

    return () => {
      isMounted = false;
    };
  }, [providerId]);

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800" dir="rtl">
      {/* 1. Top Header Banner */}
      <section className="bg-[#081933] text-white py-12 border-b border-cyan-500/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-3">
            <Link href="/" className="hover:underline">الرئيسية</Link>
            <span>/</span>
            <Link href="/directory" className="hover:underline">دليل المكاتب</Link>
            <span>/</span>
            <span className="text-slate-300">{provider?.name || 'ملف المكتب'}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  ✔ شريك هندسي معتمد لدى Survsta
                </span>
                <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  📍 {provider?.location || 'جمهورية مصر العربية'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
                {provider?.name || 'مكتب مساحي معتمد'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {provider?.about}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {provider && (
                <ContactButton
                  providerId={provider.id}
                  equipmentTitle={provider.name}
                  phoneNumber={provider.phone || '01033134413'}
                  className="rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-gray-950 font-black px-6 py-3 text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition text-center"
                />
              )}
              <Link
                href="/directory"
                className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-4 py-3 text-xs font-bold transition text-center"
              >
                ← العودة للدليل
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">المعدات المسجلة</span>
              <span className="text-2xl font-black text-slate-900">{equipmentList.length}</span>
              <span className="text-[11px] text-cyan-700 font-semibold block mt-1">أجهزة معتمدة</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">الخدمات التخصصية</span>
              <span className="text-2xl font-black text-slate-900">{servicesList.length || provider?.services?.length || 4}</span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-1">حلول هندسية</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">التقييم العام</span>
              <span className="text-2xl font-black text-amber-500">★ 4.9</span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">نخبة المهندسين</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">زمن الاستجابة</span>
              <span className="text-2xl font-black text-emerald-600">ساعة</span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">تواصل مباشر</span>
            </div>
          </div>

          {/* Section: Equipment Portfolio */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">المعدات والأجهزة المساحية المتاحة</h2>
                <p className="text-xs text-slate-500 mt-0.5">أجهزة Total Station, GNSS والموازين المتوفرة للإيجار والبيع لدى المكتب</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-100">
                {equipmentList.length} جهاز متوفر
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-200 h-80 p-5 space-y-3">
                    <div className="h-40 bg-slate-200 rounded-xl"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : equipmentList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
                <span className="text-3xl block mb-1">📡</span>
                <h3 className="text-base font-bold text-slate-800">لا توجد معدات مسجلة حالياً في النظام لهذا المكتب</h3>
                <p className="text-xs text-slate-500">
                  يمكنك التواصل مع إدارة المكتب مباشرة عبر زر التواصل للاستفسار عن توفر أجهزة إضافية أو طلب عروض أسعار.
                </p>
                {provider && (
                  <div className="pt-2">
                    <ContactButton
                      providerId={provider.id}
                      equipmentTitle={provider.name}
                      phoneNumber={provider.phone || '01033134413'}
                      className="rounded-xl bg-[#081933] hover:bg-[#0F253E] text-white px-5 py-2.5 text-xs font-bold transition shadow-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipmentList.map((item) => {
                  const fallbackSrc = getDefaultCategoryImage(item.category, item.title);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-44 w-full bg-slate-100">
                          <Image
                            alt={item.title}
                            className="object-cover"
                            fill
                            src={getEquipmentImageUrl(item.image_url, item.category, item.title)}
                            unoptimized
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = fallbackSrc;
                            }}
                          />
                          <span className="absolute top-3 right-3 bg-[#081933]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                            {item.category}
                          </span>
                        </div>

                        <div className="p-5">
                          <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                            <span>الحالة: {item.condition}</span>
                            <span>•</span>
                            <span>سنة الموديل: {item.year}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-5 py-3.5 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between gap-2">
                        {(!item.daily_price || Number(item.daily_price) <= 0) && (!item.monthly_price || Number(item.monthly_price) <= 0) && (!item.sale_price || Number(item.sale_price) <= 0) ? (
                          <div className="py-0.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-black shadow-sm">
                              <span>💬</span>
                              <span>لطلب الأسعار يرجى التواصل</span>
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[11px] text-slate-500 block">
                              {item.daily_price && Number(item.daily_price) > 0
                                ? 'الإيجار اليومي'
                                : item.monthly_price && Number(item.monthly_price) > 0
                                ? 'الإيجار الشهري'
                                : 'سعر البيع'}
                            </span>
                            <span className="text-sm font-black text-cyan-800">
                              {item.daily_price && Number(item.daily_price) > 0
                                ? `${Number(item.daily_price).toLocaleString('en-US')} ج.م / يوم`
                                : item.monthly_price && Number(item.monthly_price) > 0
                                ? `${Number(item.monthly_price).toLocaleString('en-US')} ج.م / شهر`
                                : `${Number(item.sale_price).toLocaleString('en-US')} ج.م`}
                            </span>
                          </div>
                        )}
                        {provider && (
                          <ContactButton
                            providerId={provider.id}
                            equipmentTitle={item.title}
                            phoneNumber={provider.phone || '01033134413'}
                            className="rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-3.5 py-1.5 font-bold text-xs transition shadow-sm"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Services Portfolio */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">الخدمات المساحية والهندسية</h2>
                <p className="text-xs text-slate-500 mt-0.5">الأعمال الميدانية والمكتبية المؤهل المكتب لتنفيذها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(servicesList.length > 0
                ? servicesList
                : (provider?.services || ['رفع مساحي طبوغرافي', 'معايرة وصيانة أجهزة', 'كشف مرافق تحت سطح الأرض']).map((s, i) => ({
                    id: `svc-${i}`,
                    title: typeof s === 'string' ? s : 'خدمة مساحية معتمدة',
                    category: 'خدمات هندسية',
                    description: 'تنفيذ الأعمال المساحية الميدانية والمكتبية بدقة عالية وتسليم لوحات أوتوكاد معتمدة وتقارير فنية موثقة.',
                  }))
              ).map((svc) => (
                <div key={svc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md">
                      {svc.category}
                    </span>
                    <span className="text-emerald-600 text-xs font-bold">معتمد ✓</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{svc.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
