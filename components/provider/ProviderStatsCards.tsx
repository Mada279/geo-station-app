'use client';

import React from 'react';
import Link from 'next/link';

interface ProviderStatsCardsProps {
  isLoading: boolean;
  totalRevenue: number;
  completedOrdersCount: number;
  uploadedEquipmentCount: number;
  requestsCount: number;
  newRequestsToday: number;
  profileViews: number;
  rating: number | null;
  reviewCount: number;
}

export default function ProviderStatsCards({
  isLoading,
  totalRevenue,
  completedOrdersCount,
  uploadedEquipmentCount,
  requestsCount,
  newRequestsToday,
  profileViews,
  rating,
  reviewCount,
}: ProviderStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Revenue Card */}
      <Link
        id="tour-revenue-card"
        href="/provider/analytics"
        className="rounded-2xl border border-white/5 bg-[#0A192F] p-4 backdrop-blur-md hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.08)] transition-all group block cursor-pointer"
      >
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span className="group-hover:text-emerald-300 transition font-semibold">إجمالي الإيرادات</span>
          <span className="text-emerald-400 text-lg group-hover:scale-110 transition">💰</span>
        </div>
        <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight dir-ltr text-right">
          {isLoading ? (
            <span className="inline-block w-16 h-7 bg-white/10 animate-pulse rounded"></span>
          ) : (
            `${totalRevenue.toLocaleString('en-US')} EGP`
          )}
        </div>
        <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center justify-between">
          <span className="truncate">
            {completedOrdersCount > 0 ? `من ${completedOrdersCount} طلبات مكتملة` : 'عرض تقارير الأرباح'}
          </span>
          <span className="group-hover:translate-x-[-3px] transition font-bold shrink-0">←</span>
        </div>
      </Link>

      {/* 2. Equipment Count Card */}
      <div className="rounded-2xl border border-white/5 bg-[#0A192F] p-4 backdrop-blur-md hover:border-amber-500/30 transition-all">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span className="font-semibold text-gray-300">معداتك المنشورة</span>
          <span className="text-amber-400 text-lg">📡</span>
        </div>
        <div className="text-2xl font-black text-amber-300 font-mono tracking-tight dir-ltr text-right">
          {isLoading ? (
            <span className="inline-block w-12 h-7 bg-white/10 animate-pulse rounded"></span>
          ) : (
            `${uploadedEquipmentCount}`
          )}
        </div>
        <div className="text-[11px] text-gray-400 mt-1">
          {uploadedEquipmentCount === 1 ? 'جهاز معروض للطلب' : uploadedEquipmentCount === 2 ? 'جهازان معروضان' : 'أجهزة معروضة للطلب'}
        </div>
      </div>

      {/* 3. Incoming Orders Card */}
      <Link
        id="tour-inbox-card"
        href="/provider/orders"
        className="rounded-2xl border border-white/5 bg-[#0A192F] p-4 backdrop-blur-md hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(40,199,216,0.08)] transition-all group block cursor-pointer"
      >
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span className="group-hover:text-cyan-300 transition font-semibold">صندوق الطلبات الواردة</span>
          <span className="text-cyan-400 text-lg group-hover:scale-110 transition">📥</span>
        </div>
        <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight dir-ltr text-right">
          {isLoading ? (
            <span className="inline-block w-12 h-7 bg-white/10 animate-pulse rounded"></span>
          ) : (
            `${requestsCount}`
          )}
        </div>
        <div className="text-[11px] text-cyan-400 mt-1 flex items-center justify-between">
          <span className="truncate">
            {newRequestsToday > 0 ? `▲ ${newRequestsToday} جديدة اليوم` : 'فتح صندوق الطلبات'}
          </span>
          <span className="group-hover:translate-x-[-3px] transition font-bold shrink-0">←</span>
        </div>
      </Link>

      {/* 4. Profile Views Card */}
      <Link
        href="/provider/analytics"
        className="rounded-2xl border border-white/5 bg-[#0A192F] p-4 backdrop-blur-md hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.08)] transition-all group block cursor-pointer"
      >
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span className="group-hover:text-purple-300 transition font-semibold">مشاهدات الملف</span>
          <span className="text-purple-400 text-lg group-hover:scale-110 transition">👁️</span>
        </div>
        <div className="text-2xl font-black text-purple-400 font-mono tracking-tight dir-ltr text-right">
          {isLoading ? (
            <span className="inline-block w-14 h-7 bg-white/10 animate-pulse rounded"></span>
          ) : (
            profileViews.toLocaleString('en-US')
          )}
        </div>
        <div className="text-[11px] text-purple-400/90 mt-1 flex items-center justify-between">
          <span className="truncate">
            {profileViews > 0 ? 'من شركات ومساحين' : 'فتح تقارير التحليلات'}
          </span>
          <span className="group-hover:translate-x-[-3px] transition font-bold shrink-0">←</span>
        </div>
      </Link>

      {/* 5. Provider Rating Card */}
      <Link
        href="/provider/reviews"
        className="rounded-2xl border border-white/5 bg-[#0A192F] p-4 backdrop-blur-md hover:border-yellow-500/40 hover:shadow-[0_0_25px_rgba(234,179,8,0.08)] transition-all group block cursor-pointer"
      >
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span className="group-hover:text-yellow-300 transition font-semibold">تقييم المزوّد</span>
          <span className="text-yellow-400 text-lg group-hover:scale-110 transition">⭐</span>
        </div>
        <div className="text-2xl font-black text-yellow-400 font-mono tracking-tight dir-ltr text-right">
          {isLoading ? (
            <span className="inline-block w-14 h-7 bg-white/10 animate-pulse rounded"></span>
          ) : rating !== null && rating > 0 ? (
            `${rating.toFixed(1)} / 5.0`
          ) : (
            '5.0 / 5.0'
          )}
        </div>
        <div className="text-[11px] text-yellow-400/90 mt-1 flex items-center justify-between">
          <span className="truncate">
            {reviewCount > 0 ? `${reviewCount} تقييم معتمد` : 'سجل تقييمات العملاء'}
          </span>
          <span className="group-hover:translate-x-[-3px] transition font-bold shrink-0">←</span>
        </div>
      </Link>
    </div>
  );
}
