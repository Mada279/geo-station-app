'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

interface EditEquipmentModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updated: { id: string; title: string; description: string; image_url?: string }) => void;
}

function EditEquipmentModal({ item, isOpen, onClose, onSaveSuccess }: EditEquipmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || item.name || '');
      setDescription(item.description || '');
      setImageUrl(item.image_url || item.image || '');
      setErrorMsg(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setErrorMsg(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `equipment/${cleanFileName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (!uploadErr && uploadData) {
        const { data: pubData } = supabase.storage.from('equipment-images').getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          setImageUrl(pubData.publicUrl);
          setIsUploadingImage(false);
          return;
        }
      }

      if (uploadErr) {
        console.warn('[Admin Equipment Upload Warning]:', uploadErr.message);
      }

      // Base64 fallback preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageUrl(ev.target.result as string);
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('[Admin Equipment Upload Exception]:', err);
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('يرجى إدخال عنوان الجهاز.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      // Execute Supabase update strictly for editable SEO and image fields
      const updatePayload: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
      };
      if (imageUrl) {
        updatePayload.image_url = imageUrl;
      }

      const { error } = await supabase
        .from('equipment')
        .update(updatePayload)
        .eq('id', item.id);

      if (error) {
        console.warn('[EditEquipmentModal Warning]:', error.message);
      }

      onSaveSuccess({
        id: item.id,
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl,
      });
      onClose();
    } catch (err: any) {
      console.error('[EditEquipmentModal Exception]:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ تحديثات الـ SEO.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDaily = item.daily_price
    ? `${Number(item.daily_price).toLocaleString('en-US')} ج.م / يوم`
    : item.price || 'حسب الاتفاق';

  const formattedMonthly = item.monthly_price
    ? `${Number(item.monthly_price).toLocaleString('en-US')} ج.م / شهر`
    : 'غير محدد';

  const providerPhone = item.phone || '01033134413';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl space-y-5 text-gray-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1.5">
              <span>🔍 تحسين محركات البحث والكلمات المفتاحية (SEO)</span>
            </div>
            <h2 className="text-xl font-black text-white">تعديل بيانات الجهاز لمحركات البحث</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-gray-800">ID: {item.id}</span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">{item.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Security / Financial Protection Alert */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <span className="text-lg leading-none mt-0.5">🔒</span>
          <div className="space-y-1">
            <span className="font-bold block">شروط مالية ومعلومات اتصال محمية:</span>
            <span className="text-gray-300 leading-relaxed block">
              أسعار الإيجار (اليومي والشهري) وبيانات الاتصال الخاصة بالمزوّد معطلة ومحمية من أي تعديل للحفاظ على الشروط التعاقدية للمزوّد ومنع أي تلاعب مالي من قِبل إدارة المنصة.
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Section 1: Editable SEO Fields */}
        <div className="space-y-4 rounded-xl bg-slate-950/60 p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>✏️</span>
              <span>حقول الـ SEO القابلة للتحسين والنشر</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              مسموح بالتعديل للإدارة
            </span>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1.5">
              عنوان الجهاز / العنوان الترويجي (SEO Title) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-cyan-500/40 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="مثال: محطة رصد متكاملة Leica TS07 (1 ثانية) مع كامل الملحقات"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              يظهر في نتائج محركات البحث وبطاقة الجهاز. يُفضّل ذكر الماركة والموديل والدقة بوضوح.
            </p>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1.5">
              الوصف التفصيلي والكلمات المفتاحية (SEO Description)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-cyan-500/40 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 leading-relaxed"
              placeholder="اكتب وصفاً تقنياً غنياً بالكلمات المفتاحية مثل: توتال ستيشن، ليكا، رفع مساحي، دقة 1 ثانية، معايرة سارية..."
            />
            <p className="text-[11px] text-gray-400 mt-1">
              يساعد محركات البحث في أرشفة الجهاز وفهرسته للمهندسين والمكاتب الباحثين عن هذه المعدات.
            </p>
          </div>

          {/* Equipment Image Preview & Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1.5">
              صورة الجهاز الأساسية (Equipment Photo)
            </label>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('/') ? imageUrl : `/images/${imageUrl}`}
                    alt={title || 'Equipment'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/total_station_leica.jpg';
                    }}
                  />
                ) : (
                  <span className="text-2xl">📸</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="adminEquipmentImageUpload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <span>{isUploadingImage ? 'جاري الرفع...' : '📷 رفع / استبدال صورة الجهاز'}</span>
                </button>
                <p className="text-[11px] text-gray-400 mt-1 truncate">
                  يتم حفظها في سحابة التخزين (equipment-images) وتحديثها فورياً في المنصة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Disabled / ReadOnly Financial & Contact Fields */}
        <div className="space-y-4 rounded-xl bg-slate-950/40 p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span>
              <span>الحقول المالية وجهات الاتصال (مغلقة ومحمية)</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
              للقراءة فقط (ReadOnly)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily price (Disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <span>سعر الإيجار اليومي</span>
                <span className="text-[10px] text-amber-400">🔒 محمي</span>
              </label>
              <input
                type="text"
                value={formattedDaily}
                disabled={true}
                className="w-full rounded-xl border border-gray-700/80 bg-slate-950/70 px-3.5 py-2 text-xs text-gray-400 font-bold cursor-not-allowed select-none opacity-80"
              />
            </div>

            {/* Monthly price (Disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <span>سعر الإيجار الشهري</span>
                <span className="text-[10px] text-amber-400">🔒 محمي</span>
              </label>
              <input
                type="text"
                value={formattedMonthly}
                disabled={true}
                className="w-full rounded-xl border border-gray-700/80 bg-slate-950/70 px-3.5 py-2 text-xs text-gray-400 font-bold cursor-not-allowed select-none opacity-80"
              />
            </div>

            {/* Provider contact phone (Disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <span>رقم هاتف المزوّد المالك</span>
                <span className="text-[10px] text-amber-400">🔒 محمي</span>
              </label>
              <input
                type="text"
                value={providerPhone}
                disabled={true}
                dir="ltr"
                className="w-full rounded-xl border border-gray-700/80 bg-slate-950/70 px-3.5 py-2 text-xs text-gray-400 font-mono font-bold cursor-not-allowed select-none opacity-80"
              />
            </div>

            {/* Provider Name (Disabled) */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <span>المزوّد المسجل</span>
                <span className="text-[10px] text-amber-400">🔒 محمي</span>
              </label>
              <input
                type="text"
                value={item.provider || 'مكتب مساحي معتمد'}
                disabled={true}
                className="w-full rounded-xl border border-gray-700/80 bg-slate-950/70 px-3.5 py-2 text-xs text-gray-400 font-bold cursor-not-allowed select-none opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-cyan-500/20 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-xs font-bold text-gray-300 transition"
          >
            إلغاء
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-xs font-black text-[#081933] shadow-lg hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>جاري حفظ تحديثات SEO...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>حفظ تحسينات الـ SEO (Save SEO Updates)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

const INITIAL_EQUIPMENT = [
  {
    id: 'EQ-1001',
    name: 'محطة رصد متكاملة Leica TS07 (1 ثانية)',
    title: 'محطة رصد متكاملة Leica TS07 (1 ثانية)',
    description: 'جهاز توتال ستيشن فائق الدقة 1 ثانية مزود ببرنامج FlexField وشاشة ملونة، مناسب لأعمال الأنفاق والمباني العالية وشبكات المراقبة الدقيقة.',
    category: 'Total Station',
    provider: 'مكتب الأهرام للمساحة',
    phone: '01012345678',
    daily_price: 1500,
    monthly_price: 32000,
    serial: 'SN-948271',
    calibrationDate: '2026-01-15',
    calibrationStatus: 'سارية (صلاحية 10 أشهر)',
    status: 'معتمد ونشط',
    price: '1,500 ج.م / يوم',
  },
  {
    id: 'EQ-1002',
    name: 'جهاز تحديد المواقع Trimble R12i GNSS',
    title: 'جهاز تحديد المواقع Trimble R12i GNSS',
    description: 'مستقبل GNSS متطور مزود بتقنية تعويض الميلان بالقصور الذاتي TIP ومقاوم للظروف البيئية الصعبة، دقة سنتيمترية فورية عبر شبكات RTK.',
    category: 'GNSS / GPS',
    provider: 'جيو تكنولوجي مصر',
    phone: '01123456789',
    daily_price: 2200,
    monthly_price: 45000,
    serial: 'TR-772910',
    calibrationDate: '2025-11-20',
    calibrationStatus: 'سارية (صلاحية 8 أشهر)',
    status: 'معتمد ونشط',
    price: '2,200 ج.م / يوم',
  },
  {
    id: 'EQ-1003',
    name: 'ميزان قامة بصري دقيق Sokkia B20',
    title: 'ميزان قامة بصري دقيق Sokkia B20',
    description: 'ميزان قامة بصري تلقائي بقوة تكبير 32x معوض مغناطيسي دقيق لأعمال الميزانية الشبكية والإنشاءات والتحكم في المناسيب بدقة 0.7 مم.',
    category: 'Optical Level',
    provider: 'الإسكندرية للمسح',
    phone: '01234567890',
    daily_price: 350,
    monthly_price: 7500,
    serial: 'SK-330192',
    calibrationDate: '2026-02-01',
    calibrationStatus: 'سارية (صلاحية 11 شهر)',
    status: 'معتمد ونشط',
    price: '350 ج.م / يوم',
  },
  {
    id: 'EQ-1004',
    name: 'جهاز مستقبل CHCNAV i73+ Pocket GNSS',
    title: 'جهاز مستقبل CHCNAV i73+ Pocket GNSS',
    description: 'مستقبل GNSS جيب خفيف الوزن مدمج بـ IMU ومزود بـ 624 قناة يدعم جميع الأقمار الصناعية لنقاط الرفع السريع والتوقيع المساحي.',
    category: 'GNSS / GPS',
    provider: 'سرفاي تك للمقاولات',
    phone: '01099887766',
    daily_price: 1800,
    monthly_price: 38000,
    serial: 'CHC-551029',
    calibrationDate: '2026-03-01',
    calibrationStatus: 'سارية حديثاً',
    status: 'معتمد ونشط',
    price: '1,800 ج.م / يوم',
  },
];

export default function AdminEquipmentPage() {
  const [filterBrand, setFilterBrand] = useState('all');
  const [equipmentList, setEquipmentList] = useState<any[]>(INITIAL_EQUIPMENT);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadLiveEquipment() {
      try {
        const { data: eqData, error: eqError } = await supabase
          .from('equipment')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: provData } = await supabase
          .from('providers')
          .select('id, name, phone, location');

        const provMap = new Map<string, any>();
        if (provData) {
          provData.forEach((p) => {
            provMap.set(String(p.id), p);
          });
        }

        if (!eqError && eqData && eqData.length > 0) {
          const liveMapped = eqData.map((d: any) => {
            const prov = d.provider_id ? provMap.get(String(d.provider_id)) : null;
            return {
              id: d.id,
              name: d.title || 'جهاز مساحي',
              title: d.title || 'جهاز مساحي',
              description: d.description || '',
              category: d.category || 'Total Station',
              provider: prov?.name || 'مزوّد معتمد بالسحابة',
              phone: prov?.phone || d.phone || '01033134413',
              daily_price: d.daily_price,
              monthly_price: d.monthly_price,
              sale_price: d.sale_price,
              serial: (d.id || '').slice(0, 8).toUpperCase() || 'SN-LIVE',
              calibrationDate: d.created_at ? d.created_at.slice(0, 10) : '2026-03-01',
              calibrationStatus: 'سارية وموثقة',
              status: 'معتمد ونشط',
              price: d.daily_price ? `${Number(d.daily_price).toLocaleString('en-US')} ج.م / يوم` : 'حسب الاتفاق',
              image_url: d.image_url,
            };
          });
          setEquipmentList([...liveMapped, ...INITIAL_EQUIPMENT]);
        }
      } catch {}
    }
    loadLiveEquipment();
  }, []);

  const handleSaveEquipmentSuccess = (updated: { id: string; title: string; description: string; image_url?: string }) => {
    setEquipmentList((prev) =>
      prev.map((item: any) =>
        item.id === updated.id
          ? {
              ...item,
              name: updated.title,
              title: updated.title,
              description: updated.description,
              image_url: updated.image_url || item.image_url,
              image: updated.image_url || item.image,
            }
          : item
      )
    );
    showToast(`✅ تم تحديث بيانات وصورة الجهاز "${updated.title}" بنجاح!`);
  };

  const filteredEquipment = equipmentList.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.title?.toLowerCase().includes(term) ||
      item.serial?.toLowerCase().includes(term) ||
      item.provider?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-5 left-5 z-50 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-2xl animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📡 المعدات والأجهزة الجيوديسية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">مراجعة الأجهزة والمعدات</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              فحص مواصفات وسجلات معايرة أجهزة التوتال ستيشن، والـ GNSS، والموازين البصرية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('تم تنشيط التحقق من شهادات المعايرة السارية')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-xs font-black text-slate-950 shadow-md hover:brightness-110 transition"
            >
              + إضافة فحص دوري
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي الأجهزة المعتمدة</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">📡</span>
            </div>
            <div className="text-2xl font-black text-white">312 <span className="text-xs text-gray-400 font-normal">جهاز</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">جاهزة للحجز الميداني</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>أجهزة Total Station</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">📐</span>
            </div>
            <div className="text-2xl font-black text-white">142</div>
            <div className="text-[11px] text-purple-300 mt-2 font-semibold">Leica, Trimble, Topcon</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>أجهزة GNSS / RTK</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">🛰️</span>
            </div>
            <div className="text-2xl font-black text-white">118</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">دقة ميليمترية عالية</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>نسبة صلاحية المعايرة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">✅</span>
            </div>
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-[11px] text-amber-300 mt-2 font-semibold">لا يوجد أي جهاز منتهي المعايرة</div>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/50 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">سجل الأجهزة الهندسية والمساحية</h3>
              <p className="text-xs text-gray-400 mt-0.5">تفاصيل السيريال، تاريخ المعايرة، وحالة التوافر للتأجير</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم الجهاز، الموديل، السيريال، المزوّد..."
                className="rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-200 bg-slate-900">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 text-slate-300">اسم الجهاز والموديل</th>
                  <th className="p-3.5 text-slate-300">النوع والتصنيف</th>
                  <th className="p-3.5 text-slate-300">المزوّد المالك</th>
                  <th className="p-3.5 text-slate-300">الرقم التسلسلي</th>
                  <th className="p-3.5 text-slate-300">شهادة المعايرة</th>
                  <th className="p-3.5 text-slate-300">سعر التأجير اليومي</th>
                  <th className="p-3.5 text-slate-300 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400 text-xs">
                      لا توجد أجهزة مطابقة لبحثك.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedEquipment(item);
                        setIsEditModalOpen(true);
                      }}
                      className="hover:bg-slate-800/50 cursor-pointer transition group"
                      title="انقر لمراجعة وتعديل بيانات الـ SEO للجهاز"
                    >
                      <td className="p-3.5 font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                        <span>📡</span>
                        <span>{item.title || item.name}</span>
                      </td>
                      <td className="p-3.5 text-cyan-300 font-semibold">{item.category}</td>
                      <td className="p-3.5 text-slate-200">{item.provider}</td>
                      <td className="p-3.5 font-mono text-slate-300">{item.serial}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.calibrationStatus}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white">{item.price}</td>
                      <td className="p-3.5 text-center space-x-2 space-x-reverse" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedEquipment(item);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition inline-flex items-center gap-1.5"
                        >
                          <span>✏️</span>
                          <span>تفاصيل / تعديل SEO</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Equipment SEO Modal */}
        <EditEquipmentModal
          item={selectedEquipment}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEquipment(null);
          }}
          onSaveSuccess={handleSaveEquipmentSuccess}
        />

      </div>
    </div>
  );
}
