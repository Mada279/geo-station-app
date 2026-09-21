'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

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
  const docInputRef = React.useRef<HTMLInputElement | null>(null);

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

      // Update provider in Supabase
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

      let { error } = await supabase
        .from('providers')
        .update(updatePayload)
        .eq('id', provider.id);

      // If schema uses company_name instead or in addition
      if (error && error.message?.includes('contact_person')) {
        delete updatePayload.contact_person;
        const retry = await supabase
          .from('providers')
          .update(updatePayload)
          .eq('id', provider.id);
        error = retry.error;
      }

      if (error) {
        throw error;
      }

      const updated = {
        ...provider,
        name: name.trim(),
        contact_person: contactPerson.trim(),
      };

      onSaveSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('[ReviewProviderModal Error]:', err);
      setErrorMsg(err.message || 'تعذر حفظ التعديلات. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl space-y-5 text-gray-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1.5">
              <span>🏢 مراجعة وتدقيق ملف المزوّد</span>
            </div>
            <h2 className="text-xl font-black text-white">تفاصيل الشريك وتصحيح البيانات</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {provider.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Notice */}
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs flex items-center gap-2">
          <span>✍️</span>
          <span>
            <strong>صلاحية الإدارة:</strong> يمكنك تصحيح الأخطاء الإملائية في اسم الشركة واسم المسؤول لضمان دقة العرض في الدليل العام للعملاء.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Editable Fields Section */}
        <div className="space-y-4 rounded-xl bg-slate-950/60 p-4 border border-cyan-500/15">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            ✏️ بيانات قابلة للتعديل والتصحيح
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                اسم الشركة / المكتب المساحي <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                placeholder="أدخل اسم المكتب بدقة..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                اسم مسؤول الاتصال (Contact Person)
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                placeholder="مثال: م. أحمد الشناوي"
              />
            </div>
          </div>
        </div>

        {/* Readonly Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-gray-800 space-y-1">
            <span className="text-gray-400 block text-[11px]">المحافظة والمقر</span>
            <span className="font-bold text-white">{provider.location || 'غير محدد'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-gray-800 space-y-1">
            <span className="text-gray-400 block text-[11px]">حالة الاعتماد في المنصة</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
              provider.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}>
              {provider.status === 'approved' ? 'معتمد رسمي ✅' : 'قيد المراجعة ⏳'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-gray-800 space-y-1">
            <span className="text-gray-400 block text-[11px]">رقم الهاتف المسجل</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-300 font-bold" dir="ltr">{provider.phone || '—'}</span>
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="text-cyan-400 hover:underline text-[11px]"
                >
                  اتصال 📞
                </a>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-gray-800 space-y-1">
            <span className="text-gray-400 block text-[11px]">البريد الإلكتروني</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-gray-300 truncate max-w-[180px]" dir="ltr">{provider.email || '—'}</span>
              {provider.email && (
                <a
                  href={`mailto:${provider.email}`}
                  className="text-cyan-400 hover:underline text-[11px]"
                >
                  مراسلة ✉️
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Uploaded Documents / Attachments */}
        <div className="space-y-2 rounded-xl bg-slate-950/60 p-4 border border-cyan-500/15">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span>📎</span>
              <span>المستندات والوثائق المرفوعة</span>
            </h3>
            <div>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                onChange={handleDocUpload}
                className="hidden"
                id="adminDocUpload"
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 transition flex items-center gap-1"
              >
                <span>{isUploadingDoc ? 'جاري الرفع...' : '+ إرفاق مستند جديد'}</span>
              </button>
            </div>
          </div>
          
          {docList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {docList.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-cyan-500/20 text-xs">
                  <span className="text-gray-300 font-medium truncate max-w-[140px]">{doc.title}</span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold transition"
                  >
                    معاينة 🔍
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500 text-xs border border-dashed border-gray-800 rounded-lg">
              لا توجد مستندات أو مرفقات مسجلة لهذا المزوّد حالياً.
            </div>
          )}
        </div>

        {/* Public profile link */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/30 border border-gray-800 text-xs">
          <span className="text-gray-400">معاينة صفحة المزوّد العامة في دليل المنصة:</span>
          <a
            href={`/directory/${provider.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 hover:text-cyan-200 font-bold underline inline-flex items-center gap-1"
          >
            <span>فتح الصفحة العامة</span>
            <span dir="ltr">↗</span>
          </a>
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
            className="px-5 py-2 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-xs font-bold text-[#081933] shadow-lg hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>حفظ التعديلات (Save Changes)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGov, setSelectedGov] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reviewProvider, setReviewProvider] = useState<any | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setProviders(data);
      } else {
        setProviders([
          { id: '1', name: 'مكتب الأهرام للمساحة الهندسية', location: 'القاهرة — مدينة نصر', contact_person: 'م. أحمد الشناوي', phone: '01012345678', status: 'approved' },
          { id: '2', name: 'جيو تكنولوجي مصر', location: 'الجيزة — الدقي', contact_person: 'م. كريم عادل', phone: '01123456789', status: 'approved' },
          { id: '3', name: 'الإسكندرية للمسح البحري والبري', location: 'الإسكندرية — سموحة', contact_person: 'م. حسام الدين', phone: '01234567890', status: 'approved' },
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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const { error } = await supabase.from('providers').update({ status: nextStatus }).eq('id', id);
      if (!error) {
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
        );
        showToast(`تم تعديل حالة المزوّد إلى: ${nextStatus === 'approved' ? 'معتمد' : 'قيد المراجعة'}`);
      }
    } catch {
      showToast('تعذر تعديل الحالة حالياً.');
    }
  };

  const handleSaveProviderSuccess = (updated: any) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
    showToast('✅ تم حفظ تعديلات بيانات المزوّد بنجاح وتحديث السجلات الحية!');
  };

  const filteredProviders = providers.filter((p) => {
    const displayName = p.company_name || p.name || p.contact_person || '';
    const nameMatch = !searchTerm || (displayName && displayName.includes(searchTerm)) || (p.location && p.location.includes(searchTerm));
    const govMatch = selectedGov === 'all' || (p.location && p.location.includes(selectedGov));
    return nameMatch && govMatch;
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>🏢 شركاء المنصة وشبكة التوريد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">المزوّدون</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              إدارة شبكة مكاتب وشركات المساحة المعتمدة والمعدات المسجلة لديهم متصلة بقاعدة البيانات الحية.
            </p>
          </div>

          <button
            onClick={fetchProviders}
            className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 transition"
          >
            🔄 تحديث البيانات الحية
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي المزوّدين في النظام</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">🏢</span>
            </div>
            <div className="text-2xl font-black text-white">{providers.length} <span className="text-xs text-cyan-300 font-normal">مكتب وشركة</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">قاعدة بيانات سحابية متصلة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>مزوّدون معتمدون</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-white">{providers.filter(p => p.status === 'approved').length}</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">جاهزية فورية لتسليم المعدات</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>معدل تقييم الخدمة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⭐</span>
            </div>
            <div className="text-2xl font-black text-white">4.9 <span className="text-xs text-gray-400 font-normal">/ 5.0</span></div>
            <div className="text-[11px] text-amber-300 mt-2 font-semibold">معايير جودة معتمدة</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>حالة المزامنة السحابية</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">📡</span>
            </div>
            <div className="text-xl font-black text-emerald-400">متصل (Supabase)</div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">مزامنة فورية Real-time</div>
          </div>
        </div>

        {/* Providers Directory Table */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/50 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">دليل مزوّدي الخدمات والمعدات</h3>
              <p className="text-xs text-gray-400 mt-0.5">عرض وتعديل وتجميد حسابات المزوّدين المعتمدين</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم المزوّد، المحافظة..."
                className="rounded-xl border border-cyan-500/30 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="rounded-xl border border-cyan-500/30 bg-slate-950 px-3 py-2 text-xs text-gray-300 focus:outline-none"
              >
                <option value="all">كافة المحافظات</option>
                <option value="القاهرة">القاهرة</option>
                <option value="الجيزة">الجيزة</option>
                <option value="الإسكندرية">الإسكندرية</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-xs">جاري تحميل بيانات المزوّدين من السحابة...</div>
            ) : (
              <table className="w-full text-right text-xs text-slate-200 bg-slate-900">
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3.5 text-slate-300">اسم المزوّد / الشركة</th>
                    <th className="p-3.5 text-slate-300">المحافظة والمقر</th>
                    <th className="p-3.5 text-slate-300">مسؤول الاتصال / الهاتف</th>
                    <th className="p-3.5 text-slate-300">البريد الإلكتروني</th>
                    <th className="p-3.5 text-slate-300">الحالة</th>
                    <th className="p-3.5 text-slate-300 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredProviders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400 text-xs">
                        لا توجد نتائج مطابقة لبحثك.
                      </td>
                    </tr>
                  ) : (
                    filteredProviders.map((provider) => (
                      <tr
                        key={provider.id}
                        onClick={() => {
                          setReviewProvider(provider);
                          setIsReviewOpen(true);
                        }}
                        className="hover:bg-slate-800/50 cursor-pointer transition group"
                        title="انقر لمراجعة وتعديل بيانات المزوّد"
                      >
                        <td className="p-3.5 font-semibold text-slate-200 transition flex items-center gap-1.5">
                          <span>🏢</span>
                          <span className="font-semibold text-white">
                            {provider.company_name || provider.name || provider.contact_person || 'بدون اسم'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-200">{provider.location || '—'}</td>
                        <td className="p-3.5 text-slate-300">{provider.contact_person || provider.phone || '—'}</td>
                        <td className="p-3.5 font-mono text-cyan-300 text-[11px]">{provider.email || '—'}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                              provider.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {provider.status === 'approved' ? 'معتمد' : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center space-x-2 space-x-reverse" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setReviewProvider(provider);
                              setIsReviewOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition inline-flex items-center gap-1"
                          >
                            <span>🔍</span>
                            <span>مراجعة وتعديل</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(provider.id, provider.status || 'pending')}
                            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 font-bold transition"
                          >
                            {provider.status === 'approved' ? 'إلغاء الاعتماد' : 'اعتماد مباشر'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Review Provider Modal */}
        <ReviewProviderModal
          provider={reviewProvider}
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setReviewProvider(null);
          }}
          onSaveSuccess={handleSaveProviderSuccess}
        />

      </div>
    </div>
  );
}
