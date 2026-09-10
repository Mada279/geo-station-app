import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section with top padding to flow behind fixed navbar */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          
          {/* 1. Giant Logo (Top) */}
          <div className="flex justify-center mb-6">
            <Image
              alt="Survsta Massive Logo"
              className="w-[300px] md:w-[450px] lg:w-[500px] h-auto object-contain drop-shadow-2xl"
              height={150}
              priority
              src="/images/Designer.png"
              width={450}
            />
          </div>

          {/* 2. Small Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs text-cyan-300 backdrop-blur-sm mb-6">
            <span>◎</span>
            <span>المنصة الرقمية المتخصصة لقطاع المساحة — مصر</span>
          </div>

          {/* 3. Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            كل ما تحتاجه في عالم المساحة،<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">
              في منصة واحدة.
            </span>
          </h1>

          {/* 4. Sub-heading */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            مكاتب وشركات المساحة، أجهزة للبيع والإيجار، مراكز معايرة وصيانة، خدمات ميدانية، دورات تدريبية وفرص عمل — كلها موثّقة ومرتبة حسب موقعك.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/directory"
              className="rounded-xl bg-cyan-500 px-6 py-3 text-base font-bold text-gray-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition"
            >
              استكشف الدليل
            </Link>
            <Link
              href="/equipment"
              className="rounded-xl border border-gray-700 bg-gray-900/80 px-6 py-3 text-base font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              سوق الأجهزة
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
