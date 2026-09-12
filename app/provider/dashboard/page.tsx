'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/utils/supabaseClient';

const ProviderOnboardingTour = dynamic(
  () => import('@/components/ProviderOnboardingTour'),
  { ssr: false }
);

interface EquipmentItem {
  id: string;
  title: string;
  category: string;
  dailyRate: string;
  monthlyRate: string;
  status: 'متاح للإيجار' | 'قيد الصيانة' | 'محجوز';
  photo: string;
  created_at?: string;
}

export default function ProviderDashboardPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [runTour, setRunTour] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('توتال ستيشن');
  const [newDailyPrice, setNewDailyPrice] = useState('');
  const [newMonthlyPrice, setNewMonthlyPrice] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(['total_station_leica.jpg']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch actual equipment data from Supabase
  const fetchEquipment = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ProviderDashboard] Supabase select error:', error.message);
        setFetchError('تعذر استرجاع الأجهزة من السحابة مؤقتاً.');
        setEquipment([]);
      } else if (data && data.length > 0) {
        const mapped: EquipmentItem[] = data.map((row) => ({
          id: row.id,
          title: row.title || 'جهاز مساحي',
          category: row.category || 'أجهزة ومعدات',
          dailyRate: row.daily_price ? `${Number(row.daily_price).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: row.monthly_price ? `${Number(row.monthly_price).toLocaleString('en-US')} ج.م` : '—',
          status: 'متاح للإيجار',
          photo: row.image_url || 'total_station_leica.jpg',
          created_at: row.created_at,
        }));
        setEquipment(mapped);
      } else {
        setEquipment([]);
      }
    } catch (err: any) {
      console.warn('[ProviderDashboard] Fetch exception:', err);
      setFetchError('حدث خطأ في الاتصال بقاعدة البيانات.');
      setEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Callback from ProviderOnboardingTour when step advances
  const handleTourStepChange = (stepIndex: number) => {
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

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('يرجى إدخال اسم الجهاز أو الخدمة');
      return;
    }

    setIsSaving(true);
    const photoUrl = uploadedPhotos[0] || 'total_station_leica.jpg';

    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([
          {
            title: newTitle.trim(),
            category: newCategory,
            daily_price: newDailyPrice ? parseFloat(newDailyPrice) : null,
            monthly_price: newMonthlyPrice ? parseFloat(newMonthlyPrice) : null,
            image_url: photoUrl,
          },
        ])
        .select();

      if (error) {
        console.warn('[ProviderDashboard] Insert error:', error.message);
        // Optimistic local update fallback
        const localItem: EquipmentItem = {
          id: `EQ-${Math.floor(300 + Math.random() * 700)}`,
          title: newTitle.trim(),
          category: newCategory,
          dailyRate: newDailyPrice ? `${Number(newDailyPrice).toLocaleString('en-US')} ج.م` : '1,200 ج.م',
          monthlyRate: newMonthlyPrice ? `${Number(newMonthlyPrice).toLocaleString('en-US')} ج.م` : '22,000 ج.م',
          status: 'متاح للإيجار',
          photo: photoUrl,
        };
        setEquipment((prev) => [localItem, ...prev]);
        showToast('⚠️ تم إضافة الجهاز محلياً (وضع عدم الاتصال بالسحابة)');
      } else if (data && data[0]) {
        const row = data[0];
        const addedItem: EquipmentItem = {
          id: row.id,
          title: row.title,
          category: row.category,
          dailyRate: row.daily_price ? `${Number(row.daily_price).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: row.monthly_price ? `${Number(row.monthly_price).toLocaleString('en-US')} ج.م` : '—',
          status: 'متاح للإيجار',
          photo: row.image_url || photoUrl,
          created_at: row.created_at,
        };
        setEquipment((prev) => [addedItem, ...prev]);
        showToast('🎉 تم حفظ ونشر الجهاز بنجاح في قاعدة البيانات الحية!');
      }

      setIsModalOpen(false);
      setNewTitle('');
      setNewDailyPrice('');
      setNewMonthlyPrice('');
    } catch (err: any) {
      console.warn('[ProviderDashboard] Save exception:', err);
      showToast('❌ تعذر حفظ الجهاز. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDevice = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف "${title}"؟`)) return;

    try {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) {
        console.warn('[ProviderDashboard] Delete error:', error);
      }
      setEquipment((prev) => prev.filter((item) => item.id !== id));
      showToast('🗑️ تم حذف الجهاز من القائمة.');
    } catch (err) {
      showToast('❌ تعذر الحذف حالياً.');
    }
  };

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8">
      {/* Interactive Joyride Tour Component */}
      <ProviderOnboardingTour
        key={tourKey}
        runTour={runTour}
        onStepChange={handleTourStepChange}
        onTourEnd={() => {}}
      />

      <div className="mx-auto max-w-7xl space-y-6">

        {/* Dashboard Topbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div className="flex items-center gap-3">
            {/* Step 1 Target: Add Device/Service button */}
            <button
              id="tour-add-button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-5 py-2.5 text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/20 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <span>+</span>
              <span>إضافة جهاز أو خدمة جديدة</span>
            </button>

            {/* Restart Tour button */}
            <button
              type="button"
              onClick={handleRestartTour}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-[#0F253E] px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-300 hover:bg-[#163659] transition"
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

        {/* Notice alert if fetch error */}
        {fetchError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center justify-between">
            <span>⚠️ {fetchError} تم تنشيط وضع العرض الاحتياطي.</span>
            <button
              onClick={fetchEquipment}
              className="underline text-amber-400 hover:text-white font-bold"
            >
              إعادة المحاولة 🔄
            </button>
          </div>
        )}

        {/* Dashboard KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>الأجهزة والخدمات النشطة</span>
              <span className="text-amber-400 text-lg">📡</span>
            </div>
            <div className="text-2xl font-black text-amber-300">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                `${equipment.length} أجهزة`
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">معروضة للبيع والتأجير المباشر</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات التواصل الواردة</span>
              <span className="text-cyan-400 text-lg">📥</span>
            </div>
            <div className="text-2xl font-black text-cyan-400">14 طلب</div>
            <div className="text-[11px] text-gray-400 mt-1">▲ 4 طلبات جديدة اليوم</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>مشاهدات الملف هذا الشهر</span>
              <span className="text-purple-400 text-lg">👁️</span>
            </div>
            <div className="text-2xl font-black text-purple-400">1,420</div>
            <div className="text-[11px] text-gray-400 mt-1">من مهندسين وشركات مقاولات</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>تقييم المزوّد</span>
              <span className="text-yellow-400 text-lg">⭐</span>
            </div>
            <div className="text-2xl font-black text-yellow-400">4.9 / 5.0</div>
            <div className="text-[11px] text-gray-400 mt-1">بناءً على 24 مراجعة معتمدة</div>
          </div>
        </div>

        {/* Equipment Listing Section */}
        <div className="space-y-4" id="equipment">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              قائمة المعدات والأجهزة المعروضة في حسابك — متصلة مباشرة بقاعدة بيانات Supabase.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEquipment}
                className="text-xs text-gray-400 hover:text-cyan-400 transition"
                title="تحديث البيانات"
              >
                🔄 تحديث
              </button>
              <span className="text-xs font-semibold text-amber-400">
                إجمالي الأجهزة: {equipment.length}
              </span>
            </div>
          </div>

          {/* Loading Skeleton State */}
          {isLoading && (
            <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/60 p-6 space-y-3">
              <div className="h-5 w-48 bg-gray-700/40 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-800/40 rounded-xl animate-pulse flex items-center justify-between px-4">
                    <div className="h-4 w-24 bg-gray-700/50 rounded"></div>
                    <div className="h-4 w-40 bg-gray-700/50 rounded"></div>
                    <div className="h-4 w-20 bg-gray-700/50 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State UI */}
          {!isLoading && equipment.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-500/30 bg-[#0F253E]/40 p-12 text-center space-y-4 shadow-xl backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl shadow-inner">
                📡
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">لا توجد أجهزة أو معدات مضافة حتى الآن</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  ابدأ بإضافة أول جهاز مساحي (توتال ستيشن، مستقبل GNSS، ميزان قامة) لعرضه فوراً في دليل المنصة وتلقي طلبات التأجير والشراء المباشرة.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-6 py-2.5 text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/25 hover:brightness-110 transition"
              >
                <span>+</span>
                <span>أضف أول جهاز الآن</span>
              </button>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && equipment.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-[#0F253E]/60 shadow-xl backdrop-blur-md">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-amber-500/20 bg-[#081933]/90 text-gray-300">
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
                <tbody className="divide-y divide-amber-500/10 text-gray-200">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-[#163659]/40 transition">
                      <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold truncate max-w-[100px]">
                        {item.id.length > 10 ? item.id.slice(0, 8) + '…' : item.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{item.title}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>📷 {item.photo}</span>
                          <span>• معايرة سارية</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-lg bg-cyan-500/10 text-cyan-300 px-2.5 py-1 text-[11px] font-medium border border-cyan-500/20">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-300">
                        {item.dailyRate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-300">
                        {item.monthlyRate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => showToast(`جارٍ فتح محرر أسعار ${item.title}`)}
                            className="rounded-lg border border-cyan-500/30 bg-[#0F253E] px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                          >
                            تعديل السعر
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(item.id, item.title)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                            title="حذف الجهاز"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add Device Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-[#081933] p-6 shadow-2xl space-y-5 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <h3 className="text-lg font-bold text-white">إضافة جهاز أو خدمة جديدة</h3>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDevice} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  اسم الجهاز والموديل <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Leica FlexLine TS07 (1 ثانية)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">الفئة والتصنيف</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="توتال ستيشن">توتال ستيشن (Total Station)</option>
                  <option value="أجهزة GNSS/RTK">أجهزة GNSS / RTK المتطورة</option>
                  <option value="موازين قامة">موازين قامة دقيقة ورقمية</option>
                  <option value="ماسحات ليزرية">ماسحات ليزرية 3D Terrestrial Laser</option>
                  <option value="درون ومسح جوي">طائرات بدون طيار مساحية (UAV/Drone)</option>
                  <option value="خدمات هندسية">خدمات رفع مساحي وميزانيات شبكية</option>
                </select>
              </div>

              {/* Step 2 Target: Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">صور المعدة الحقيقية</label>
                <div
                  id="tour-upload-area"
                  className="rounded-xl border-2 border-dashed border-amber-500/40 bg-[#0F253E]/50 p-4 text-center hover:border-amber-400 transition cursor-pointer"
                  onClick={() => {
                    setUploadedPhotos(['Leica_TS07_Live.jpg', 'Certificate_Calibration.pdf']);
                    showToast('📸 تم محاكاة رفع صورة الجهاز وشهادة المعايرة السارية');
                  }}
                >
                  <div className="text-2xl mb-1">📤</div>
                  <div className="text-xs font-semibold text-amber-300">اسحب الصور هنا أو اضغط للاستعراض</div>
                  <div className="text-[10px] text-gray-400 mt-1">الصور الواضحة الميدانية ترفع نسبة التأجير بنسبة 85%</div>
                  {uploadedPhotos.length > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ✓ {uploadedPhotos.length} ملفات جاهزة للنشر
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 Target: Pricing Inputs */}
              <div id="tour-price-input" className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0F253E]/40 border border-gray-800">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    السعر اليومي (ج.م)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 1500"
                    value={newDailyPrice}
                    onChange={(e) => setNewDailyPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-[#081933] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    السعر الشهري (ج.م)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 25000"
                    value={newMonthlyPrice}
                    onChange={(e) => setNewMonthlyPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-[#081933] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 4 Target: Publish Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
                >
                  إلغاء
                </button>
                <button
                  id="tour-save-button"
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-50"
                >
                  {isSaving ? 'جارٍ الحفظ في السحابة…' : 'حفظ ونشر الجهاز مباشرة'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-amber-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
