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
  status: 'متاح للإيجار' | 'قيد الصيانة' | 'محجوز' | 'pending' | string;
  photo: string;
  serial_number?: string;
  is_flagged_stolen?: boolean;
  created_at?: string;
}

interface StolenItem {
  id: string;
  provider_id?: string;
  serial_number: string;
  equipment_model: string;
  proof_document_url?: string;
  status: string;
  notes?: string;
  created_at?: string;
}

interface ProviderServiceItem {
  id: string;
  provider_id?: string;
  title: string;
  category: string;
  description?: string;
  created_at?: string;
}

const normalizeSerialNumber = (sn: string): string => {
  return (sn || '').trim().toUpperCase().replace(/[\s\-_]/g, '');
};

export default function ProviderDashboardPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);

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
  const [serialNumber, setSerialNumber] = useState<string>('');
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

  // Stolen Equipment Registry State
  const [isReportStolenModalOpen, setIsReportStolenModalOpen] = useState<boolean>(false);
  const [stolenSerial, setStolenSerial] = useState<string>('');
  const [stolenModel, setStolenModel] = useState<string>('');
  const [stolenNotes, setStolenNotes] = useState<string>('');
  const [stolenProofUrl, setStolenProofUrl] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [isSubmittingStolen, setIsSubmittingStolen] = useState<boolean>(false);
  const [myStolenReports, setMyStolenReports] = useState<StolenItem[]>([]);
  const proofFileInputRef = React.useRef<HTMLInputElement | null>(null);

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
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

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
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);

  // Dynamic Provider Profile Information (Header Summary)
  const [providerProfile, setProviderProfile] = useState({
    name: 'مزوّد معتمد',
    org: 'مكتب مساحي معتمد',
    location: 'تغطية شاملة',
  });

  // Phase 1: Provider Profile Form & Sync State
  const [profileData, setProfileData] = useState<{
    id: string | null;
    name: string;
    organization: string;
    phone: string;
    location: string;
    email: string;
    status: string;
  }>({
    id: null,
    name: '',
    organization: '',
    phone: '',
    location: '',
    email: '',
    status: 'pending',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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
          status: row.is_flagged_stolen ? 'قيد المراجعة الأمنية' : (row.status || 'متاح للإيجار'),
          photo: row.image_url || 'total_station_leica.jpg',
          serial_number: row.serial_number || undefined,
          is_flagged_stolen: !!row.is_flagged_stolen,
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
    let authUserId: string | null = null;
    let providerDbId: string | null = null;

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) authUserId = authData.user.id;
    } catch {}

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('SURVSTA_AUTH_USER');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!authUserId && parsed.id) authUserId = parsed.id;
        } catch {}
      }
    }

    if (authUserId) {
      try {
        const { data: provRow } = await supabase
          .from('providers')
          .select('id, profile_views')
          .or(`id.eq.${authUserId}`)
          .maybeSingle();
        if (provRow?.id) {
          providerDbId = provRow.id;
        }
        if (provRow?.profile_views !== undefined && provRow?.profile_views !== null) {
          setProfileViews(Number(provRow.profile_views));
        }
      } catch {}
    }

    const targetId = providerDbId || authUserId;

    // 1. Fetch Orders Stats & Total Revenue from orders table
    try {
      let ordersQuery = supabase.from('orders').select('*');
      if (targetId) {
        ordersQuery = ordersQuery.eq('provider_id', targetId);
      }

      const { data: ordersData, error: ordErr } = await ordersQuery;
      if (!ordErr && ordersData && ordersData.length > 0) {
        setRequestsCount(ordersData.length);

        // Count today's incoming orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = ordersData.filter((o: any) => new Date(o.created_at) >= today).length;
        setNewRequestsToday(newToday);

        // Calculate Revenue from completed orders
        const completed = ordersData.filter(
          (o: any) => o.status === 'completed' || o.status === 'مكتمل' || o.status === 'مكتمل بنجاح'
        );
        setCompletedOrdersCount(completed.length);
        const revSum = completed.reduce(
          (acc: number, curr: any) => acc + (Number(curr.amount || curr.total_price) || 0),
          0
        );
        setTotalRevenue(revSum);
      } else {
        // Fallback to contact_requests or mock counts if no live orders yet
        const { count: contactCount } = await supabase
          .from('contact_requests')
          .select('*', { count: 'exact', head: true });
        if (contactCount !== null) {
          setRequestsCount(contactCount);
        }
      }
    } catch {
      // fallback: 0
    }

    // 2. Fetch Profile Views
    try {
      if (targetId) {
        const { data: provData } = await supabase
          .from('providers')
          .select('profile_views')
          .eq('id', targetId)
          .maybeSingle();
        if (provData?.profile_views !== undefined && provData?.profile_views !== null) {
          setProfileViews(Number(provData.profile_views));
        } else {
          const { data: clientData } = await supabase
            .from('clients')
            .select('profile_views')
            .eq('id', targetId)
            .maybeSingle();
          if (clientData?.profile_views !== undefined && clientData?.profile_views !== null) {
            setProfileViews(Number(clientData.profile_views));
          }
        }
      }
    } catch {
      // Table column not yet set - fallback
    }

    // 3. Fetch reviews / ratings
    try {
      let revQuery = supabase.from('provider_reviews').select('rating');
      if (targetId) {
        revQuery = revQuery.eq('provider_id', targetId);
      }

      const { data: revData, error: revErr } = await revQuery;
      if (!revErr && revData && revData.length > 0) {
        const sum = revData.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
        setRating(sum / revData.length);
        setReviewCount(revData.length);
      } else {
        const { data: oldRev } = await supabase.from('reviews').select('rating');
        if (oldRev && oldRev.length > 0) {
          const sum = oldRev.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
          setRating(sum / oldRev.length);
          setReviewCount(oldRev.length);
        } else if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_REVIEWS');
          if (cached) {
            try {
              const list = JSON.parse(cached);
              if (Array.isArray(list) && list.length > 0) {
                const sum = list.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
                setRating(sum / list.length);
                setReviewCount(list.length);
              }
            } catch {}
          }
        }
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

  // Fetch Stolen Equipment Reports for this provider
  const fetchStolenReports = async () => {
    try {
      let activeUserId: string | null = providerId;
      if (!activeUserId && typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            activeUserId = JSON.parse(stored).id || null;
          } catch {}
        }
      }

      let query = supabase
        .from('stolen_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUserId) {
        query = query.eq('provider_id', activeUserId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setMyStolenReports(data);
      } else {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_STOLEN_REPORTS');
          if (cached) setMyStolenReports(JSON.parse(cached));
        }
      }
    } catch (err) {
      console.warn('[fetchStolenReports]:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('SURVSTA_LOCAL_STOLEN_REPORTS');
        if (cached) setMyStolenReports(JSON.parse(cached));
      }
    }
  };

  // Upload proof of ownership file (document/image)
  const handleProofUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanFileName = `stolen_proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `stolen_proofs/${cleanFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          setStolenProofUrl(publicUrlData.publicUrl);
          showToast('📄 تم رفع وثيقة إثبات الملكية بنجاح.');
          setIsUploadingProof(false);
          return;
        }
      }

      // Base64 Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setStolenProofUrl(base64);
          showToast('📄 تم تجهيز وثيقة إثبات الملكية.');
        }
        setIsUploadingProof(false);
      };
      reader.onerror = () => {
        showToast('تعذر قراءة ملف الوثيقة.');
        setIsUploadingProof(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('[Proof upload error]:', err);
      setIsUploadingProof(false);
    }
  };

  // Submit Stolen Equipment Report
  const handleSubmitStolenReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stolenModel.trim()) {
      showToast('⚠️ يرجى إدخال اسم وموديل الجهاز المفقود/المسروق.');
      return;
    }
    if (!stolenSerial.trim()) {
      showToast('⚠️ الرقم التسلسلي (Serial Number) إلزامي لتسجيل البلاغ.');
      return;
    }

    setIsSubmittingStolen(true);
    const cleanSerial = stolenSerial.trim().toUpperCase();

    try {
      let activeUserId: string | null = providerId;
      if (!activeUserId && typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            activeUserId = JSON.parse(stored).id || null;
          } catch {}
        }
      }

      const payload: any = {
        serial_number: cleanSerial,
        equipment_model: stolenModel.trim(),
        proof_document_url: stolenProofUrl || null,
        notes: stolenNotes.trim() || null,
        status: 'verified',
      };

      if (activeUserId) {
        payload.provider_id = activeUserId;
      }

      const { data, error } = await supabase.from('stolen_registry').insert([payload]).select();

      const newReport: StolenItem = {
        id: data?.[0]?.id || `STL-${Date.now()}`,
        provider_id: activeUserId || undefined,
        serial_number: cleanSerial,
        equipment_model: stolenModel.trim(),
        proof_document_url: stolenProofUrl || undefined,
        notes: stolenNotes.trim() || undefined,
        status: 'verified',
        created_at: new Date().toISOString(),
      };

      setMyStolenReports((prev) => [newReport, ...prev]);

      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_STOLEN_REPORTS') || '[]');
        localStorage.setItem('SURVSTA_LOCAL_STOLEN_REPORTS', JSON.stringify([newReport, ...existing]));
      }

      // Create Security Alert in inapp_notifications targeted at admin
      try {
        await supabase.from('inapp_notifications').insert([
          {
            title: 'بلاغ سرقة جديد في المنصة',
            message: `تم تسجيل بلاغ سرقة رسمي لجهاز (${stolenModel.trim()}) برقم تسلسلي (${cleanSerial}). تم إدراج الرقم في سجل الحظر لمنع إعادة تداوله.`,
            type: 'warning',
            link: '/admin/equipment',
          }
        ]);
      } catch (notifErr) {
        console.warn('[Admin Stolen Alert Notice]:', notifErr);
      }

      showToast(`🚨 تم تسجيل بلاغ السرقة للجهاز (${cleanSerial}) بنجاح في سجل الحماية الموحد!`);
      setStolenModel('');
      setStolenSerial('');
      setStolenNotes('');
      setStolenProofUrl('');
      setIsReportStolenModalOpen(false);
    } catch (err: any) {
      console.error('[handleSubmitStolenReport Exception]:', err);
      showToast('❌ تعذر إرسال البلاغ حالياً، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmittingStolen(false);
    }
  };

  // Phase 1: Fetch provider profile from Supabase Auth & live providers table
  const fetchProviderProfile = async () => {
    try {
      let activeEmail: string | null = null;
      let activeUserId: string | null = null;

      // 1. Check active Supabase Auth session
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        activeEmail = authData.user.email?.trim().toLowerCase() || null;
        activeUserId = authData.user.id;
      }

      // 2. Check localStorage session fallback
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!activeEmail && parsed.email) activeEmail = parsed.email.trim().toLowerCase();
            if (!activeUserId && parsed.id) activeUserId = parsed.id;
          }
        } catch {}
      }

      if (!activeEmail && !activeUserId) return;

      // 3. Query Supabase providers table
      let query = supabase.from('providers').select('*');
      if (activeEmail) {
        query = query.eq('email', activeEmail);
      } else if (activeUserId) {
        query = query.eq('id', activeUserId);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        setProviderId(data.id);
        const nameVal = data.name || '';
        const orgVal = data.company_name || data.organization || data.name || 'مكتب مساحي معتمد';
        const phoneVal = data.phone || '';
        const locVal = data.location || '';
        const emailVal = data.email || activeEmail || '';

        setProfileData({
          id: data.id,
          name: nameVal,
          organization: orgVal,
          phone: phoneVal,
          location: locVal,
          email: emailVal,
          status: data.status || 'pending',
        });

        setProviderProfile({
          name: nameVal || 'مزوّد معتمد',
          org: orgVal,
          location: locVal || 'تغطية شاملة',
        });

        // Sync back to localStorage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('SURVSTA_AUTH_USER');
            const parsed = stored ? JSON.parse(stored) : {};
            localStorage.setItem(
              'SURVSTA_AUTH_USER',
              JSON.stringify({
                ...parsed,
                id: data.id,
                name: nameVal,
                org: orgVal,
                phone: phoneVal,
                location: locVal,
              })
            );
          } catch {}
        }
      }

      // Check admin and pending approval status
      let isAdmin = false;
      if (activeEmail === 'ahmed@survsta.com') isAdmin = true;
      if (authData?.user?.user_metadata?.role === 'admin') isAdmin = true;
      if (typeof window !== 'undefined') {
        try {
          const s = localStorage.getItem('SURVSTA_AUTH_USER');
          if (s && JSON.parse(s).role === 'admin') isAdmin = true;
        } catch {}
      }

      let moduleIsPending = false;
      // Check auth metadata
      const authModules = authData?.user?.user_metadata?.active_modules;
      if (authModules && typeof authModules === 'object' && !Array.isArray(authModules)) {
        if (authModules.provider === 'pending') moduleIsPending = true;
      }

      // Check clients table
      if (activeUserId) {
        const { data: clientRow } = await supabase
          .from('clients')
          .select('active_modules')
          .eq('user_id', activeUserId)
          .maybeSingle();

        if (clientRow?.active_modules && typeof clientRow.active_modules === 'object' && !Array.isArray(clientRow.active_modules)) {
          if (clientRow.active_modules.provider === 'pending') {
            moduleIsPending = true;
          }
        }
      }

      const provDbStatus = data?.status;
      const isPending = provDbStatus === 'pending' || provDbStatus === 'needs_revision' || moduleIsPending || (!data && !isAdmin);

      if (!isAdmin && isPending) {
        setIsPendingApproval(true);
      } else {
        setIsPendingApproval(false);
      }
    } catch (err) {
      console.warn('[fetchProviderProfile error]:', err);
    }
  };

  // Phase 1: Save provider profile updates to Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      setProfileError('يرجى إدخال اسم المسؤول أو ممثل الجهة.');
      return;
    }
    if (!profileData.phone.trim()) {
      setProfileError('يرجى إدخال رقم هاتف التواصل.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaveSuccess(false);

    try {
      const updatePayload: Record<string, any> = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        location: profileData.location.trim(),
      };

      if (profileData.organization.trim()) {
        updatePayload.company_name = profileData.organization.trim();
      }

      let dbQuery = supabase.from('providers').update(updatePayload);
      if (profileData.id) {
        dbQuery = dbQuery.eq('id', profileData.id);
      } else if (profileData.email) {
        dbQuery = dbQuery.eq('email', profileData.email.trim().toLowerCase());
      } else {
        throw new Error('تعذر تحديد معرّف الحساب في قاعدة البيانات.');
      }

      let { error } = await dbQuery;

      // Graceful fallback if company_name column doesn't exist
      if (error && (error.message?.includes('company_name') || error.code === 'PGRST204')) {
        delete updatePayload.company_name;
        let retryQuery = supabase.from('providers').update(updatePayload);
        if (profileData.id) {
          retryQuery = retryQuery.eq('id', profileData.id);
        } else {
          retryQuery = retryQuery.eq('email', profileData.email.trim().toLowerCase());
        }
        const res = await retryQuery;
        error = res.error;
      }

      if (error) {
        throw error;
      }

      setProviderProfile({
        name: profileData.name.trim(),
        org: profileData.organization.trim() || profileData.name.trim(),
        location: profileData.location.trim() || 'تغطية شاملة',
      });

      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          const parsed = stored ? JSON.parse(stored) : {};
          localStorage.setItem(
            'SURVSTA_AUTH_USER',
            JSON.stringify({
              ...parsed,
              name: profileData.name.trim(),
              org: profileData.organization.trim() || profileData.name.trim(),
              phone: profileData.phone.trim(),
              location: profileData.location.trim(),
            })
          );
        } catch {}
      }

      setProfileSaveSuccess(true);
      showToast('✅ تم حفظ وتحديث بيانات الملف الشخصي بنجاح في السحابة!');
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('[handleSaveProfile error]:', err);
      setProfileError(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    fetchProviderProfile();
    fetchEquipment();
    fetchKpiData();
    fetchServices();
    fetchStolenReports();
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

    if (!serialNumber.trim()) {
      showToast('⚠️ الرقم التسلسلي للجهاز (Serial Number) إلزامي للتحقق الأمني ومنع التكرار.');
      setIsSaving(false);
      return;
    }

    const rawSerial = serialNumber.trim().toUpperCase();
    const normalizedSerial = normalizeSerialNumber(serialNumber);

    try {
      // 1. Anti-Fraud Pre-Insert Check: Verify serial number against stolen_registry
      let isStolenMatch = false;
      let matchedReport: any = null;

      try {
        const { data: stolenList } = await supabase
          .from('stolen_registry')
          .select('*');

        if (stolenList && stolenList.length > 0) {
          matchedReport = stolenList.find((item: any) => {
            const itemNorm = normalizeSerialNumber(item.serial_number || '');
            return itemNorm === normalizedSerial;
          });
          if (matchedReport) {
            isStolenMatch = true;
          }
        }
      } catch (checkErr) {
        console.warn('[Stolen Registry Check Notice]:', checkErr);
      }

      const deviceStatus = isStolenMatch ? 'pending' : 'متاح للإيجار';

      // 2. If matched as stolen: Alert Admin immediately via inapp_notifications
      if (isStolenMatch) {
        try {
          await supabase.from('inapp_notifications').insert([
            {
              title: 'تنبيه أمني: محاولة إدراج جهاز مسروق',
              message: `تنبيه أمني: محاولة إدراج جهاز متطابق مع بلاغ سرقة (سيريال: ${rawSerial})`,
              type: 'warning',
              link: '/admin/equipment',
            }
          ]);
        } catch (notifErr) {
          console.warn('[Admin Alert Notice]:', notifErr);
        }
      }

      // 3. Prepare payload with serial_number and is_flagged_stolen
      let insertPayload: any = {
        title: titleToSave,
        category: categoryToSave,
        daily_price: dailyNum,
        monthly_price: monthlyNum,
        image_url: photoUrl,
        serial_number: rawSerial,
        is_flagged_stolen: isStolenMatch,
        status: deviceStatus,
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

      // If serial_number or is_flagged_stolen doesn't exist in DB yet, fallback gracefully
      if (error && (error.message?.includes('serial_number') || error.message?.includes('is_flagged_stolen') || error.code === 'PGRST204')) {
        delete insertPayload.serial_number;
        delete insertPayload.is_flagged_stolen;
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
          status: deviceStatus,
          photo: photoUrl,
          serial_number: rawSerial,
          is_flagged_stolen: isStolenMatch,
        };
        setEquipment((prev) => [localItem, ...prev]);
        setUploadedEquipmentCount((prev) => prev + 1);
        if (isStolenMatch) {
          showToast(`🚨 تنبيه أمني: تم حجب نشر الجهاز ووضعه قيد المراجعة الأمنية لمطابقته مع بلاغ سرقة مسجل (سيريال: ${rawSerial}).`);
        } else {
          showToast('⚠️ تم إضافة الجهاز محلياً (وضع عدم الاتصال بالسحابة)');
        }
      } else if (data && data[0]) {
        const row = data[0];
        const addedItem: EquipmentItem = {
          id: row.id,
          title: row.title,
          category: row.category,
          dailyRate: row.daily_price ? `${Number(row.daily_price).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: row.monthly_price ? `${Number(row.monthly_price).toLocaleString('en-US')} ج.م` : '—',
          salePrice: row.sale_price ? `${Number(row.sale_price).toLocaleString('en-US')} ج.م` : salePriceFormatted,
          status: row.is_flagged_stolen ? 'قيد المراجعة الأمنية' : (row.status || deviceStatus),
          photo: row.image_url || photoUrl,
          serial_number: row.serial_number || rawSerial,
          is_flagged_stolen: typeof row.is_flagged_stolen === 'boolean' ? row.is_flagged_stolen : isStolenMatch,
          created_at: row.created_at,
        };
        setEquipment((prev) => [addedItem, ...prev]);
        setUploadedEquipmentCount((prev) => prev + 1);
        if (isStolenMatch) {
          showToast(`🚨 تنبيه أمني: تم حجب نشر الجهاز ووضعه قيد المراجعة الأمنية لمطابقته مع بلاغ سرقة مسجل (سيريال: ${rawSerial}).`);
        } else {
          showToast(`🎉 تم حفظ ونشر "${titleToSave}" بنجاح في قاعدة البيانات الحية!`);
        }
      }

      setCustomTitle('');
      setSerialNumber('');
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

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-slate-950 text-right text-slate-100 flex items-center justify-center p-4 sm:p-6 selection:bg-amber-500 selection:text-slate-950" dir="rtl">
        <div className="max-w-xl w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-950/20 space-y-8 relative overflow-hidden">
          {/* Glowing Amber Background Effect */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Lock / Pending Icon */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-3xl text-amber-400 shadow-xl shadow-amber-500/10">
                ⏳
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
                🔒
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>حالة الحساب: قيد المراجعة والتدقيق</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                حساب المزود قيد المراجعة
              </h1>
              <p className="text-sm font-semibold text-amber-300">
                حساب المزود قيد المراجعة. سيتم إشعارك فور الاعتماد.
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              شكراً لانضمامك إلى شبكة مزودي منصة Survsta. يجري حالياً تدقيق واعتماد بيانات الحساب والكتالوج من قبل فريق الإدارة لضمان أعلى معايير الجودة والموثوقية المساحية.
            </p>
          </div>

          {/* Feature Highlights When Approved */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-3 relative z-10">
            <div className="text-xs font-bold text-slate-300">
              ماذا بعد اكتمال الاعتماد؟
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>إدراج وإدارة كتالوج أجهزتك المساحية (Total Station, GPS, 3D Scanners).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>تحديد أسعار الإيجار اليومي والشهري واستقبال طلبات الحجز مباشرة.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>تلقي إشعار فوري داخل المنصة عبر مركز الإشعارات فور تفعيل الحساب.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 relative z-10">
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-600/20 transition"
            >
              <span>العودة إلى لوحة التحكم الموحدة</span>
              <span>←</span>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                🔄 إعادة التحقق من الحالة
              </button>

              <a
                href="https://wa.me/201000000000?text=مرحباً، أستفسر عن حالة اعتماد حساب المزود الخاص بي في منصة Survsta"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition"
              >
                <span>💬 تواصل عبر واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

            {/* Step: Report Stolen Device button */}
            <button
              type="button"
              onClick={() => setIsReportStolenModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-300 transition shadow-lg shadow-rose-950/30 cursor-pointer"
              title="تسجيل بلاغ رسمي عن جهاز مسروق لمنع تداوله"
            >
              <span>🚨</span>
              <span>الإبلاغ عن جهاز مسروق</span>
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
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end flex-wrap">
              <span>{providerProfile.org} • {providerProfile.name}</span>
              <Link
                href="/provider/locations"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 mr-1 transition"
                title="تعديل وتحديد المحافظات المغطاة"
              >
                <span>📍</span>
                <span>{providerProfile.location || 'تحديد التغطية الجغرافية'}</span>
              </Link>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            href="/provider/analytics"
            className="rounded-2xl border border-emerald-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md hover:border-emerald-400/50 transition group block cursor-pointer"
          >
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="group-hover:text-emerald-300 transition font-semibold">إجمالي الإيرادات</span>
              <span className="text-emerald-400 text-lg group-hover:scale-110 transition">💰</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                `${totalRevenue.toLocaleString('en-US')} ج.م`
              )}
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center justify-between">
              <span>{completedOrdersCount > 0 ? `من ${completedOrdersCount} طلبات مكتملة` : 'عرض تقارير الأرباح'}</span>
              <span className="group-hover:translate-x-[-3px] transition font-bold">←</span>
            </div>
          </Link>

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

          <Link
            href="/provider/orders"
            className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md hover:border-cyan-400/50 transition group block cursor-pointer"
          >
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="group-hover:text-cyan-300 transition font-semibold">صندوق الطلبات الواردة</span>
              <span className="text-cyan-400 text-lg group-hover:scale-110 transition">📥</span>
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                `${requestsCount} طلب`
              )}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1 flex items-center justify-between">
              <span>{newRequestsToday > 0 ? `▲ ${newRequestsToday} طلبات جديدة اليوم` : 'فتح وإدارة صندوق الطلبات'}</span>
              <span className="group-hover:translate-x-[-3px] transition font-bold">←</span>
            </div>
          </Link>

          <Link
            href="/provider/analytics"
            className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md hover:border-purple-400/50 transition group block cursor-pointer"
          >
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="group-hover:text-purple-300 transition font-semibold">مشاهدات الملف</span>
              <span className="text-purple-400 text-lg group-hover:scale-110 transition">👁️</span>
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : (
                profileViews.toLocaleString('en-US')
              )}
            </div>
            <div className="text-[11px] text-purple-400/90 mt-1 flex items-center justify-between">
              <span>{profileViews > 0 ? 'من مهندسين وشركات مقاولات' : 'فتح تقارير التحليلات'}</span>
              <span className="group-hover:translate-x-[-3px] transition font-bold">←</span>
            </div>
          </Link>

          <Link
            href="/provider/reviews"
            className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md hover:border-yellow-400/50 transition group block cursor-pointer"
          >
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span className="group-hover:text-yellow-300 transition font-semibold">تقييم المزوّد</span>
              <span className="text-yellow-400 text-lg group-hover:scale-110 transition">⭐</span>
            </div>
            <div className="text-2xl font-black text-yellow-400 font-mono">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-700/50 animate-pulse rounded"></span>
              ) : rating !== null && rating > 0 ? (
                `${rating.toFixed(1)} / 5.0`
              ) : (
                '0.0 / 5.0'
              )}
            </div>
            <div className="text-[11px] text-yellow-400/90 mt-1 flex items-center justify-between">
              <span>{reviewCount > 0 ? `بناءً على ${reviewCount} مراجعة معتمدة` : 'عرض وسجل تقييمات العملاء'}</span>
              <span className="group-hover:translate-x-[-3px] transition font-bold">←</span>
            </div>
          </Link>
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
                          {item.is_flagged_stolen && (
                            <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                              🚨 مسروق
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-1">
                          {item.serial_number && (
                            <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
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
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-300">
                        {item.dailyRate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-300">
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

        {/* Anti-Fraud Stolen Equipment Registry Section */}
        <div className="space-y-4 scroll-mt-6 pt-8 border-t border-rose-500/20" id="stolen-registry">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold mb-1">
                <span>🛡️ نظام مكافحة السرقة والاحتيال</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>سجل بلاغات الأجهزة المفقودة والمسروقة</span>
              </h2>
              <p className="text-xs text-gray-400">
                سجل أمني مركزي لحماية أجهزة المساحة، يتم التحقق تلقائياً من أي جهاز جديد يُعرض للإيجار أو البيع لمنع تداول الأجهزة المسروقة.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsReportStolenModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition cursor-pointer"
              >
                <span>+</span>
                <span>تسجيل بلاغ سرقة جديد</span>
              </button>
            </div>
          </div>

          {myStolenReports.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-2">
              <span className="text-2xl">🔒</span>
              <p className="text-xs text-slate-400">
                لم تقم بتسجيل أي بلاغات سرقة حتى الآن. في حال فقدان أي معدة، يمكنك تسجيل رقمها التسلسلي ووثيقة إثبات الملكية لحظرها فورياً عبر شبكة المنصة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myStolenReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      ● حظر نشط بالمنصة
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {report.created_at ? report.created_at.slice(0, 10) : 'مُسجل'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{report.equipment_model}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">الرقم التسلسلي:</span>
                      <span className="font-mono text-xs font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                        {report.serial_number}
                      </span>
                    </div>
                  </div>
                  {report.notes && (
                    <p className="text-[11px] text-gray-400 line-clamp-2">
                      {report.notes}
                    </p>
                  )}
                  {report.proof_document_url && (
                    <a
                      href={report.proof_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                    >
                      <span>📎 عرض وثيقة إثبات الملكية</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Orders Quick Banner / Preview Section */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0F253E] to-[#0A1A30] p-6 shadow-xl scroll-mt-6" id="leads">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold">
                <span>📥 مركز العمليات والطلبات</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>صندوق الطلبات الواردة (Incoming Orders)</span>
              </h3>
              <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                استقبل وأدِر طلبات الاستئجار والشراء وحجوزات الخدمات المساحية المرسلة من العملاء. يمكنك مراجعة تفاصيل كل طلب، تحديث حالته، والتواصل مباشرة عبر واتساب.
              </p>
            </div>
            <Link
              href="/provider/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition shrink-0 cursor-pointer"
            >
              <span>فتح وإدارة صندوق الطلبات</span>
              <span>←</span>
            </Link>
          </div>
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

        {/* Phase 1: Provider Profile Management & Database Sync Section */}
        <div className="space-y-4 scroll-mt-6 pt-8 border-t border-amber-500/20" id="profile">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1">
                <span>🏢 الملف الشخصي للجهة والشريك</span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>إدارة وتحديث بيانات الشريك المعتمد</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                تعديل البيانات الأساسية، أرقام التواصل، والمقر الجغرافي المعروض في دليل المنصة ومحركات البحث.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                profileData.status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {profileData.status === 'approved' ? '✓ حساب معتمد ونشط' : '⏳ الحساب قيد المراجعة'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-xl space-y-6">
            {profileError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
                <span>❌</span>
                <span>{profileError}</span>
              </div>
            )}

            {profileSaveSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
                <span>✅</span>
                <span>تم تحديث بياناتك بنجاح ومزامنتها مع قاعدة بيانات منصة Survsta!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Provider Contact Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    اسم المسؤول / ممثل الجهة <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: م. أحمد النجار"
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">يظهر كجهة الاتصال للمهندسين وطالبي الخدمات والمعدات.</p>
                </div>

                {/* Organization / Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    اسم المكتب أو الشركة المساحية <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.organization}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, organization: e.target.value }))}
                    placeholder="مثال: مكتب النخبة للهندسة والمساحة"
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">اسم الكيان التجاري أو المكتب المسجل في المنصة.</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    رقم هاتف التواصل والواتساب <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={profileData.phone}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="010XXXXXXXX"
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none font-mono text-right"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">الرقم الذي يستقبل اتصالات المهندسين واستفسارات الإيجار.</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    المحافظة والمقر الرئيسي والتغطية <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.location}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="مثال: القاهرة — مدينة نصر والتجمع الخامس"
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">يحدد نطاق ظهور أجهزتك في الفلاتر الجغرافية للدليل العام.</p>
                </div>

                {/* Email (Readonly Auth Field) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center justify-between">
                    <span>البريد الإلكتروني المسجل للحساب</span>
                    <span className="text-[10px] text-amber-400 font-normal">🔒 مرتبط بحساب المصادقة</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    dir="ltr"
                    value={profileData.email}
                    className="w-full rounded-xl border border-gray-800 bg-[#061429] px-4 py-2.5 text-xs text-gray-400 cursor-not-allowed font-mono opacity-80"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">البريد الإلكتروني الأساسي المستخدم لتسجيل الدخول وإشعارات الطلبات.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-gray-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>جارٍ حفظ التحديثات في السحابة...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>حفظ وتحديث بيانات الملف (Save Profile)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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

              {/* Mandatory Serial Number Field for Anti-Fraud Verification */}
              <div className="rounded-xl border border-cyan-500/30 bg-[#061429] p-3.5 space-y-1.5">
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
                  placeholder="مثال: TS-06-894123 أو SN98234..."
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full rounded-lg border border-cyan-500/40 bg-[#081933] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                />
                <p className="text-[10px] text-gray-400">
                  يتم التحقق تلقائياً من الرقم التسلسلي عبر سجل مكافحة سرقة الأجهزة لحماية مجتمع المساحين ومنع تداول المعدات غير القانونية.
                </p>
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

      {/* Report Stolen Device Modal Dialog */}
      {isReportStolenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <button
                type="button"
                onClick={() => setIsReportStolenModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">تسجيل بلاغ سرقة جهاز مساحي</h3>
                  <p className="text-[11px] text-rose-300">إدراج الرقم التسلسلي في سجل الحظر لمنع التداول</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitStolenReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  نوع وموديل الجهاز المفقود/المسروق <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stolenModel}
                  onChange={(e) => setStolenModel(e.target.value)}
                  placeholder="مثال: Leica FlexLine TS06 Plus أو Trimble R10 GNSS"
                  className="w-full rounded-xl border border-rose-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  الرقم التسلسلي للجهاز (Serial Number) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stolenSerial}
                  onChange={(e) => setStolenSerial(e.target.value)}
                  placeholder="مثال: 1845920 أو SN-40291"
                  className="w-full rounded-xl border border-rose-500/40 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-rose-300/80 mt-1">
                  * سيتم فحص أي جهاز يُدرج في المنصة ومطابقته مع هذا الرقم فورياً وإيقاف نشره تلقائياً.
                </p>
              </div>

              {/* Upload Proof Document */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  وثيقة إثبات الملكية أو محضر الشرطة <span className="text-gray-500">(صورة فاتورة، شهادة معايرة، محضر)</span>
                </label>
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProofUpload(e.target.files[0]);
                    }
                  }}
                />
                <div
                  className="rounded-xl border-2 border-dashed border-rose-500/30 bg-[#0F253E]/60 p-4 text-center hover:border-rose-400 transition cursor-pointer"
                  onClick={() => proofFileInputRef.current?.click()}
                >
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-xs font-semibold text-rose-300">
                    {isUploadingProof ? 'جارٍ رفع الوثيقة...' : stolenProofUrl ? '✓ تم إرفاق وثيقة الملكية بنجاح' : 'اضغط لاختيار صورة الفاتورة أو وثيقة الملكية'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">يدعم الصور وملفات PDF</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  تفاصيل إضافية عن واقعة السرقة <span className="text-gray-500">(اختياري)</span>
                </label>
                <textarea
                  rows={3}
                  value={stolenNotes}
                  onChange={(e) => setStolenNotes(e.target.value)}
                  placeholder="مكان وتاريخ السرقة، رقم المحضر إن وجد، أي علامات مميزة على الجهاز..."
                  className="w-full rounded-xl border border-rose-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportStolenModalOpen(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStolen}
                  className="rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingStolen ? 'جارٍ تسجيل البلاغ...' : 'تسجيل البلاغ في سجل الحماية'}
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
