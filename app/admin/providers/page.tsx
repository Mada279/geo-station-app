'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';
import { formatWhatsAppNumber, getWhatsAppLink } from '@/utils/phoneUtils';
import {
  getProvidersSuspensionMetaMap,
  isProviderActiveSuspended,
  setProviderSuspension,
  ProviderSuspensionMeta,
} from '@/services/providerControlService';

interface ReviewProviderModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedProvider: any) => void;
}

function ReviewProviderModal({ provider, isOpen, onClose, onSaveSuccess }: ReviewProviderModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [docList, setDocList] = useState<{ title: string; url: string; field?: string }[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setName(provider.company_name || provider.name || provider.contact_person || '');
      setContactPerson(provider.contact_person || '');
      setErrorMsg(null);
      const initialDocs = [
        { title: 'السجل التجاري', url: provider.commercial_reg || provider.commercial_register || provider.cr_doc, field: 'commercial_reg' },
        { title: 'البطاقة الضريبية', url: provider.tax_card || provider.tax_doc, field: 'tax_card' },
        { title: 'رخصة مزاولة المهنة', url: provider.license || provider.license_doc, field: 'license' },
        { title: 'شعار المكتب / الشركة', url: provider.logo_url || provider.avatar_url || provider.image_url, field: 'logo_url' },
      ].filter((d) => Boolean(d.url));
      setDocList(initialDocs);
    }
  }, [provider]);

  if (!isOpen || !provider) return null;

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !provider) return;
    setIsUploadingDoc(true);
    setErrorMsg(null);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const cleanFileName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `documents/${cleanFileName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      let publicUrl = '';
      if (!uploadErr && uploadData) {
        const { data: pubData } = supabase.storage.from('attachments').getPublicUrl(filePath);
        publicUrl = pubData?.publicUrl || '';
      } else {
        if (uploadErr) console.warn('[Attachment Storage Upload Warn]:', uploadErr.message);
        publicUrl = URL.createObjectURL(file);
      }

      const newDoc = {
        title: file.name,
        url: publicUrl,
        field: 'commercial_reg',
      };
      setDocList((prev) => [...prev, newDoc]);

      await supabase
        .from('providers')
        .update({ commercial_reg: publicUrl })
        .eq('id', provider.id);
    } catch (err: any) {
      console.error('[Document Upload Exception]:', err);
      setErrorMsg('تعذر رفع المستند. يرجى التأكد من تشغيل أمر إنشاء الـ Bucket وسياسات التخزين.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم المزوّد / الشركة.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const updatePayload: any = {
        name: name.trim(),
        contact_person: contactPerson.trim(),
      };

      const { error: dbError } = await supabase
        .from('providers')
        .update(updatePayload)
        .eq('id', provider.id);

      if (dbError) throw dbError;

      onSaveSuccess({
        ...provider,
        name: name.trim(),
        company_name: name.trim(),
        contact_person: contactPerson.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving provider updates:', err);
      setErrorMsg('فشل حفظ البيانات. الرجاء إعادة المحاولة.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl space-y-6 text-right max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-xl">🏢</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">مراجعة وتعديل بيانات المزوّد</h2>
              <p className="text-[11px] text-gray-400">تعديل بيانات الحساب الرسمي ومراجعة المستندات الهندسية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition">✕</button>
        </div>

        {errorMsg && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">{errorMsg}</div>}

        <div className="space-y-4 rounded-xl bg-slate-950/60 p-4 border border-cyan-500/15">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">✏️ بيانات قابلة للتعديل</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">اسم الشركة / المكتب المساحي <span className="text-rose-400">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">مسؤول الاتصال (Contact Person)</label>
              <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-gray-800 space-y-1">
            <span className="text-gray-400 block text-[11px]">المحافظة والمقر</span>
            <span className="font-bold text-white">{provider.location || 'غير محدد'}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-gray-800 space-y-1">
            <span className="text-gray-400 block text-[11px]">رقم الهاتف المسجل</span>
            <span className="font-mono text-cyan-300 font-bold" dir="ltr">{provider.phone || '—'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-200">📑 المستندات والملفات المرفقة</h3>
          {docList.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-gray-800 text-center text-xs text-gray-500">لا توجد مستندات مرفوعة بعد.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {docList.map((doc, idx) => (
                <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between transition group">
                  <span className="truncate">{doc.title}</span>
                  <span>↗</span>
                </a>
              ))}
            </div>
          )}
          <input type="file" onChange={handleDocUpload} className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20" />
          {isUploadingDoc && <span className="text-xs text-cyan-400 animate-pulse">جاري الرفع...</span>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-gray-300 hover:text-white transition">إلغاء</button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50">
            {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [suspensionMap, setSuspensionMap] = useState<Map<string, ProviderSuspensionMeta>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGov, setSelectedGov] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [reviewProvider, setReviewProvider] = useState<any | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  // God Mode Smart Suspend Modal
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [suspendMode, setSuspendMode] = useState<'permanent' | 'temporary'>('permanent');
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [customSuspensionDate, setCustomSuspensionDate] = useState<string>('');
  const [suspensionReason, setSuspensionReason] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isProcessingSuspend, setIsProcessingSuspend] = useState<boolean>(false);

  // Quick Action Communication Modal (WhatsApp / Resend Email)
  const [commTarget, setCommTarget] = useState<{
    provider: any;
    actionType: 'suspended' | 'approved' | 'needs_revision' | 'restored';
    defaultMessage: string;
  } | null>(null);
  const [commNotes, setCommNotes] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [sendingWelcomeId, setSendingWelcomeId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendWelcome = async (provider: any) => {
    if (!provider.email || !provider.email.includes('@') || provider.email === '—') {
      showToast('⚠️ لا يوجد بريد إلكتروني صالح لهذا المزوّد');
      return;
    }

    setSendingWelcomeId(String(provider.id));
    try {
      const res = await fetch('/api/admin/notify-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerEmail: provider.email,
          providerName: provider.company_name || provider.name || 'شريكنا العزيز',
          actionType: 'welcome',
          userType: 'provider',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`✉️ تم إرسال إيميل الترحيب الرسمي بنجاح إلى "${provider.name}" (${provider.email}) 🎉`);
      } else {
        showToast(`❌ فشل إرسال الترحيب: ${data.error || data.warning || 'خطأ غير متوقع'}`);
      }
    } catch {
      showToast('❌ تعذر الاتصال ببوابة إرسال البريد');
    } finally {
      setSendingWelcomeId(null);
    }
  };

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      const sMap = await getProvidersSuspensionMetaMap();
      setSuspensionMap(sMap);

      if (!error && data && data.length > 0) {
        setProviders(data);
      } else {
        setProviders([
          { id: '1', name: 'مكتب الأهرام للمساحة الهندسية', location: 'القاهرة — مدينة نصر', contact_person: 'م. أحمد الشناوي', phone: '01012345678', email: 'ahmed@ahram-survey.com', status: 'approved' },
          { id: '2', name: 'جيو تكنولوجي مصر', location: 'الجيزة — الدقي', contact_person: 'م. كريم عادل', phone: '01123456789', email: 'karim@geotech.com', status: 'approved' },
          { id: '3', name: 'الإسكندرية للمسح البحري والبري', location: 'الإسكندرية — سموحة', contact_person: 'م. حسام الدين', phone: '01234567890', email: 'hossam@alex-survey.com', status: 'approved' },
        ]);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Open Smart Suspend Dialog
  const handleOpenSuspendModal = (provider: any) => {
    setSuspendTarget(provider);
    setSuspendMode('permanent');
    setSuspendDays(7);
    setCustomSuspensionDate('');
    setSuspensionReason('مخالفة معايير الجودة والمستندات الهندسية');
    setAdminNotes('');
  };

  // Submit Smart Suspend Action
  const handleConfirmSuspension = async () => {
    if (!suspendTarget) return;
    setIsProcessingSuspend(true);

    let suspendedUntil: string | null = null;
    if (suspendMode === 'temporary') {
      if (customSuspensionDate) {
        suspendedUntil = new Date(customSuspensionDate).toISOString();
      } else {
        const d = new Date();
        d.setDate(d.getDate() + suspendDays);
        suspendedUntil = d.toISOString();
      }
    }

    try {
      const res = await setProviderSuspension({
        providerId: String(suspendTarget.id),
        isSuspended: true,
        suspendedUntil,
        suspensionReason,
        adminNotes,
        providerEmail: suspendTarget.email,
      });

      if (res.success) {
        showToast(`⛔ تم إيقاف المزوّد "${suspendTarget.name}" وإخفاء معداته ووظائفه بنجاح.`);

        // Prompt for automated communication
        setCommTarget({
          provider: suspendTarget,
          actionType: 'suspended',
          defaultMessage: `السلام عليكم ${suspendTarget.contact_person || suspendTarget.name}، نود إعلامكم بأنه تم إيقاف حساب المزود الخاص بكم في منصة Survsta.${
            suspensionReason ? ` السبب: ${suspensionReason}.` : ''
          }${suspendedUntil ? ` مدة الإيقاف حتى: ${new Date(suspendedUntil).toLocaleDateString('ar-EG')}.` : ' الحظر دائم.'} يرجى مراجعة الإدارة.`,
        });

        setSuspendTarget(null);
        await fetchProviders();
      } else {
        throw res.error;
      }
    } catch (err: any) {
      showToast('❌ حدث خطأ أثناء تنفيذ أمر الإيقاف.');
    } finally {
      setIsProcessingSuspend(false);
    }
  };

  // Unban / Restore Provider
  const handleRestoreProvider = async (provider: any) => {
    try {
      const res = await setProviderSuspension({
        providerId: String(provider.id),
        isSuspended: false,
        providerEmail: provider.email,
      });

      if (res.success) {
        showToast(`✅ تم رفع الإيقاف واستعادة تفعيل المزوّد "${provider.name}" بنجاح!`);

        setCommTarget({
          provider,
          actionType: 'restored',
          defaultMessage: `أهلاً ${provider.contact_person || provider.name}، يسعدنا إبلاغكم بأنه تم رفع الإيقاف عن حسابكم في منصة Survsta وعادت كافة أجهزتكم للظهور.`,
        });

        await fetchProviders();
      }
    } catch {
      showToast('❌ تعذر استعادة تفعيل الحساب.');
    }
  };

  // Toggle Verification / Approval
  const handleToggleStatus = async (provider: any) => {
    const isApproved = provider.status === 'approved';
    const nextStatus = isApproved ? 'pending' : 'approved';

    try {
      await supabase.from('providers').update({ status: nextStatus }).eq('id', provider.id);
      showToast(nextStatus === 'approved' ? '✅ تم اعتماد وتوثيق المزوّد بنجاح!' : '⏳ تم تحويل المزوّد لقيد المراجعة.');

      if (nextStatus === 'approved') {
        setCommTarget({
          provider,
          actionType: 'approved',
          defaultMessage: `تهانينا ${provider.contact_person || provider.name}! تم اعتماد وتوثيق حسابكم رسمياً في منصة Survsta. يمكنك الآن رفع معداتك واستقبال الطلبات.`,
        });
      }

      await fetchProviders();
    } catch {
      showToast('تعذر تعديل الحالة حالياً.');
    }
  };

  // Featured toggle
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    const nextFeatured = !currentFeatured;
    try {
      await supabase.from('providers').update({ is_featured: nextFeatured }).eq('id', id);
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, is_featured: nextFeatured } : p)));
      showToast(nextFeatured ? '⭐ تم تمييز المزوّد في الصفحة الرئيسية!' : 'تم إلغاء التمييز');
    } catch {
      showToast('تعذر تحديث حالة التمييز.');
    }
  };

  // Trigger automated email via API route
  const handleSendEmailNotification = async () => {
    if (!commTarget || !commTarget.provider.email) {
      showToast('⚠️ لا يوجد بريد إلكتروني مسجل لهذا المزود.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/admin/notify-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerEmail: commTarget.provider.email,
          providerName: commTarget.provider.name,
          actionType: commTarget.actionType,
          reason: commNotes || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('✉️ تم إرسال الإشعار بالبريد الإلكتروني بنجاح!');
        setCommTarget(null);
      } else {
        throw new Error(data.error || 'فشل الإرسال');
      }
    } catch (err: any) {
      showToast(`❌ فشل إرسال البريد: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Filtered providers list
  const filteredProviders = providers.filter((p) => {
    const displayName = p.company_name || p.name || p.contact_person || '';
    const nameMatch = !searchTerm || displayName.includes(searchTerm) || (p.location && p.location.includes(searchTerm));
    const govMatch = selectedGov === 'all' || (p.location && p.location.includes(selectedGov));

    const meta = suspensionMap.get(String(p.id));
    const isSuspended = isProviderActiveSuspended(meta) || p.status === 'suspended' || p.is_suspended === true;

    let statusMatch = true;
    if (statusFilter === 'active') statusMatch = !isSuspended && p.status === 'approved';
    else if (statusFilter === 'suspended') statusMatch = isSuspended;
    else if (statusFilter === 'pending') statusMatch = !isSuspended && p.status === 'pending';

    return nameMatch && govMatch && statusMatch;
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
              <span>⚡ نظام التحكم الشامل والمطلق (God Mode)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة المزوّدين والمكاتب</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              التحكم في الاعتماد، التوثيق، الحظر المؤقت والدائم، وإخفاء الأجهزة تسلسلياً مع إشعارات الواتساب والإيميل.
            </p>
          </div>

          <button
            onClick={fetchProviders}
            className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 transition"
          >
            🔄 تحديث البيانات الحية
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">إجمالي المزوّدين</div>
            <div className="text-2xl font-black text-white">{providers.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">المعتمدون والنشطون</div>
            <div className="text-2xl font-black text-emerald-400">
              {providers.filter((p) => {
                const meta = suspensionMap.get(String(p.id));
                return !isProviderActiveSuspended(meta) && p.status === 'approved';
              }).length}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">الموقوفون والمحظورون (Suspended)</div>
            <div className="text-2xl font-black text-rose-500">
              {providers.filter((p) => {
                const meta = suspensionMap.get(String(p.id));
                return isProviderActiveSuspended(meta) || p.status === 'suspended';
              }).length}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">بانتظار المراجعة (Pending)</div>
            <div className="text-2xl font-black text-amber-400">
              {providers.filter((p) => p.status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="بحث بالاسم، مسؤول الاتصال، الهاتف، المحافظة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كل حالات الحسابات</option>
              <option value="active">نشط ومعتمد فقط</option>
              <option value="suspended">موقوف / محظور فقط</option>
              <option value="pending">قيد المراجعة فقط</option>
            </select>

            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كافة المحافظات</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">جاري تحميل بيانات المزوّدين...</div>
          ) : filteredProviders.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">لا توجد نتائج مطابقة لبحثك.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-gray-400 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">المزوّد / الشركة</th>
                    <th className="px-5 py-3.5">المحافظة</th>
                    <th className="px-5 py-3.5">الهاتف والتواصل السريع</th>
                    <th className="px-5 py-3.5">حالة الحساب</th>
                    <th className="px-5 py-3.5 text-center">الرئيسية (Featured)</th>
                    <th className="px-5 py-3.5 text-center">إجراءات God Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProviders.map((provider) => {
                    const meta = suspensionMap.get(String(provider.id));
                    const isSuspended = isProviderActiveSuspended(meta) || provider.status === 'suspended' || provider.is_suspended === true;
                    const isApproved = provider.status === 'approved';

                    let suspensionTimeRemaining = '';
                    if (isSuspended && meta?.suspended_until) {
                      const days = Math.ceil((new Date(meta.suspended_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      suspensionTimeRemaining = days > 0 ? `(متبقي ${days} يوم)` : '(انتهت المدة)';
                    }

                    return (
                      <tr key={provider.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>🏢</span>
                            <div>
                              <div>{provider.company_name || provider.name || 'بدون اسم'}</div>
                              <div className="text-[10px] text-gray-400 font-normal">{provider.email || '—'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-300">{provider.location || '—'}</td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-300 font-bold" dir="ltr">{provider.phone || '—'}</span>
                            {provider.phone && (
                              <a
                                href={getWhatsAppLink(provider.phone, `أهلاً ${provider.name}، بخصوص حسابكم في منصة Survsta:`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition"
                                title="محادثة واتساب سريعة"
                              >
                                💬
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {isSuspended ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <span>⛔</span>
                                <span>{meta?.suspended_until ? 'موقوف مؤقتاً' : 'محظور دائم'}</span>
                              </span>
                              {suspensionTimeRemaining && (
                                <span className="text-[10px] text-rose-400 font-semibold">{suspensionTimeRemaining}</span>
                              )}
                            </div>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <span>✓</span>
                              <span>معتمد ونشط</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <span>⏳</span>
                              <span>قيد المراجعة</span>
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(provider.id, Boolean(provider.is_featured))}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 mx-auto border ${
                              provider.is_featured
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                : 'bg-slate-950 text-gray-500 border-gray-800 hover:text-gray-300'
                            }`}
                          >
                            <span>{provider.is_featured ? '⭐' : '☆'}</span>
                            <span>{provider.is_featured ? 'مميّز' : 'تمييز'}</span>
                          </button>
                        </td>

                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Review & Edit */}
                            <button
                              onClick={() => {
                                setReviewProvider(provider);
                                setIsReviewOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:bg-cyan-500/20 transition font-bold"
                              title="تعديل ومراجعة المستندات"
                            >
                              🔍 مراجعة
                            </button>

                            {/* Send Welcome Email */}
                            <button
                              type="button"
                              disabled={sendingWelcomeId === String(provider.id) || !provider.email || !provider.email.includes('@')}
                              onClick={() => handleSendWelcome(provider)}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 disabled:opacity-40 font-bold transition flex items-center gap-1 shadow-sm"
                              title={provider.email ? `إرسال إيميل ترحيب رسمي عبر Resend إلى ${provider.email}` : 'لا يوجد بريد إلكتروني مسجل'}
                            >
                              {sendingWelcomeId === String(provider.id) ? (
                                <span className="flex items-center gap-1 text-[11px]">
                                  <span className="animate-spin h-3 w-3 border-2 border-blue-300 border-t-transparent rounded-full" />
                                  <span>إرسال...</span>
                                </span>
                              ) : (
                                <>
                                  <span>✉️</span>
                                  <span>إرسال ترحيب</span>
                                </>
                              )}
                            </button>

                            {/* Approve / Revoke Approval */}
                            <button
                              onClick={() => handleToggleStatus(provider)}
                              className={`px-2.5 py-1 rounded-lg font-bold transition border ${
                                isApproved
                                  ? 'bg-slate-800 text-gray-400 border-slate-700 hover:text-white'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              }`}
                            >
                              {isApproved ? 'سحب الاعتماد' : 'اعتماد رسمي'}
                            </button>

                            {/* Suspend / Restore (God Mode Action) */}
                            {isSuspended ? (
                              <button
                                onClick={() => handleRestoreProvider(provider)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-600/30"
                              >
                                ✓ رفع الإيقاف
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenSuspendModal(provider)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold transition"
                              >
                                ⛔ إيقاف الحساب
                              </button>
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

        {/* Modal: Smart Suspend (God Mode) */}
        {suspendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-right">
            <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button onClick={() => setSuspendTarget(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <span className="text-xl">⛔</span>
                  <h3 className="text-base text-white">إيقاف وتجميد حساب المزوّد (God Mode)</h3>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                ⚠️ <strong>تأثير الإجراء التسلسلي:</strong> فور إيقاف المزوّد، سيتم فورياً إخفاء كافة أجهزته ومعداته ووظائفه من سوق المنصة ولن يستطيع الدخول لحسابه لحين رفع الحظر.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">المزوّد المستهدف:</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-white text-xs">
                  {suspendTarget.name} ({suspendTarget.phone || 'بدون هاتف'})
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">نوع الإيقاف:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSuspendMode('permanent')}
                    className={`p-3 rounded-xl border text-xs font-bold transition ${
                      suspendMode === 'permanent'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-gray-400'
                    }`}
                  >
                    حظر إداري دائم (Permanent Ban)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuspendMode('temporary')}
                    className={`p-3 rounded-xl border text-xs font-bold transition ${
                      suspendMode === 'temporary'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-gray-400'
                    }`}
                  >
                    إيقاف مؤقت مجدول (Time-based)
                  </button>
                </div>
              </div>

              {/* Temporary duration controls */}
              {suspendMode === 'temporary' && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex gap-2">
                    {[3, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSuspendDays(d);
                          setCustomSuspensionDate('');
                        }}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                          suspendDays === d && !customSuspensionDate
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-gray-400'
                        }`}
                      >
                        {d} أيام
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">أو حدد تاريخاً مخصصاً لرفع الحظر التلقائي:</label>
                    <input
                      type="datetime-local"
                      value={customSuspensionDate}
                      onChange={(e) => setCustomSuspensionDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {/* Suspension Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">سبب الإيقاف (سيظهر للمزود):</label>
                <input
                  type="text"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="مثال: نقص رخصة مزاولة المهنة، شكوى عميل بخصوص جهاز غير معاير..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">ملاحظات سرية للإدارة فقط (اختياري):</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="ملاحظات داخلية لفريق المشرفين..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSuspendTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-gray-300 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspension}
                  disabled={isProcessingSuspend}
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {isProcessingSuspend ? 'جاري التنفيذ...' : 'تأكيد إيقاف الحساب فوراً'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Automated Communication Dialog (WhatsApp + Resend Email) */}
        {commTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-right">
            <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button onClick={() => setCommTarget(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📨</span>
                  <h3 className="text-base font-bold text-white">إرسال إشعار مباشر للمزوّد</h3>
                </div>
              </div>

              <p className="text-xs text-gray-300">
                المزوّد: <strong className="text-white">{commTarget.provider.name}</strong>
              </p>

              {/* Message preview box */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-200 leading-relaxed font-sans select-all">
                {commTarget.defaultMessage}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">ملاحظة إضافية للرسالة:</label>
                <input
                  type="text"
                  value={commNotes}
                  onChange={(e) => setCommNotes(e.target.value)}
                  placeholder="أضف أي تفاصيل أخرى..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2 pt-2">
                {/* WhatsApp Trigger */}
                {commTarget.provider.phone ? (
                  <a
                    href={`https://wa.me/${formatWhatsAppNumber(commTarget.provider.phone)}?text=${encodeURIComponent(
                      `${commTarget.defaultMessage}${commNotes ? `\n\nملاحظة: ${commNotes}` : ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      showToast('💬 تم فتح الواتساب بنجاح');
                      setCommTarget(null);
                    }}
                    className="w-full rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <span>💬</span>
                    <span>إرسال عبر الواتساب (Via WhatsApp)</span>
                  </a>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-1">لا يوجد رقم هاتف متاح للواتساب.</div>
                )}

                {/* Resend Email Trigger */}
                {commTarget.provider.email ? (
                  <button
                    type="button"
                    onClick={handleSendEmailNotification}
                    disabled={isSendingEmail}
                    className="w-full rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-500 text-cyan-300 hover:text-white py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <span>✉️</span>
                    <span>{isSendingEmail ? 'جاري الإرسال عبر Resend...' : 'إرسال بريد إلكتروني رسمي (Via Resend API)'}</span>
                  </button>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-1">لا يوجد بريد إلكتروني متاح لهذا المزود.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing Review Modal */}
        <ReviewProviderModal
          provider={reviewProvider}
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setReviewProvider(null);
          }}
          onSaveSuccess={() => {
            showToast('✅ تم حفظ التعديلات بنجاح.');
            fetchProviders();
          }}
        />
      </div>
    </div>
  );
}
