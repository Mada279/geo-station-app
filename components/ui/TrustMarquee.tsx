'use client';

import React from 'react';

interface MarqueeItem {
  id: string;
  type: 'payment' | 'trust';
  title: string;
  badge?: string;
  icon: string;
  colorClass: string;
}

const MARQUEE_ITEMS: MarqueeItem[] = [
  {
    id: 'instapay',
    type: 'payment',
    title: 'InstaPay إنستاباي',
    badge: 'تحويل لحظي فوري',
    icon: '⚡',
    colorClass: 'border-pink-500/30 bg-pink-950/30 text-pink-300 hover:border-pink-400',
  },
  {
    id: 'vodafone',
    type: 'payment',
    title: 'Vodafone Cash',
    badge: 'فودافون كاش',
    icon: '🔴',
    colorClass: 'border-rose-500/30 bg-rose-950/30 text-rose-300 hover:border-rose-400',
  },
  {
    id: 'trust-safe',
    type: 'trust',
    title: 'معاملات آمنة وموثقة',
    badge: 'ضمان حقوق الطرفين',
    icon: '🛡️',
    colorClass: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:border-emerald-400',
  },
  {
    id: 'etisalat',
    type: 'payment',
    title: 'Etisalat Cash',
    badge: 'اتصالات كاش',
    icon: '🟢',
    colorClass: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:border-emerald-400',
  },
  {
    id: 'trust-instant',
    type: 'trust',
    title: 'مدفوعات لحظية 24/7',
    badge: 'شحن فوري للمحفظة',
    icon: '⚡',
    colorClass: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:border-cyan-400',
  },
  {
    id: 'orange',
    type: 'payment',
    title: 'Orange Cash',
    badge: 'أورنج كاش',
    icon: '🟠',
    colorClass: 'border-amber-500/30 bg-amber-950/30 text-amber-300 hover:border-amber-400',
  },
  {
    id: 'we-pay',
    type: 'payment',
    title: 'WE Pay',
    badge: 'وي باي',
    icon: '🟣',
    colorClass: 'border-purple-500/30 bg-purple-950/30 text-purple-300 hover:border-purple-400',
  },
  {
    id: 'trust-contracts',
    type: 'trust',
    title: 'عقود وإيصالات معتمدة',
    badge: 'حماية الأجهزة المساحية',
    icon: '📋',
    colorClass: 'border-blue-500/30 bg-blue-950/30 text-blue-300 hover:border-blue-400',
  },
];

interface TrustMarqueeProps {
  className?: string;
  speedClass?: string;
}

export default function TrustMarquee({
  className = '',
  speedClass = 'animate-marquee',
}: TrustMarqueeProps) {
  return (
    <div
      className={`relative w-full overflow-hidden border-y border-white/5 bg-[#071326]/80 py-3.5 backdrop-blur-md group ${className}`}
      dir="ltr"
    >
      {/* Subtle edge fade gradient mask */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#071326] via-[#071326]/80 to-transparent sm:w-36" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#071326] via-[#071326]/80 to-transparent sm:w-36" />

      {/* Marquee Wrapper: 2 identical flex items side by side for seamless loop */}
      <div className="flex w-max [mask-image:linear-gradient(to_right,transparent_0%,black_100px,black_calc(100%-100px),transparent_100%)]">
        {/* Set 1 */}
        <div className={`flex shrink-0 items-center gap-4 sm:gap-6 px-3 ${speedClass} group-hover:[animation-play-state:paused]`}>
          {MARQUEE_ITEMS.map((item) => (
            <div
              key={`marquee-1-${item.id}`}
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-bold transition shadow-sm ${item.colorClass}`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="whitespace-nowrap font-black">{item.title}</span>
              {item.badge && (
                <span className="hidden sm:inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Set 2 (Duplicate for infinite seamless loop) */}
        <div
          aria-hidden="true"
          className={`flex shrink-0 items-center gap-4 sm:gap-6 px-3 ${speedClass} group-hover:[animation-play-state:paused]`}
        >
          {MARQUEE_ITEMS.map((item) => (
            <div
              key={`marquee-2-${item.id}`}
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-bold transition shadow-sm ${item.colorClass}`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="whitespace-nowrap font-black">{item.title}</span>
              {item.badge && (
                <span className="hidden sm:inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
