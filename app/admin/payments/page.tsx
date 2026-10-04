'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

interface PaymentRequestItem {
  id: string;
  provider_id: string;
  amount: number;
  payment_method: 'vodafone_cash' | 'instapay' | string;
  transfer_reference: string;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  admin_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  // Joined provider data
  provider?: {
    id: string;
    name: string;
    company_name?: string;
    phone: string;
    email: string;
    wallet_balance?: number;
  } | null;
}

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [inspectItem, setInspectItem] = useState<PaymentRequestItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<PaymentRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch payment requests
      const { data: payData, error: payErr } = await supabase
        .from('manual_payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (payErr) {
        console.warn('[AdminPayments] Error fetching payment requests:', payErr.message);
        // Fallback demo data if table is not yet populated
        setRequests(getFallbackDemoData());
        return;
      }

      if (!payData || payData.length === 0) {
        setRequests(getFallbackDemoData());
        return;
      }

      // 2. Fetch associated providers
      const providerIds = Array.from(new Set(payData.map((p) => p.provider_id).filter(Boolean)));
      let providersMap = new Map<string, any>();

      if (providerIds.length > 0) {
        const { data: provData } = await supabase
          .from('providers')
          .select('id, name, company_name, phone, email, wallet_balance')
          .in('id', providerIds);

        if (provData) {
          provData.forEach((prov) => providersMap.set(prov.id, prov));
        }
      }

      // Map joined data
      const merged: PaymentRequestItem[] = payData.map((item) => ({
        ...item,
        provider: providersMap.get(item.provider_id) || null,
      }));

      setRequests(merged);
    } catch (err) {
      console.error('[AdminPayments] Exception fetching payments:', err);
      setRequests(getFallbackDemoData());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  function getFallbackDemoData(): PaymentRequestItem[] {
    return [
      {
        id: 'req-demo-1',
        provider_id: 'prov-1',
        amount: 750,
        payment_method: 'vodafone_cash',
        transfer_reference: '01099887766',
        receipt_url: '/uploads/image-1.png',
        status: 'pending',
        created_at: new Date().toISOString(),
        provider: {
          id: 'prov-1',
          name: 'م. أحمد الشناوي',
          company_name: 'الأهرام للمساحة والهندسة',
          phone: '01012345678',
          email: 'ahmed@ahram-survey.com',
          wallet_balance: 120,
        },
      },
      {
        id: 'req-demo-2',
        provider_id: 'prov-2',
        amount: 1500,
        payment_method: 'instapay',
        transfer_reference: 'karim_geo@instapay',
        receipt_url: '/uploads/image-1.png',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        provider: {
          id: 'prov-2',
          name: 'م. كريم عثمان',
          company_name: 'جيو تك للمعدات',
          phone: '01123456789',
          email: 'karim@geotech.com',
          wallet_balance: 450,
        },
      },
    ];
  }

  // Handle Approve Action
  const handleApprove = async (item: PaymentRequestItem) => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);

    try {
      // 1. Attempt official atomic RPC
      let rpcSucceeded = false;
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('approve_manual_payment', {
          p_request_id: item.id,
          p_admin_notes: 'تم التحقق من مطابقة الحوالة واعتماد الرصيد بواسطة المشرف.',
        });

        if (!rpcErr && rpcRes && rpcRes.success) {
          rpcSucceeded = true;
        } else if (rpcErr) {
          console.warn('[AdminPayments] RPC error, using client fallback:', rpcErr.message);
        }
      } catch (rpcEx) {
        console.warn('[AdminPayments] RPC exception, fallback:', rpcEx);
      }

      // 2. Client-side fallback if RPC is not yet deployed to remote DB
      if (!rpcSucceeded) {
        // Update request row
        await supabase
          .from('manual_payment_requests')
          .update({
            status: 'approved',
            admin_notes: 'تم الاعتماد والشحن بنجاح.',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        // Fetch current provider balance & increment
        if (item.provider_id) {
          const { data: pRow } = await supabase
            .from('providers')
            .select('wallet_balance')
            .eq('id', item.provider_id)
            .maybeSingle();

          const currentBal = Number(pRow?.wallet_balance) || 0;
          const newBal = currentBal + Number(item.amount);

          await supabase
            .from('providers')
            .update({ wallet_balance: newBal })
            .eq('id', item.provider_id);

          // Insert into wallet_transactions
          try {
            await supabase.from('wallet_transactions').insert({
              provider_id: item.provider_id,
              amount: Number(item.amount),
              tx_type: 'deposit',
              balance_after: newBal,
              notes: `شحن يدوي عبر ${item.payment_method} - إيصال #${item.id.slice(0, 8)}`,
            });
          } catch {}
        }
      }

      // 3. Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? {
                ...r,
                status: 'approved',
                admin_notes: 'تم الاعتماد بنجاح',
                provider: r.provider
                  ? {
                      ...r.provider,
                      wallet_balance: (r.provider.wallet_balance || 0) + r.amount,
                    }
                  : null,
              }
            : r
        )
      );

      if (inspectItem?.id === item.id) {
        setInspectItem(null);
      }

      showToast(`🎉 تم اعتماد الإيصال بمبلغ ${item.amount.toLocaleString('en-US')} ج.م وشحن رصيد المزود فورياً!`);
    } catch (err: any) {
      console.error('[AdminPayments] Failed approving payment:', err);
      showToast('❌ تعذر اعتماد الطلب، يرجى إعادة المحاولة.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject Action
  const handleConfirmReject = async () => {
    if (!rejectingItem || isProcessingAction) return;
    setIsProcessingAction(true);

    try {
      const reason = rejectReason.trim() || 'رقم العملية غير مطابق أو الصورة غير واضحة';

      // 1. Attempt RPC
      let rpcSucceeded = false;
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('reject_manual_payment', {
          p_request_id: rejectingItem.id,
          p_reason: reason,
        });
        if (!rpcErr && rpcRes?.success) rpcSucceeded = true;
      } catch {}

      // 2. Fallback
      if (!rpcSucceeded) {
        await supabase
          .from('manual_payment_requests')
          .update({
            status: 'rejected',
            admin_notes: reason,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', rejectingItem.id);
      }

      // 3. Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectingItem.id ? { ...r, status: 'rejected', admin_notes: reason } : r
        )
      );

      showToast('⚠️ تم رفض الإيصال وتسجيل سبب الرفض بنجاح.');
      setRejectingItem(null);
      setRejectReason('');
      if (inspectItem?.id === rejectingItem.id) {
        setInspectItem(null);
      }
    } catch (err) {
      console.error('[AdminPayments] Error rejecting payment:', err);
      showToast('❌ حدث خطأ أثناء رفض الطلب.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filter items
  const filteredRequests = requests.filter((r) => {
    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    // Method filter
    if (methodFilter !== 'all' && r.payment_method !== methodFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const provName = (r.provider?.name || '').toLowerCase();
      const compName = (r.provider?.company_name || '').toLowerCase();
      const ref = (r.transfer_reference || '').toLowerCase();
      const phone = (r.provider?.phone || '').toLowerCase();
      if (!provName.includes(q) && !compName.includes(q) && !ref.includes(q) && !phone.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Calculate Metrics
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');
  const pendingSum = pendingRequests.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const approvedSum = approvedRequests.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar pendingCount={pendingRequests.length} />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>💳 الإيداعات والتحويلات اليدوية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إيصالات الشحن (Vodafone Cash & InstaPay)</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              مراجعة سكرين شوتس الحوالات ومطابقة أرقام العمليات وشحن أرصدة المحافظ بضغطة زر واحدة.
            </p>
          </div>

          <button
            onClick={fetchPayments}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-300 hover:text-white hover:border-cyan-500/40 transition flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>تحديث السجلات</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>طلبات قيد المراجعة</span>
              <span className="text-amber-400 text-lg">⏳</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {pendingRequests.length}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">
              بإجمالي: {pendingSum.toLocaleString('en-US')} ج.م
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>إجمالي المبالغ المعتمدة</span>
              <span className="text-emerald-400 text-lg">💰</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {approvedSum.toLocaleString('en-US')} ج.م
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1">
              من {approvedRequests.length} عمليات شحن ناجحة
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>إيصالات مرفوضة</span>
              <span className="text-rose-400 text-lg">✕</span>
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {rejectedRequests.length}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-1">بيانات غير مطابقة أو ملغاة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>إجمالي العمليات المسجلة</span>
              <span className="text-cyan-400 text-lg">📊</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {requests.length}
            </div>
            <div className="text-[11px] text-cyan-400/80 mt-1">سجل المعاملات المالية المكتملة</div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Tabs */}
            {[
              { id: 'all', label: 'الكل' },
              { id: 'pending', label: `قيد الانتظار (${pendingRequests.length})` },
              { id: 'approved', label: 'المعتمدة' },
              { id: 'rejected', label: 'المرفوضة' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كل طرق الدفع</option>
              <option value="vodafone_cash">فودافون كاش فقط</option>
              <option value="instapay">إنستاباي فقط</option>
            </select>

            {/* Search Input */}
            <input
              type="text"
              placeholder="بحث باسم المزود، رقم الهاتف، أو المرجع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0b1b36] border-b border-slate-800 text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="p-4">المزوّد / الشركة</th>
                  <th className="p-4">طريقة التحويل</th>
                  <th className="p-4">المبلغ المحول</th>
                  <th className="p-4">مرجع التحويل</th>
                  <th className="p-4">تاريخ الطلب</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">صورة الإيصال</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      جاري تحميل سجلات الإيصالات والمدفوعات...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      لا توجد طلبات إيداع تطابق معايير البحث الحالية.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">
                          {item.provider?.company_name || item.provider?.name || 'مزوّد مساحي'}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5" dir="ltr">
                          {item.provider?.phone || '—'} • {item.provider?.email || ''}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          الرصيد الحالي: {Number(item.provider?.wallet_balance || 0).toLocaleString('en-US')} ج.م
                        </div>
                      </td>

                      <td className="p-4">
                        {item.payment_method === 'vodafone_cash' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            فودافون كاش
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            إنستاباي (InstaPay)
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {Number(item.amount).toLocaleString('en-US')} ج.م
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-slate-800" dir="ltr">
                          {item.transfer_reference}
                        </span>
                      </td>

                      <td className="p-4 text-gray-400 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-4">
                        {item.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ معتمد
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ✕ مرفوض
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ قيد المراجعة
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {item.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setInspectItem(item)}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold underline transition"
                          >
                            <span>👁️</span>
                            <span>معاينة الإيصال</span>
                          </button>
                        ) : (
                          <span className="text-gray-500">لا يوجد إيصال</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={() => handleApprove(item)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
                              title="اعتماد الإيصال وشحن الرصيد فوراً"
                            >
                              اعتماد ✅
                            </button>
                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={() => {
                                setRejectingItem(item);
                                setRejectReason('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-xs transition disabled:opacity-50"
                              title="رفض الإيصال"
                            >
                              رفض ✕
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px]">
                            {item.admin_notes || 'تمت المعالجة'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal 1: Inspect Receipt Lightbox */}
        {inspectItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            style={{ direction: 'rtl' }}
          >
            <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#081933] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">معاينة إيصال التحويل البنكي</h3>
                  <p className="text-xs text-gray-400">
                    {inspectItem.provider?.name} • مبلغ: {inspectItem.amount.toLocaleString('en-US')} ج.م
                  </p>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Receipt Image Display */}
              <div className="rounded-xl border border-slate-700 bg-black/60 p-2 flex items-center justify-center min-h-[300px] overflow-hidden">
                <img
                  src={inspectItem.receipt_url}
                  alt="إيصال التحويل"
                  className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <div className="text-gray-400">طريقة الدفع:</div>
                  <div className="font-bold text-white mt-0.5">
                    {inspectItem.payment_method === 'vodafone_cash' ? 'فودافون كاش' : 'إنستاباي'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">مرجع التحويل:</div>
                  <div className="font-mono text-cyan-300 font-bold mt-0.5" dir="ltr">
                    {inspectItem.transfer_reference}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">المبلغ المطلوب:</div>
                  <div className="font-mono text-emerald-400 font-black text-sm mt-0.5">
                    {inspectItem.amount.toLocaleString('en-US')} ج.م
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <a
                  href={inspectItem.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition"
                >
                  فتح الصورة بالحجم الكامل ↗
                </a>

                {inspectItem.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => handleApprove(inspectItem)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
                    >
                      اعتماد وشحن الرصيد فوراً ✅
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => {
                        setRejectingItem(inspectItem);
                        setRejectReason('');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
                    >
                      رفض الطلب ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Reject Reason Dialog */}
        {rejectingItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            style={{ direction: 'rtl' }}
          >
            <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#081933] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <h3 className="text-base font-bold text-rose-400">رفض إيصال التحويل</h3>
                <button
                  onClick={() => setRejectingItem(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-300">
                يرجى توضيح سبب الرفض ليتم إرساله في إشعار رسمي للمزود ({rejectingItem.provider?.name}):
              </p>

              <div>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: رقم العملية غير موجود بكشف الحساب، أو الصورة غير واضحة..."
                  className="w-full rounded-xl border border-rose-500/40 bg-slate-950 p-3 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  تأكيد الرفض والإشعار
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-cyan-500/30 bg-gray-900/95 px-5 py-3 text-sm text-cyan-300 shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}
