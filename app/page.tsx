import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#081933] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          
          {/* Two-Column Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[75vh]">
            
            {/* Right Column: lg:col-span-7 (RTL: Content & Search) */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              {/* Brand Typography Header with Electric Blue Accents */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-400 backdrop-blur-sm shadow-[0_0_20px_rgba(28,167,255,0.2)]">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d2ff]"></span>
                <span className="tracking-widest font-black">SURVSTA</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-200 font-medium">المنصة الرقمية المتخصصة لقطاع المساحة والهندسة</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.2]">
                كل ما تحتاجه في عالم المساحة،<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">
                  في منصة واحدة.
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl">
                المنصة الرقمية المتخصصة لقطاع المساحة والهندسة: مكاتب معتمدة، بيع وتأجير أجهزة Total Station وGNSS، مراكز معايرة، خدمات هندسية ميدانية، وتدريب ووظائف متجددة.
              </p>

              {/* Unified Search Component (Pill-style) */}
              <div className="rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-lg shadow-2xl">
                <form action="/directory" method="GET" className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 px-4 w-full">
                    <span className="text-cyan-400">🔍</span>
                    <input
                      name="q"
                      placeholder="ابحث عن جهاز، مكتب، خدمة..."
                      className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
                  <select name="gov" className="bg-transparent text-xs text-gray-200 px-3 py-2 rounded-lg focus:outline-none cursor-pointer w-full sm:w-auto">
                    <option value="" className="bg-[#081933] text-white">كل المحافظات</option>
                    <option value="الإسكندرية" className="bg-[#081933] text-white">الإسكندرية</option>
                    <option value="القاهرة" className="bg-[#081933] text-white">القاهرة</option>
                    <option value="الجيزة" className="bg-[#081933] text-white">الجيزة</option>
                  </select>
                  <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
                  <select name="type" className="bg-transparent text-xs text-gray-200 px-3 py-2 rounded-lg focus:outline-none cursor-pointer w-full sm:w-auto">
                    <option value="" className="bg-[#081933] text-white">كل الفئات</option>
                    <option value="offices" className="bg-[#081933] text-white">مكاتب المساحة</option>
                    <option value="suppliers" className="bg-[#081933] text-white">موردو الأجهزة</option>
                    <option value="calibration" className="bg-[#081933] text-white">مراكز المعايرة</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full sm:w-auto rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-bold text-gray-950 shadow-md shadow-cyan-400/30 hover:bg-cyan-300 transition"
                  >
                    بحث
                  </button>
                </form>
              </div>

              {/* Category Badges Row Beneath Search Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="text-xs font-semibold text-gray-400">تصفح سريع:</span>
                <Link
                  href="/directory?type=offices"
                  className="rounded-full border border-cyan-500/20 bg-[#0F253E]/80 px-3.5 py-1.5 text-xs text-gray-300 hover:border-cyan-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <span>🏢</span>
                  <span>مكاتب المساحة</span>
                </Link>
                <Link
                  href="/equipment"
                  className="rounded-full border border-cyan-500/20 bg-[#0F253E]/80 px-3.5 py-1.5 text-xs text-gray-300 hover:border-cyan-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <span>📡</span>
                  <span>أجهزة ومعدات</span>
                </Link>
                <Link
                  href="/services"
                  className="rounded-full border border-cyan-500/20 bg-[#0F253E]/80 px-3.5 py-1.5 text-xs text-gray-300 hover:border-cyan-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <span>🧭</span>
                  <span>خدمات</span>
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full border border-cyan-500/20 bg-[#0F253E]/80 px-3.5 py-1.5 text-xs text-gray-300 hover:border-cyan-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <span>💼</span>
                  <span>وظائف</span>
                </Link>
              </div>

              {/* Gateway Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Link
                  href="/login"
                  className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-400/25 hover:bg-cyan-300 hover:shadow-cyan-400/40 transition-all"
                >
                  🔐 تسجيل الدخول
                </Link>
                <Link
                  href="/admin"
                  className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all backdrop-blur-sm"
                >
                  🛡️ لوحة الإدارة
                </Link>
                <Link
                  href="/provider/dashboard"
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all backdrop-blur-sm"
                >
                  📊 بوابة المزوّد
                </Link>
                <Link
                  href="/join"
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
                >
                  ✨ انضم كشريك
                </Link>
              </div>

            </div>

            {/* Left Column: lg:col-span-5 (Task 2: Clean, Transparent Visual Anchor with ONLY the Large Survsta Image) */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              <Image
                alt="Survsta Platform"
                className="w-full max-w-[500px] object-contain drop-shadow-2xl"
                height={350}
                priority
                src="/images/Designer.png"
                width={500}
              />
            </div>

          </div>

          {/* 3. Floating Stats Bar (Glassmorphic counter card with 4 columns) */}
          <div className="mt-14 rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-6 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/10">
              <div className="pt-4 md:pt-0">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400">+50</div>
                <div className="text-sm font-semibold text-gray-300 mt-1">محافظة</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400">+320</div>
                <div className="text-sm font-semibold text-gray-300 mt-1">مكتب مساحة</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400">+1,100</div>
                <div className="text-sm font-semibold text-gray-300 mt-1">خدمة متاحة</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400">+4,800</div>
                <div className="text-sm font-semibold text-gray-300 mt-1">مستخدم مسجل</div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
