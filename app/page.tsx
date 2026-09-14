import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800">
      
      {/* 1. Hero Section (Dark Navy #081933) */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-14 lg:py-20 border-b border-cyan-500/15">
        {/* Subtle Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden">
          <Image
            alt="Surveying Engineering Background"
            className="object-cover w-full h-full"
            fill
            priority
            src="/assets/img/hero-engineering-office.jpg"
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-12">
          
          {/* Two-Column Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[65vh]">
            
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

              {/* Unified Search Component (Pill-style with glassmorphism) */}
              <div className="rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-xl shadow-2xl">
                <form action="/directory" method="GET" className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <div className="flex flex-1 items-center gap-2.5 px-4 w-full">
                    <span className="text-cyan-400 text-base">🔍</span>
                    <input
                      name="q"
                      placeholder="ابحث عن جهاز، مكتب، خدمة، أو تخصص..."
                      className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="h-6 w-px bg-white/20 hidden sm:block shrink-0"></div>

                  {/* Category Dropdown - Styled Translucent Dark Glass */}
                  <div className="w-full sm:w-auto">
                    <select
                      name="type"
                      className="w-full sm:w-auto bg-black/30 text-white border border-white/20 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 cursor-pointer transition"
                    >
                      <option value="" className="bg-[#081933] text-white">كل الفئات</option>
                      <option value="offices" className="bg-[#081933] text-white">مكاتب المساحة</option>
                      <option value="companies" className="bg-[#081933] text-white">شركات المساحة</option>
                      <option value="suppliers" className="bg-[#081933] text-white">موردو الأجهزة</option>
                      <option value="calibration" className="bg-[#081933] text-white">مراكز المعايرة</option>
                      <option value="services" className="bg-[#081933] text-white">خدمات مساحية</option>
                    </select>
                  </div>

                  <div className="h-6 w-px bg-white/20 hidden sm:block shrink-0"></div>

                  {/* Location Dropdown - Styled Translucent Dark Glass */}
                  <div className="w-full sm:w-auto">
                    <select
                      name="gov"
                      className="w-full sm:w-auto bg-black/30 text-white border border-white/20 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 cursor-pointer transition"
                    >
                      <option value="" className="bg-[#081933] text-white">كل المحافظات</option>
                      <option value="الإسكندرية" className="bg-[#081933] text-white">الإسكندرية</option>
                      <option value="القاهرة" className="bg-[#081933] text-white">القاهرة</option>
                      <option value="الجيزة" className="bg-[#081933] text-white">الجيزة</option>
                      <option value="البحيرة" className="bg-[#081933] text-white">البحيرة</option>
                      <option value="مطروح" className="bg-[#081933] text-white">مطروح</option>
                      <option value="الدقهلية" className="bg-[#081933] text-white">الدقهلية</option>
                      <option value="الشرقية" className="bg-[#081933] text-white">الشرقية</option>
                      <option value="الغربية" className="bg-[#081933] text-white">الغربية</option>
                    </select>
                  </div>

                  {/* Cyan Search Button */}
                  <button
                    type="submit"
                    className="w-full sm:w-auto rounded-full bg-[#00d2ff] hover:bg-cyan-300 px-7 py-2.5 text-sm font-extrabold text-[#041527] shadow-[0_0_18px_rgba(0,210,255,0.4)] transition shrink-0 whitespace-nowrap"
                  >
                    بحـث
                  </button>
                </form>
              </div>

              {/* Clean Quick Browse Tags Row - Perfectly Aligned, No Awkward Breaking */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
                <span className="font-semibold text-slate-400 shrink-0">تصفح سريع:</span>
                <Link
                  href="/directory?type=offices"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/25 bg-[#0F253E]/80 text-slate-200 hover:border-cyan-400 hover:text-white hover:bg-[#0F253E] transition shadow-sm shrink-0 whitespace-nowrap"
                >
                  <span className="text-sm">🏢</span>
                  <span>مكاتب المساحة</span>
                </Link>
                <Link
                  href="/equipment"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/25 bg-[#0F253E]/80 text-slate-200 hover:border-cyan-400 hover:text-white hover:bg-[#0F253E] transition shadow-sm shrink-0 whitespace-nowrap"
                >
                  <span className="text-sm">📐</span>
                  <span>أجهزة ومعدات</span>
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/25 bg-[#0F253E]/80 text-slate-200 hover:border-cyan-400 hover:text-white hover:bg-[#0F253E] transition shadow-sm shrink-0 whitespace-nowrap"
                >
                  <span className="text-sm">🛠️</span>
                  <span>خدمات</span>
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/25 bg-[#0F253E]/80 text-slate-200 hover:border-cyan-400 hover:text-white hover:bg-[#0F253E] transition shadow-sm shrink-0 whitespace-nowrap"
                >
                  <span className="text-sm">💼</span>
                  <span>وظائف</span>
                </Link>
              </div>
            </div>

            {/* Left Column: lg:col-span-5 (Visual Anchor with Large Survsta Image) */}
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

          {/* Floating Stats Bar */}
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

      {/* 2. Categories Section (استكشف المنصة) */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider block mb-1">استكشف المنصة</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">ابدأ من الفئة التي تناسب احتياجك</h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                ستة مسارات رئيسية تغطي منظومة المساحة كاملة — من الجهة المنفّذة حتى الجهاز والتدريب والوظيفة.
              </p>
            </div>
            <Link
              href="/directory"
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition flex items-center gap-1 group whitespace-nowrap"
            >
              <span>كل الدليل</span>
              <span className="transition-transform group-hover:-translate-x-1">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category 1 */}
            <Link
              href="/directory?type=offices"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-cyan-500 transition-all group duration-200"
            >
              <div className="text-3xl mb-4 p-3 w-fit rounded-xl bg-cyan-50 border border-cyan-100 group-hover:scale-110 transition-transform">🏢</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">مكاتب المساحة</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">مكاتب متخصصة في الرفع المساحي والتقسيم وحصر الكميات.</p>
              <div className="text-cyan-700 text-xs font-semibold mt-4 flex items-center gap-1">
                <span>جهة مسجّلة</span>
                <span>←</span>
              </div>
            </Link>

            {/* Category 2 */}
            <Link
              href="/directory?type=companies"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-cyan-500 transition-all group duration-200"
            >
              <div className="text-3xl mb-4 p-3 w-fit rounded-xl bg-cyan-50 border border-cyan-100 group-hover:scale-110 transition-transform">🏗️</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">شركات المساحة</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">شركات بقدرات تنفيذية وفرق ومعدات متعددة ومشاريع كبرى.</p>
              <div className="text-cyan-700 text-xs font-semibold mt-4 flex items-center gap-1">
                <span>جهة مسجّلة</span>
                <span>←</span>
              </div>
            </Link>

            {/* Category 3 */}
            <Link
              href="/directory?type=suppliers"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-cyan-500 transition-all group duration-200"
            >
              <div className="text-3xl mb-4 p-3 w-fit rounded-xl bg-cyan-50 border border-cyan-100 group-hover:scale-110 transition-transform">📦</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">موردو الأجهزة</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">بيع وتأجير أجهزة المساحة وقطع الغيار والملحقات الهندسية.</p>
              <div className="text-cyan-700 text-xs font-semibold mt-4 flex items-center gap-1">
                <span>جهة مسجّلة</span>
                <span>←</span>
              </div>
            </Link>

            {/* Category 4 */}
            <Link
              href="/directory?type=calibration"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-cyan-500 transition-all group duration-200"
            >
              <div className="text-3xl mb-4 p-3 w-fit rounded-xl bg-cyan-50 border border-cyan-100 group-hover:scale-110 transition-transform">🛠️</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">مراكز المعايرة</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">معايرة وصيانة الأجهزة وإصدار الشهادات الفنية المعتمدة.</p>
              <div className="text-cyan-700 text-xs font-semibold mt-4 flex items-center gap-1">
                <span>مركز معتمد</span>
                <span>←</span>
              </div>
            </Link>

            {/* Category 5 */}
            <Link
              href="/equipment"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-500 transition-all group duration-200"
            >
              <div className="text-3xl mb-4 p-3 w-fit rounded-xl bg-amber-50 border border-amber-100 group-hover:scale-110 transition-transform">📡</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">سوق الأجهزة</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">Total Station وGNSS وScanners وDrones للبيع أو الإيجار اليومي والشهري.</p>
              <div className="text-amber-700 text-xs font-semibold mt-4 flex items-center gap-1">
                <span>عروض متاحة</span>
                <span>←</span>
              </div>
            </Link>

            {/* Category 6 */}
            <Link
              href="/jobs"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-cyan-500 transition-all group duration-200"
            >
              <div className="text-3xl mb-4 p-3 w-fit rounded-xl bg-cyan-50 border border-cyan-100 group-hover:scale-110 transition-transform">💼</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">الوظائف</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">فرص للمسّاحين والمساعدين ومحللي GIS وفنيي الصيانة بالمواقع.</p>
              <div className="text-cyan-700 text-xs font-semibold mt-4 flex items-center gap-1">
                <span>وظائف شاغرة</span>
                <span>←</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Featured Verified Providers (الأكثر طلباً) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider block mb-1">الأكثر طلباً</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">مكاتب وشركات مميّزة</h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                الظهور المميّز موضّح دائمًا بشارة، ولا يلغي معايير الصلة والتقييم والتوثيق.
              </p>
            </div>
            <Link
              href="/directory"
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition flex items-center gap-1 group whitespace-nowrap"
            >
              <span>عرض كل المزوّدين</span>
              <span className="transition-transform group-hover:-translate-x-1">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Provider 1 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  alt="مكتب النخبة للمساحة"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={200}
                  src="/assets/img/hero-engineering-office.jpg"
                  width={400}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="rounded-md bg-[#F4B400] text-black px-2 py-0.5 text-xs font-black shadow-sm">
                    ⭐ مميّز
                  </span>
                  <span className="rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                    مكتب مساحة
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    مكتب النخبة للمساحة
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>📍 الإسكندرية — سموحة</span>
                    <span>•</span>
                    <span>منذ 2012</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-amber-500 text-sm">★★★★★</span>
                    <span className="text-xs font-semibold text-slate-700">4.8 (64 تقييم)</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">رفع مساحي طبوغرافي</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">تقسيم وفرز أراضي</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">حصر كميات</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">✔ ملف موثّق</span>
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">✔ نشاط موثّق</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">⏱ يرد خلال ساعة</span>
                  <Link
                    href="/directory"
                    className="rounded-lg bg-[#081933] hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition"
                  >
                    طلب تواصل
                  </Link>
                </div>
              </div>
            </article>

            {/* Provider 2 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  alt="دلتا جيوماتكس"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={200}
                  src="/assets/img/office-survey-team.jpg"
                  width={400}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="rounded-md bg-[#F4B400] text-black px-2 py-0.5 text-xs font-black shadow-sm">
                    ⭐ مميّز
                  </span>
                  <span className="rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                    شركة مساحة
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    دلتا جيوماتكس
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>📍 القاهرة — مدينة نصر</span>
                    <span>•</span>
                    <span>منذ 2008</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-amber-500 text-sm">★★★★☆</span>
                    <span className="text-xs font-semibold text-slate-700">4.6 (118 تقييم)</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">مسح ليزري ثلاثي الأبعاد</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">As-Built</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">نمذجة BIM</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">✔ ملف موثّق</span>
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">✔ نشاط موثّق</span>
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">✔ معدات موثّقة</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">⏱ يرد خلال 3 ساعات</span>
                  <Link
                    href="/directory"
                    className="rounded-lg bg-[#081933] hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition"
                  >
                    طلب تواصل
                  </Link>
                </div>
              </div>
            </article>

            {/* Provider 3 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  alt="النيل لأجهزة المساحة"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={200}
                  src="/assets/img/survey-instruments-studio.jpg"
                  width={400}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                    مورد أجهزة
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    النيل لأجهزة المساحة
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>📍 القاهرة — وسط البلد</span>
                    <span>•</span>
                    <span>منذ 2015</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-amber-500 text-sm">★★★★☆</span>
                    <span className="text-xs font-semibold text-slate-700">4.4 (87 تقييم)</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">بيع أجهزة جديدة</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">تأجير مرن</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">قطع غيار وملحقات</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">✔ ملف موثّق</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">⏱ يرد خلال يوم</span>
                  <Link
                    href="/directory"
                    className="rounded-lg bg-[#081933] hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition"
                  >
                    طلب تواصل
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4. Featured Equipment Marketplace (سوق الأجهزة) */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider block mb-1">Marketplace</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">أجهزة معروضة للبيع والإيجار</h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                مع بيانات الحالة والموديل وحالة المعايرة كما وردت من المزوّد.
              </p>
            </div>
            <Link
              href="/equipment"
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition flex items-center gap-1 group whitespace-nowrap"
            >
              <span>سوق الأجهزة</span>
              <span className="transition-transform group-hover:-translate-x-1">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Equipment 1 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  alt="Leica TS16 Total Station"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={200}
                  src="/assets/img/leica-ts16-product.jpg"
                  width={400}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="rounded-md bg-slate-900 text-white px-2 py-0.5 text-xs font-bold">إيجار</span>
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                    متاح الآن
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    Leica TS16 Total Station
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">Total Station • Leica • 📍 الإسكندرية</div>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">مستعمل — ممتاز</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">موديل 2021</span>
                  </div>
                  <div className="mt-3 text-lg font-bold text-slate-900">
                    500 <span className="text-xs font-normal text-slate-500">جنيه / يوم</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    المزوّد: <span className="text-cyan-700 font-semibold">مكتب النخبة للمساحة</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href="/equipment"
                    className="block w-full text-center rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-xs font-bold transition"
                  >
                    طلب تواصل
                  </Link>
                </div>
              </div>
            </article>

            {/* Equipment 2 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  alt="Topcon GT-1200 روبوتيك"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={200}
                  src="/assets/img/topcon-gt1200-product.jpg"
                  width={400}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="rounded-md bg-amber-500 text-black px-2 py-0.5 text-xs font-bold">بيع</span>
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                    متاح
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    Topcon GT-1200 روبوتيك
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">Total Station • Topcon • 📍 القاهرة</div>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">جديد</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">موديل 2025</span>
                  </div>
                  <div className="mt-3 text-lg font-bold text-slate-900">
                    حسب العرض
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    المزوّد: <span className="text-cyan-700 font-semibold">النيل لأجهزة المساحة</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href="/equipment"
                    className="block w-full text-center rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-xs font-bold transition"
                  >
                    طلب تواصل
                  </Link>
                </div>
              </div>
            </article>

            {/* Equipment 3 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  alt="طقم GNSS RTK — Stonex S900"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={200}
                  src="/assets/img/stonex-s900-product.jpg"
                  width={400}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="rounded-md bg-slate-900 text-white px-2 py-0.5 text-xs font-bold">إيجار</span>
                  <span className="rounded-md bg-amber-500 text-black px-2 py-0.5 text-xs font-bold">بيع</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    طقم GNSS RTK — Stonex S900
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">GNSS / RTK • Stonex • 📍 الجيزة</div>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">مستعمل — جيد جدًا</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs">موديل 2022</span>
                  </div>
                  <div className="mt-3 text-lg font-bold text-slate-900">
                    حسب المدة
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    المزوّد: <span className="text-cyan-700 font-semibold">النيل لأجهزة المساحة</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href="/equipment"
                    className="block w-full text-center rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-xs font-bold transition"
                  >
                    طلب تواصل
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section (كيف تعمل المنصة) */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Steps Column */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider block">كيف تعمل المنصة</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                من البحث إلى التواصل في أربع خطوات
              </h2>
              
              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">ابحث وحدّد موقعك</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      اكتب ما تحتاجه واختر المحافظة، أو استخدم «بالقرب مني» للحصول على الأقرب.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">قارن بثقة</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      راجع الخدمات والأجهزة والتقييمات ومستوى التوثيق وزمن الرد لكل جهة.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">اطلب تواصل</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      تُنشئ المنصة طلبًا موثّقًا ويصل فورًا لصندوق المزوّد المناسب.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">اتفق ونفّذ</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      الاتفاق والتنفيذ يتمّان مباشرة بينك وبين الجهة، ثم تقيّم التجربة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#081933] text-white px-6 py-3 text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
                >
                  <span>تفاصيل أكثر عن آلية العمل</span>
                  <span>←</span>
                </Link>
              </div>
            </div>

            {/* Visual Column */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <Image
                  alt="أعمال مساحة واستخدام GNSS في موقع عمل"
                  className="w-full h-[400px] object-cover"
                  height={500}
                  src="/assets/img/gnss-earthworks-site.jpg"
                  width={600}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Services Showcase (الخدمات) */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider block mb-1">الخدمات</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">خدمات مساحية يقدّمها شركاء المنصة</h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                اختر الخدمة لعرض الجهات القادرة على تنفيذها داخل نطاقك الجغرافي.
              </p>
            </div>
            <Link
              href="/services"
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition flex items-center gap-1 group whitespace-nowrap"
            >
              <span>كل الخدمات</span>
              <span className="transition-transform group-hover:-translate-x-1">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service 1 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  alt="رفع مساحي طبوغرافي"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={150}
                  src="/assets/img/totalstation-construction-crane.jpg"
                  width={300}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">🗺️</div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    رفع مساحي طبوغرافي
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">مساحة أرضية</div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed line-clamp-2">
                    رفع تفصيلي للمناسيب ومعالم الموقع وإخراج خرائط كنتورية ومقاطع طولية وعرضية.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
                    24 جهة مقدّمة
                  </span>
                  <Link href="/services" className="text-xs font-semibold text-slate-700 hover:text-cyan-700 transition">
                    التفاصيل ←
                  </Link>
                </div>
              </div>
            </article>

            {/* Service 2 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  alt="مسح ليزري ثلاثي الأبعاد"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={150}
                  src="/assets/img/trimble-sx-kit.jpg"
                  width={300}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">🔦</div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    مسح ليزري ثلاثي الأبعاد
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">Reality Capture</div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed line-clamp-2">
                    توثيق المنشآت القائمة بسحابة نقاط عالية الكثافة وإنتاج مخططات As-Built ونماذج BIM.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
                    9 جهات مقدّمة
                  </span>
                  <Link href="/services" className="text-xs font-semibold text-slate-700 hover:text-cyan-700 transition">
                    التفاصيل ←
                  </Link>
                </div>
              </div>
            </article>

            {/* Service 3 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  alt="مسح بالطائرات بدون طيار"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={150}
                  src="/assets/img/drone-orthophoto-site.jpg"
                  width={300}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">🚁</div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    مسح بالطائرات بدون طيار
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">Aerial Survey</div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed line-clamp-2">
                    تغطية جوية سريعة للمساحات الكبيرة مع إنتاج أورثوفوتو ونماذج ارتفاع رقمية.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
                    12 جهة مقدّمة
                  </span>
                  <Link href="/services" className="text-xs font-semibold text-slate-700 hover:text-cyan-700 transition">
                    التفاصيل ←
                  </Link>
                </div>
              </div>
            </article>

            {/* Service 4 */}
            <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  alt="تقسيم وفرز أراضي"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  height={150}
                  src="/assets/img/drone-subdivision-aerial.jpg"
                  width={300}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">📋</div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                    تقسيم وفرز أراضي
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">مساحة قانونية</div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed line-clamp-2">
                    إعداد مخططات التقسيم والفرز وحساب المساحات وتجهيز المستندات المساحية المطلوبة.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded px-2 py-0.5">
                    18 جهة مقدّمة
                  </span>
                  <Link href="/services" className="text-xs font-semibold text-slate-700 hover:text-cyan-700 transition">
                    التفاصيل ←
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 7. Dual Section: Academy (قريباً) + Latest Jobs (أحدث الفرص) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left: Academy */}
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider">Academy</span>
                  <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    قريباً
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">تعلّم واتقن أدوات المهنة</h2>
                <p className="text-slate-600 text-sm mt-1">
                  دورات تطبيقية من مراكز تدريب شريكة — قيد الإعداد والإطلاق قريباً.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Course 1 */}
                <article className="rounded-2xl border border-slate-200 bg-[#f4f7fa] overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      alt="Civil 3D للمساحين"
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      height={160}
                      src="/assets/img/gis-blueprints-desk.jpg"
                      width={320}
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                        متوسط
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                        Civil 3D للمساحين
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-1">جيو أكاديمي مصر • 18 ساعة</div>
                      <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                        إنشاء السطوح والمحاور والمقاطع وحساب الكميات على مشروع طريق كامل من البداية للتسليم.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">3,500 جنيه</span>
                      <Link href="/academy" className="text-xs text-slate-500 hover:text-cyan-700 transition font-medium">
                        تفاصيل الدورة
                      </Link>
                    </div>
                  </div>
                </article>

                {/* Course 2 */}
                <article className="rounded-2xl border border-slate-200 bg-[#f4f7fa] overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500 transition-all flex flex-col">
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      alt="تشغيل GNSS RTK ميدانيًا"
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      height={160}
                      src="/assets/img/gnss-monument-hilltop.jpg"
                      width={320}
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="rounded-md bg-slate-900/80 text-white px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                        مبتدئ
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                        تشغيل GNSS RTK ميدانيًا
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-1">جيو أكاديمي مصر • 12 ساعة</div>
                      <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                        ضبط Base وRover، الاتصال بشبكات التصحيح، الرفع والتوقيع، ومعالجة الأخطاء الشائعة.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">2,200 جنيه</span>
                      <Link href="/academy" className="text-xs text-slate-500 hover:text-cyan-700 transition font-medium">
                        تفاصيل الدورة
                      </Link>
                    </div>
                  </div>
                </article>
              </div>

              <div className="mt-6">
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition"
                >
                  <span>استكشف الأكاديمية (قريباً)</span>
                  <span>←</span>
                </Link>
              </div>
            </div>

            {/* Right: Latest Jobs */}
            <div>
              <div className="mb-8">
                <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider block mb-1">وظائف</span>
                <h2 className="text-2xl font-bold text-slate-900">أحدث الفرص في السوق</h2>
                <p className="text-slate-600 text-sm mt-1">
                  منشورة من مكاتب وشركات معتمدة بعد مراجعة الإدارة.
                </p>
              </div>

              <div className="space-y-4">
                {/* Job 1 */}
                <article className="rounded-2xl border border-slate-200 bg-[#f4f7fa] p-5 hover:border-cyan-500 hover:bg-white transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                      مسّاح موقع — مشروع سكني
                    </h3>
                    <span className="rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 text-xs font-semibold">
                      دوام كامل
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    مكتب النخبة للمساحة • 📍 الإسكندرية • خبرة 3-5 سنوات
                  </div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                    مسؤول عن الرفع المساحي وتوقيع المحاور ومتابعة أعمال التنفيذ اليومية بالموقع وإعداد التقارير الدورية.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">🕒 منذ يومين • 💰 يُحدد بعد المقابلة</span>
                    <Link
                      href="/jobs"
                      className="rounded-lg bg-white border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs"
                    >
                      تقديم سريع
                    </Link>
                  </div>
                </article>

                {/* Job 2 */}
                <article className="rounded-2xl border border-slate-200 bg-[#f4f7fa] p-5 hover:border-cyan-500 hover:bg-white transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                      محلل نظم معلومات جغرافية GIS
                    </h3>
                    <span className="rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 text-xs font-semibold">
                      دوام كامل
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    دلتا جيوماتكس • 📍 القاهرة • خبرة 2-4 سنوات
                  </div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                    إعداد قواعد بيانات مكانية وخرائط تحليلية للمشروعات ودعم فرق التصميم بالبيانات الجغرافية.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">🕒 منذ 4 أيام • 💰 تنافسي</span>
                    <Link
                      href="/jobs"
                      className="rounded-lg bg-white border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs"
                    >
                      تقديم سريع
                    </Link>
                  </div>
                </article>

                {/* Job 3 */}
                <article className="rounded-2xl border border-slate-200 bg-[#f4f7fa] p-5 hover:border-cyan-500 hover:bg-white transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors">
                      مساعد مسّاح
                    </h3>
                    <span className="rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 text-xs font-semibold">
                      عقد مشروع
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    الغرب للخدمات المساحية • 📍 البحيرة • خبرة سنة فأكثر
                  </div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                    دعم فريق الرفع الميداني وتجهيز المعدات ومساعدة المسّاح في القياسات والتوقيع.
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">🕒 منذ أسبوع • 💰 يومية + بدل انتقال</span>
                    <Link
                      href="/jobs"
                      className="rounded-lg bg-white border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs"
                    >
                      تقديم سريع
                    </Link>
                  </div>
                </article>
              </div>

              <div className="mt-6">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition"
                >
                  <span>كل الوظائف</span>
                  <span>←</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Trust Value Proposition Band */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-base font-bold text-slate-900">توثيق متدرّج</h3>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                شارات تعكس فقط ما تمّت مراجعته فعليًا — بدون ادعاءات.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-base font-bold text-slate-900">نتائج قائمة على الموقع</h3>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                بحث بالمحافظة والمدينة ونطاق الخدمة والأقرب إليك.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-base font-bold text-slate-900">رد سريع</h3>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                متوسط زمن الرد ظاهر على كل ملف قبل ما تتواصل.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-base font-bold text-slate-900">خصوصية بياناتك</h3>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                لا تُشارك بياناتك إلا مع الجهة التي تختارها بموافقتك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Provider CTA Band */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-[#0a2033] to-[#12455f] text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                للمكاتب والشركات والموردين
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                اعرض خدماتك وأجهزتك أمام من يبحث عنها فعلًا
              </h2>
              <p className="text-slate-200 text-sm leading-relaxed">
                سجّل جهتك مجانًا، أضف خدماتك ومعداتك، واستقبل طلبات تواصل حقيقية من عملاء داخل نطاق عملك — مع لوحة تحكم ومؤشرات أداء.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/join"
                  className="rounded-xl bg-[#F4B400] text-black px-6 py-3 text-sm font-bold shadow-md hover:brightness-110 transition"
                >
                  سجّل جهتك مجانًا
                </Link>
                <Link
                  href="/about"
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                >
                  كيف يعمل حساب المزوّد؟
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image
                alt="محطة مساحية متكاملة في موقع إنشاءات"
                className="w-72 h-48 object-cover rounded-2xl border border-cyan-500/30 shadow-xl"
                height={200}
                src="/assets/img/totalstation-construction-crane.jpg"
                width={300}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 10. Need Request CTA Band */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="rounded-3xl border border-slate-200 bg-[#f4f7fa] p-8 md:p-12 shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                عندك احتياج محدد؟ خلّي المزوّدين يوصلوك
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                اكتب احتياجك مرة واحدة، وتوجّهه Survsta للمكاتب والشركات المؤهلة في نطاقك الجغرافي — مجانًا وبدون التزام.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/join"
                className="rounded-xl bg-[#F4B400] px-6 py-3 text-sm font-bold text-gray-950 shadow-md hover:brightness-110 transition"
              >
                أضف احتياجك
              </Link>
              <Link
                href="/join"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
              >
                انضم كشريك
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

