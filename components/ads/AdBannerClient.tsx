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
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBanner() {
      try {
        const { data: banners, error } = await supabase
          .from('ad_banners')
          .select('id, title, image_url, target_link, location')
          .eq('is_active', true)
          .eq('location', location)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('AdBannerClient Fetch Error:', error);
        }

        if (isMounted) {
          if (!error && banners && banners.length > 0) {
            const selected =
              banners.length === 1
                ? banners[0]
                : banners[Math.floor(Math.random() * banners.length)];
            setBanner(selected);
          } else {
            setBanner(null);
          }
          setHasLoaded(true);
        }
      } catch (err) {
        console.error('AdBannerClient Fetch Error:', err);
        if (isMounted) {
          setBanner(null);
          setHasLoaded(true);
        }
      }
    }

    loadBanner();

    return () => {
      isMounted = false;
    };
  }, [location]);

  if (!hasLoaded || !banner || !banner.image_url) {
    return null;
  }

  const trackingUrl = `/api/ads/click?id=${banner.id}`;

  return (
    <div className={`w-full my-6 overflow-hidden ${className}`} dir="rtl">
      <div className="relative group block rounded-2xl border border-cyan-500/25 bg-slate-900/60 p-2 sm:p-3 shadow-xl backdrop-blur-md hover:border-cyan-400/50 transition-all duration-300">
        
        {/* Micro Sponsored Badge */}
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-1 font-bold text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>إعلان مروّج • Sponsored</span>
          </span>
          <span className="text-gray-500 font-medium truncate max-w-[200px]">{banner.title}</span>
        </div>

        {/* Banner Link & Responsive Image Container */}
        <Link
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full h-32 sm:h-44 md:h-52 lg:h-60 rounded-xl overflow-hidden bg-slate-950"
        >
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            unoptimized
          />
        </Link>
      </div>
    </div>
  );
}
