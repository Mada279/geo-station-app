'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/utils/supabaseClient';
import WalletTopUpModal from '@/components/provider/WalletTopUpModal';
import ProviderStatsCards from '@/components/provider/ProviderStatsCards';
import ProviderEquipmentSection from '@/components/provider/ProviderEquipmentSection';
import ProviderServicesSection from '@/components/provider/ProviderServicesSection';
import ProviderStolenRegistrySection from '@/components/provider/ProviderStolenRegistrySection';
import ProviderProfileSection from '@/components/provider/ProviderProfileSection';
import ProviderWalletSection from '@/components/provider/ProviderWalletSection';
import ProviderOrdersBanner from '@/components/provider/ProviderOrdersBanner';
import ProviderHeader from '@/components/provider/ProviderHeader';
import {
  EquipmentItem,
  StolenItem,
  ProviderServiceItem,
  ProviderProfileData,
} from '@/components/provider/types';

const DashboardTour = dynamic(
  () => import('@/components/provider/DashboardTour'),
  { ssr: false }
);

const normalizeSerialNumber = (sn: string): string => {
  return (sn || '').trim().toUpperCase().replace(/[\s\-_]/g, '');
};

let cachedProviderRowId: string | null = null;

async function resolveProviderRowId(): Promise<string | null> {
  if (cachedProviderRowId) return cachedProviderRowId;

  const { data: authData } = await supabase.auth.getUser();
  const uid = authData?.user?.id || null;
  const email = (authData?.user?.email || '').toLowerCase();
  if (!uid && !email) return null;

  const filters: string[] = [];
  if (uid) filters.push(`user_id.eq.${uid}`);
  if (email) filters.push(`email.eq.${email}`);

  const { data } = await supabase
    .from('providers')
    .select('id')
    .or(filters.join(','))
    .maybeSingle();

  if (!data?.id) return null;

  cachedProviderRowId = String(data.id);
  return cachedProviderRowId;
}

