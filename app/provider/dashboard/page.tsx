'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProviderOnboardingTour from '@/components/ProviderOnboardingTour';

interface EquipmentItem {
  id: string;
  title: string;
  category: string;
  dailyRate: string;
  monthlyRate: string;
  status: 'متاح للإيجار' | 'قيد الصيانة' | 'محجوز';
  photo: string;
}

const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'EQ-301',
    title: 'محطة رصد متكاملة Leica FlexLine TS07 (1 ثانية)',
    category: 'توتال ستيشن',
    dailyRate: '1,500 ج.م',
    monthlyRate: '28,000 ج.م',
    status: 'متاح للإيجار',
    photo: 'total_station_leica.jpg',
  },
  {
    id: 'EQ-302',
    title: 'طقم مستقبل أقمار صناعية CHC i73 GNSS RTK Base & Rover',
    category: 'أجهزة GNSS/RTK',
    dailyRate: '1,800 ج.م',
    monthlyRate: '32,000 ج.م',
    status: 'متاح للإيجار',
    photo: 'chc_i73_gnss.png',
  },
  {
    id: 'EQ-303',
    title: 'ميزان قامة رقمي دقيق Sokkia SDL30 مع قامات باركود',
    category: 'موازين قامة',
    dailyRate: '600 ج.م',
    monthlyRate: '9,500 ج.م',
    status: 'متاح للإيجار',
    photo: 'sokkia_sdl30.jpg',
  },
];

