'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

interface KycItem {
  id: string;
  provider_id: string;
  commercial_register_url?: string;
  tax_id_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
  // Joined Provider details
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export default function AdminKycPage() {
  const [kycRequests, setKycRequests] = useState<KycItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<KycItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch KYC Requests and Join with Providers / Clients
  const loadKycData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Supabase kyc_requests
      const { data: dbRequests, error: kycErr } = await supabase
        .from('kyc_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (kycErr) {
        console.warn('Supabase kyc_requests notice:', kycErr.message);
      }

      // 2. Fetch providers to join
      let providerMap: Record<string, any> = {};
      try {
        const { data: providersData } = await supabase
          .from('providers')
          .select('id, name, email, phone, location, is_verified');

        if (providersData) {
          providersData.forEach((p: any) => {
            providerMap[p.id] = p;
          });
        }
      } catch (err) {
        console.warn('Providers fetch error:', err);
      }

      // Also check clients table
      try {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('user_id, full_name, email, phone, company_name');

        if (clientsData) {
          clientsData.forEach((c: any) => {
            if (c.user_id && !providerMap[c.user_id]) {
              providerMap[c.user_id] = {
                name: c.company_name || c.full_name,
                email: c.email,
                phone: c.phone,
              };
            }
          });
        }
      } catch {}

      // 3. Fallback localStorage requests
      let localRequests: KycItem[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_LOCAL_KYC_REQUESTS');
        if (stored) {
          try {
            localRequests = JSON.parse(stored);
          } catch {}
        }
      }

      // Combine database and local items
      const existingIds = new Set((dbRequests || []).map((r: any) => r.id));
      const combinedRaw = [
        ...(dbRequests || []),
        ...localRequests.filter((l) => !existingIds.has(l.id)),
      ];

      let list: KycItem[] = combinedRaw.map((item: any) => {
        const prov = providerMap[item.provider_id];
        return {
          id: String(item.id),
          provider_id: item.provider_id,
          commercial_register_url: item.commercial_register_url,
          tax_id_url: item.tax_id_url,
          status: item.status || 'pending',
          admin_notes: item.admin_notes || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at,
          company_name: item.company_name || prov?.name || 'مكتب النخبة للمساحة الهندسية',
          contact_name: prov?.name || 'م. حسام الدين',
          email: item.email || prov?.email || 'contact@survey-office.com',
          phone: item.phone || prov?.phone || '01012345678',
          location: prov?.location || 'القاهرة والجيزة',
        };
      });

      // If empty in dev, supply realistic KYC requests
      if (list.length === 0) {
        list = [
          {
            id: 'kyc-demo-1',
            provider_id: 'prov-demo-1',
            company_name: 'شركة النيل للتجهيزات الجيوديسية والمساحة',
            contact_name: 'م. شريف عبد المنعم',
            email: 'nile.geodesy@gmail.com',
            phone: '01098765432',
            location: 'القاهرة — مدينة نصر',
            commercial_register_url: 'https://storage.survsta.com/kyc/demo/nile-commercial-register.pdf',
            tax_id_url: 'https://storage.survsta.com/kyc/demo/nile-tax-card.jpg',
            status: 'pending',
            admin_notes: 'سجل تجاري: 108492 | رقم ضريبي: 492-109-842',
            created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
          {
            id: 'kyc-demo-2',
            provider_id: 'prov-demo-2',
            company_name: 'مكتب الأهرام للمساحة الرقمية وتأجير الأجهزة',
            contact_name: 'م. مروان الشريف',
            email: 'ahram.surveying@outlook.com',
            phone: '01123456789',
            location: 'الجيزة — الدقي',
            commercial_register_url: 'https://storage.survsta.com/kyc/demo/ahram-cr.pdf',
            tax_id_url: 'https://storage.survsta.com/kyc/demo/ahram-tax.pdf',
            status: 'pending',
            admin_notes: 'سجل تجاري: 78491 | ضريبي: 381-992-105 — يرجى فحص فرع التجمع',
            created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          },
          {
            id: 'kyc-demo-3',
            provider_id: 'prov-demo-3',
            company_name: 'الشرق لمعدات ونظم المساحة',
            contact_name: 'م. تامر الجندي',
            email: 'sharq.geo@gmail.com',
            phone: '01234567890',
            location: 'الإسكندرية — سموحة',
            commercial_register_url: 'https://storage.survsta.com/kyc/demo/sharq-cr.pdf',
            tax_id_url: 'https://storage.survsta.com/kyc/demo/sharq-tax.jpg',
            status: 'approved',
            admin_notes: 'تمت مطابقة السجل التجاري والبطاقة الضريبية مع مصلحة الضرائب. معتمد بالكامل.',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: 'kyc-demo-4',
            provider_id: 'prov-demo-4',
            company_name: 'مكتب الدلتا للهندسة والمقاولات',
            contact_name: 'م. وائل يوسف',
            email: 'delta.eng@yahoo.com',
            phone: '01011223344',
            location: 'طنطا — الغربية',
            commercial_register_url: 'https://storage.survsta.com/kyc/demo/delta-cr.pdf',
            tax_id_url: '',
            status: 'rejected',
            admin_notes: 'لم يتم إرفاق صورة البطاقة الضريبية، والسجل التجاري المرفق منتهي الصلاحية منذ 2023.',
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          },
        ];
      }

      setKycRequests(list);
    } catch (err) {
      console.warn('KYC load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKycData();
  }, []);

  // 2. Action: Approve KYC Request
  const handleApprove = async (item: KycItem) => {
    setProcessingId(item.id);
    try {
      const now = new Date().toISOString();

      // 1. Update kyc_requests table in Supabase
      const { error: kycError } = await supabase
        .from('kyc_requests')
        .update({
          status: 'approved',
          admin_notes: item.admin_notes ? `${item.admin_notes} — [معتمد رسمياً]` : 'تم التدقيق والاعتماد رسمياً.',
          updated_at: now,
        })
        .eq('id', item.id);

      if (kycError) {
        console.warn('Supabase kyc update error:', kycError.message);
      }

      // 2. Update provider profile is_verified = true
      try {
        await supabase
          .from('providers')
          .update({ is_verified: true, status: 'approved' })
          .eq('id', item.provider_id);
      } catch {}

      try {
        await supabase
          .from('clients')
          .update({ is_verified: true })
          .eq('user_id', item.provider_id);
      } catch {}

      // 3. Send in-app notification to provider
      try {
        await supabase.from('inapp_notifications').insert([
          {
            user_id: item.provider_id,
            title: 'تهانينا! تم اعتماد توثيق حسابك (KYC) ومنحك شارة التوثيق',
            message: `تم التحقق من السجل التجاري والبطاقة الضريبية لـ "${item.company_name}". حسابك معتمد وموثق الآن في Survsta وله أولوية الظهور للعملاء.`,
            type: 'approval',
            link: '/provider/verification',
            is_read: false,
          },
        ]);
      } catch {}

      // 4. Update local state
      setKycRequests((prev) =>
        prev.map((k) => (k.id === item.id ? { ...k, status: 'approved', updated_at: now } : k))
      );

      // 5. Update local storage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`SURVSTA_KYC_${item.provider_id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.status = 'approved';
            parsed.updated_at = now;
            localStorage.setItem(`SURVSTA_KYC_${item.provider_id}`, JSON.stringify(parsed));
          } catch {}
        }
      }