export default function ProviderDashboardPage() {
  // Equipment State
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);

  // Services State
  const [services, setServices] = useState<ProviderServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false);

  // Stolen Reports State
  const [myStolenReports, setMyStolenReports] = useState<StolenItem[]>([]);
  const [isLoadingStolen, setIsLoadingStolen] = useState<boolean>(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile & Wallet State
  const [providerId, setProviderId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProviderProfileData>({
    name: '',
    organization: '',
    phone: '',
    location: '',
    email: '',
    status: 'pending',
  });
  const [providerProfile, setProviderProfile] = useState<{
    name: string;
    org: string;
    location: string;
  }>({
    name: 'مزوّد معتمد',
    org: 'مكتب مساحي معتمد',
    location: 'تغطية شاملة',
  });

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Stats / KPI State
  const [uploadedEquipmentCount, setUploadedEquipmentCount] = useState<number>(0);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [newRequestsToday, setNewRequestsToday] = useState<number>(0);
  const [profileViews, setProfileViews] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);
  const [rating, setRating] = useState<number | null>(5.0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Provider Profile
  const fetchProviderProfile = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const activeEmail = authData?.user?.email || null;
      const providerRowId = await resolveProviderRowId();

      let data: any = null;

      if (providerRowId) {
        const res = await supabase
          .from('providers')
          .select('*')
          .eq('id', providerRowId)
          .maybeSingle();

        if (res.error) console.warn('[fetchProviderProfile]:', res.error.message);
        data = res.data;
      }

      if (data) {
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

        if (data.wallet_balance !== undefined && data.wallet_balance !== null) {
          setWalletBalance(Number(data.wallet_balance) || 0);
        }

        if (data.status === 'pending') {
          setIsPendingApproval(true);
        } else {
          setIsPendingApproval(false);
        }
      }
    } catch (err) {
      console.warn('[fetchProviderProfile exception]:', err);
    }
  };

  // 2. Fetch Equipment
  const fetchEquipment = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const activeUserId = await resolveProviderRowId();

      let query = supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUserId) {
        query = query.eq('provider_id', activeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[fetchEquipment] error:', error.message);
        setFetchError('تعذر جلب الأجهزة من قاعدة البيانات');
        setEquipment([]);
        setUploadedEquipmentCount(0);
      } else if (data && data.length > 0) {
        const mapped: EquipmentItem[] = data.map((row: any) => ({
          id: String(row.id),
          title: row.title || 'جهاز مساحي',
          category: row.category || 'أجهزة مساحية',
          dailyRate: row.daily_price ? `${Number(row.daily_price).toLocaleString('en-US')} ج.م` : '—',
          monthlyRate: row.monthly_price ? `${Number(row.monthly_price).toLocaleString('en-US')} ج.م` : '—',
          salePrice: row.sale_price ? `${Number(row.sale_price).toLocaleString('en-US')} ج.م` : undefined,
          status: row.is_flagged_stolen ? 'قيد المراجعة الأمنية' : (row.status || 'متاح للإيجار'),
          photo: row.image_url || '/images/default_equipment.png',
          serial_number: row.serial_number || undefined,
          is_flagged_stolen: Boolean(row.is_flagged_stolen),
          created_at: row.created_at,
        }));
        setEquipment(mapped);
        setUploadedEquipmentCount(mapped.length);
      } else {
        setEquipment([]);
        setUploadedEquipmentCount(0);
      }
    } catch (err: any) {
      console.warn('[fetchEquipment exception]:', err);
      setFetchError('حدث خطأ أثناء تحميل بيانات المعدات');
      setEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Fetch KPI Data
  const fetchKpiData = async () => {
    try {
      const targetId = providerId || (await resolveProviderRowId());

      if (targetId) {
        // Orders count
        const { count: ordCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', targetId);

        setRequestsCount(ordCount || 0);

        // Revenue sum
        const { data: revOrders } = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('provider_id', targetId)
          .eq('status', 'completed');

        if (revOrders && revOrders.length > 0) {
          const sum = revOrders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
          setTotalRevenue(sum);
          setCompletedOrdersCount(revOrders.length);
        }
      }

      // Reviews
      let revQuery = supabase.from('provider_reviews').select('rating');
      if (targetId) revQuery = revQuery.eq('provider_id', targetId);

      const { data: revData } = await revQuery;
      if (revData && revData.length > 0) {
        const sum = revData.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
        setRating(sum / revData.length);
        setReviewCount(revData.length);
      }
    } catch {
      // Non-blocking
    }
  };

  // 4. Fetch Services
  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const activeUserId = await resolveProviderRowId();
      let query = supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUserId) query = query.eq('provider_id', activeUserId);

      const { data, error } = await query;
      if (!error && data) {
        setServices(data);
      }
    } catch (err) {
      console.warn('[fetchServices]:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  // 5. Fetch Stolen Reports
  const fetchStolenReports = async () => {
    setIsLoadingStolen(true);
    try {
      const activeUserId = providerId || (await resolveProviderRowId());
      if (!activeUserId) {
        setMyStolenReports([]);
        return;
      }

      const { data, error } = await supabase
        .from('stolen_registry')
        .select('*')
        .eq('reported_by', activeUserId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyStolenReports(
          data.map((row: any) => ({
            id: row.id,
            provider_id: row.reported_by,
            serial_number: row.serial_number || '',
            equipment_model: row.device_model || '',
            proof_document_url: row.proof_document_url,
            notes: row.notes,
            status: row.status || 'verified',
            created_at: row.created_at,
          }))
        );
      }
    } catch (err) {
      console.warn('[fetchStolenReports]:', err);
    } finally {
      setIsLoadingStolen(false);
    }
  };

  useEffect(() => {
    fetchProviderProfile();
    fetchEquipment();
    fetchKpiData();
    fetchServices();
    fetchStolenReports();
  }, []);

  // Handler: Save Device
  const handleSaveDevice = async (device: {
    title: string;
    category: string;
    brand: string;
    description?: string;
    dailyPrice: number;
    monthlyPrice: number;
    salePrice?: number;
    serialNumber: string;
    photoUrl?: string;
  }): Promise<boolean> => {
    const rawSerial = device.serialNumber.trim().toUpperCase();
    const normalizedSerial = normalizeSerialNumber(device.serialNumber);

    try {
      // Anti-Fraud Pre-Check
      let isStolenMatch = false;
      try {
        const { data: stolenList } = await supabase.from('stolen_registry').select('serial_number');
        if (stolenList && stolenList.length > 0) {
          isStolenMatch = stolenList.some(
            (item: any) => normalizeSerialNumber(item.serial_number || '') === normalizedSerial
          );
        }
      } catch {}

      const activeUserId = providerId || (await resolveProviderRowId());
      const payload: any = {
        title: device.title,
        category: device.category,
        daily_price: device.dailyPrice || null,
        monthly_price: device.monthlyPrice || null,
        sale_price: device.salePrice || null,
        serial_number: rawSerial,
        is_flagged_stolen: isStolenMatch,
        image_url: device.photoUrl,
        status: isStolenMatch ? 'pending' : 'متاح للإيجار',
        provider_id: activeUserId || undefined,
      };

      const { data, error } = await supabase.from('equipment').insert([payload]).select();

      if (error) {
        // Fallback retry without provider_id or sale_price if column issues
        delete payload.provider_id;
        const retry = await supabase.from('equipment').insert([payload]).select();
        if (retry.error) {
          showToast(`❌ تعذر حفظ الجهاز: ${retry.error.message}`);
          return false;
        }
      }

      await fetchEquipment();
      if (isStolenMatch) {
        showToast(`🚨 تنبيه: تم حجب نشر الجهاز لمطابقته مع بلاغ سرقة مسجل (سيريال: ${rawSerial}).`);
      } else {
        showToast(`🎉 تم حفظ ونشر "${device.title}" بنجاح في قاعدة البيانات!`);
      }
      return true;
    } catch {
      showToast('❌ تعذر حفظ الجهاز. يرجى المحاولة لاحقاً.');
      return false;
    }
  };

  // Handler: Delete Device
  const handleDeleteDevice = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف "${title}"؟`)) return;

    try {
      const res = await fetch('/api/equipment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'فشل حذف الجهاز من الخادم');
      }

      setEquipment((prev) => prev.filter((item) => item.id !== id));
      setUploadedEquipmentCount((prev) => Math.max(0, prev - 1));
      showToast('🗑️ تم حذف الجهاز بنجاح من قاعدة البيانات.');
    } catch (err: any) {
      showToast(`❌ تعذر الحذف: ${err?.message || 'خطأ غير متوقع'}`);
    }
  };

  // Handler: Update Price
  const handleUpdatePrice = async (id: string, dailyPrice: number, monthlyPrice: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          daily_price: dailyPrice || null,
          monthly_price: monthlyPrice || null,
        })
        .eq('id', id);

      if (error) {
        showToast(`❌ تعذر تحديث السعر: ${error.message}`);
        return false;
      }

      setEquipment((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                dailyRate: dailyPrice ? `${dailyPrice.toLocaleString('en-US')} ج.م` : '—',
                monthlyRate: monthlyPrice ? `${monthlyPrice.toLocaleString('en-US')} ج.م` : '—',
              }
            : it
        )
      );
      showToast('✅ تم تحديث الأسعار بنجاح!');
      return true;
    } catch {
      showToast('❌ تعذر تحديث السعر حالياً.');
      return false;
    }
  };

  // Handler: Save Service
  const handleSaveService = async (service: {
    title: string;
    category: string;
    description?: string;
  }): Promise<boolean> => {
    try {
      const activeUserId = await resolveProviderRowId();
      if (!activeUserId) {
        showToast('❌ تعذر تحديد حساب المزود.');
        return false;
      }

      const payload = {
        title: service.title,
        category: service.category,
        description: service.description,
        provider_id: activeUserId,
      };

      const { data, error } = await supabase.from('services').insert([payload]).select();

      if (error || !data?.[0]) {
        showToast(`❌ تعذر حفظ الخدمة: ${error?.message || 'خطأ'}`);
        return false;
      }

      const newSvc: ProviderServiceItem = {
        id: data[0].id,
        provider_id: activeUserId,
        title: service.title,
        category: service.category,
        description: service.description,
        created_at: data[0].created_at || new Date().toISOString(),
      };

      setServices((prev) => [newSvc, ...prev]);
      showToast(`🎉 تم حفظ ونشر خدمة "${service.title}" بنجاح!`);
      return true;
    } catch {
      showToast('❌ تعذر حفظ الخدمة حالياً.');
      return false;
    }
  };

  // Handler: Delete Service
  const handleDeleteService = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف خدمة "${title}"؟`)) return;
    try {
      await supabase.from('services').delete().eq('id', id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('🗑️ تم حذف الخدمة بنجاح.');
    } catch {
      showToast('❌ تعذر الحذف حالياً.');
    }
  };

  // Handler: Submit Stolen Report
  const handleSubmitStolenReport = async (report: {
    equipment_model: string;
    serial_number: string;
    proof_document_url?: string;
    notes?: string;
  }): Promise<boolean> => {
    const cleanSerial = report.serial_number.trim().toUpperCase();
    try {
      const activeUserId = providerId || (await resolveProviderRowId());
      if (!activeUserId) {
        showToast('❌ تعذر تحديد حساب المزود.');
        return false;
      }

      const { data, error } = await supabase
        .from('stolen_registry')
        .insert([
          {
            reported_by: activeUserId,
            serial_number: cleanSerial,
            device_model: report.equipment_model.trim(),
            notes: report.notes || null,
            proof_document_url: report.proof_document_url || null,
            status: 'verified',
          },
        ])
        .select();

      if (error || !data?.[0]) {
        showToast(`❌ تعذر تسجيل البلاغ: ${error?.message || 'خطأ'}`);
        return false;
      }

      const row: any = data[0];
      setMyStolenReports((prev) => [
        {
          id: row.id,
          provider_id: row.reported_by || activeUserId,
          serial_number: row.serial_number || cleanSerial,
          equipment_model: row.device_model || report.equipment_model,
          proof_document_url: row.proof_document_url,
          notes: row.notes,
          status: row.status || 'verified',
          created_at: row.created_at || new Date().toISOString(),
        },
        ...prev,
      ]);

      showToast(`🚨 تم إدراج الجهاز (سيريال: ${cleanSerial}) في سجل الحماية بنجاح!`);
      return true;
    } catch {
      showToast('❌ تعذر تسجيل البلاغ حالياً.');
      return false;
    }
  };

  // Handler: Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaveSuccess(false);

    try {
      const activeUserId = providerId || (await resolveProviderRowId());
      if (!activeUserId) {
        throw new Error('تعذر تحديد معرف حساب المزود.');
      }

      const updatePayload = {
        name: profileData.name.trim(),
        company_name: profileData.organization.trim(),
        organization: profileData.organization.trim(),
        phone: profileData.phone.trim(),
        location: profileData.location.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('providers')
        .update(updatePayload)
        .eq('id', activeUserId);

      if (error) throw error;

      setProfileSaveSuccess(true);
      setProviderProfile({
        name: profileData.name.trim(),
        org: profileData.organization.trim(),
        location: profileData.location.trim(),
      });
      showToast('✅ تم حفظ وتحديث بيانات الملف الشخصي بنجاح!');
    } catch (err: any) {
      setProfileError(err?.message || 'حدث خطأ أثناء حفظ الملف.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRestartTour = async () => {
    try {
      const { startDashboardTour, resetTourState } = await import('@/components/provider/DashboardTour');
      resetTourState();
      startDashboardTour(0);
      showToast('🧭 انطلقت الجولة التعريفية التفاعلية.');
    } catch (err) {
      console.error('Failed to start dashboard tour:', err);
    }
  };

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#040C16] text-right text-slate-100 flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <div className="max-w-xl w-full bg-[#0A192F] border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl text-amber-400 shadow-xl">
              ⏳
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                قيد التدقيق والمراجعة الإدارية
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">حساب الشريك بانتظار الاعتماد الرسمي</h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                شكراً لانضمامك إلى شبكة Survsta. حساب مكتبك قيد المراجعة الفنية من قبل إدارة المنصة وسيتم تفعيله خلال 24 ساعة.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href="/provider/verification"
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
              >
                استكمال وثائق التوثيق (KYC)
              </Link>
              <Link
                href="/"
                className="py-2.5 px-4 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-700 transition"
              >
                تصفح الموقع العام
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040C16] text-right text-gray-100 p-4 sm:p-8">
      {/* Interactive SaaS Driver.js Tour */}
      <DashboardTour autoStart={true} />

      <div className="w-full space-y-8">
        {/* Dashboard Topbar */}
        <ProviderHeader
          walletBalance={walletBalance}
          providerProfile={providerProfile}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          onRestartTour={handleRestartTour}
        />

        {/* Notice alert if fetch error */}
        {fetchError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center justify-between">
            <span>⚠️ {fetchError}</span>
            <button
              onClick={fetchEquipment}
              className="underline text-amber-400 hover:text-white font-bold"
            >
              إعادة المحاولة 🔄
            </button>
          </div>
        )}

        {/* 1. Modular KPI Stats Cards */}
        <ProviderStatsCards
          isLoading={isLoading}
          totalRevenue={totalRevenue}
          completedOrdersCount={completedOrdersCount}
          uploadedEquipmentCount={uploadedEquipmentCount}
          requestsCount={requestsCount}
          newRequestsToday={newRequestsToday}
          profileViews={profileViews}
          rating={rating}
          reviewCount={reviewCount}
        />

        {/* 2. Modular Wallet Section */}
        <ProviderWalletSection
          balance={walletBalance}
          onOpenTopUp={() => setIsWalletModalOpen(true)}
        />

        {/* 3. Modular Equipment Section */}
        <ProviderEquipmentSection
          equipment={equipment}
          isLoading={isLoading}
          uploadedEquipmentCount={uploadedEquipmentCount}
          onRefresh={fetchEquipment}
          onSaveDevice={handleSaveDevice}
          onDeleteDevice={handleDeleteDevice}
          onUpdatePrice={handleUpdatePrice}
        />

        {/* 4. Modular Stolen Registry Section */}
        <ProviderStolenRegistrySection
          stolenItems={myStolenReports}
          isLoading={isLoadingStolen}
          onRefresh={fetchStolenReports}
          onSubmitStolenReport={handleSubmitStolenReport}
        />

        {/* 5. Modular Incoming Orders Operations Banner */}
        <ProviderOrdersBanner />

        {/* 5. Modular Services Section */}
        <ProviderServicesSection
          services={services}
          isLoading={isLoadingServices}
          onRefresh={fetchServices}
          onSaveService={handleSaveService}
          onDeleteService={handleDeleteService}
        />

        {/* 6. Modular Profile Section */}
        <ProviderProfileSection
          profileData={profileData}
          setProfileData={setProfileData}
          isSavingProfile={isSavingProfile}
          profileError={profileError}
          profileSaveSuccess={profileSaveSuccess}
          onSaveProfile={handleSaveProfile}
          onEmailUpdated={(newEmail) => {
            setProfileData((prev) => ({ ...prev, email: newEmail }));
            showToast('✅ تم توثيق واعتماد بريدك الإلكتروني الجديد بنجاح!');
          }}
        />
      </div>

      {/* Wallet Top-Up Modal */}
      <WalletTopUpModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        providerId={providerId || profileData.id || null}
        currentBalance={walletBalance}
        onSuccess={() => {
          fetchProviderProfile();
          showToast('✅ تم استلام طلب شحن المحفظة وإرساله للإدارة بنجاح!');
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-[#0F253E] border border-amber-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

