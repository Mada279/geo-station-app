'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface MapProvider {
  id: number;
  name: string;
  type: string;
  gov: string;
  city: string;
  lat: number;
  lng: number;
  rate: number;
  reviews: number;
  phone: string;
  services: string[];
}

const MAP_PROVIDERS: MapProvider[] = [
  {
    id: 1,
    name: 'مكتب النخبة للمساحة',
    type: 'مكتب مساحة معتمد',
    gov: 'الإسكندرية',
    city: 'سموحة',
    lat: 31.2156,
    lng: 29.9553,
    rate: 4.8,
    reviews: 64,
    phone: '01012345678',
    services: ['رفع مساحي', 'تقسيم أراضي', 'حصر كميات'],
  },
  {
    id: 2,
    name: 'دلتا جيوماتكس',
    type: 'شركة مساحة',
    gov: 'القاهرة',
    city: 'مدينة نصر',
    lat: 30.0626,
    lng: 31.3468,
    rate: 4.6,
    reviews: 118,
    phone: '01123456789',
    services: ['مسح ليزري 3D', 'As-Built', 'مسح Drone'],
  },
  {
    id: 3,
    name: 'النيل لأجهزة المساحة',
    type: 'مورد أجهزة',
    gov: 'القاهرة',
    city: 'وسط البلد',
    lat: 30.0444,
    lng: 31.2357,
    rate: 4.4,
    reviews: 87,
    phone: '01234567890',
    services: ['بيع وتأجير Total Station', 'صيانة GNSS'],
  },
  {
    id: 4,
    name: 'مركز الدقة للمعايرة',
    type: 'مركز معايرة',
    gov: 'الجيزة',
    city: 'الهرم',
    lat: 29.9972,
    lng: 31.1518,
    rate: 4.9,
    reviews: 39,
    phone: '01512345678',
    services: ['معايرة Total Station', 'موازين قامة', 'شهادات معتمدة'],
  },
  {
    id: 5,
    name: 'جيو أكاديمي مصر',
    type: 'مركز تدريب',
    gov: 'الإسكندرية',
    city: 'العصافرة',
    lat: 31.2721,
    lng: 30.0074,
    rate: 4.7,
    reviews: 52,
    phone: '01098765432',
    services: ['Civil 3D', 'تدريب RTK ميداني', 'GIS'],
  },
  {
    id: 6,
    name: 'الغرب للخدمات المساحية',
    type: 'مكتب مساحة',
    gov: 'البحيرة',
    city: 'دمنهور',
    lat: 31.0379,
    lng: 30.4689,
    rate: 4.5,
    reviews: 28,
    phone: '01187654321',
    services: ['رفع أراضي زراعية', 'توقيع مباني', 'ميزانيات شبكية'],
  },
];