export default function ProviderDashboardPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [runTour, setRunTour] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('توتال ستيشن');
  const [newDailyPrice, setNewDailyPrice] = useState('');
  const [newMonthlyPrice, setNewMonthlyPrice] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(['Leica_TS07_HD.jpg']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Callback from ProviderOnboardingTour when step advances
  const handleTourStepChange = (stepIndex: number) => {
    // Steps 1, 2, 3 target elements inside the Add Modal
    if (stepIndex >= 1) {
      setIsModalOpen(true);
    }
  };

  const handleRestartTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('survsta_provider_tour_seen', 'manual_run');
    }
    setRunTour(false);
    setIsModalOpen(false);
    setTimeout(() => {
      setTourKey((prev) => prev + 1);
      setRunTour(true);
      showToast('🧭 بدأت الجولة التعريفية التفاعلية.');
    }, 150);
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('يرجى إدخال اسم الجهاز أو الخدمة');
      return;
    }
    const item: EquipmentItem = {
      id: `EQ-${Math.floor(300 + Math.random() * 700)}`,
      title: newTitle,
      category: newCategory,
      dailyRate: newDailyPrice ? `${newDailyPrice} ج.م` : '1,200 ج.م',
      monthlyRate: newMonthlyPrice ? `${newMonthlyPrice} ج.م` : '22,000 ج.م',
      status: 'متاح للإيجار',
      photo: uploadedPhotos[0] || 'device_sample.jpg',
    };
    setEquipment((prev) => [item, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDailyPrice('');
    setNewMonthlyPrice('');
    showToast('🎉 تم نشر الجهاز بنجاح وظهر في دليل المنصة لآلاف العملاء!');
  };

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8">
      {/* Interactive Joyride Tour Component Mounted inside Dashboard */}
      <ProviderOnboardingTour
        key={tourKey}
        runTour={runTour}
        onStepChange={handleTourStepChange}
        onTourEnd={() => {
          // If modal was opened purely for the tour, we can leave it or close it
        }}
      />

      <div className="mx-auto max-w-7xl space-y-6">

        {/* Dashboard Topbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div className="flex items-center gap-3">
            
            {/* Step 1 Target: Add Device/Service button */}
            <button
              id="tour-add-button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] px-5 py-2.5 text-sm font-bold text-[#081933] shadow-lg shadow-cyan-500/20 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <span>+</span>
              <span>إضافة جهاز أو خدمة جديدة</span>
            </button>

            {/* Restart Tour button */}
            <button
              type="button"
              onClick={handleRestartTour}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs sm:text-sm font-semibold text-cyan-300 hover:bg-[#163659] transition"
              title="إعادة تشغيل الجولة الإرشادية"
            >
              <span>🧭</span>
              <span>جولة تعريفية (Tour)</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 px-3.5 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition"
            >
              <span>🌐</span>
              <span>الموقع العام</span>
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-end">
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                ✓ مزوّد معتمد وموثّق
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">بوابة المزوّد — لوحة التحكم</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              مكتب النخبة للمساحة • م. أحمد النجار (الإسكندرية — تغطية شاملة)
            </p>
          </div>
        </div>

        {/* Dashboard KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>الأجهزة والخدمات النشطة</span>
              <span className="text-cyan-400 text-lg">📡</span>
            </div>
            <div className="text-2xl font-black text-cyan-300">{equipment.length} أجهزة</div>
            <div className="text-[11px] text-gray-400 mt-1">معروضة للبيع والتأجير المباشر</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات التواصل الواردة</span>
              <span className="text-amber-400 text-lg">📥</span>
            </div>
            <div className="text-2xl font-black text-amber-400">14 طلب</div>
            <div className="text-[11px] text-gray-400 mt-1">▲ 4 طلبات جديدة اليوم</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>مشاهدات الملف هذا الشهر</span>
              <span className="text-purple-400 text-lg">👁️</span>
            </div>
            <div className="text-2xl font-black text-purple-400">1,420</div>
            <div className="text-[11px] text-gray-400 mt-1">من مهندسين وشركات مقاولات</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>تقييم المزوّد</span>
              <span className="text-yellow-400 text-lg">⭐</span>
            </div>
            <div className="text-2xl font-black text-yellow-400">4.9 / 5.0</div>
            <div className="text-[11px] text-gray-400 mt-1">بناءً على 24 مراجعة معتمدة</div>
          </div>
        </div>

        {/* Equipment Listing Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              قائمة المعدات والأجهزة المعروضة في حسابك — يمكنك تعديل الأسعار أو إضافة معدات جديدة في أي وقت.
            </span>
            <span className="text-xs font-semibold text-cyan-400">
              إجمالي الأجهزة: {equipment.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-[#0F253E]/60 shadow-xl backdrop-blur-md">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-cyan-500/20 bg-[#081933]/90 text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم الكود</th>
                  <th className="px-4 py-3 font-semibold">اسم الجهاز / المعدة</th>
                  <th className="px-4 py-3 font-semibold">الفئة</th>
                  <th className="px-4 py-3 font-semibold">السعر اليومي</th>
                  <th className="px-4 py-3 font-semibold">السعر الشهري</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 text-gray-200">
                {equipment.map((item) => (
                  <tr key={item.id} className="hover:bg-[#163659]/40 transition">
                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold">{item.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span>📷 {item.photo}</span>
                        <span>• معايرة سارية</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] text-cyan-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {item.dailyRate}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {item.monthlyRate}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10.5px] font-semibold">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => showToast(`تعديل بيانات الجهاز ${item.id}`)}
                        className="rounded-lg border border-cyan-500/30 bg-[#0F253E] px-2.5 py-1 text-[11px] text-cyan-300 hover:bg-[#1CA7FF] hover:text-[#081933] transition"
                      >
                        تعديل السعر
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ADD DEVICE / SERVICE MODAL (CONTAINS STEP 2, 3, 4 TARGETS FOR JOYRIDE)    */}
        {/* ========================================================================= */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-[#0F253E] p-6 sm:p-8 shadow-2xl space-y-5 text-right my-8">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
                >
                  ✕
                </button>
                <div>
                  <h3 className="text-lg font-black text-white">إضافة جهاز أو خدمة جديدة للمنصة</h3>
                  <p className="text-xs text-cyan-400 mt-1">
                    أدخل مواصفات الجهاز وصوره والأسعار المقترحة للظهور الفوري أمام العملاء
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveDevice} className="space-y-4">
                
                {/* Device Title & Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    اسم الجهاز والموديل *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: محطة رصد متكاملة Leica FlexLine TS07"
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#1CA7FF] focus:outline-none focus:ring-1 focus:ring-[#1CA7FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      فئة الجهاز
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2.5 text-sm text-white focus:border-[#1CA7FF] focus:outline-none focus:ring-1 focus:ring-[#1CA7FF]"
                    >
                      <option value="توتال ستيشن">توتال ستيشن Total Station</option>
                      <option value="أجهزة GNSS/RTK">مستقبلات GPS / GNSS RTK</option>
                      <option value="موازين قامة">موازين قامة Levels</option>
                      <option value="أجهزة ليزر">أجهزة قياس وتوجيه ليزر</option>
                      <option value="طائرات درون">طائرات درون مساحية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      حالة الجهاز
                    </label>
                    <select
                      className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2.5 text-sm text-white focus:border-[#1CA7FF] focus:outline-none focus:ring-1 focus:ring-[#1CA7FF]"
                    >
                      <option>ممتازة — كالجديد</option>
                      <option>جيدة جداً مع شهادة معايرة</option>
                      <option>جديد بالكرتونة والضمان</option>
                    </select>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 2 TARGET: UPLOAD PHOTO AREA (#tour-upload-area)                      */}
                {/* ========================================================================= */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    صور الأجهزة والمعدات *
                  </label>
                  <div
                    id="tour-upload-area"
                    className="rounded-xl border-2 border-dashed border-cyan-500/40 bg-[#081933]/90 p-5 text-center cursor-pointer hover:border-[#1CA7FF] hover:bg-[#081933] transition"
                    onClick={() => {
                      setUploadedPhotos((prev) => [...prev, `Photo_${Date.now().toString().slice(-4)}.jpg`]);
                      showToast('تمت إضافة صورة تجريبية للمعدة');
                    }}
                  >
                    <div className="text-3xl mb-1">📸</div>
                    <div className="text-xs font-bold text-[#1CA7FF]">
                      اضغط هنا لرفع صور حقيقية للجهاز (أو اسحب الملفات هنا)
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      الصور الواضحة تزيد من ثقة العملاء وفرص التأجير. ارفع صوراً حقيقية للأجهزة.
                    </p>
                    
                    {/* Photos tags */}
                    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                      {uploadedPhotos.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded bg-[#0F253E] border border-cyan-500/30 px-2 py-0.5 text-[10.5px] text-cyan-200">
                          <span>📷 {p}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* STEP 3 TARGET: PRICE INPUT (#tour-price-input)                            */}
                {/* ========================================================================= */}
                <div id="tour-price-input" className="p-3 rounded-xl border border-cyan-500/30 bg-[#081933]/60 space-y-2">
                  <label className="block text-xs font-bold text-white">
                    تحديد سعر التأجير / البيع *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">السعر اليومي (ج.م)</span>
                      <input
                        type="number"
                        value={newDailyPrice}
                        onChange={(e) => setNewDailyPrice(e.target.value)}
                        placeholder="مثال: 1200"
                        className="w-full rounded-xl border border-cyan-500/40 bg-[#0F253E] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-[#1CA7FF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">السعر الشهري (ج.م)</span>
                      <input
                        type="number"
                        value={newMonthlyPrice}
                        onChange={(e) => setNewMonthlyPrice(e.target.value)}
                        placeholder="مثال: 22000"
                        className="w-full rounded-xl border border-cyan-500/40 bg-[#0F253E] px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-[#1CA7FF] focus:outline-none"
                      />
                    </div>
                  </div>
                  <span className="text-[10.5px] text-cyan-400 block">
                    * حدد السعر بدقة. يمكنك إضافة سعر يومي أو شهري لزيادة فرصك.
                  </span>
                </div>

                {/* ========================================================================= */}
                {/* STEP 4 TARGET: SAVE/PUBLISH BUTTON (#tour-save-button)                    */}
                {/* ========================================================================= */}
                <div className="pt-2 flex items-center justify-between border-t border-cyan-500/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    id="tour-save-button"
                    className="rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] px-7 py-2.5 text-sm font-bold text-[#081933] shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
                  >
                    حفظ ونشر العرض فوراً 🚀
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-cyan-500/40 bg-[#0F253E]/95 px-5 py-3 text-sm text-cyan-300 shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}
