'use client';

import React from 'react';

interface ProviderWalletSectionProps {
  balance: number;
  onOpenTopUp: () => void;
}

export default function ProviderWalletSection({
  balance,
  onOpenTopUp,
}: ProviderWalletSectionProps) {
  return (
    <div
      id="wallet"
      className="rounded-2xl border border-white/5 bg-[#0A192F] p-6 sm:p-8 shadow-card-soft transition duration-300 hover:border-emerald-500/20 scroll-mt-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Balance Display & Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-base">
              💳
            </span>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                الرصيد المالي المتاح
              </span>
              <h3 className="text-lg font-bold text-white">محفظة المزود (Provider Wallet)</h3>
            </div>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <span
              dir="ltr"
              className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white"
            >
              {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              EGP (جنيه مصري)
            </span>
          </div>

          <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
            يُستخدم رصيد المحفظة لترقية وتثبيت الأجهزة في صدارة البحث، تفعيل الإعلانات المميزة، وسداد رسوم المعاملات بدون أي تأخير.
          </p>
        </div>

        {/* Quick Actions & Payment Methods */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenTopUp}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <span>⚡</span>
            <span>شحن المحفظة الآن</span>
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
            <span>طرق الشحن المدعومة:</span>
            <span className="text-gray-300 font-semibold">Vodafone Cash • InstaPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
