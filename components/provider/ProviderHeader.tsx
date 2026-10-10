'use client';

import React from 'react';
import Link from 'next/link';
import InstallPwaButton from '@/components/InstallPwaButton';

interface ProviderHeaderProps {
  walletBalance: number;
  providerProfile: {
    name: string;
    org: string;
    location: string;
  };
  onOpenWalletModal: () => void;
  onRestartTour: () => void;
}

export default function ProviderHeader({
  walletBalance,
  providerProfile,
  onOpenWalletModal,
  onRestartTour,
}: ProviderHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/5 pb-5">
      {/* Action Buttons & Quick Nav */}
      <div className="order-2 lg:order-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Wallet Top-Up Button */}
        <button
          id="tour-wallet-button"
          type="button"
          onClick={onOpenWalletModal}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/50 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-300 transition shadow-card-soft cursor-pointer"
          title="شحن رصيد المحفظة عبر فودافون كاش أو إنستاباي"
        >
          <span>💳</span>
          <span dir="ltr" className="font-mono">
            {walletBalance.toLocaleString('en-US')} EGP
          </span>
          <span>شحن المحفظة</span>
        </button>

        {/* Report Stolen Device shortcut */}
        <a
          href="#stolen-registry"
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-950/25 hover:bg-rose-900/40 px-3.5 py-2 text-xs font-bold text-rose-300 transition"
        >
          <span>🚨</span>
          <span>سجل السرقات</span>
        </a>

        {/* Restart Tour button */}
        <button
          id="tour-restart-button"
          type="button"
          onClick={onRestartTour}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0A192F] hover:bg-[#0F2444] px-3.5 py-2 text-xs font-bold text-cyan-300 transition cursor-pointer"
        >
          <span>🧭</span>
          <span>جولة تعريفية</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0A192F] px-3.5 py-2 text-xs text-gray-300 hover:text-white transition"
        >
          <span>🌐</span>
          <span>الموقع العام</span>
        </Link>

        <InstallPwaButton variant="navbar" />
      </div>

      {/* Provider Title & Organization Badge */}
      <div className="order-1 lg:order-2">
        <div className="flex items-center gap-2 justify-start lg:justify-end">
          <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
            ✓ مزوّد معتمد وموثّق
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white">بوابة المزوّد — لوحة التحكم</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 justify-start lg:justify-end flex-wrap leading-relaxed">
          <span>{providerProfile.org} • {providerProfile.name}</span>
          <Link
            href="/provider/locations"
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 ms-1 transition"
            title="تعديل وتحديد المحافظات المغطاة"
          >
            <span>📍</span>
            <span>{providerProfile.location || 'تحديد التغطية الجغرافية'}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
