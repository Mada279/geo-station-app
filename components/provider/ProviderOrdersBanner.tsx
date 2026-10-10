'use client';

import React from 'react';
import Link from 'next/link';

export default function ProviderOrdersBanner() {
  return (
    <div
      id="leads"
      className="rounded-2xl border border-white/5 bg-[#0A192F] p-6 shadow-card-soft scroll-mt-6 hover:border-cyan-500/20 transition duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold">
            <span>📥 مركز العمليات والطلبات</span>
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>صندوق الطلبات الواردة (Incoming Orders)</span>
          </h3>
          <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
            استقبل وأدِر طلبات الاستئجار والشراء وحجوزات الخدمات المساحية المرسلة من العملاء. يمكنك مراجعة تفاصيل كل طلب، تحديث حالته، والتواصل مباشرة عبر واتساب.
          </p>
        </div>
        <Link
          href="/provider/orders"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 transition shrink-0 cursor-pointer"
        >
          <span>فتح وإدارة صندوق الطلبات</span>
          <span dir="ltr">←</span>
        </Link>
      </div>
    </div>
  );
}
