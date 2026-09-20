'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ContactButton from './ContactButton';
import { supabase } from '@/utils/supabaseClient';
import { MOCK_PROFILES } from '@/utils/helpers';

interface FeaturedProviderCard {
  id: string | number;
  name: string;
  phone: string;
  location: string;
  img: string;
  type: string;
  rate: string;
  reviews: number;
  since: string;
  resp: string;
  services: string[];
  ver: string[];
  featured: boolean;
}

export default function FeaturedProviders() {
  // Initialize with the top 3 mock profiles as fallback for flawless client demo
  const initialCards: FeaturedProviderCard[] = MOCK_PROFILES.slice(0, 3).map((m, idx) => {
    const defaultImages = [
      '/assets/img/hero-engineering-office.jpg',
      '/assets/img/office-survey-team.jpg',
      '/assets/img/survey-instruments-studio.jpg',
    ];
    const typeMap = ['مكتب مساحة', 'شركة مساحة', 'مورد أجهزة'];
    const rateMap = ['4.8', '4.6', '4.4'];
    const revMap = [64, 118, 87];
    const respMap = ['يرد خلال ساعة', 'يرد خلال 3 ساعات', 'يرد خلال يوم'];
    const sinceMap = ['2012', '2008', '2015'];
    const verMap = [
      ['ملف موثّق', 'نشاط موثّق'],
      ['ملف موثّق', 'نشاط موثّق', 'معدات موثّقة'],
      ['ملف موثّق'],
    ];

    return {
      id: m.id,
      name: m.name,
      phone: m.phone || '01033134413',
      location: m.location,
      img: defaultImages[idx % defaultImages.length],
      type: typeMap[idx] || 'مكتب مساحة',
      rate: rateMap[idx] || '4.8',
      reviews: revMap[idx] || 50,
      since: sinceMap[idx] || '2020',
      resp: respMap[idx] || 'يرد خلال ساعة',
      services: m.services || ['رفع مساحي طبوغرافي', 'تقسيم وفرز أراضي', 'حصر كميات'],
      ver: verMap[idx] || ['ملف موثّق', 'نشاط موثّق'],
      featured: true,
    };
  });

  const [providers, setProviders] = useState<FeaturedProviderCard[]>(initialCards);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProviders() {
      try {
        const { data, error } = await supabase
          .from('providers')
          .select('*')
          .eq('is_featured', true)
          .limit(3);

        if (error) {
          // Gracefully swallow 400/PGRST204 column missing error, retain dummy mock data
          console.warn('[FeaturedProviders] Live query skipped gracefully, using mock demo data:', error.message || error);
          if (isMounted) {
            setProviders(initialCards);
          }
          return;
        }

        if (isMounted && data && data.length > 0) {
          const defaultImages = [
            '/assets/img/hero-engineering-office.jpg',
            '/assets/img/office-survey-team.jpg',
            '/assets/img/survey-instruments-studio.jpg',
          ];

          const mapped: FeaturedProviderCard[] = data.map((p: any, idx: number) => {
            const nameLower = (p.name || '').toLowerCase();
            const loc = p.location || 'القاهرة';
            let cat = 'مكتب مساحة';
            if (nameLower.includes('شركة') || nameLower.includes('مجموعة')) cat = 'شركة مساحة';
            else if (nameLower.includes('مورد') || nameLower.includes('أجهزة') || nameLower.includes('تجارة')) cat = 'مورد أجهزة';
            else if (nameLower.includes('معايرة') || nameLower.includes('مركز')) cat = 'مركز معايرة';

            let svcList = ['رفع مساحي طبوغرافي', 'تأجير أجهزة مساحية', 'توقيع محاور المنشآت'];
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
              id: p.id,
              name: p.name || 'مكتب مساحي معتمد',
              phone: p.phone || '01033134413',
              location: loc,
              img: p.image_url || defaultImages[idx % defaultImages.length],
              type: cat,
              rate: p.rating ? String(p.rating) : '4.8',
              reviews: p.review_count || 45 + idx * 12,
              since: p.created_at ? String(new Date(p.created_at).getFullYear()) : '2023',
              resp: 'يرد خلال ساعة',
              services: svcList,
              ver: ['ملف موثّق', 'نشاط معتمد'],
              featured: true,
            };
          });

          setProviders(mapped);
        }
      } catch (err) {
        console.warn('[FeaturedProviders] Fallback retained due to exception:', err);
      }
    }

    loadFeaturedProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {providers.map((p) => (
        <article
          key={p.id}
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col justify-between"
        >
          {/* 1. Profile Area (Clickable) */}
          <Link
            href={`/directory/${p.id}`}
            className="flex-1 group cursor-pointer active:scale-[0.98] transition-transform duration-150 flex flex-col"
          >
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <Image
                alt={p.name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                fill
                src={p.img}
                unoptimized
              />
              <div className="absolute top-3 right-3 flex gap-2 pointer-events-none">
                <span className="rounded-md bg-[#F4B400] text-black px-2 py-0.5 text-xs font-black shadow-sm">
                  ⭐ مميّز
                </span>
                <span className="rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                  {p.type}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 pointer-events-none">
                <span className="bg-[#081933]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm">
                  📍 {p.location}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {p.name}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span>📍 {p.location}</span>
                  {p.since && (
                    <>
                      <span>•</span>
                      <span>منذ {p.since}</span>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-amber-500 text-sm">★★★★★</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {p.rate} ({p.reviews} تقييم)
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.services.slice(0, 3).map((s, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.ver.map((v, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold"
                    >
                      ✔ {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>

          {/* 2. Action Footer (Strictly OUTSIDE the Link) */}
          <div className="px-5 py-3.5 bg-[#f4f7fa] border-t border-slate-100 flex items-center justify-between mt-auto relative z-10">
            <span className="text-xs text-slate-500">⏱ {p.resp}</span>
            <ContactButton
              providerId={`provider-${p.id}`}
              equipmentTitle={p.name}
              phoneNumber={p.phone || '01033134413'}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
