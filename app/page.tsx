import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#081933] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
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

            </div>

            {/* Left Column: lg:col-span-5 (Visual Anchor with Radial Glow) */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              {/* Neon Radial Glow */}
              <div className="absolute -inset-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1CA7FF]/25 via-cyan-500/10 to-transparent blur-3xl pointer-events-none"></div>

              {/* High-Tech Container */}
              <div className="relative z-10 w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0F253E]/90 to-[#081933]/95 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-950/50">
                
                {/* Live Sensor Stream Header */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-semibold text-emerald-300">Live Sensor Stream</span>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] text-cyan-300">
                    RTK FIXED: ±1mm
                  </span>
                </div>

                {/* 3D Hologram Surveying Asset */}
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#0E2A47]/80 to-[#040E1C]/90 p-4 flex items-center justify-center overflow-hidden">
                  <Image
                    alt="Survsta 3D Hologram Surveying Platform"
                    className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
                    height={260}
                    priority
                    src="/images/Designer.png"
                    width={450}
                  />
                  <div className="absolute bottom-3 right-3 rounded-lg border border-cyan-500/30 bg-[#081933]/90 px-2.5 py-1 text-[11px] text-gray-200 backdrop-blur-md flex items-center gap-1.5">
                    <span className="text-cyan-400">📡</span> Total Station + Drone 3D
                  </div>
                </div>

                {/* Telemetry Sub-metrics */}
                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                    <div className="text-[11px] text-gray-400">دقة القياس</div>
                    <div className="text-sm font-bold text-cyan-400 mt-0.5">Sub-cm</div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                    <div className="text-[11px] text-gray-400">تغطية الأقمار</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">Full GNSS</div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                    <div className="text-[11px] text-gray-400">المسح السحابي</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">LiDAR 3D</div>
                  </div>
                </div>

              </div>
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
