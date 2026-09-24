'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

export interface AdBannerItem {
  id: string;
  title: string;
  image_url: string;
  target_link: string;
  location: 'homepage_hero' | 'search_in_feed' | 'providers_directory' | 'equipment_sidebar';
  is_active: boolean;
  clicks: number;
  created_at: string;
  updated_at?: string;
}

export interface RegisteredEntity {
  id: string;
  name: string;
  location?: string;
}

const LOCATION_LABELS: Record<AdBannerItem['location'], { label: string; badgeColor: string }> = {
  homepage_hero: {
    label: 'الصفحة الرئيسية — أسفل الهيرو',
    badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  search_in_feed: {
    label: 'سوق الأجهزة — بين النتائج (In-Feed)',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  providers_directory: {
    label: 'دليل المكاتب — أعلى القائمة',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  equipment_sidebar: {
    label: 'الشريط الجانبي للأجهزة',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdBannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Registered Entities (Providers / Companies) for Auto-population
  const [entities, setEntities] = useState<RegisteredEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdBannerItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    title: string;
    image_url: string;
    target_link: string;
    location: AdBannerItem['location'];
    is_active: boolean;
  }>({
    title: '',
    image_url: '',
    target_link: '',
    location: 'homepage_hero',
    is_active: true,
  });

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ad banners:', error);
        showToast('⚠️ تعذر جلب الإعلانات من قاعدة البيانات');
      } else {
        setAds(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading ads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, company_name, location')
        .order('name', { ascending: true });

      if (!error && data) {
        const formatted: RegisteredEntity[] = data.map((p: any) => ({
          id: p.id,
          name: p.company_name || p.name || 'مزوّد غير مسمّى',
          location: p.location || '',
        }));
        setEntities(formatted);
      }
    } catch (err) {
      console.error('Error fetching registered entities for ads:', err);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchEntities();
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setSelectedEntityId('');
    setFormData({
      title: '',
      image_url: '',
      target_link: '',
      location: 'homepage_hero',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ad: AdBannerItem) => {
    setEditingAd(ad);
    const matched = entities.find((e) => ad.target_link.includes(e.id));
    setSelectedEntityId(matched ? matched.id : '');
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      target_link: ad.target_link,
      location: ad.location,
      is_active: ad.is_active,
    });
    setIsModalOpen(true);
  };

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntityId(entityId);
    if (entityId) {
      const selected = entities.find((e) => e.id === entityId);
      setFormData((prev) => ({
        ...prev,
        target_link: `/directory/${entityId}`,
        title: prev.title.trim() === '' && selected ? `إعلان ${selected.name}` : prev.title,
      }));
    }
  };

  // Direct Image Upload to Supabase 'ads' bucket
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ الحد الأقصى لحجم الصورة هو 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('ads')
        .upload(filePath, file);

      if (error) {
        console.error('Supabase storage upload error:', error.message, error);
        showToast(`❌ فشل الرفع: ${error.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      showToast('✅ تم رفع صورة الإعلان بنجاح');
    } catch (err: any) {
      console.error('Unexpected error uploading to ads bucket:', err?.message || err);
      showToast(`❌ خطأ غير متوقع أثناء الرفع: ${err?.message || 'تعذر الرفع'}`);
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('⚠️ يرجى إدخال عنوان الإعلان');
      return;
    }
    if (!formData.image_url.trim()) {
      showToast('⚠️ يرجى رفع صورة أو إدخال رابط صورة الإعلان');
      return;
    }
    if (!formData.target_link.trim()) {
      showToast('⚠️ يرجى إدخال رابط التوجيه عند النقر');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAd) {
        // Update
        const { error } = await supabase
          .from('ad_banners')
          .update({
            title: formData.title.trim(),
            image_url: formData.image_url.trim(),
            target_link: formData.target_link.trim(),
            location: formData.location,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAd.id);

        if (error) throw error;
        showToast('✅ تم تحديث بيانات الإعلان بنجاح');
      } else {
        // Insert
        const { error } = await supabase.from('ad_banners').insert([
          {
            title: formData.title.trim(),
            image_url: formData.image_url.trim(),
            target_link: formData.target_link.trim(),
            location: formData.location,
            is_active: formData.is_active,
            clicks: 0,
          },
        ]);

        if (error) throw error;
        showToast('✅ تم إنشاء البنر الإعلاني بنجاح');
      }

      setIsModalOpen(false);
      fetchAds();
    } catch (err: any) {
      console.error('Error saving ad banner:', err);
      showToast('❌ حدث خطأ أثناء حفظ الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic update
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, is_active: nextStatus } : ad))
    );

    try {
      const { error } = await supabase
        .from('ad_banners')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      showToast(nextStatus ? '✅ تم تفعيل البنر الإعلاني' : '⚠️ تم تعطيل البنر الإعلاني');
    } catch (err) {
      console.error('Error toggling ad status:', err);
      // Revert optimistic update
      setAds((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, is_active: currentStatus } : ad))
      );
      showToast('❌ تعذر تغيير حالة البنر');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا البنر الإعلاني نهائياً؟')) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from('ad_banners').delete().eq('id', id);
      if (error) throw error;
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      showToast('🗑️ تم حذف البنر الإعلاني بنجاح');
    } catch (err) {
      console.error('Error deleting ad banner:', err);
      showToast('❌ فشل حذف البنر الإعلاني');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter ads
  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.target_link.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || ad.location === locationFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && ad.is_active) ||
      (statusFilter === 'inactive' && !ad.is_active);

    return matchesSearch && matchesLocation && matchesStatus;
  });

  // Calculate stats
  const totalAds = ads.length;
  const activeAdsCount = ads.filter((a) => a.is_active).length;
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📢 منظومة الإعلانات والرعايات (Monetization)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة بنرات الإعلانات</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              إدارة المساحات الإعلانية المدفوعة، تتبع النقرات الترويجية، وتخصيص أماكن الظهور.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/25 hover:brightness-110 transition active:scale-95 whitespace-nowrap"
          >
            <span>+ إضافة بنر إعلاني جديد</span>
          </button>
        </div>

        {/* Analytics & Metrics Quick Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي البنرات المسجلة</span>
              <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs">🖼️</span>
            </div>
            <div className="text-2xl font-black text-white">{totalAds}</div>
            <div className="text-[11px] text-gray-400 mt-1">
              منها <span className="text-emerald-400 font-bold">{activeAdsCount}</span> بنر نشط حالياً
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي النقرات المسجلة</span>
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 text-xs">👆</span>
            </div>
            <div className="text-2xl font-black text-amber-400">{totalClicks.toLocaleString()}</div>
            <div className="text-[11px] text-gray-400 mt-1">تتبع دقيق عبر مسار التحويل المباشر</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>مساحات الظهور المدعومة</span>
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 text-xs">📍</span>
            </div>
            <div className="text-2xl font-black text-purple-300">4 مساحات</div>
            <div className="text-[11px] text-gray-400 mt-1">الهيرو، سوق الأجهزة، الدليل، والقائمة</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full md:w-80">
            <span className="absolute right-3.5 top-2.5 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="ابحث بالعنوان أو الرابط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كافة أماكن الظهور</option>
              <option value="homepage_hero">الصفحة الرئيسية — أسفل الهيرو</option>
              <option value="search_in_feed">سوق الأجهزة — بين النتائج</option>
              <option value="providers_directory">دليل المكاتب — أعلى القائمة</option>
              <option value="equipment_sidebar">الشريط الجانبي للأجهزة</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كافة الحالات</option>
              <option value="active">النشطة فقط</option>
              <option value="inactive">المعطلة فقط</option>
            </select>
          </div>
        </div>

        {/* Ads Data Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-gray-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">الصورة المصغرة</th>
                  <th className="p-4">عنوان الإعلان</th>
                  <th className="p-4">مكان الظهور</th>
                  <th className="p-4">رابط التوجيه</th>
                  <th className="p-4">النقرات</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      <div className="inline-block animate-spin h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full mb-2"></div>
                      <div>جاري تحميل البنرات الإعلانية...</div>
                    </td>
                  </tr>
                ) : filteredAds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      <div className="text-3xl mb-2">📢</div>
                      <div className="text-white font-bold mb-1">لا توجد بنرات إعلانية مطابقة</div>
                      <p className="text-xs text-gray-500">يمكنك إضافة بنر جديد بالنقر على زر &quot;إضافة بنر إعلاني جديد&quot;</p>
                    </td>
                  </tr>
                ) : (
                  filteredAds.map((ad) => {
                    const loc = LOCATION_LABELS[ad.location] || {
                      label: ad.location,
                      badgeColor: 'bg-slate-800 text-gray-300 border-slate-700',
                    };

                    return (
                      <tr key={ad.id} className="hover:bg-slate-850/50 transition">
                        {/* Thumbnail */}
                        <td className="p-4">
                          <div className="relative h-14 w-28 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            {ad.image_url ? (
                              <Image
                                src={ad.image_url}
                                alt={ad.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-600 text-xs">
                                بلا صورة
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Title */}
                        <td className="p-4 font-bold text-white max-w-xs truncate">
                          {ad.title}
                        </td>

                        {/* Location */}
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${loc.badgeColor}`}
                          >
                            {loc.label}
                          </span>
                        </td>

                        {/* Target Link */}
                        <td className="p-4 max-w-xs">
                          <a
                            href={ad.target_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 truncate font-mono text-[11px]"
                          >
                            <span className="truncate">{ad.target_link}</span>
                            <span className="text-xs">↗</span>
                          </a>
                        </td>

                        {/* Clicks */}
                        <td className="p-4 font-black text-amber-400 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <span>👆</span>
                            <span>{ad.clicks || 0}</span>
                          </span>
                        </td>

                        {/* Active Toggle */}
                        <td className="p-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(ad.id, ad.is_active)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                              ad.is_active
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {ad.is_active ? '● معروض (نشط)' : '○ معطّل (مخفي)'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(ad)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition"
                              title="تعديل الإعلان"
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              disabled={deletingId === ad.id}
                              onClick={() => handleDelete(ad.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold transition disabled:opacity-50"
                              title="حذف الإعلان"
                            >
                              {deletingId === ad.id ? 'جاري الحذف...' : '🗑️ حذف'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 text-right my-8">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white">
                  {editingAd ? 'تعديل البنر الإعلاني' : 'إضافة بنر إعلاني جديد'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white transition text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                
                {/* Title */}
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">
                    عنوان الإعلان / اسم الجهة الراعية <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خصم 20% على أجهزة لايكا من مكتب النخبة"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Location Placement */}
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">
                    مكان ظهور البنر (Placement) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value as AdBannerItem['location'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="homepage_hero">الصفحة الرئيسية — أسفل الهيرو (homepage_hero)</option>
                    <option value="search_in_feed">سوق الأجهزة — بين النتائج (search_in_feed)</option>
                    <option value="providers_directory">دليل المكاتب والشركات — أعلى القائمة (providers_directory)</option>
                    <option value="equipment_sidebar">الشريط الجانبي للأجهزة (equipment_sidebar)</option>
                  </select>
                </div>

                {/* Advertiser Dropdown (Auto-populate) */}
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">
                    صاحب الإعلان (ربط تلقائي بالملف الشخصي)
                  </label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => handleEntitySelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">إعلان خارجي / كتابة الرابط يدوياً</option>
                    {entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} {entity.location ? `(${entity.location})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">
                    عند اختيار جهة مسجلة، يتم ملء الرابط تلقائياً برابط ملفها في دليل المنصة مع إمكانية تعديله يدوياً.
                  </p>
                </div>

                {/* Target Link */}
                <div>
                  <label className="block text-gray-300 mb-1 font-bold">
                    رابط التوجيه عند النقر (Target Link) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/directory/uuid أو https://external-link.com"
                    value={formData.target_link}
                    onChange={(e) => {
                      setFormData({ ...formData, target_link: e.target.value });
                      if (selectedEntityId && !e.target.value.includes(selectedEntityId)) {
                        setSelectedEntityId('');
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400 font-mono text-left"
                    dir="ltr"
                  />
                </div>

                {/* Image Upload / URL */}
                <div className="space-y-2">
                  <label className="block text-gray-300 font-bold">
                    صورة البنر الإعلاني <span className="text-rose-400">*</span>
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {isUploading ? (
                        <span>جاري الرفع... ⏳</span>
                      ) : (
                        <>
                          <span>📁</span>
                          <span>رفع صورة من الجهاز (ads bucket)</span>
                        </>
                      )}
                    </button>

                    <input
                      type="text"
                      placeholder="أو ضع رابط مباشر للصورة..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                    />
                  </div>

                  {/* Image Preview Box */}
                  {formData.image_url && (
                    <div className="mt-2 relative h-32 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-2 left-2 p-1 rounded-md bg-black/70 text-rose-400 hover:bg-black text-xs font-bold"
                        title="إزالة الصورة"
                      >
                        ✕ مسح
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Toggle Switch */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <div>
                    <div className="font-bold text-white">تفعيل البنر فور الحفظ</div>
                    <div className="text-gray-400 text-[11px]">
                      إذا كان مفعلاً، سيظهر البنر للزوار في المكان المحدد مباشرة.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Modal Buttons */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:bg-slate-700 font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-6 py-2 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : editingAd ? 'تحديث البنر' : 'إنشاء البنر'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-cyan-500/30 bg-gray-900/95 px-5 py-3 text-sm text-cyan-300 shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}
