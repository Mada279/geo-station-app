'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlobalAnnouncement } from '@/services/announcementService';

interface GlobalAnnouncementBannerProps {
  initialAnnouncement: GlobalAnnouncement | null;
  isDismissedInitial: boolean;
}

const THEME_STYLES = {
  info: {
    bg: 'bg-[#0B1120]',
    border: 'border-white/10',
    text: 'text-slate-300',
    highlight: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    badgeText: 'معلومة',
    btnBg: 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30',
  },
  promo: {
    bg: 'bg-gradient-to-r from-amber-950 via-[#1a1306] to-amber-950',
    border: 'border-amber-500/30',
    text: 'text-amber-100',
    highlight: 'text-amber-400 font-bold',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    badgeText: 'عرض خاص',
    btnBg: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold',
  },
  alert: {
    bg: 'bg-gradient-to-r from-rose-950 via-[#1f0b12] to-rose-950',
    border: 'border-rose-500/30',
    text: 'text-rose-100',
    highlight: 'text-rose-400 font-bold',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    badgeText: 'تنبيه هام',
    btnBg: 'bg-rose-500 text-white hover:bg-rose-600 font-bold',
  },
  maintenance: {
    bg: 'bg-gradient-to-r from-purple-950 via-[#180a24] to-purple-950',
    border: 'border-purple-500/30',
    text: 'text-purple-100',
    highlight: 'text-purple-400 font-bold',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    badgeText: 'صيانة وتحديث',
    btnBg: 'bg-purple-500 text-white hover:bg-purple-600 font-bold',
  },
};

export default function GlobalAnnouncementBanner({
  initialAnnouncement,
  isDismissedInitial,
}: GlobalAnnouncementBannerProps) {
  const [announcement] = useState<GlobalAnnouncement | null>(initialAnnouncement);
  const [isDismissed, setIsDismissed] = useState<boolean>(isDismissedInitial);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (announcement) {
      // Re-verify cookie on client side in case of fast transitions
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`survsta_banner_dismissed_${announcement.id}=`));
      if (cookieValue) {
        setIsDismissed(true);
      }
    }
  }, [announcement]);

  if (!announcement || !announcement.is_active || isDismissed) {
    return null;
  }

  const theme = THEME_STYLES[announcement.theme_type] || THEME_STYLES.info;

  const handleDismiss = () => {
    setIsDismissed(true);
    // Set cookie valid for 7 days
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `survsta_banner_dismissed_${announcement.id}=true; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  return (
    <div
      role="region"
      aria-label="Platform Announcement"
      className={`relative z-20 ${theme.bg} ${theme.text} text-xs border-b ${theme.border} py-2 px-4 sm:px-6 lg:px-8 transition-all duration-300`}
      dir="rtl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Announcement Message & Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${theme.badge}`}>
            {theme.badgeText}
          </span>
          <span className={`text-[12px] sm:text-[13px] leading-relaxed truncate font-medium ${theme.highlight}`}>
            {announcement.message_ar}
          </span>
        </div>

        {/* Action Link & Dismiss Button */}
        <div className="flex items-center gap-3 shrink-0">
          {announcement.cta_text && announcement.cta_link && (
            <Link
              href={announcement.cta_link}
              className={`px-3 py-1 rounded-lg text-[11px] sm:text-[12px] transition whitespace-nowrap shadow-sm ${theme.btnBg}`}
            >
              {announcement.cta_text}
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="إغلاق الإعلان"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center text-sm font-bold"
            title="إخفاء الإعلان"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
