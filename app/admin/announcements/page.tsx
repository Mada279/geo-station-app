'use client';

import React, { useState, useEffect } from 'react';
import {
  GlobalAnnouncement,
  getAllAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
} from '@/services/announcementService';

const THEME_OPTIONS: Array<{
  value: GlobalAnnouncement['theme_type'];
  label: string;
  badge: string;
  desc: string;
}> = [
  {
    value: 'info',
    label: 'معلومة عامة (Info)',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    desc: 'رسائل الخدمة، مناطق التغطية، والتحديثات العادية',
  },
  {
    value: 'promo',
    label: 'عرض ترويجي (Promo)',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    desc: 'الخصومات، العروض الحصرية، والحملات التسويقية',
  },
  {
    value: 'alert',
    label: 'تنبيه عاجل (Alert)',
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    desc: 'تنبيهات طارئة، تحذيرات هامة، وتنبيهات أمنية',
  },
  {
    value: 'maintenance',
    label: 'صيانة وتحديث (Maintenance)',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    desc: 'مواعيد صيانة الخوادم وتوقف الخدمات المجدول',
  },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GlobalAnnouncement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    message_ar: string;
    cta_text: string;
    cta_link: string;
    theme_type: GlobalAnnouncement['theme_type'];
    is_active: boolean;
    expires_at: string;
  }>({
    message_ar: '',
    cta_text: '',
    cta_link: '',
    theme_type: 'info',
    is_active: true,
    expires_at: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      showToast('❌ تعذر تحميل قائمة الإعلانات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      message_ar: '',
      cta_text: '',
      cta_link: '',
      theme_type: 'info',
      is_active: true,
      expires_at: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: GlobalAnnouncement) => {
    setEditingItem(item);
    setFormData({
      message_ar: item.message_ar,
      cta_text: item.cta_text || '',
      cta_link: item.cta_link || '',
      theme_type: item.theme_type,
      is_active: item.is_active,
      expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message_ar.trim()) {
      showToast('⚠️ يرجى إدخال نص الإعلان باللغة العربية');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<GlobalAnnouncement> = {
        id: editingItem?.id,
        message_ar: formData.message_ar.trim(),
        cta_text: formData.cta_text.trim() || null,
        cta_link: formData.cta_link.trim() || null,
        theme_type: formData.theme_type,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      const res = await saveAnnouncement(payload);
      if (res.success) {
        showToast(editingItem ? '✅ تم تحديث الإعلان بنجاح' : '✅ تم إنشاء ونشر الإعلان بنجاح');
        setIsModalOpen(false);
        await loadData();
      } else {
        throw res.error;
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('❌ حدث خطأ أثناء حفظ الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: GlobalAnnouncement) => {
    const nextVal = !item.is_active;
    try {
      const res = await toggleAnnouncementActive(item.id, nextVal);
      if (res.success) {
        showToast(nextVal ? '✅ تم تفعيل الإعلان' : '⚠️ تم إيقاف الإعلان');
        await loadData();
      } else {
        throw res.error;
      }
    } catch (err) {
      showToast('❌ تعذر تغيير حالة الإعلان');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteAnnouncement(id);
      if (res.success) {
        showToast('🗑️ تم حذف الإعلان نهائياً');
        setDeletingId(null);
        await loadData();
      } else {
        throw res.error;
      }
    } catch (err) {
      showToast('❌ تعذر حذف الإعلان');
    }
  };

  // Filtered List
  const filteredList = announcements.filter((item) => {
    const matchesSearch =
      item.message_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cta_text && item.cta_text.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTheme = themeFilter === 'all' || item.theme_type === themeFilter;

    let matchesStatus = true;
    const isExpired = item.expires_at ? new Date(item.expires_at) <= new Date() : false;
    if (statusFilter === 'active') matchesStatus = item.is_active && !isExpired;
    else if (statusFilter === 'inactive') matchesStatus = !item.is_active;
    else if (statusFilter === 'expired') matchesStatus = isExpired;

    return matchesSearch && matchesTheme && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📣 إدارة البنرات والإعلانات العلوية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">شريط الإعلانات العام (Global Announcements)</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              التحكم في الشريط العلوي للمنصة، إعلانات التغطية، العروض الترويجية، وتنبيهات الصيانة مع دعم الإخفاء بالكوكيز.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
          >
            <span>+</span>
            <span>إضافة إعلان جديد</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">إجمالي الإعلانات</div>
            <div className="text-2xl font-bold text-white">{announcements.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">الإعلانات النشطة</div>
            <div className="text-2xl font-bold text-emerald-400">
              {announcements.filter((a) => a.is_active && (!a.expires_at || new Date(a.expires_at) > new Date())).length}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">الإعلانات المعطلة</div>
            <div className="text-2xl font-bold text-slate-400">
              {announcements.filter((a) => !a.is_active).length}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="text-xs text-gray-400 mb-1">الإعلانات المنتهية الصلاحية</div>
            <div className="text-2xl font-bold text-rose-400">
              {announcements.filter((a) => a.expires_at && new Date(a.expires_at) <= new Date()).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="بحث في نصوص الإعلانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كل الأنماط (Themes)</option>
              <option value="info">معلومة (Info)</option>
              <option value="promo">عرض ترويجي (Promo)</option>
              <option value="alert">تنبيه عاجل (Alert)</option>
              <option value="maintenance">صيانة (Maintenance)</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط حالياً</option>
              <option value="inactive">معطل</option>
              <option value="expired">منتهي الصلاحية</option>
            </select>
          </div>
        </div>

        {/* Announcements Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">جاري تحميل الإعلانات...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              لا توجد إعلانات مطابقة لخيارات البحث.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-gray-400 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">النمط</th>
                    <th className="px-5 py-3.5">نص الإعلان</th>
                    <th className="px-5 py-3.5">زر التوجيه (CTA)</th>
                    <th className="px-5 py-3.5">الصلاحية</th>
                    <th className="px-5 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredList.map((item) => {
                    const isExpired = item.expires_at ? new Date(item.expires_at) <= new Date() : false;
                    const themeObj = THEME_OPTIONS.find((t) => t.value === item.theme_type);

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              themeObj?.badge || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {themeObj?.label.split(' ')[0] || item.theme_type}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-white max-w-md">
                          <p className="line-clamp-2 leading-relaxed">{item.message_ar}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {item.cta_text && item.cta_link ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-cyan-400">{item.cta_text}</span>
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px] font-mono">
                                {item.cta_link}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-400">
                          {item.expires_at ? (
                            <div className="flex flex-col gap-0.5">
                              <span className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                {new Date(item.expires_at).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isExpired && (
                                <span className="text-[10px] text-rose-400 font-bold">منتهي</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-400 text-[11px]">دائم (بلا انتهاء)</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggle(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                              item.is_active && !isExpired
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active && !isExpired ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            ></span>
                            <span>{item.is_active ? (isExpired ? 'معطل تلقائياً' : 'مفعل') : 'معطل'}</span>
                          </button>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 hover:text-white transition font-medium"
                            >
                              حذف
                            </button>
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

        {/* Modal Create/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-right my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? 'تعديل الإعلان' : 'إنشاء إعلان علوي جديد'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    نمط الإعلان (Theme Type) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme_type: t.value })}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                          formData.theme_type === t.value
                            ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-gray-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">{t.label}</span>
                        <span className="text-[10px] text-gray-500 mt-1">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Text */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    نص الإعلان باللغة العربية *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.message_ar}
                    onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
                    placeholder="مثال: 📍 نخدم حاليًا: الإسكندرية والقاهرة والجيزة — التوسع تباعًا لباقي المحافظات"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* CTA Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      نص زر التوجيه (اختياري)
                    </label>
                    <input
                      type="text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      placeholder="مثال: حمل التطبيق"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      رابط التوجيه (اختياري)
                    </label>
                    <input
                      type="text"
                      value={formData.cta_link}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      placeholder="مثال: /mobile-app أو https://..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Expiration DateTime */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    تاريخ ووقت انتهاء الصلاحية (اتركه فارغاً إذا كان دائماً)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    سيتم إخفاء الإعلان تلقائياً عند حلول هذا التاريخ دون الحاجة لأي تدخل يدوي.
                  </p>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-white cursor-pointer">
                    تفعيل الإعلان فور الحفظ
                  </label>
                </div>

                {/* Live Preview Box */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-gray-400 mb-2 block">معاينة مباشرة:</span>
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      formData.theme_type === 'promo'
                        ? 'bg-gradient-to-r from-amber-950 via-[#1a1306] to-amber-950 text-amber-100 border-amber-500/30'
                        : formData.theme_type === 'alert'
                        ? 'bg-gradient-to-r from-rose-950 via-[#1f0b12] to-rose-950 text-rose-100 border-rose-500/30'
                        : formData.theme_type === 'maintenance'
                        ? 'bg-gradient-to-r from-purple-950 via-[#180a24] to-purple-950 text-purple-100 border-purple-500/30'
                        : 'bg-[#0B1120] text-slate-300 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                        {formData.theme_type}
                      </span>
                      <span className="truncate">{formData.message_ar || 'نص الإعلان سيظهر هنا...'}</span>
                      {formData.cta_text && (
                        <span className="text-cyan-400 font-bold underline shrink-0">
                          {formData.cta_text} ←
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">✕</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-gray-300 hover:text-white transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : editingItem ? 'تحديث الإعلان' : 'نشر الإعلان'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-base font-bold text-white">تأكيد حذف الإعلان</h3>
              <p className="text-xs text-gray-400">
                هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟ لن يمكن استرجاع البيانات بعد الحذف.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-gray-300 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingId)}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/30"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-cyan-500/30 bg-gray-900/95 px-5 py-3 text-sm text-cyan-300 shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}
      </div>
  );
}
