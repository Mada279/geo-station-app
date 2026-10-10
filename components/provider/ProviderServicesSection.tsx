'use client';

import React, { useState } from 'react';
import { ProviderServiceItem } from './types';

interface ProviderServicesSectionProps {
  services: ProviderServiceItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSaveService: (service: { title: string; category: string; description?: string }) => Promise<boolean>;
  onDeleteService: (serviceId: string, title: string) => Promise<void>;
}

export default function ProviderServicesSection({
  services,
  isLoading,
  onRefresh,
  onSaveService,
  onDeleteService,
}: ProviderServicesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('مساحة أرضية');
  const [serviceDescription, setServiceDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle.trim()) return;

    setIsSaving(true);
    try {
      const ok = await onSaveService({
        title: serviceTitle.trim(),
        category: serviceCategory,
        description: serviceDescription.trim() || undefined,
      });

      if (ok) {
        setIsModalOpen(false);
        setServiceTitle('');
        setServiceCategory('مساحة أرضية');
        setServiceDescription('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 scroll-mt-6 pt-8 border-t border-amber-500/20" id="services">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1">
            <span>🧭 الخدمات المساحية والهندسية</span>
          </div>
          <h2 className="text-xl font-bold text-white">إدارة الخدمات المساحية المنشورة</h2>
          <p className="text-xs text-gray-400">
            أضف خدمات مكتبك المساحي (رفع، توقيع، ميزانية، كشف مرافق، مسح جوي) لتلقي طلبات عروض الأسعار.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-gray-400 hover:text-cyan-400 transition"
            title="تحديث البيانات"
          >
            🔄 تحديث
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition cursor-pointer"
          >
            <span>+</span>
            <span>إضافة خدمة جديدة</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-[#0A192F] border border-white/5 p-5 animate-pulse space-y-3">
              <div className="h-4 w-28 bg-white/10 rounded"></div>
              <div className="h-5 w-48 bg-white/10 rounded"></div>
              <div className="h-3 w-full bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && services.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0A192F] p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-2xl">
            🧭
          </div>
          <h3 className="text-base font-bold text-white">لم يتم إضافة خدمات مساحية بعد</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            الخدمات المساحية تُبرز كفاءة فريقك في الأعمال الميدانية والمكتبية وتتيح للشركات إسناد العقود لك مباشرة.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-2 text-xs font-bold hover:bg-cyan-500/30 transition cursor-pointer"
          >
            <span>+</span>
            <span>إضافة أول خدمة الآن</span>
          </button>
        </div>
      )}

      {/* Populated Services Grid */}
      {!isLoading && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/5 bg-[#0A192F] p-5 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(40,199,216,0.06)] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-cyan-500/10 text-cyan-300 px-2.5 py-0.5 text-[11px] font-bold border border-cyan-500/20">
                    {item.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteService(item.id, item.title)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition text-xs"
                    title="حذف الخدمة"
                  >
                    🗑️
                  </button>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  نشطة ومعروضة للعملاء
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#071324] p-6 shadow-2xl space-y-5 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">🧭</span>
                <h3 className="text-lg font-bold text-white">إضافة خدمة مساحية جديدة</h3>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  اسم الخدمة المساحية <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="مثال: رفع مساحي طبوغرافي، توقيع خنزيرة ومحاور، حساب كميات..."
                  className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  فئة وتصنيف الخدمة <span className="text-amber-400">*</span>
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="مساحة أرضية">مساحة أرضية (طبوغرافي، توقيع، ميزانية شبكية)</option>
                  <option value="مساحة قانونية">مساحة قانونية (فرز وتجنيب، شهر عقاري)</option>
                  <option value="خدمات فنية">خدمات فنية (معايرة أجهزة، صيانة وضبط)</option>
                  <option value="جيوفيزياء وهندسة">جيوفيزياء وهندسة (كشف مرافق GPR، جسات)</option>
                  <option value="Reality Capture">Reality Capture (مسح ليزري ثلاثي الأبعاد، BIM)</option>
                  <option value="Aerial Survey">Aerial Survey (تصوير ومسح جوي بالدرون)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  وصف تفصيلي للخدمة والمخرجات <span className="text-gray-500">(اختياري)</span>
                </label>
                <textarea
                  rows={3}
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="اكتب نبذة عن منهجية العمل، الأجهزة المستخدمة، والمخرجات المسلّمة (مثل ملفات CAD، تقارير معتمدة)..."
                  className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'جارٍ الحفظ في السحابة…' : 'حفظ ونشر الخدمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
