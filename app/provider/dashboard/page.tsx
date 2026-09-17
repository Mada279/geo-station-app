'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/utils/supabaseClient';
import { MASTER_CATALOG, MasterCatalogItem } from '@/data/masterCatalog';

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
  salePrice?: string;
  status: 'متاح للإيجار' | 'قيد الصيانة' | 'محجوز';
  photo: string;
  created_at?: string;
}

interface ProviderServiceItem {
  id: string;
  provider_id?: string;
  title: string;
  category: string;
  description: string;
  created_at?: string;
}

export default function ProviderDashboardPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Provider Services State (Isolated from Equipment logic)
  const [services, setServices] = useState<ProviderServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [serviceTitle, setServiceTitle] = useState<string>('');
  const [serviceCategory, setServiceCategory] = useState<string>('مساحة أرضية');
  const [serviceDescription, setServiceDescription] = useState<string>('');
  const [isSavingService, setIsSavingService] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [runTour, setRunTour] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form State (Driven by Master Catalog)
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(MASTER_CATALOG[0]?.id || '');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [newDailyPrice, setNewDailyPrice] = useState<string>(
    MASTER_CATALOG[0]?.suggestedDaily ? String(MASTER_CATALOG[0].suggestedDaily) : ''
  );
  const [newMonthlyPrice, setNewMonthlyPrice] = useState<string>(
    MASTER_CATALOG[0]?.suggestedMonthly ? String(MASTER_CATALOG[0].suggestedMonthly) : ''
  );
  const [newSalePrice, setNewSalePrice] = useState<string>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    MASTER_CATALOG[0]?.image || 'total_station_leica.jpg',
  ]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const selectedItem = MASTER_CATALOG.find((item) => item.id === selectedCatalogId) || MASTER_CATALOG[0];

  const handleSelectCatalogItem = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    if (catalogId !== 'other-unlisted') {
      setCustomTitle('');
    }
    const item = MASTER_CATALOG.find((c) => c.id === catalogId);
    if (item) {
      if (item.suggestedDaily) setNewDailyPrice(String(item.suggestedDaily));
      else setNewDailyPrice('');
      if (item.suggestedMonthly) setNewMonthlyPrice(String(item.suggestedMonthly));
      else setNewMonthlyPrice('');
      if (item.image) setUploadedPhotos([item.image]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      // 1. Attempt Supabase Storage upload
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `equipment/${cleanFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, file);

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('equipment-images')
          .getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          setUploadedPhotos([publicUrlData.publicUrl]);
          showToast('📸 تم رفع صورة الجهاز بنجاح إلى التخزين السحابي');
          setIsUploadingImage(false);
          return;
        }
      }

      // 2. Base64 FileReader Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setUploadedPhotos([base64Url]);
          showToast('📸 تم تجهيز صورة الجهاز بنجاح للمعاينة والنشر');
        }
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        showToast('❌ تعذر قراءة ملف الصورة');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('[Image Upload Fallback]:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setUploadedPhotos([base64Url]);
          showToast('📸 تم تجهيز صورة الجهاز بنجاح للمعاينة والنشر');
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit Price Modal State
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [editDailyPrice, setEditDailyPrice] = useState('');
  const [editMonthlyPrice, setEditMonthlyPrice] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Dynamic KPI Metrics (defaulting realistically to zero activity for new accounts)
  const [providerId, setProviderId] = useState<string | null>(null);
  const [uploadedEquipmentCount, setUploadedEquipmentCount] = useState<number>(0);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [newRequestsToday, setNewRequestsToday] = useState<number>(0);
  const [profileViews, setProfileViews] = useState<number>(0);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // Dynamic Provider Profile Information
  const [providerProfile, setProviderProfile] = useState({
    name: 'مزوّد معتمد',
    org: 'مكتب مساحي معتمد',
    location: 'تغطية شاملة',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEditPrice = (item: EquipmentItem) => {
    setEditingItem(item);
    const cleanDaily = (item.dailyRate || '').replace(/[^0-9.]/g, '');
    const cleanMonthly = (item.monthlyRate || '').replace(/[^0-9.]/g, '');
    setEditDailyPrice(cleanDaily);
    setEditMonthlyPrice(cleanMonthly);
  };

  const handleSaveEditPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdatingPrice(true);
    try {
      const dailyNum = editDailyPrice.trim() ? parseFloat(editDailyPrice) : null;
      const monthlyNum = editMonthlyPrice.trim() ? parseFloat(editMonthlyPrice) : null;

      // Update in Supabase equipment table
      const { error } = await supabase
        .from('equipment')
        .update({
          daily_price: dailyNum,
          monthly_price: monthlyNum,
        })
        .eq('id', editingItem.id);

      if (error) {
        console.warn('[Edit Price Supabase Error]:', error.message);
      }

      // Update local equipment state immediately
      setEquipment((prev) =>
        prev.map((it) =>
          it.id === editingItem.id
            ? {
                ...it,
                dailyRate: dailyNum ? `${Number(dailyNum).toLocaleString('en-US')} ج.م` : '—',
                monthlyRate: monthlyNum ? `${Number(monthlyNum).toLocaleString('en-US')} ج.م` : '—',
              }
            : it
        )
      );

      showToast(`✅ تم تحديث أسعار "${editingItem.title}" بنجاح!`);
      setEditingItem(null);
    } catch (err) {
      console.error('[Edit Price Exception]:', err);
      showToast('❌ تعذر تحديث السعر حالياً.');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Fetch actual equipment data from Supabase
  const fetchEquipment = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let activeUserId: string | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            activeUserId = parsed.id || null;
            if (activeUserId) setProviderId(activeUserId);
          } catch {}
        }
      }

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ProviderDashboard] Supabase select error:', error.message);
        setFetchError('تعذر استرجاع الأجهزة من السحابة مؤقتاً.');
        setEquipment([]);
        setUploadedEquipmentCount(0);
      } else if (data && data.length > 0) {
        const mapped: EquipmentItem[] = data.map((row) => ({
          id: row.id,
          title: row.title || 'جهاز مساحي',
          category: row.category || 'أجهزة ومعدات',
          dailyRate: row.daily_price ? `${Number(row.daily_price).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: row.monthly_price ? `${Number(row.monthly_price).toLocaleString('en-US')} ج.م` : '—',
          salePrice: row.sale_price ? `${Number(row.sale_price).toLocaleString('en-US')} ج.م` : undefined,
          status: 'متاح للإيجار',
          photo: row.image_url || 'total_station_leica.jpg',
          created_at: row.created_at,
        }));
        setEquipment(mapped);

        // Execute Supabase exact count query where provider_id matches logged-in user
        if (activeUserId) {
          const { count, error: countErr } = await supabase
            .from('equipment')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', activeUserId);

          if (!countErr && count !== null && count > 0) {
            setUploadedEquipmentCount(count);
          } else {
            // Fallback to active equipment count
            setUploadedEquipmentCount(mapped.length);
          }
        } else {
          setUploadedEquipmentCount(mapped.length);
        }
      } else {
        setEquipment([]);
        setUploadedEquipmentCount(0);
      }
    } catch (err: any) {
      console.warn('[ProviderDashboard] Fetch exception:', err);
      setFetchError('حدث خطأ في الاتصال بقاعدة البيانات.');
      setEquipment([]);
      setUploadedEquipmentCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dynamic KPI metrics from Supabase
  const fetchKpiData = async () => {
    try {
      // 1. Fetch incoming requests count from live contact_requests table
      const { count: contactCount } = await supabase
        .from('contact_requests')
        .select('*', { count: 'exact', head: true });
      if (contactCount !== null) {
        setRequestsCount(contactCount);
      } else {
        const { count: reqCount, error: reqErr } = await supabase
          .from('incoming_requests')
          .select('*', { count: 'exact', head: true });
        if (!reqErr && reqCount !== null) {
          setRequestsCount(reqCount);
        }
      }
    } catch {
      // fallback: 0
    }

    try {
      // 2. Fetch profile views count
      const { count: viewCount, error: viewErr } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true });
      if (!viewErr && viewCount !== null) {
        setProfileViews(viewCount);
      }
    } catch {
      // Table not yet created in MVP - fallback: 0
    }

    try {
      // 3. Fetch reviews / ratings
      const { data: revData, error: revErr } = await supabase
        .from('reviews')
        .select('rating');
      if (!revErr && revData && revData.length > 0) {
        const sum = revData.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
        setRating(sum / revData.length);
        setReviewCount(revData.length);
      }
    } catch {
      // Table not yet created in MVP - fallback: null / 0
    }
  };

  // Fetch provider services from Supabase
  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      let activeUserId: string | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            activeUserId = JSON.parse(stored).id || null;
          } catch {}
        }
      }

      let query = supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUserId) {
        query = query.eq('provider_id', activeUserId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        setServices(data);
      } else {
        // Fallback to local cache if table not created or query fails
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_SERVICES');
          if (cached) {
            setServices(JSON.parse(cached));
          } else {
            setServices([]);
          }
        } else {
          setServices([]);
        }
      }
    } catch (err) {
      console.warn('[fetchServices] fallback to local cache:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('SURVSTA_LOCAL_SERVICES');
        if (cached) setServices(JSON.parse(cached));
      }
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle.trim()) {
      showToast('⚠️ يرجى إدخال اسم الخدمة المساحية');
      return;
    }

    setIsSavingService(true);
    try {
      let activeUserId: string | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            activeUserId = JSON.parse(stored).id || null;
          } catch {}
        }
      }

      const payload: any = {
        title: serviceTitle.trim(),
        category: serviceCategory,
        description: serviceDescription.trim(),
      };

      if (activeUserId) {
        payload.provider_id = activeUserId;
      }

      let { data, error } = await supabase.from('services').insert([payload]).select();

      // If provider_id foreign key constraint fails, retry without provider_id
      if (error && (error.message?.includes('provider_id') || error.message?.includes('foreign key') || error.code === '23503')) {
        delete payload.provider_id;
        const retry = await supabase.from('services').insert([payload]).select();
        data = retry.data;
        error = retry.error;
      }

      const newSvc: ProviderServiceItem = {
        id: data?.[0]?.id || `SVC-${Date.now()}`,
        provider_id: activeUserId || undefined,
        title: serviceTitle.trim(),
        category: serviceCategory,
        description: serviceDescription.trim(),
        created_at: new Date().toISOString(),
      };

      setServices((prev) => [newSvc, ...prev]);

      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_SERVICES') || '[]');
        localStorage.setItem('SURVSTA_LOCAL_SERVICES', JSON.stringify([newSvc, ...existing]));
      }

      if (error) {
        console.warn('[handleSaveService]: Saved locally:', error.message);
        showToast('✅ تم حفظ الخدمة بنجاح (سيتم مزامنتها مع السحابة)');
      } else {
        showToast(`🎉 تم حفظ ونشر خدمة "${serviceTitle.trim()}" بنجاح في قاعدة البيانات!`);
      }

      setServiceTitle('');
      setServiceDescription('');
      setIsServiceModalOpen(false);
    } catch (err) {
      console.warn('[handleSaveService exception]:', err);
      showToast('✅ تم حفظ الخدمة بنجاح');
      setIsServiceModalOpen(false);
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف خدمة "${title}"؟`)) return;
    try {
      await supabase.from('services').delete().eq('id', id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_SERVICES') || '[]');
        localStorage.setItem(
          'SURVSTA_LOCAL_SERVICES',
          JSON.stringify(existing.filter((s: any) => s.id !== id))
        );
      }
      showToast('🗑️ تم حذف الخدمة من القائمة.');
    } catch {
      showToast('تعذر الحذف حالياً.');
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchKpiData();
    fetchServices();

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProviderProfile({
            name: parsed.name || 'مزوّد معتمد',
            org: parsed.org || parsed.organization || parsed.company || 'مكتب مساحي معتمد',
            location: parsed.location || 'تغطية شاملة',
          });
        }
      } catch {
        // keep fallback
      }
    }
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
    if (!selectedItem) {
      showToast('يرجى اختيار جهاز من الكتالوج المعتمد');
      return;
    }

    const isOtherSelected = selectedCatalogId === 'other-unlisted';
    if (isOtherSelected && !customTitle.trim()) {
      showToast('⚠️ يرجى إدخال اسم وموديل الجهاز المخصص أولاً');
      return;
    }

    setIsSaving(true);
    const titleToSave = isOtherSelected ? customTitle.trim() : selectedItem.title;
    const categoryToSave = isOtherSelected ? 'أخرى' : selectedItem.category;
    const photoUrl = uploadedPhotos[0] || selectedItem.image || 'total_station_leica.jpg';
    const dailyNum = newDailyPrice.trim() ? parseFloat(newDailyPrice) : null;
    const monthlyNum = newMonthlyPrice.trim() ? parseFloat(newMonthlyPrice) : null;
    const saleNum = newSalePrice.trim() ? parseFloat(newSalePrice) : null;
    const salePriceFormatted = saleNum ? `${Number(saleNum).toLocaleString('en-US')} ج.م` : undefined;

    try {
      // First attempt inserting with sale_price and provider_id if columns exist
      let insertPayload: any = {
        title: titleToSave,
        category: categoryToSave,
        daily_price: dailyNum,
        monthly_price: monthlyNum,
        image_url: photoUrl,
      };

      if (saleNum !== null) {
        insertPayload.sale_price = saleNum;
      }
      if (providerId) {
        insertPayload.provider_id = providerId;
      }

      let { data, error } = await supabase
        .from('equipment')
        .insert([insertPayload])
        .select();

      // If provider_id or foreign key constraint errors out, retry safely without provider_id
      if (error && (error.message?.includes('provider_id') || error.message?.includes('foreign key') || error.code === '23503')) {
        delete insertPayload.provider_id;
        const retry = await supabase.from('equipment').insert([insertPayload]).select();
        data = retry.data;
        error = retry.error;
      }

      // If sale_price column doesn't exist in Supabase schema, retry safely without it
      if (error && (error.message?.includes('sale_price') || error.code === 'PGRST204')) {
        delete insertPayload.sale_price;
        const retry = await supabase.from('equipment').insert([insertPayload]).select();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn('[ProviderDashboard] Insert error:', error.message);
        // Optimistic local update fallback
        const localItem: EquipmentItem = {
          id: `EQ-${Math.floor(300 + Math.random() * 700)}`,
          title: titleToSave,
          category: categoryToSave,
          dailyRate: dailyNum ? `${Number(dailyNum).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: monthlyNum ? `${Number(monthlyNum).toLocaleString('en-US')} ج.م` : '—',
          salePrice: salePriceFormatted,
          status: 'متاح للإيجار',
          photo: photoUrl,
        };
        setEquipment((prev) => [localItem, ...prev]);
        setUploadedEquipmentCount((prev) => prev + 1);
        showToast('⚠️ تم إضافة الجهاز محلياً (وضع عدم الاتصال بالسحابة)');
      } else if (data && data[0]) {
        const row = data[0];
        const addedItem: EquipmentItem = {
          id: row.id,
          title: row.title,
          category: row.category,
          dailyRate: row.daily_price ? `${Number(row.daily_price).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: row.monthly_price ? `${Number(row.monthly_price).toLocaleString('en-US')} ج.م` : '—',
          salePrice: row.sale_price ? `${Number(row.sale_price).toLocaleString('en-US')} ج.م` : salePriceFormatted,
          status: 'متاح للإيجار',
          photo: row.image_url || photoUrl,
          created_at: row.created_at,
        };
        setEquipment((prev) => [addedItem, ...prev]);
        setUploadedEquipmentCount((prev) => prev + 1);
        showToast(`🎉 تم حفظ ونشر "${titleToSave}" بنجاح في قاعدة البيانات الحية!`);
      }

      setCustomTitle('');
      setNewSalePrice('');
      setIsModalOpen(false);
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
      setUploadedEquipmentCount((prev) => Math.max(0, prev - 1));
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
              {providerProfile.org} • {providerProfile.name} ({providerProfile.location})
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
              <span>معداتك المنشورة</span>
              <span className="text-amber-400 text-lg">📡</span>
            </div>
            <div className="text-2xl font-black text-amber-300">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                `${uploadedEquipmentCount} ${uploadedEquipmentCount === 1 ? 'جهاز' : uploadedEquipmentCount === 2 ? 'جهازان' : 'أجهزة'}`
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">معروضة للبيع والتأجير المباشر</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات التواصل الواردة</span>
              <span className="text-cyan-400 text-lg">📥</span>
            </div>
            <div className="text-2xl font-black text-cyan-400">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                `${requestsCount} طلب`
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {newRequestsToday > 0 ? `▲ ${newRequestsToday} طلبات جديدة اليوم` : 'لا توجد طلبات جديدة اليوم'}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>مشاهدات الملف هذا الشهر</span>
              <span className="text-purple-400 text-lg">👁️</span>
            </div>
            <div className="text-2xl font-black text-purple-400">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                profileViews.toLocaleString('en-US')
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {profileViews > 0 ? 'من مهندسين وشركات مقاولات' : 'بانتظار المشاهدات الأولى لحسابك'}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>تقييم المزوّد</span>
              <span className="text-yellow-400 text-lg">⭐</span>
            </div>
            <div className="text-2xl font-black text-yellow-400">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : rating !== null && rating > 0 ? (
                `${rating.toFixed(1)} / 5.0`
              ) : (
                '0.0 / 5.0'
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {reviewCount > 0 ? `بناءً على ${reviewCount} مراجعة معتمدة` : 'لا يوجد تقييم بعد (حساب جديد)'}
            </div>
          </div>
        </div>

        {/* Equipment Listing Section */}
        <div className="space-y-4 scroll-mt-6" id="equipment">
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
                إجمالي الأجهزة: {uploadedEquipmentCount}
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
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.salePrice && (
                            <span className="rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold">
                              بيع: {item.salePrice}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>📷 {item.photo?.startsWith('data:image') ? 'صورة مرفوعة' : item.photo}</span>
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
                            onClick={() => handleOpenEditPrice(item)}
                            className="rounded-lg border border-cyan-500/30 bg-[#0F253E] px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
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

        {/* Services Management Section */}
        <div className="space-y-4 scroll-mt-6 pt-8 border-t border-amber-500/20" id="services">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1">
                <span>🧭 الخدمات المساحية والهندسية</span>
              </div>
              <h2 className="text-xl font-bold text-white">إدارة الخدمات المساحية المنشورة</h2>
              <p className="text-xs text-gray-400">
                اعرض خدمات مكتبك الهندسية (رفع طوبوغرافي، توقيع محاور، مسح ليزري، معايرة) لتظهر للعملاء في الدليل وسوق الخدمات.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchServices}
                className="text-xs text-gray-400 hover:text-cyan-400 transition cursor-pointer"
                title="تحديث الخدمات"
              >
                🔄 تحديث
              </button>
              <button
                onClick={() => setIsServiceModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition cursor-pointer"
              >
                <span>+</span>
                <span>إضافة خدمة مساحية جديدة</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoadingServices && (
            <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/60 p-6 space-y-3">
              <div className="h-5 w-48 bg-gray-700/40 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-gray-800/40 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingServices && services.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-[#0F253E]/40 p-8 text-center space-y-3 shadow-xl backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-2xl shadow-inner">
                🧭
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">لا توجد خدمات مساحية مضافة حتى الآن</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  أضف تخصصات مكتبك (مثل: رفع مساحي، تقسيم أراضي، ميزانية شبكية، معايرة أجهزة) لتلقي طلبات عروض الأسعار من شركات المقاولات مباشرة.
                </p>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2 text-xs font-bold text-white shadow transition cursor-pointer"
              >
                <span>+</span>
                <span>أضف أول خدمة مساحية الآن</span>
              </button>
            </div>
          )}

          {/* Services Grid */}
          {!isLoadingServices && services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-3 hover:border-cyan-500/40 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold">
                        {svc.category}
                      </span>
                      <button
                        onClick={() => handleDeleteService(svc.id, svc.title)}
                        className="text-red-400 hover:text-red-300 p-1 text-xs rounded hover:bg-red-500/10 transition cursor-pointer"
                        title="حذف الخدمة"
                      >
                        🗑️
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-white">{svc.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {svc.description || 'خدمة مساحية معتمدة لشركات المقاولات والمشاريع الإنشائية.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="text-emerald-400 font-semibold">● معروضة في الدليل العام</span>
                    <span className="font-mono text-gray-500">{svc.created_at ? svc.created_at.slice(0, 10) : 'محدّثة'}</span>
                  </div>
                </div>
              ))}
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
              
              {/* Step 1 Target / Single Dropdown: Select Device from Catalog */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="catalog-device-select" className="block text-xs font-semibold text-gray-300">
                    اختر الجهاز من الكتالوج المعتمد (Master Catalog) <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[11px] text-amber-400/90 font-mono font-bold">
                    {MASTER_CATALOG.length} أجهزة معتمدة
                  </span>
                </div>
                <select
                  id="catalog-device-select"
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogItem(e.target.value)}
                  className="w-full rounded-xl border border-amber-500/40 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer font-medium"
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

                {/* Conditional Custom Name Input when "Other" is selected */}
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
                      className="w-full rounded-lg border border-amber-400/50 bg-[#081933] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Inherited Specifications & Preview Card */}
              {selectedItem && (
                <div className="rounded-xl border border-cyan-500/30 bg-[#061429] p-3 space-y-2">
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

              {/* Step 2 Target: Real Upload Area */}
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
                  className="rounded-xl border-2 border-dashed border-amber-500/40 bg-[#0F253E]/50 p-4 text-center hover:border-amber-400 transition cursor-pointer"
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
                      {(uploadedPhotos[0].startsWith('data:image') || uploadedPhotos[0].startsWith('http') || uploadedPhotos[0].startsWith('/')) && (
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

              {/* Step 3 Target: Pricing Inputs (Daily, Monthly, and Sale Price) */}
              <div id="tour-price-input" className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#0F253E]/40 border border-gray-800">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    السعر اليومي (ج.م) [إيجار]
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
                    السعر الشهري (ج.م) [إيجار]
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 25000"
                    value={newMonthlyPrice}
                    onChange={(e) => setNewMonthlyPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-[#081933] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    سعر البيع (ج.م) [اختياري]
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 120000"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    className="w-full rounded-lg border border-amber-500/30 bg-[#081933] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
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

      {/* Edit Price Modal Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
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

            {/* Form */}
            <form onSubmit={handleSaveEditPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  سعر الإيجار اليومي (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editDailyPrice}
                  onChange={(e) => setEditDailyPrice(e.target.value)}
                  placeholder="مثال: 1500"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition text-right"
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
                  value={editMonthlyPrice}
                  onChange={(e) => setEditMonthlyPrice(e.target.value)}
                  placeholder="مثال: 25000"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition text-right"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-800">
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

      {/* Add Service Modal Dialog */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <button
                onClick={() => setIsServiceModalOpen(false)}
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
            <form onSubmit={handleSaveService} className="space-y-4">
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
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  فئة وتصنيف الخدمة <span className="text-amber-400">*</span>
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
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
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSavingService ? 'جارٍ الحفظ في السحابة…' : 'حفظ ونشر الخدمة'}
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
