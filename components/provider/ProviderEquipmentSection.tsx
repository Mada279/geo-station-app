'use client';

import React, { useState, useRef } from 'react';
import { EquipmentItem } from './types';
import { MASTER_CATALOG, MasterCatalogItem } from '@/data/masterCatalog';
import { supabase } from '@/utils/supabaseClient';

interface ProviderEquipmentSectionProps {
  equipment: EquipmentItem[];
  isLoading: boolean;
  uploadedEquipmentCount: number;
  onRefresh: () => void;
  onSaveDevice: (device: {
    title: string;
    category: string;
    brand: string;
    description?: string;
    dailyPrice: number;
    monthlyPrice: number;
    salePrice?: number;
    serialNumber: string;
    photoUrl?: string;
  }) => Promise<boolean>;
  onDeleteDevice: (id: string, title: string) => Promise<void>;
  onUpdatePrice: (id: string, dailyPrice: number, monthlyPrice: number) => Promise<boolean>;
}

export default function ProviderEquipmentSection({
  equipment,
  isLoading,
  uploadedEquipmentCount,
  onRefresh,
  onSaveDevice,
  onDeleteDevice,
  onUpdatePrice,
}: ProviderEquipmentSectionProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  // Add Device Form state
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(MASTER_CATALOG[0]?.id || '');
  const [customTitle, setCustomTitle] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [newDailyPrice, setNewDailyPrice] = useState('');
  const [newMonthlyPrice, setNewMonthlyPrice] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Price Form state
  const [editDailyPrice, setEditDailyPrice] = useState('');
  const [editMonthlyPrice, setEditMonthlyPrice] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const selectedItem: MasterCatalogItem | undefined = MASTER_CATALOG.find(
    (item) => item.id === selectedCatalogId
  );

  const handleSelectCatalogItem = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    if (catalogId !== 'other-unlisted') {
      setCustomTitle('');
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `equipment/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(filePath, file);

      if (uploadError) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedPhotos([e.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('equipment-photos')
          .getPublicUrl(filePath);
        setUploadedPhotos([publicUrlData.publicUrl]);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedPhotos([e.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOpenEditPrice = (item: EquipmentItem) => {
    setEditingItem(item);
    setEditDailyPrice(item.dailyRate.replace(/\D/g, '') || '');
    setEditMonthlyPrice(item.monthlyRate.replace(/\D/g, '') || '');
  };

  const handleSaveEditPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdatingPrice(true);
    try {
      const daily = Number(editDailyPrice) || 0;
      const monthly = Number(editMonthlyPrice) || 0;
      const ok = await onUpdatePrice(editingItem.id, daily, monthly);
      if (ok) {
        setEditingItem(null);
      }
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleSaveDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem && selectedCatalogId !== 'other-unlisted') return;
    if (!serialNumber.trim()) return;

    setIsSaving(true);
    try {
      const resolvedTitle =
        selectedCatalogId === 'other-unlisted' && customTitle.trim()
          ? customTitle.trim()
          : selectedItem?.title || 'جهاز مساحي';

      const resolvedCategory = selectedItem?.category || 'أخرى';
      const resolvedBrand = selectedItem?.brand || 'Survsta';
      const resolvedDesc = selectedItem?.description || '';

      const daily = Number(newDailyPrice) || 0;
      const monthly = Number(newMonthlyPrice) || 0;
      const sale = newSalePrice ? Number(newSalePrice) : undefined;

      const ok = await onSaveDevice({
        title: resolvedTitle,
        category: resolvedCategory,
        brand: resolvedBrand,
        description: resolvedDesc,
        dailyPrice: daily,
        monthlyPrice: monthly,
        salePrice: sale,
        serialNumber: serialNumber.trim(),
        photoUrl: uploadedPhotos[0] || selectedItem?.image,
      });

      if (ok) {
        setIsModalOpen(false);
        setSerialNumber('');
        setNewDailyPrice('');
        setNewMonthlyPrice('');
        setNewSalePrice('');
        setUploadedPhotos([]);
        setCustomTitle('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 scroll-mt-6" id="equipment">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          قائمة المعدات والأجهزة المعروضة في حسابك — متصلة مباشرة بقاعدة بيانات Supabase.
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-gray-400 hover:text-cyan-400 transition"
            title="تحديث البيانات"
          >
            🔄 تحديث
          </button>
          <span className="text-xs font-semibold text-amber-400">
            إجمالي الأجهزة: {uploadedEquipmentCount}
          </span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-3.5 py-1.5 text-xs font-bold text-[#081933] shadow-md hover:brightness-110 transition"
          >
            <span>+</span>
            <span>إضافة جهاز</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="rounded-2xl border border-white/5 bg-[#0A192F] p-6 space-y-3">
          <div className="h-5 w-48 bg-white/10 rounded animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-white/5 rounded-xl animate-pulse flex items-center justify-between px-4"
              >
                <div className="h-4 w-24 bg-white/10 rounded"></div>
                <div className="h-4 w-40 bg-white/10 rounded"></div>
                <div className="h-4 w-20 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State UI */}
      {!isLoading && equipment.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0A192F] p-12 text-center space-y-4 shadow-xl backdrop-blur-md">
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
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-6 py-2.5 text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/25 hover:brightness-110 transition cursor-pointer"
          >
            <span>+</span>
            <span>أضف أول جهاز الآن</span>
          </button>
        </div>
      )}

      {/* Populated Table */}
      {!isLoading && equipment.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0A192F] shadow-xl backdrop-blur-md">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-white/5 bg-[#071324] text-gray-300">
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
            <tbody className="divide-y divide-white/5 text-gray-200">
              {equipment.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold truncate max-w-[100px] dir-ltr text-right">
                    {item.id.length > 10 ? item.id.slice(0, 8) + '…' : item.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.salePrice && (
                        <span className="rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold dir-ltr font-mono">
                          بيع: {item.salePrice}
                        </span>
                      )}
                      {item.is_flagged_stolen && (
                        <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                          🚨 مسروق
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-1">
                      {item.serial_number && (
                        <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 font-bold dir-ltr">
                          SN: {item.serial_number}
                        </span>
                      )}
                      <span>📷 {item.photo?.startsWith('data:image') ? 'صورة مرفوعة' : item.photo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="rounded-lg bg-cyan-500/10 text-cyan-300 px-2.5 py-1 text-[11px] font-medium border border-cyan-500/20">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-300 font-mono dir-ltr text-right">
                    {item.dailyRate}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-300 font-mono dir-ltr text-right">
                    {item.monthlyRate}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {item.is_flagged_stolen ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-300 px-2.5 py-1 text-[11px] font-bold border border-rose-500/40 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                        <span>🚨 بلاغ سرقة (محجوب)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPrice(item)}
                        className="rounded-lg border border-cyan-500/30 bg-[#0F253E] px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                      >
                        تعديل السعر
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDevice(item.id, item.title)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer"
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

      {/* Add Device Modal Dialog */}
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
                <span className="text-xl">📡</span>
                <h3 className="text-lg font-bold text-white">إضافة جهاز أو خدمة جديدة</h3>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDeviceSubmit} className="space-y-4">
              {/* Catalog Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="catalog-device-select" className="block text-xs font-semibold text-gray-300">
                    اختر الجهاز من الكتالوج المعتمد (Master Catalog) <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[11px] text-amber-400/90 font-mono font-bold dir-ltr">
                    {MASTER_CATALOG.length} models
                  </span>
                </div>
                <select
                  id="catalog-device-select"
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogItem(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer font-medium"
                >
                  <optgroup label="📡 محطات رصد متكاملة (Total Stations)">
                    {MASTER_CATALOG.filter((i) => i.category === 'توتال ستيشن').map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} — {item.brand}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛰️ أجهزة رصد الأقمار الصناعية (GNSS / RTK)">
                    {MASTER_CATALOG.filter((i) => i.category === 'أجهزة GNSS/RTK').map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} — {item.brand}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📐 موازين قامة دقيقة ورقمية (Levels)">
                    {MASTER_CATALOG.filter((i) => i.category === 'ميزان قامة').map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} — {item.brand}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛸 طائرات درون ومسح جوي وماسحات ليزرية">
                    {MASTER_CATALOG.filter(
                      (i) => i.category === 'طائرات درون ومسح جوي' || i.category === 'ماسحات ليزرية'
                    ).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} — {item.brand}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚙️ أجهزة ومعدات أخرى">
                    {MASTER_CATALOG.filter((i) => i.category === 'أخرى' || i.id === 'other-unlisted').map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Conditional Custom Name Input */}
                {selectedCatalogId === 'other-unlisted' && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <label htmlFor="custom-device-title" className="block text-xs font-bold text-amber-300 mb-1.5">
                      اكتب اسم وموديل الجهاز المخصص <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="custom-device-title"
                      type="text"
                      required
                      placeholder="مثال: ميزان ليزري دوار GeoMax Zone20 H أو ملحقات أخرى..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full rounded-lg border border-amber-400/50 bg-[#081933] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Inherited Specifications & Preview Card */}
              {selectedItem && (
                <div className="rounded-xl border border-white/10 bg-[#0C1B2E] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">البيانات الموروثة تلقائياً:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                        {selectedItem.brand}
                      </span>
                      <span className="rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold">
                        {selectedItem.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <div className="text-xs font-bold text-white">
                      {selectedCatalogId === 'other-unlisted' && customTitle.trim() ? customTitle : selectedItem.title}
                    </div>
                  </div>
                  {selectedItem.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  )}
                </div>
              )}

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">صور المعدة الحقيقية</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div
                  id="tour-upload-area"
                  className="rounded-xl border-2 border-dashed border-white/10 bg-[#0C1B2E] p-4 text-center hover:border-amber-400/60 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div className="text-2xl mb-1">📤</div>
                  <div className="text-xs font-semibold text-amber-300">
                    {isUploadingImage ? 'جارٍ تحميل ومعالجة الصورة…' : 'اسحب الصور هنا أو اضغط لاختيار ملف من جهازك'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">الصور الواضحة الميدانية ترفع نسبة التأجير بنسبة 85%</div>

                  {uploadedPhotos.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-3">
                      {(uploadedPhotos[0].startsWith('data:image') ||
                        uploadedPhotos[0].startsWith('http') ||
                        uploadedPhotos[0].startsWith('/')) && (
                        <img
                          src={uploadedPhotos[0]}
                          alt="Device preview"
                          className="w-14 h-14 object-cover rounded-lg border border-amber-500/40 shadow-sm"
                        />
                      )}
                      <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30">
                        ✓ صورة جاهزة للنشر
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mandatory Serial Number Field */}
              <div className="rounded-xl border border-cyan-500/30 bg-[#0C1B2E] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="device-serial-number" className="block text-xs font-bold text-white">
                    الرقم التسلسلي للجهاز (Serial Number) <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md font-semibold">
                    🛡️ فحص أمني فوري
                  </span>
                </div>
                <input
                  id="device-serial-number"
                  type="text"
                  required
                  dir="ltr"
                  placeholder="مثال: TS-06-894123 أو SN98234..."
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#071324] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none font-mono text-right"
                />
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  يتم التحقق تلقائياً من الرقم التسلسلي عبر سجل مكافحة سرقة الأجهزة لحماية مجتمع المساحين ومنع تداول المعدات غير القانونية.
                </p>
              </div>

              {/* Pricing Inputs */}
              <div id="tour-price-input" className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#0C1B2E] border border-white/5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    السعر اليومي (ج.م) [إيجار]
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    placeholder="مثال: 1500"
                    value={newDailyPrice}
                    onChange={(e) => setNewDailyPrice(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#071324] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    السعر الشهري (ج.م) [إيجار]
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    placeholder="مثال: 25000"
                    value={newMonthlyPrice}
                    onChange={(e) => setNewMonthlyPrice(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#071324] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    سعر البيع (ج.م) [اختياري]
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    placeholder="مثال: 120000"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    className="w-full rounded-lg border border-amber-500/30 bg-[#071324] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none font-mono text-right"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  className="rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'جارٍ الحفظ في السحابة…' : 'حفظ ونشر الجهاز مباشرة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Price Modal Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#071324] p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <h3 className="text-base font-black text-white">تعديل أسعار التأجير</h3>
                  <p className="text-[11px] text-gray-400 truncate max-w-[240px]">
                    {editingItem.title}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEditPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  سعر الإيجار اليومي (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  dir="ltr"
                  value={editDailyPrice}
                  onChange={(e) => setEditDailyPrice(e.target.value)}
                  placeholder="مثال: 1500"
                  className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition font-mono text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  سعر الإيجار الشهري (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  dir="ltr"
                  value={editMonthlyPrice}
                  onChange={(e) => setEditMonthlyPrice(e.target.value)}
                  placeholder="مثال: 25000"
                  className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition font-mono text-right"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPrice}
                  className="rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] px-5 py-2.5 text-xs font-bold text-gray-950 hover:brightness-110 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {isUpdatingPrice ? 'جاري الحفظ...' : 'حفظ وتحديث الأسعار ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