export default function MapPage() {
  const [selectedGov, setSelectedGov] = useState('الكل');
  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(MAP_PROVIDERS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProviders = MAP_PROVIDERS.filter((p) => {
    const matchGov = selectedGov === 'الكل' || p.gov === selectedGov;
    const matchQuery = !searchQuery || p.name.includes(searchQuery) || p.city.includes(searchQuery);
    return matchGov && matchQuery;
  });

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Header Banner */}
      <section className="bg-[#081933] text-white py-10 lg:py-12 border-b border-cyan-500/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-cyan-400 text-xs font-semibold mb-1">الرئيسية / الخريطة</div>
            <h1 className="text-2xl sm:text-3xl font-black">مستكشف الخريطة التفاعلية</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              استكشف مكاتب المساحة ومراكز المعايرة وموردي الأجهزة جغرافياً حسب محافظتك وموقعك الميداني.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedGov('الإسكندرية');
                setSelectedProvider(MAP_PROVIDERS[0]);
              }}
              className="rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2 text-xs font-bold transition shadow"
            >
              📍 الإسكندرية
            </button>
            <button
              onClick={() => {
                setSelectedGov('القاهرة');
                setSelectedProvider(MAP_PROVIDERS[1]);
              }}
              className="rounded-lg bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-bold transition border border-white/20"
            >
              📍 القاهرة
            </button>
            <button
              onClick={() => {
                setSelectedGov('الجيزة');
                setSelectedProvider(MAP_PROVIDERS[3]);
              }}
              className="rounded-lg bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-bold transition border border-white/20"
            >
              📍 الجيزة
            </button>
          </div>
        </div>
      </section>

      {/* 2. Interactive Map Layout */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Sidebar: Controls & Filter List */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">تصفية المواقع</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">المحافظة</label>
                    <select
                      value={selectedGov}
                      onChange={(e) => setSelectedGov(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-2.5 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="الكل">كل المحافظات</option>
                      <option value="الإسكندرية">الإسكندرية</option>
                      <option value="القاهرة">القاهرة</option>
                      <option value="الجيزة">الجيزة</option>
                      <option value="البحيرة">البحيرة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">بحث سريع</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اسم المكتب أو الحي..."
                      className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Provider cards scroll */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredProviders.map((p) => {
                  const isSelected = selectedProvider?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#081933] text-white border-[#081933] shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-cyan-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-bold ${isSelected ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          {p.type}
                        </span>
                        <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          📍 {p.gov} — {p.city}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{p.name}</h4>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="text-amber-400 font-bold">★ {p.rate}</span>
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                          ({p.reviews} تقييم)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.services.map((s, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/15 text-slate-200'
                                : 'bg-[#f4f7fa] text-slate-600 border border-slate-200'
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Map Canvas & Details Panel (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative h-[420px] sm:h-[500px] bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                {/* Simulated Interactive Map with High-Resolution OpenStreetMap Embed */}
                <iframe
                  title="خريطة مواقع المكاتب المساحية"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={
                    selectedProvider
                      ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedProvider.lng - 0.08}%2C${selectedProvider.lat - 0.05}%2C${selectedProvider.lng + 0.08}%2C${selectedProvider.lat + 0.05}&layer=mapnik&marker=${selectedProvider.lat}%2C${selectedProvider.lng}`
                      : 'https://www.openstreetmap.org/export/embed.html?bbox=29.5%2C29.8%2C32.0%2C31.5&layer=mapnik'
                  }
                  className="w-full h-full filter contrast-105"
                ></iframe>

                {/* Map Floating Indicator Badge */}
                {selectedProvider && (
                  <div className="absolute top-4 right-4 bg-[#081933]/95 text-white p-4 rounded-xl shadow-xl border border-cyan-500/30 backdrop-blur-md max-w-xs text-xs">
                    <div className="text-cyan-400 font-bold mb-1">{selectedProvider.type}</div>
                    <div className="font-extrabold text-sm mb-1">{selectedProvider.name}</div>
                    <div className="text-slate-300 mb-2">📍 {selectedProvider.gov}، {selectedProvider.city}</div>
                    <div className="flex gap-2">
                      <Link
                        href="/contact"
                        className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-3 py-1.5 rounded text-xs transition"
                      >
                        طلب تواصل
                      </Link>
                      <a
                        href={`https://www.google.com/maps?q=${selectedProvider.lat},${selectedProvider.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold px-3 py-1.5 rounded text-xs transition"
                      >
                        فتح في خرائط Google
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Selected Details Bar */}
              {selectedProvider && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">الجهة المحددة حالياً على الخريطة:</span>
                    <span className="font-black text-slate-900 text-base">{selectedProvider.name}</span>
                    <span className="text-xs text-cyan-700 mr-3 font-semibold">({selectedProvider.city}، {selectedProvider.gov})</span>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/directory?q=${encodeURIComponent(selectedProvider.name)}`}
                      className="text-xs text-slate-700 hover:text-cyan-700 border border-slate-300 px-4 py-2 rounded-lg font-bold transition"
                    >
                      عرض في الدليل
                    </Link>
                    <Link
                      href="/contact"
                      className="text-xs bg-[#081933] hover:bg-[#0F253E] text-white px-5 py-2 rounded-lg font-bold transition"
                    >
                      طلب تسعير فوري
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
