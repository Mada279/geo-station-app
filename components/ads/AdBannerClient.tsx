'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export interface AdBannerClientProps {
  location: 'homepage_hero' | 'search_in_feed' | 'providers_directory' | 'equipment_sidebar' | string;
  className?: string;
}

interface BannerData {
  id: string;
  title: string;
  image_url: string;
  target_link: string;
  location: string;
}

export default function AdBannerClient({ location, className = '' }: AdBannerClientProps) {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBanners() {
      try {
        const { data, error } = await supabase
          .from('ad_banners')
          .select('id, title, image_url, target_link, location')
          .eq('is_active', true)
          .eq('location', location)
          .order('created_at', { ascending: false })
          .limit(2);

        if (error) {
          console.error('AdBannerClient Fetch Error:', error);
        }

        if (isMounted) {
          const valid = data?.filter((b) => Boolean(b.image_url)) || [];
          setBanners(valid);
          setHasLoaded(true);
        }
      } catch (err) {
        console.error('AdBannerClient Fetch Error:', err);
        if (isMounted) {
          setBanners([]);
          setHasLoaded(true);
        }
      }
    }

    loadBanners();

    return () => {
      isMounted = false;
    };
  }, [location]);

  if (!hasLoaded || banners.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full my-8 ${className}`} dir="rtl">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={`/api/ads/click?id=${banner.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row bg-[#0b1e3d] rounded-2xl border border-slate-700/50 overflow-hidden hover:border-cyan-500 transition-colors shadow-lg group"
        >
          {/* Text Section (RTL - Right Side) */}
          <div className="flex-1 p-5 flex flex-col justify-center relative">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>إعلان مروّج • Sponsored</span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-white mt-2 leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
              {banner.title}
            </h4>

            <div className="text-cyan-400 text-xs sm:text-sm mt-4 font-semibold flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
              <span>اكتشف العرض</span>
              <span>←</span>
            </div>
          </div>

          {/* Image Section (RTL - Left Side) */}
          <div className="relative w-2/5 md:w-1/2 h-32 md:h-40 bg-slate-800 shrink-0">
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
