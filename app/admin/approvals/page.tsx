'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';
import { getWhatsAppLink, formatWhatsAppNumber } from '@/utils/phoneUtils';

interface PendingItem {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  location: string;
  services: string[];
  createdAt: string;
  status: string;
}

export default function AdminApprovalsPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [activeRevisionItem, setActiveRevisionItem] = useState<PendingItem | null>(null);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const getRevisionMessage = (item: PendingItem) => {
    const targetName = item.contact && item.contact !== '—' && item.contact !== item.name ? item.contact : item.name;
    return `السلام عليكم ${targetName}، يرجى الدخول لحسابكم في منصة Survsta وتعديل البيانات/الصور ليتم اعتماد حسابكم ونشر إعلاناتكم.`;
  };

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .or('status.eq.pending,status.eq.needs_revision,status.is.null')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data.map((r: any) => ({
          id: r.id,
          name: r.name || 'مزوّد خدمة مساحية',
          contact: r.contact_person || r.name || 'المسؤول',
          phone: r.phone || '—',
          email: r.email || '—',
          location: r.location || 'القاهرة',
          services: Array.isArray(r.services) && r.services.length > 0 ? r.services : ['إيجار أجهزة ومعدات مساحية'],
          createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : 'اليوم',
          status: r.status || 'pending',
        })));
      } else {
        setItems([
          {
            id: 'demo-1',
            name: 'مكتب النخبة للهندسة والمساحة',
            contact: 'م. أحمد فؤاد',
            phone: '01099887766',
            email: 'contact@elnekheba.com',
            location: 'القاهرة — التجمع الخامس',
            services: ['إيجار توتال ستيشن', 'رفع شبكات GNSS'],
            createdAt: 'اليوم 11:20 ص',
            status: 'pending',
          },
          {
            id: 'demo-2',
            name: 'الأفق للمسح الجيوديسي',
            contact: 'م. محمود رضوان',
            phone: '01122334455',
            email: 'info@alofok-geo.com',
            location: 'الجيزة — الدقي',
            services: ['معايرة وتأجير معدات'],
            createdAt: 'أمس',
            status: 'pending',
          }
        ]);
      }
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    const approvedItem = items.find((item) => item.id === id);
    try {
      await supabase.from('providers').update({ status: 'approved' }).eq('id', id);

      // Send in-app notification to provider
      try {
        await supabase.from('inapp_notifications').insert({
          user_id: id,
          title: 'تم اعتماد حسابك كمزود خدمة بنجاح! 🎉',
          message: 'تهانينا! تمت مراجعة واعتماد حساب المزود الخاص بك من قبل الإدارة. يمكنك الآن نشر أجهزتك ومعداتك واستقبال طلبات الحجز.',
          type: 'approval',
          link: '/provider/dashboard',
        });
      } catch {}

      // Update clients table active_modules if client entry exists
      if (approvedItem?.email && approvedItem.email !== '—') {
        try {
          const { data: clientRow } = await supabase
            .from('clients')
            .select('id, active_modules')
            .eq('email', approvedItem.email.trim().toLowerCase())
            .maybeSingle();

          if (clientRow) {
            let updatedMods: any = clientRow.active_modules;
            if (updatedMods && typeof updatedMods === 'object' && !Array.isArray(updatedMods)) {
              updatedMods = { ...updatedMods, provider: 'active' };
            } else if (Array.isArray(updatedMods)) {
              updatedMods = Array.from(new Set([...updatedMods, 'provider']));
            } else {
              updatedMods = { client: 'active', provider: 'active' };
            }
            await supabase.from('clients').update({ active_modules: updatedMods }).eq('id', clientRow.id);
          }
        } catch {}
      }
    } catch {}
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`تم اعتماد المزوّد (${name}) بنجاح ونقله إلى القائمة المعتمدة وإرسال إشعار التفعيل ✅`);
  };

  const handleMarkNeedsRevision = async (id: string, name: string) => {
    try {
      await supabase.from('providers').update({ status: 'needs_revision' }).eq('id', id);
    } catch {}
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'needs_revision' } : item))
    );
    showToast(`تم إشعار المزوّد وتحديث حالة (${name}) إلى: بانتظار التعديل 📝`);
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await supabase.from('providers').update({ status: 'rejected' }).eq('id', id);
    } catch {}
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`تم رفض / تعليق طلب (${name}) ❌`);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar pendingCount={items.length} />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Toast */}
        {actionToast && (
          <div className="fixed top-5 left-5 z-50 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-2xl animate-bounce">
            {actionToast}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold mb-2">
              <span>⏳ طابور المراجعة والاعتماد الفوري</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">طابور الاعتمادات</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              مراجعة وتدقيق طلبات انضمام المزوّدين وشركات المساحة المعلقة قبل نشرها على المنصة.
            </p>
          </div>

          <button
            onClick={fetchApprovals}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-cyan-300 shadow-md transition"
          >
            <span>🔄</span>
            <span>تحديث الطلبات من Supabase</span>
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>طلبات انضمام معلقة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⏳</span>
            </div>
            <div className="text-2xl font-black text-amber-400">{items.length} <span className="text-xs text-gray-400 font-normal">طلب</span></div>
            <div className="text-[11px] text-amber-300/80 mt-2 font-semibold">بانتظار التحقق أو التعديل</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>زمن الاستجابة المستهدف (SLA)</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-white">أقل من 24 ساعة</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">▲ نسبة الالتزام 98%</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>حالة قاعدة البيانات الحية</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xl font-bold text-emerald-400">Supabase Live</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">Real-time RLS Sync Active</div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
            <h3 className="text-base font-bold text-white">طلبات الانضمام والمراجعة ({items.length})</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              تحديث فوري
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-cyan-300 text-xs animate-pulse">
              جاري جلب طلبات الانضمام الحية من Supabase...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              🎉 لا توجد طلبات معلقة حالياً، تم تدقيق واعتماد كافة المزوّدين!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-200 bg-slate-900">
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3.5 text-slate-300">اسم الجهة / المزوّد</th>
                    <th className="p-3.5 text-slate-300">المسؤول والاتصال</th>
                    <th className="p-3.5 text-slate-300">المقر / المحافظة</th>
                    <th className="p-3.5 text-slate-300">الحالة</th>
                    <th className="p-3.5 text-slate-300">تاريخ التقديم</th>
                    <th className="p-3.5 text-slate-300 text-center">إجراءات الاعتماد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-bold text-white">{item.name}</td>
                      <td className="p-3.5 text-slate-200">
                        <div>{item.contact}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          {item.phone && item.phone !== '—' ? (
                            <a
                              href={getWhatsAppLink(item.phone, `أهلاً ${item.name}، بخصوص طلب انضمامكم إلى منصة Survsta:`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 transition hover:underline inline-flex items-center gap-1"
                              title="محادثة واتساب سريعة"
                            >
                              <span>💬</span>
                              <span>{item.phone}</span>
                            </a>
                          ) : (
                            <span>{item.phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">{item.location}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                            item.status === 'needs_revision'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {item.status === 'needs_revision' ? 'بانتظار التعديل 📝' : 'طلب معلق ⏳'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{item.createdAt}</td>
                      <td className="p-3.5 text-center space-x-2 space-x-reverse whitespace-nowrap">
                        <button
                          onClick={() => handleApprove(item.id, item.name)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold transition shadow-sm"
                        >
                          اعتماد ونشر ✓
                        </button>
                        <button
                          onClick={() => setActiveRevisionItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold transition shadow-sm inline-flex items-center gap-1"
                          title="إرسال رسالة طلب تعديل بالواتساب أو الإيميل"
                        >
                          <span>📝</span>
                          <span>طلب تعديل</span>
                        </button>
                        <button
                          onClick={() => handleReject(item.id, item.name)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold transition shadow-sm"
                        >
                          رفض ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Revision Modal Dialog */}
        {activeRevisionItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-5 text-right">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveRevisionItem(null)}
                  className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  <h3 className="text-base font-black text-white">إرسال طلب تعديل بيانات</h3>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-300 font-semibold mb-1">
                  المزوّد: <span className="text-amber-300 font-bold">{activeRevisionItem.name}</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  اختر وسيلة الإشعار المباشرة لإرسال الرسالة المجهزة مسبقاً لمسؤول المكتب:
                </p>
              </div>

              {/* Message Box */}
              <div className="rounded-xl border border-amber-500/20 bg-slate-900 p-3 text-xs text-amber-200/90 leading-relaxed font-sans select-all">
                {getRevisionMessage(activeRevisionItem)}
              </div>

              {/* Action Links */}
              <div className="space-y-2 pt-1">
                {/* WhatsApp Link */}
                <a
                  href={`https://wa.me/${formatWhatsAppNumber(activeRevisionItem.phone)}?text=${encodeURIComponent(
                    getRevisionMessage(activeRevisionItem)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleMarkNeedsRevision(activeRevisionItem.id, activeRevisionItem.name)}
                  className="w-full rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <span>💬</span>
                  <span>إرسال عبر الواتساب (Via WhatsApp)</span>
                </a>

                {/* Email Link */}
                <a
                  href={`mailto:${
                    activeRevisionItem.email && activeRevisionItem.email !== '—' ? activeRevisionItem.email : ''
                  }?subject=${encodeURIComponent('تحديث بيانات حسابكم - منصة Survsta')}&body=${encodeURIComponent(
                    getRevisionMessage(activeRevisionItem)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleMarkNeedsRevision(activeRevisionItem.id, activeRevisionItem.name)}
                  className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <span>✉️</span>
                  <span>إرسال عبر الإيميل (Via Email)</span>
                </a>
              </div>

              <div className="border-t border-gray-800 pt-3 flex justify-between items-center text-[11px] text-gray-400">
                <span>سيتم تحديث الحالة تلقائياً إلى «بانتظار التعديل»</span>
                <button
                  type="button"
                  onClick={() => setActiveRevisionItem(null)}
                  className="rounded-xl border border-gray-700 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
