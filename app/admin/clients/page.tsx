'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';
import { formatWhatsAppNumber, getWhatsAppLink } from '@/utils/phoneUtils';

export interface ClientItem {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  category?: string;
  status?: string;
  active_modules?: string[];
  preferences?: Record<string, any>;
  created_at?: string;
  orders_count?: number;
}

export interface ClientOrderItem {
  id: string;
  order_number: string;
  client_id?: string;
  equipment_name?: string;
  category?: string;
  duration?: string;
  total_price?: number;
  status?: string;
  created_at?: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedClientForOrders, setSelectedClientForOrders] = useState<ClientItem | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState<boolean>(false);

  // New Client Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newCategory, setNewCategory] = useState('شركات مقاولات');
  const [isSubmittingNewClient, setIsSubmittingNewClient] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live clients from Supabase
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet in Supabase schema cache
        console.warn('[AdminClientsPage] Supabase error:', error.message);
        setClients([]);
      } else if (data) {
        setClients(data);
      }
    } catch (err: any) {
      console.error('[AdminClientsPage Exception]:', err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Quick Seed Sample Clients (for demo / initial database initialization)
  const handleSeedSampleClients = async () => {
    const samples = [
      {
        full_name: 'م. مصطفى كمال',
        email: 'mostafa.kamal@arabcont.com',
        phone_number: '01019283746',
        company_name: 'شركة المقاولون العرب (فرع المعادي)',
        category: 'شركات مقاولات',
        status: 'active',
        preferences: { notifications: true, preferred_categories: ['محطات رصد', 'GNSS'] },
      },
      {
        full_name: 'م. سارة محمود',
        email: 'sara.m@dargroup.com',
        phone_number: '01293847561',
        company_name: 'دار الهندسة للاستشارات',
        category: 'مكاتب استشارية',
        status: 'active',
        preferences: { notifications: true, preferred_categories: ['مسح ليزري', 'BIM'] },
      },
      {
        full_name: 'م. تامر جلال',
        email: 'tamer.g@rme.com.eg',
        phone_number: '01128475938',
        company_name: 'رواد الهندسة الحديثة RME',
        category: 'شركات مقاولات',
        status: 'active',
        preferences: { notifications: true, preferred_categories: ['محطات توتال ستيشن'] },
      },
      {
        full_name: 'م. يوسف فتحي',
        email: 'youssef.survey@gmail.com',
        phone_number: '01594837261',
        company_name: 'مكتب مصر للمساحة والخرائط',
        category: 'مهندسون أفراد',
        status: 'active',
        preferences: { notifications: false, preferred_categories: ['موازين قامة'] },
      },
    ];

    try {
      const { data, error } = await supabase.from('clients').insert(samples).select();
      if (error) {
        throw error;
      }
      showToast('✅ تم إضافة بيانات العملاء النموذجية إلى قاعدة البيانات بنجاح!');
      fetchClients();
    } catch (err: any) {
      showToast('⚠️ تعذر الحفظ المباشر: تأكد من تشغيل كود SQL لإنشاء جدول clients أولاً.');
      console.warn('[Seed Clients error]:', err);
    }
  };

  // Add Client Submission
  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      setFormError('يرجى ملء الاسم والبريد الإلكتروني.');
      return;
    }

    const cleanPhone = newPhone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 8) {
      setFormError('رقم الهاتف والواتساب إلزامي (8 أرقام على الأقل) للتواصل وحجز الأجهزة.');
      return;
    }

    setIsSubmittingNewClient(true);
    setFormError(null);

    try {
      const newClientPayload = {
        full_name: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone_number: cleanPhone,
        company_name: newCompany.trim() || newFullName.trim(),
        category: newCategory,
        status: 'active',
        preferences: { notifications: true },
        active_modules: ['client'],
      };

      const { data, error } = await supabase.from('clients').insert([newClientPayload]).select();

      if (error) throw error;

      showToast(`✅ تم تسجيل العميل "${newFullName}" بنجاح!`);
      setIsAddClientModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewCompany('');
      fetchClients();
    } catch (err: any) {
      console.error('[Add Client Error]:', err);
      setFormError(err.message || 'حدث خطأ أثناء حفظ بيانات العميل في Supabase.');
    } finally {
      setIsSubmittingNewClient(false);
    }
  };

  // Filtered clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !searchTerm.trim() ||
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone_number?.includes(searchTerm);

    const matchesCategory =
      categoryFilter === 'all' ||
      c.category === categoryFilter ||
      (categoryFilter === 'شركات مقاولات' && c.category?.includes('مقاولات')) ||
      (categoryFilter === 'مكاتب استشارية' && c.category?.includes('استشار')) ||
      (categoryFilter === 'مهندسون أفراد' && (c.category?.includes('أفراد') || c.category?.includes('مهندس')));

    return matchesSearch && matchesCategory;
  });

  // KPI Calculations
  const totalCount = clients.length;
  const contractorsCount = clients.filter((c) => c.category?.includes('مقاولات')).length;
  const consultantsCount = clients.filter((c) => c.category?.includes('استشار')).length;
  const activeCount = clients.filter((c) => c.status === 'active' || c.status === 'نشط' || !c.status).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>👥 إدارة المستفيدين وحسابات العملاء</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">العملاء</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              إدارة حسابات شركات المقاولات، المكاتب الاستشارية، والمهندسين المسجلين ومتابعة عقودهم.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddClientModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <span>+</span>
              <span>إضافة عميل جديد</span>
            </button>

            <button
              onClick={fetchClients}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs"
              title="تحديث البيانات"
            >
              🔄
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي حسابات العملاء</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">👥</span>
            </div>
            <div className="text-2xl font-black text-white">
              {isLoading ? '...' : totalCount} <span className="text-xs text-cyan-300 font-normal">جهة مسجلة</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">قاعدة بيانات سحابية متزامنة</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>شركات مقاولات</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">🏗️</span>
            </div>
            <div className="text-2xl font-black text-white">
              {isLoading ? '...' : contractorsCount} <span className="text-xs text-gray-400 font-normal">شركة</span>
            </div>
            <div className="text-[11px] text-purple-300 mt-2 font-semibold">مشاريع بنية تحتية ومقاولات</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>مكاتب استشارية</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">🏢</span>
            </div>
            <div className="text-2xl font-black text-white">
              {isLoading ? '...' : consultantsCount} <span className="text-xs text-gray-400 font-normal">مكتب</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">إشراف هندسي ومساحي</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>حسابات نشطة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">⚡</span>
            </div>
            <div className="text-2xl font-black text-white">
              {isLoading ? '...' : activeCount}
            </div>
            <div className="text-[11px] text-cyan-300 mt-2 font-semibold">حسابات مفعلة بالمنصة</div>
          </div>
        </div>

        {/* Clients Table Container */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/50 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">سجل حسابات العملاء الحية</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                مربوط مباشرة بجدول `clients` في Supabase مع إمكانية المراسلة الفورية عبر واتساب
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم العميل، الشركة، أو الهاتف..."
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 min-w-[220px]"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="all">كافة التصنيفات</option>
                <option value="شركات مقاولات">شركات مقاولات</option>
                <option value="مكاتب استشارية">مكاتب استشارية</option>
                <option value="مهندسون أفراد">مهندسون أفراد</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-200 bg-slate-900">
              <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 text-slate-300">اسم الجهة / الشركة</th>
                  <th className="p-3.5 text-slate-300">التصنيف</th>
                  <th className="p-3.5 text-slate-300">مسؤول الاتصال</th>
                  <th className="p-3.5 text-slate-300">البريد الإلكتروني</th>
                  <th className="p-3.5 text-slate-300">الهاتف والواتساب</th>
                  <th className="p-3.5 text-slate-300">الحالة</th>
                  <th className="p-3.5 text-slate-300 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      <span className="inline-block animate-spin text-xl ml-2">⏳</span>
                      جارٍ جلب بيانات العملاء من السحابة...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <div className="space-y-3 max-w-md mx-auto">
                        <span className="text-3xl block">👥</span>
                        <div className="text-white font-bold text-sm">لا توجد سجلات عملاء مطابقة حالياً</div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          جدول العملاء (`clients`) متصل حالياً مع Supabase. يمكنك إضافة عميل جديد مباشرة أو استيراد بيانات نموذجية للتجربة.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setIsAddClientModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition"
                          >
                            + إضافة أول عميل
                          </button>
                          <button
                            onClick={handleSeedSampleClients}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-gray-300 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition"
                          >
                            + استيراد عينات نموذجية
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const waLink = client.phone_number
                      ? `https://wa.me/${formatWhatsAppNumber(client.phone_number)}?text=${encodeURIComponent(
                          `مرحباً ${client.full_name}، نتواصل معك من إدارة منصة Survsta بخصوص حسابكم وطلباتكم.`
                        )}`
                      : null;

                    return (
                      <tr key={client.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-bold text-white">
                          <div>
                            <span>{client.company_name || client.full_name}</span>
                            {client.company_name && client.company_name !== client.full_name && (
                              <span className="block text-[11px] text-gray-400 font-normal">
                                {client.full_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {client.category || 'مكتب استشاري'}
                            </span>
                            {Array.isArray(client.active_modules) && client.active_modules.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {client.active_modules.map((mod) => (
                                  <span
                                    key={mod}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                      mod === 'client'
                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                        : mod === 'freelancer'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}
                                  >
                                    {mod === 'client' ? 'عميل' : mod === 'freelancer' ? 'مستقل' : 'مزود'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-200 font-medium">{client.full_name}</td>

                        <td className="p-3.5 font-mono text-slate-300 text-[11px]" dir="ltr">
                          {client.email ? (
                            <a href={`mailto:${client.email}`} className="hover:text-cyan-300 hover:underline">
                              {client.email}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="p-3.5">
                          {client.phone_number ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-300" dir="ltr">
                                {client.phone_number}
                              </span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-[11px] font-bold transition"
                                  title="تواصل فوري عبر واتساب"
                                >
                                  <span>واتساب</span>
                                  <span className="text-xs">💬</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 font-mono text-xs">غير مسجل</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                            client.status === 'blocked'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {client.status === 'blocked' ? 'محظور' : 'نشط'}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedClientForOrders(client)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition inline-flex items-center gap-1"
                          >
                            <span>📋</span>
                            <span>سجل الطلبات</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal: Client Order History */}
      {selectedClientForOrders && (
        <ClientOrdersModal
          client={selectedClientForOrders}
          isOpen={Boolean(selectedClientForOrders)}
          onClose={() => setSelectedClientForOrders(null)}
        />
      )}

      {/* Modal: Add New Client */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl space-y-5 text-right text-gray-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <h3 className="text-lg font-bold text-white">تسجيل حساب عميل جديد</h3>
              </div>
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddClientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  الاسم بالكامل (مسؤول الاتصال) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="مثال: م. أحمد عبد الرحمن"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  البريد الإلكتروني <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    رقم الهاتف والواتساب
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    التصنيف
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="شركات مقاولات">شركات مقاولات</option>
                    <option value="مكاتب استشارية">مكاتب استشارية</option>
                    <option value="مهندسون أفراد">مهندسون أفراد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  اسم الشركة / المكتب المساحي
                </label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="مثال: شركة النيل للإنشاءات الهندسية"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewClient}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 text-xs font-bold text-slate-950 hover:brightness-110 disabled:opacity-50 transition"
                >
                  {isSubmittingNewClient ? 'جارٍ الحفظ...' : 'حفظ وتسجيل العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-cyan-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-cyan-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Client Orders History Modal
 */
function ClientOrdersModal({
  client,
  isOpen,
  onClose,
}: {
  client: ClientItem;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<ClientOrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrderEquip, setNewOrderEquip] = useState('');
  const [newOrderDuration, setNewOrderDuration] = useState('أسبوع واحد');
  const [newOrderPrice, setNewOrderPrice] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch orders for this specific client from Supabase
  const fetchClientOrders = async () => {
    setIsLoadingOrders(true);
    try {
      let query = supabase.from('orders').select('*');
      if (client.id) {
        query = query.or(`client_id.eq.${client.id},client_email.eq.${client.email}`);
      } else if (client.email) {
        query = query.eq('client_email', client.email);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      } else {
        // Fallback demo orders for visualization if table is freshly created
        setOrders([
          {
            id: 'ord-demo-1',
            order_number: `ORD-${client.id.slice(0, 4).toUpperCase()}-01`,
            equipment_name: 'محطة رصد متكاملة Leica TS07 (1 ثانية)',
            category: 'محطات رصد',
            duration: 'شهر واحد',
            total_price: 32000,
            status: 'جاري التنفيذ',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClientOrders();
    }
  }, [isOpen, client]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderEquip.trim()) return;

    setOrderError(null);
    try {
      const orderPayload = {
        order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        client_id: client.id,
        client_email: client.email,
        equipment_name: newOrderEquip.trim(),
        duration: newOrderDuration,
        total_price: newOrderPrice ? parseFloat(newOrderPrice) : 0,
        status: 'جاري التنفيذ',
      };

      const { data, error } = await supabase.from('orders').insert([orderPayload]).select();

      if (error) {
        // If orders table not yet created in Supabase
        setOrders((prev) => [
          {
            id: `ord-${Date.now()}`,
            ...orderPayload,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else if (data) {
        setOrders((prev) => [...data, ...prev]);
      }

      setIsAddingOrder(false);
      setNewOrderEquip('');
      setNewOrderPrice('');
    } catch (err: any) {
      setOrderError(err.message || 'تعذر إضافة الطلب');
    }
  };

  if (!isOpen) return null;

  const waLink = client.phone_number
    ? `https://wa.me/${formatWhatsAppNumber(client.phone_number)}?text=${encodeURIComponent(
        `مرحباً ${client.full_name}، نتواصل معك بخصوص سجل طلباتكم على منصة Survsta.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ direction: 'rtl' }}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl space-y-5 text-gray-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1.5">
              <span>📋 سجل العقود والطلبات المساحية</span>
            </div>
            <h2 className="text-xl font-black text-white">{client.company_name || client.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
              <span>مسؤول الاتصال: <strong className="text-white">{client.full_name}</strong></span>
              <span>•</span>
              <span className="font-mono text-cyan-300" dir="ltr">{client.email}</span>
              {client.phone_number && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-300" dir="ltr">{client.phone_number}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>واتساب</span>
                <span>💬</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            إجمالي الطلبات المسجلة: <span className="font-bold text-cyan-300">{orders.length} طلب</span>
          </div>
          <button
            onClick={() => setIsAddingOrder(!isAddingOrder)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
          >
            {isAddingOrder ? 'إغلاق النموذج' : '+ تسجيل طلب جديد لهذا العميل'}
          </button>
        </div>

        {/* Inline Create Order Form */}
        {isAddingOrder && (
          <form onSubmit={handleCreateOrder} className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
            <h4 className="text-xs font-bold text-cyan-300">تسجيل طلب / عقد جديد</h4>
            {orderError && <div className="text-xs text-rose-400">{orderError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">المعدة / الخدمة المطلوبة</label>
                <input
                  type="text"
                  required
                  value={newOrderEquip}
                  onChange={(e) => setNewOrderEquip(e.target.value)}
                  placeholder="مثال: جهاز GNSS RTK Trimble"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">المدة التقديرية</label>
                <input
                  type="text"
                  value={newOrderDuration}
                  onChange={(e) => setNewOrderDuration(e.target.value)}
                  placeholder="مثال: شهرين"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">القيمة الإجمالية (ج.م)</label>
                <input
                  type="number"
                  value={newOrderPrice}
                  onChange={(e) => setNewOrderPrice(e.target.value)}
                  placeholder="مثال: 25000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110"
              >
                حفظ الطلب
              </button>
            </div>
          </form>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs text-slate-200 bg-slate-950/40">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">المعدة / الخدمة</th>
                <th className="p-3">المدة</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isLoadingOrders ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    جارٍ استرجاع الطلبات...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    لا توجد طلبات أو عقود سابقة مسجلة لهذا العميل.
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-cyan-300">{order.order_number}</td>
                    <td className="p-3 font-semibold text-white">{order.equipment_name}</td>
                    <td className="p-3 text-slate-300">{order.duration || 'غير محدد'}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">
                      {order.total_price ? `${Number(order.total_price).toLocaleString('en-US')} ج.م` : 'حسب الاتفاق'}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {order.status || 'جاري التنفيذ'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px] font-mono">
                      {order.created_at ? order.created_at.slice(0, 10) : 'اليوم'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-gray-300 hover:bg-slate-700 transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}

