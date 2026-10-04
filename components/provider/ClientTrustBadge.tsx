'use client';

import React from 'react';

export type ClientTrustLevel = 'trusted' | 'new' | 'risky';

export interface ClientTrustBadgeProps {
  trustLevel?: ClientTrustLevel | string;
  completedRentals?: number;
  compact?: boolean;
  showDescription?: boolean;
  className?: string;
}

export default function ClientTrustBadge({
  trustLevel = 'new',
  completedRentals = 0,
  compact = false,
  showDescription = true,
  className = '',
}: ClientTrustBadgeProps) {
  const normalizedLevel: ClientTrustLevel =
    trustLevel === 'trusted' || trustLevel === 'موثوق'
      ? 'trusted'
      : trustLevel === 'risky' || trustLevel === 'عالي المخاطرة' || trustLevel === 'خطر'
      ? 'risky'
      : 'new';

  const rentalsCount = Number(completedRentals) || 0;

  if (normalizedLevel === 'trusted') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm ${className}`}
        title={`عميل موثوق — أتم ${rentalsCount} عمليات إيجار ناجحة عبر المنصة`}
      >
        <span className="text-[13px]">🛡️</span>
        <span className="font-bold">عميل موثوق</span>
        {!compact && (
          <span className="text-[11px] text-emerald-300/80 font-normal mr-0.5">
            ({rentalsCount} إيجار ناجح)
          </span>
        )}
      </div>
    );
  }

  if (normalizedLevel === 'risky') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse ${className}`}
        title="تنبيه مخاطرة: توجد ملاحظات سابقة على هذا العميل من مزودين أو الإدارة"
      >
        <span className="text-[13px]">🚨</span>
        <span className="font-bold">عالي المخاطرة</span>
        {!compact && showDescription && (
          <span className="text-[10px] text-rose-200/90 font-normal mr-0.5">
            (تنبيه: ملاحظات سابقة)
          </span>
        )}
      </div>
    );
  }

  // Default: 'new'
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm ${className}`}
      title="عميل جديد — يرجى استيفاء الضمانات القانونية وإيصال الأمانة المعتمد"
    >
      <span className="text-[13px]">⚠️</span>
      <span className="font-bold">عميل جديد</span>
      {!compact && showDescription && (
        <span className="text-[10px] text-amber-200/80 font-normal mr-0.5">
          (يرجى استيفاء الضمانات)
        </span>
      )}
    </div>
  );
}

export function ClientTrustBanner({
  trustLevel = 'new',
  completedRentals = 0,
}: {
  trustLevel?: ClientTrustLevel | string;
  completedRentals?: number;
}) {
  const normalizedLevel: ClientTrustLevel =
    trustLevel === 'trusted' || trustLevel === 'موثوق'
      ? 'trusted'
      : trustLevel === 'risky' || trustLevel === 'عالي المخاطرة' || trustLevel === 'خطر'
      ? 'risky'
      : 'new';

  const rentalsCount = Number(completedRentals) || 0;

  if (normalizedLevel === 'trusted') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2.5">
        <span className="text-xl">🛡️</span>
        <div>
          <strong className="block font-bold text-emerald-200">عميل موثوق ومعتمد</strong>
          <span className="text-[11px] text-emerald-300/80">
            أتم {rentalsCount} عمليات إيجار ناجحة بدون مخالفات مسجلة على المنصة.
          </span>
        </div>
      </div>
    );
  }

  if (normalizedLevel === 'risky') {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-3 text-xs text-rose-200 flex items-center gap-2.5 animate-pulse">
        <span className="text-xl">🚨</span>
        <div>
          <strong className="block font-bold text-rose-300">تحذير أمني ومخاطر عالية</strong>
          <span className="text-[11px] text-rose-200/90">
            تنبيه: توجد ملاحظات أو بلاغات سابقة على هذا العميل. يرجى توخي الحذر الشديد واستيفاء كافة العقود والضمانات.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200 flex items-center gap-2.5">
      <span className="text-xl">⚠️</span>
      <div>
        <strong className="block font-bold text-amber-300">عميل جديد بالمنصة</strong>
        <span className="text-[11px] text-amber-200/80">
          لم يسجل عمليات إيجار مكتملة سابقة — يرجى استيفاء الضمانات القانونية وبطاقة الرقم القومي سارية.
        </span>
      </div>
    </div>
  );
}
