'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ContactButton from '@/components/ContactButton';
import { supabase } from '@/utils/supabaseClient';
import { getEquipmentImageUrl, getDefaultCategoryImage, findMockProvider } from '@/utils/helpers';

export interface ProviderData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: string;
  created_at?: string;
  about?: string;
  services?: string[];
  logo_url?: string;
}

export interface EquipmentData {
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

export interface ServiceData {
  id: string;
  title: string;
  category: string;
  description?: string;
}

export default function ProviderProfileClient({
  initialProvider,
}: {
  initialProvider?: ProviderData | null;
}) {
  const params = useParams();
  const router = useRouter();
  const providerId = params?.id as string;

  const [provider, setProvider] = useState<ProviderData | null>(initialProvider || null);
  const [equipmentList, setEquipmentList] = useState<EquipmentData[]>([]);
  const [servicesList, setServicesList] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(!initialProvider);

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
              name: provData.company_name || provData.name || 'مكتب مساحي معتمد',
              email: provData.email,
              phone: provData.phone || '01033134413',
              location: provData.location || 'القاهرة',
              status: provData.status || 'approved',
              created_at: provData.created_at,
              about: provData.about || `جهة مساحية متخصصة ومعتمدة على منصة Survsta لتقديم أرقى الحلول الهندسية وخدمات الرفع الطبوغرافي والمعايرة في نطاق ${provData.location || 'الجمهورية'}.`,
              services: svcList.length > 0 ? svcList : ['رفع مساحي طبوغرافي', 'تأجير أجهزة Total Station', 'شبكات GNSS'],
              logo_url: provData.logo_url || '/assets/img/hero-engineering-office.jpg',
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
              logo_url: '/assets/img/hero-engineering-office.jpg',
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
            logo_url: '/assets/img/hero-engineering-office.jpg',
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
                  label="تواصل مع المكتب الآن"
                />
              )}
              <Link
                href="/directory"
                className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold text-center transition"
              >
                ← العودة للدليل
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Quick Profile Info & Badges */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                بيانات الاعتماد والتواصل
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">الموقع والنطاق الجغرافي</span>
                  <span className="font-semibold text-slate-800">{provider?.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">حالة التوثيق</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span>✓</span>
                    <span>سجل تجاري وبطاقة ضريبية معتمدة</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الهاتف المعتمد</span>
                  <a href={`tel:${provider?.phone || '01033134413'}`} className="font-semibold text-cyan-700 hover:underline font-mono">
                    {provider?.phone || '01033134413'}
                  </a>
                </div>
                {provider?.email && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">البريد الإلكتروني</span>
                    <span className="font-semibold text-slate-800 font-mono">{provider.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block mb-0.5">عضو في المنصة منذ</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {provider?.created_at ? new Date(provider.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }) : '2023'}
                  </span>
                </div>
              </div>
            </div>

            {/* Specializations Tags */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                مجالات العمل والتخصصات
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {provider?.services?.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Equipment & Services Listing */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Equipment by Provider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📡</span>
                  <h2 className="text-lg font-bold text-slate-900">
                    الأجهزة المتاحة لدى المكتب ({equipmentList.length})
                  </h2>
                </div>
                <Link
                  href="/equipment"
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800"
                >
                  استعراض كافة الأجهزة ←
                </Link>
              </div>

              {equipmentList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
                  لا توجد أجهزة مدرجة حالياً لهذا المكتب.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {equipmentList.map((eq) => {
                    const priceDisplay = eq.daily_price
                      ? `${eq.daily_price} ج.م / يوم`
                      : eq.sale_price
                      ? `${eq.sale_price.toLocaleString()} ج.م (بيع)`
                      : 'حسب الاتفاق';

                    return (
                      <div
                        key={eq.id}
                        className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition flex flex-col justify-between"
                      >
                        <div className="relative h-40 bg-slate-100">
                          <Image
                            src={getEquipmentImageUrl(eq.image_url, eq.category, eq.title)}
                            alt={eq.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/img/hero-engineering-office.jpg';
                            }}
                          />
                          <span className="absolute top-2 right-2 rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-[10px] font-bold">
                            {eq.category}
                          </span>
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm hover:text-cyan-700 transition">
                              {eq.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span>الحالة: {eq.condition}</span>
                              {eq.year && <span>• موديل {eq.year}</span>}
                            </div>
                            <div className="text-xs font-bold text-cyan-700 mt-2 font-mono">
                              {priceDisplay}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                            <Link
                              href={`/equipment/${eq.id}`}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-center font-bold text-xs transition"
                            >
                              عرض التفاصيل
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Services Offered */}
            {servicesList.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <span className="text-xl">🛠️</span>
                  <h2 className="text-lg font-bold text-slate-900">
                    الخدمات الهندسية والميدانية المتاحة ({servicesList.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {servicesList.map((svc) => (
                    <div
                      key={svc.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-cyan-500 transition space-y-2"
                    >
                      <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                        {svc.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {svc.title}
                      </h4>
                      {svc.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {svc.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