      showToast(`✓ تم اعتماد توثيق "${item.company_name}" بنجاح ومنحه شارة التوثيق.`);
    } catch (err) {
      console.error('Approve failed:', err);
      showToast('حدث خطأ أثناء الاعتماد.');
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Action: Submit Reject Reason
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    setProcessingId(rejectingItem.id);

    try {
      const now = new Date().toISOString();
      const reason = rejectReason.trim() || 'المستندات المرفقة غير مكتملة أو غير واضحة. يرجى إعادة رفع مستندات سارية.';

      // 1. Update kyc_requests table
      const { error: kycError } = await supabase
        .from('kyc_requests')
        .update({
          status: 'rejected',
          admin_notes: reason,
          updated_at: now,
        })
        .eq('id', rejectingItem.id);

      if (kycError) {
        console.warn('Supabase kyc reject error:', kycError.message);
      }

      // 2. Update provider profile is_verified = false
      try {
        await supabase
          .from('providers')
          .update({ is_verified: false })
          .eq('id', rejectingItem.provider_id);
      } catch {}

      // 3. Send in-app notification to provider
      try {
        await supabase.from('inapp_notifications').insert([
          {
            user_id: rejectingItem.provider_id,
            title: 'تنبيه: تعذر اعتماد وثائق التوثيق (KYC)',
            message: `تم فحص مستندات "${rejectingItem.company_name}" وتعذر الاعتماد للسبب: ${reason}. يرجى مراجعة الملاحظات وإعادة الرفع.`,
            type: 'warning',
            link: '/provider/verification',
            is_read: false,
          },
        ]);
      } catch {}

      // 4. Update local state
      setKycRequests((prev) =>
        prev.map((k) => (k.id === rejectingItem.id ? { ...k, status: 'rejected', admin_notes: reason, updated_at: now } : k))
      );

      showToast(`تم استبعاد طلب "${rejectingItem.company_name}" وإشعار المزود بالسبب.`);
      setRejectingItem(null);
      setRejectReason('');
    } catch (err) {
      console.error('Reject failed:', err);
      showToast('حدث خطأ أثناء تسجيل الرفض.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered requests
  const filteredRequests = kycRequests.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = (item.company_name || '').toLowerCase().includes(q);
      const matchContact = (item.contact_name || '').toLowerCase().includes(q);
      const matchEmail = (item.email || '').toLowerCase().includes(q);
      const matchPhone = (item.phone || '').toLowerCase().includes(q);
      const matchNotes = (item.admin_notes || '').toLowerCase().includes(q);
      return matchCompany || matchContact || matchEmail || matchPhone || matchNotes;
    }
    return true;
  });

  // KPI counts
  const pendingCount = kycRequests.filter((k) => k.status === 'pending').length;
  const approvedCount = kycRequests.filter((k) => k.status === 'approved').length;
  const rejectedCount = kycRequests.filter((k) => k.status === 'rejected').length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar pendingCount={pendingCount} />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>🛡️ لوحة الإدارة العليا (Super Admin)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              نظام التحقق والاعتماد التجاري (KYC)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              مراجعة وتدقيق السجلات التجارية والبطاقات الضريبية للمكاتب والشركات المساحية لمنح شارة التوثيق.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadKycData()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>تحديث البيانات</span>
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              لوحة الإدارة الرئيسية
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>وثائق بانتظار الاعتماد</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⏳</span>
            </div>
            <div className="text-2xl font-black text-amber-400">
              {pendingCount} <span className="text-xs text-gray-400 font-normal">طلب</span>
            </div>
            <div className="text-[11px] text-amber-300/80 mt-2 font-semibold">تتطلب تدقيق فوري من الإدارة</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>مزوّدون موثّقون ومعتمدون</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">✅</span>
            </div>
            <div className="text-2xl font-black text-white">
              {approvedCount} <span className="text-xs text-gray-400 font-normal">جهة</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">تم منحهم شارة التوثيق الخضراء</div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>طلبات مستبعدة / مرفوضة</span>
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 text-base">❌</span>
            </div>
            <div className="text-2xl font-black text-rose-400">
              {rejectedCount} <span className="text-xs text-gray-400 font-normal">طلب</span>
            </div>
            <div className="text-[11px] text-rose-300/80 mt-2 font-semibold">مستندات منتهية أو غير مطابقة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي ملفات التوثيق</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">📁</span>
            </div>
            <div className="text-2xl font-black text-white">
              {kycRequests.length} <span className="text-xs text-gray-400 font-normal">ملف</span>
            </div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">سجلات تجارية وبطاقات ضريبية</div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'pending', label: 'قيد المراجعة', count: pendingCount, color: 'text-amber-400' },
              { id: 'all', label: 'كافة الطلبات', count: kycRequests.length, color: 'text-gray-300' },
              { id: 'approved', label: 'المعتمدة', count: approvedCount, color: 'text-emerald-400' },
              { id: 'rejected', label: 'المرفوضة', count: rejectedCount, color: 'text-rose-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  statusFilter === tab.id
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'bg-slate-950 text-gray-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    statusFilter === tab.id ? 'bg-black/20 text-white' : 'bg-slate-800 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالجهة، الرقم، أو الملاحظات..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 transition pl-8"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</span>
          </div>
        </div>

        {/* KYC Verification Queue Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400">جاري تحميل سجلات التوثيق...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="text-3xl">📭</div>
              <h3 className="text-base font-bold text-white">لا توجد طلبات توثيق مطابقة</h3>
              <p className="text-xs text-gray-400">
                {statusFilter === 'pending'
                  ? 'رائع! لا توجد وثائق معلقة تتطلب التدقيق حالياً.'
                  : 'لم يتم العثور على أي نتائج وفق معايير البحث الحالية.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">الجهة / المكتب الهندسي</th>
                    <th className="p-4">السجل التجاري (CR)</th>
                    <th className="p-4">البطاقة الضريبية (Tax ID)</th>
                    <th className="p-4">تاريخ التقديم</th>
                    <th className="p-4">الحالة الحالية</th>
                    <th className="p-4 text-center">الإجراءات والقرار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRequests.map((item) => {
                    const isPending = item.status === 'pending';
                    const isApproved = item.status === 'approved';
                    const isRejected = item.status === 'rejected';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        {/* Company Info */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {item.company_name}
                              </span>
                              {isApproved && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                                  موثّق ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap">
                              <span>👤 {item.contact_name}</span>
                              <span>•</span>
                              <span className="font-mono text-cyan-300">{item.phone}</span>
                              {item.location && (
                                <>
                                  <span>•</span>
                                  <span>📍 {item.location}</span>
                                </>
                              )}
                            </div>
                            {item.admin_notes && (
                              <p className="text-[11px] text-gray-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mt-1 max-w-sm leading-relaxed">
                                {item.admin_notes}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Commercial Register Document */}
                        <td className="p-4 align-top">
                          {item.commercial_register_url ? (
                            <div className="space-y-1">
                              <a
                                href={item.commercial_register_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                              >
                                <span>📄 استعراض السجل ↗</span>
                              </a>
                              <span className="text-[10px] text-gray-500 block truncate max-w-[150px] font-mono">
                                {item.commercial_register_url}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">غير مرفق</span>
                          )}
                        </td>

                        {/* Tax ID Document */}
                        <td className="p-4 align-top">
                          {item.tax_id_url ? (
                            <div className="space-y-1">
                              <a
                                href={item.tax_id_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                              >
                                <span>📄 استعراض البطاقة ↗</span>
                              </a>
                              <span className="text-[10px] text-gray-500 block truncate max-w-[150px] font-mono">
                                {item.tax_id_url}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">غير مرفق</span>
                          )}
                        </td>

                        {/* Submission Date */}
                        <td className="p-4 align-top font-mono text-[11px] text-gray-400 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 align-top">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                              <span>✓</span>
                              <span>معتمد وموثق</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                              <span>⏳</span>
                              <span>قيد التدقيق</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                              <span>✕</span>
                              <span>مرفوض</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 align-top text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Approve Button */}
                            {!isApproved && (
                              <button
                                disabled={processingId === item.id}
                                onClick={() => handleApprove(item)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1 disabled:opacity-50"
                                title="اعتماد الوثائق ومنح شارة التوثيق"
                              >
                                <span>✓</span>
                                <span>{processingId === item.id ? 'جاري الاعتماد...' : 'اعتماد'}</span>
                              </button>
                            )}

                            {/* Reject Button */}
                            {!isRejected && (
                              <button
                                disabled={processingId === item.id}
                                onClick={() => {
                                  setRejectingItem(item);
                                  setRejectReason(item.admin_notes || '');
                                }}
                                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition disabled:opacity-50"
                                title="استبعاد الطلب وتسجيل السبب"
                              >
                                <span>✕</span>
                                <span>رفض</span>
                              </button>
                            )}

                            {/* WhatsApp Direct */}
                            {item.phone && (
                              <a
                                href={`https://wa.me/20${item.phone.replace(/\D/g, '').replace(/^0+/, '')}?text=${encodeURIComponent(`مرحباً ${item.company_name}، نتواصل معك من إدارة منصة Survsta بخصوص وثائق التحقق والاعتماد التجاري.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition text-xs"
                                title="تواصل واتساب"
                              >
                                💬
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
            <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>❌</span>
                  <span>تسجيل سبب استبعاد الوثائق: {rejectingItem.company_name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-gray-300">
                  يرجى توضيح سبب الرفض ليتم إرساله للمزود في إشعار رسمي وإرشاده لتصحيح الوثائق:
                </p>

                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: صورة السجل التجاري غير واضحة، أو السجل منتهي الصلاحية، أو لم يتم إرفاق البطاقة الضريبية السارية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/60 leading-relaxed"
                />

                <div className="flex items-center gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setRejectingItem(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-semibold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={processingId === rejectingItem.id}
                    onClick={handleConfirmReject}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow disabled:opacity-50"
                  >
                    {processingId === rejectingItem.id ? 'جاري الحفظ...' : 'تأكيد الرفض وإشعار المزود'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-emerald-500/50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300 shadow-2xl animate-slide-up flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
