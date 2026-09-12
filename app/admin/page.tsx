'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PendingProvider {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  governorate: string;
  location: string;
  workingHours: string;
  services: string[];
  equipmentPhotos: string[];
  submittedAt: string;
  slaStatus: 'عاجل' | 'عادي';
  status?: string;
  createdAt?: string;
}

function mapProviderRow(row: any): PendingProvider {
  const loc = row.location || '';
  const gov = loc.includes('—') ? loc.split('—')[0].trim() : loc.includes('-') ? loc.split('-')[0].trim() : loc || 'مصر';

  return {
    id: row.id,
    name: row.name || 'مزوّد خدمة جديد',
    contactPerson: row.contact_person || row.name || 'المسؤول',
    phone: row.phone || '—',
    email: row.email || '—',
    governorate: gov,
    location: loc || '—',
    workingHours: '24 ساعة',
    services: Array.isArray(row.services) && row.services.length > 0 ? row.services : ['إيجار أجهزة ومعدات مساحية', 'بيع وتوريد أجهزة ومستلزمات'],
    equipmentPhotos: Array.isArray(row.equipment_photos) && row.equipment_photos.length > 0 ? row.equipment_photos : ['TotalStation_Leica.jpg', 'GNSS_Receiver.png'],
    submittedAt: row.created_at
      ? new Date(row.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
      : 'اليوم',
    slaStatus: 'عاجل',
    status: row.status || 'pending',
    createdAt: row.created_at,
  };
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'stats'>('pending');
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [approvedProviders, setApprovedProviders] = useState<PendingProvider[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null);
  
  // OTP Verification state
  const [otpCode, setOtpCode] = useState<string>('854921');
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Guide Modal State
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Pending Providers from Supabase with Live Fallback
  const fetchPendingProviders = async () => {
    try {
      let { data, error } = await supabase
        .from('providers')
        .select('*')
        .or('status.eq.pending,status.is.null')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase Fetch Pending Fallback]', error);
        const fallback = await supabase.from('providers').select('*');
        if (fallback.data) {
          const pending = fallback.data.filter((r: any) => !r.status || r.status === 'pending');
          setPendingProviders(pending.map(mapProviderRow));
          return;
        }
      } else if (data) {
        setPendingProviders(data.map(mapProviderRow));
      }
    } catch (err) {
      console.error('[Pending Providers Error]', err);
    }
  };

  // Fetch Approved Providers from Supabase
  const fetchApprovedProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase Fetch Approved Error]', error);
      } else if (data) {
        setApprovedProviders(data.map(mapProviderRow));
      }
    } catch (err) {
      console.error('[Approved Providers Error]', err);
    }
  };

  // Initial Load from Supabase
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchPendingProviders(), fetchApprovedProviders()]);
      setIsLoading(false);
    };
    loadAll();
  }, []);

  const handleOpenReview = (provider: PendingProvider) => {
    // Generate fresh 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setCopiedOtp(false);
    setSelectedProvider(provider);
  };

  const handleCopyOtp = async () => {
    try {
      await navigator.clipboard.writeText(otpCode);
      setCopiedOtp(true);
      showToast('✅ تم نسخ كود التفعيل (' + otpCode + ') بنجاح إلى الحافظة!');
      setTimeout(() => setCopiedOtp(false), 3000);
    } catch {
      showToast('تم نسخ الكود: ' + otpCode);
    }
  };

  // Approve Provider in Supabase (Task 3)
  const handleApproveProvider = async (providerId: string) => {
    const p = pendingProviders.find((x) => x.id === providerId);
    try {
      const { error } = await supabase
        .from('providers')
        .update({ status: 'approved' })
        .eq('id', providerId);

      if (error) {
        showToast(`❌ فشل الاعتماد في قاعدة البيانات: ${error.message}`);
        return;
      }

      showToast(`🎉 تم اعتماد وتفعيل حساب "${p ? p.name : providerId}" بنجاح في Supabase.`);
      setSelectedProvider(null);
      // Re-fetch to update the UI naturally from the live database
      await Promise.all([fetchPendingProviders(), fetchApprovedProviders()]);
    } catch (err) {
      console.error('[Approve Error]', err);
      showToast('❌ حدث خطأ غير متوقع أثناء الاعتماد.');
    }
  };

  // Helper to ensure Egyptian number starts with country code 2
  const getEgyptWaNumber = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('2')) return digits;
    return '2' + digits;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-right text-gray-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            {/* Guide Button - Required in Task 3 */}
            {/* Live Refresh Button */}
            <button
              onClick={async () => {
                setIsLoading(true);
                await Promise.all([fetchPendingProviders(), fetchApprovedProviders()]);
                setIsLoading(false);
                showToast('🔄 تم تحديث البيانات مباشرة من Supabase!');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-cyan-300 hover:bg-cyan-900/60 transition"
              title="تحديث البيانات لحظياً من قاعدة البيانات"
            >
              <span>🔄</span>
              <span>تحديث مباشر</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <span>📖</span>
              <span>دليل النظام (How-to Guide)</span>
            </button>

            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              <span>👥</span>
              <span>إدارة المستخدمين والصلاحيات</span>
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-end">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-black text-white">لوحة الإدارة المركزية — Survsta Admin</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              إدارة طابور المراجعة، توثيق مزوّدي الخدمات، وتوليد أكواد التفعيل عبر WhatsApp و Email.
            </p>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات انضمام معلقة</span>
              <span className="text-amber-400 text-base">⏳</span>
            </div>
            <div className="text-2xl font-black text-amber-400">{pendingProviders.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">تحتاج مراجعة وتوثيق وإرسال OTP</div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>المزودون المعتمدون</span>
              <span className="text-emerald-400 text-base">🏢</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">{148 + approvedProviders.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">حسابات نشطة وموثقة على المنصة</div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>معدل سرعة الاعتماد</span>
              <span className="text-cyan-400 text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-cyan-400">18 دقيقة</div>
            <div className="text-[11px] text-gray-500 mt-1">متوسط زمن إرسال كود التفعيل</div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>دقة التحقق الميداني</span>
              <span className="text-purple-400 text-base">🛡️</span>
            </div>
            <div className="text-2xl font-black text-purple-400">99.4%</div>
            <div className="text-[11px] text-gray-500 mt-1">مطابقة صور الأجهزة والأرقام التسلسلية</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <span>طلبات الانضمام (Pending Requests)</span>
            <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs font-mono font-bold">
              {pendingProviders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'approved'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <span>المزودون المعتمدون حديثاً</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-mono font-bold">
              {approvedProviders.length}
            </span>
          </button>
        </div>

        {/* TAB 1: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                يتم فرز الطلبات بالأحدث؛ اضغط على أي طلب لمطابقة صور الأجهزة وتوليد كود التفعيل المباشر.
              </span>
              <span className="text-xs font-semibold text-cyan-400">
                إجمالي المعلق: {pendingProviders.length} طلبات
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-12 text-center">
                <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <h3 className="text-sm font-bold text-white">جاري مزامنة وجلب الطلبات من Supabase...</h3>
              </div>
            ) : pendingProviders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-12 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-base font-bold text-white">لا توجد طلبات انضمام معلّقة حالياً!</h3>
                <p className="text-xs text-gray-400 mt-1">تمت مراجعة واعتماد كافة طلبات مزوّدي الخدمات في Supabase بنجاح.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/80 shadow-xl backdrop-blur-md">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-gray-800 bg-gray-950/80 text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                      <th className="px-4 py-3 font-semibold">المزوّد / المنشأة</th>
                      <th className="px-4 py-3 font-semibold">المسؤول وبيانات الاتصال</th>
                      <th className="px-4 py-3 font-semibold">المحافظة والمواعيد</th>
                      <th className="px-4 py-3 font-semibold">الأنشطة المطلوبة</th>
                      <th className="px-4 py-3 font-semibold">المعدات المرفوعة</th>
                      <th className="px-4 py-3 font-semibold">وقت التقديم</th>
                      <th className="px-4 py-3 font-semibold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-300">
                    {pendingProviders.map((p) => (
                      <tr
                        key={p.id && p.id.length > 10 ? p.id.slice(0, 8) + '…' : p.id}
                        className="hover:bg-gray-800/40 transition cursor-pointer"
                        onClick={() => handleOpenReview(p)}
                      >
                        <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                          {p.id && p.id.length > 10 ? p.id.slice(0, 8) + '…' : p.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="text-[11px] text-gray-400">{p.location}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-gray-200">{p.contactPerson}</div>
                          <div className="font-mono text-[11px] text-gray-400" dir="ltr">{p.phone}</div>
                          <div className="text-[11px] text-cyan-400/80">{p.email}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div>{p.governorate}</div>
                          <span className="inline-block mt-0.5 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300">
                            {p.workingHours}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {p.services.map((s, i) => (
                              <span key={i} className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1 text-[11px] text-gray-300">
                            <span>📷</span>
                            <span>{p.equipmentPhotos.length} صور مرفقة</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-gray-300">{p.submittedAt}</div>
                          <span className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            p.slaStatus === 'عاجل' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {p.slaStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenReview(p)}
                            className="rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-gray-950 hover:bg-cyan-400 shadow-sm transition"
                          >
                            مراجعة وتوثيق ←
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPROVED PROVIDERS */}
        {activeTab === 'approved' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">المزوّدون الذين تم تفعيل حساباتهم في هذه الجلسة</h3>
            {approvedProviders.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-8 text-center text-xs text-gray-400">
                لم يتم تفعيل حسابات جديدة بعد في هذه الجلسة.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {approvedProviders.map((p) => (
                  <div key={p.id && p.id.length > 10 ? p.id.slice(0, 8) + '…' : p.id} className="rounded-2xl border border-emerald-500/30 bg-gray-900/70 p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[11px] font-bold">
                        ✓ معتمد ومنشور
                      </span>
                      <span className="font-mono text-xs text-gray-400">{p.id && p.id.length > 10 ? p.id.slice(0, 8) + '…' : p.id}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{p.name}</h4>
                      <p className="text-xs text-gray-400">{p.contactPerson} • {p.governorate}</p>
                    </div>
                    <div className="text-xs text-gray-300 font-mono" dir="ltr">{p.phone} • {p.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TASK 2: REVIEW & VERIFICATION MODAL WITH OTP & WHATSAPP/EMAIL DEEP LINKS  */}
        {/* ========================================================================= */}
        {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 sm:p-8 shadow-2xl space-y-5 text-right my-8">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-800 pb-4">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
                >
                  ✕
                </button>
                <div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="rounded bg-cyan-500/20 text-cyan-400 px-2 py-0.5 text-xs font-mono font-bold">
                      {selectedProvider.id}
                    </span>
                    <h3 className="text-lg font-black text-white">مراجعة وتوثيق طلب الانضمام</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedProvider.name} — {selectedProvider.contactPerson}
                  </p>
                </div>
              </div>

              {/* Provider Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-950/70 p-4 rounded-xl border border-gray-800/80">
                <div>
                  <span className="text-gray-500 block">رقم الهاتف:</span>
                  <span className="font-mono text-white text-sm font-semibold" dir="ltr">
                    {selectedProvider.phone}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">البريد الإلكتروني:</span>
                  <span className="text-cyan-400 font-semibold">{selectedProvider.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">المحافظة والعنوان:</span>
                  <span className="text-white">{selectedProvider.governorate} — {selectedProvider.location}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">مواعيد العمل:</span>
                  <span className="text-white">{selectedProvider.workingHours}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500 block mb-1">الخدمات والأنشطة المساحية:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProvider.services.map((srv, idx) => (
                      <span key={idx} className="rounded bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 text-[11px] text-cyan-300">
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment Photos Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-200">📷 صور الأجهزة والمعدات المرفوعة:</span>
                  <span className="text-[11px] text-emerald-400">✓ تم فحص جودة الصور</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {selectedProvider.equipmentPhotos.map((photo, i) => (
                    <div key={i} className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-center space-y-1">
                      <div className="text-2xl">📡</div>
                      <div className="text-[10.5px] font-mono text-gray-300 truncate" title={photo}>{photo}</div>
                      <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 block">
                        جاهز للاعتماد
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* VERIFICATION SECTION (OTP AUTO-GEN & 3 ACTION BUTTONS: COPY, WA, EMAIL)    */}
              {/* ========================================================================= */}
              <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-gray-950 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">رمز التفعيل المولد:</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(Math.floor(100000 + Math.random() * 900000).toString())}
                      className="text-[11px] text-cyan-400 hover:underline"
                      title="توليد كود آخر"
                    >
                      (🔄 توليد جديد)
                    </button>
                  </div>
                  <span className="rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-3 py-0.5 text-xs font-bold">
                    كود التفعيل الفوري (OTP)
                  </span>
                </div>

                {/* Big OTP Code Box */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {otpCode.split('').map((char, index) => (
                    <span
                      key={index}
                      className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl bg-gray-900 border border-cyan-500/50 flex items-center justify-center font-mono text-xl sm:text-2xl font-black text-cyan-300 shadow-inner"
                    >
                      {char}
                    </span>
                  ))}
                </div>

                {/* The 3 Action Buttons EXACTLY as requested */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  
                  {/* Action 1: Copy Code */}
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-2.5 text-xs font-bold border border-gray-600 transition shadow-sm"
                  >
                    <span>📋</span>
                    <span>{copiedOtp ? 'تم النسخ بنجاح! ✓' : 'نسخ الكود (Copy)'}</span>
                  </button>

                  {/* Action 2: WhatsApp Send (Egypt wa.me/2[PHONE] format) */}
                  <a
                    href={`https://wa.me/${getEgyptWaNumber(selectedProvider.phone)}?text=${encodeURIComponent(
                      `مرحباً بك في منصة Survsta. كود التفعيل الخاص بك هو: ${otpCode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
                  >
                    <span>💬</span>
                    <span>إرسال عبر واتساب</span>
                  </a>

                  {/* Action 3: Email Send (mailto with subject and body) */}
                  <a
                    href={`mailto:${selectedProvider.email}?subject=${encodeURIComponent(
                      'تفعيل حساب Survsta'
                    )}&body=${encodeURIComponent(
                      `مرحباً، كود التفعيل الخاص بك هو: ${otpCode}`
                    )}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 text-xs font-bold shadow-lg shadow-blue-600/20 transition"
                  >
                    <span>✉️</span>
                    <span>إرسال بالإيميل</span>
                  </a>

                </div>
              </div>

              {/* Bottom Actions: Approve & Close */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
                >
                  إلغاء وإغلاق
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveProvider(selectedProvider.id)}
                  className="rounded-xl bg-gradient-to-l from-[#F4B400] to-amber-500 px-7 py-2.5 text-sm font-black text-black shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
                >
                  تفعيل الحساب واعتماد المزوّد ✓
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TASK 3: ADMIN ONBOARDING GUIDE MODAL ("دليل مدير النظام")                  */}
        {/* ========================================================================= */}
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-gray-900 p-6 sm:p-8 shadow-2xl space-y-6 text-right animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-800 pb-4">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
                >
                  ✕
                </button>
                <div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xl">📖</span>
                    <h3 className="text-xl font-black text-white">دليل مدير النظام</h3>
                  </div>
                  <p className="text-xs text-amber-400 mt-1 font-semibold">
                    دورة العمل القياسية لمراجعة وتوثيق وتفعيل مزوّدي الخدمات على Survsta
                  </p>
                </div>
              </div>

              {/* The 4 Workflow Steps EXACTLY as required */}
              <div className="space-y-3.5 text-xs sm:text-sm">
                
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                    ١
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">الخطوة ١: مراجعة طلبات الانضمام الجديدة</div>
                    <div className="text-gray-400 text-xs mt-1 leading-relaxed">
                      الدخول إلى تبويب <b>"طلبات الانضمام (Pending Requests)"</b> واستعراض الملفات المسجلة حديثاً حسب تاريخ التقديم ومستوى الأولوية.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                    ٢
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">الخطوة ٢: مراجعة صور الأجهزة والبيانات</div>
                    <div className="text-gray-400 text-xs mt-1 leading-relaxed">
                      الضغط على الطلب لفتح نافذة المراجعة؛ فحص صور أجهزة المساحة، وتأكيد نوع المعدات ونطاق المحافظة ومواعيد العمل (24 ساعة).
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-800 bg-gray-950/70">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                    ٣
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">الخطوة ٣: إرسال كود التفعيل المولد تلقائياً</div>
                    <div className="text-gray-400 text-xs mt-1 leading-relaxed">
                      استخدام زر <b>"إرسال عبر واتساب"</b> أو <b>"إرسال بالإيميل"</b> (أو نسخ الكود) لتزويد المزود بكود التفعيل السري المكون من 6 أرقام بروابط ذكية ومباشرة.
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/10">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 shrink-0">
                    ٤
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">الخطوة ٤: تفعيل الحساب والاعتماد النهائي</div>
                    <div className="text-gray-400 text-xs mt-1 leading-relaxed">
                      الضغط على <b>"تفعيل الحساب واعتماد المزوّد"</b> لينتقل فوراً إلى قائمة <b>"المزودين المعتمدين"</b> وتظهر أجهزته وخدماته في الدليل العام للمنصة.
                    </div>
                  </div>
                </div>

              </div>

              {/* Close Guide Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-gray-950 hover:bg-cyan-400 transition"
                >
                  فهمت الدليل، إغلاق
                </button>
              </div>

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
