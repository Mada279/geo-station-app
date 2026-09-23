'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';

export default function AdminSettingsPage() {
  const [showEarlyAccessCTA, setShowEarlyAccessCTA] = useState<boolean>(true);
  const [isLoadingSetting, setIsLoadingSetting] = useState<boolean>(true);
  const [isSavingToggle, setIsSavingToggle] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSetting(true);
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'show_provider_early_access_cta')
          .maybeSingle();

        if (data && data.setting_value !== undefined && data.setting_value !== null) {
          // setting_value could be boolean true/false or string 'true'/'false'
          setShowEarlyAccessCTA(data.setting_value === true || data.setting_value === 'true');
        }
      } catch (err) {
        console.warn('Could not load early access setting, defaulting to true:', err);
      } finally {
        setIsLoadingSetting(false);
      }
    }

    loadSettings();
  }, []);

  const handleToggleEarlyAccess = async (nextValue: boolean) => {
    setIsSavingToggle(true);
    setShowEarlyAccessCTA(nextValue);

    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          {
            setting_key: 'show_provider_early_access_cta',
            setting_value: nextValue,
            description: 'Toggle visibility of the early access banner on the homepage',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (error) {
        // Fallback update if upsert failed due to missing RLS or constraint
        const { error: updateErr } = await supabase
          .from('platform_settings')
          .update({
            setting_value: nextValue,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'show_provider_early_access_cta');

        if (updateErr) throw updateErr;
      }

      showToast(
        nextValue
          ? '✅ تم تفعيل ظهور قسم التسجيل المبكر للمكاتب في الصفحة الرئيسية'
          : '⚠️ تم إخفاء قسم التسجيل المبكر للمكاتب من الصفحة الرئيسية'
      );
    } catch (err) {
      console.error('Failed to update platform setting:', err);
      setShowEarlyAccessCTA(!nextValue); // revert state
      showToast('❌ حدث خطأ أثناء حفظ الإعداد، يرجى المحاولة لاحقاً');
    } finally {
      setIsSavingToggle(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>⚙️ تفضيلات المنصة والربط التقني</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إعدادات النظام</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              تهيئة وتخصيص سياسات المنصة، تفعيل الأقسام الديناميكية، وبوابات الإشعارات.
            </p>
          </div>
        </div>

        {/* Connection & Health Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>قاعدة بيانات Supabase</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xl font-bold text-emerald-400">متصلة (Live)</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">Latency: 38ms</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>بوابة الدفع والفوترة</span>
              <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs">💳</span>
            </div>
            <div className="text-xl font-bold text-white">نشطة</div>
            <div className="text-[11px] text-cyan-300 mt-1">الجنيه المصري (EGP)</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>خدمة الرسائل SMS OTP</span>
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 text-xs">📱</span>
            </div>
            <div className="text-xl font-bold text-white">مفعلة</div>
            <div className="text-[11px] text-purple-300 mt-1">رصيد الرسائل: 8,420</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>النسخ الاحتياطي التلقائي</span>
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs">🛡️</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">يوميًا (Daily)</div>
            <div className="text-[11px] text-gray-400 mt-1">آخر نسخة: اليوم 03:00 ص</div>
          </div>
        </div>

        {/* Dynamic Feature Toggles Section */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚀</span>
              <span>التحكم في أقسام وميزات الصفحة الرئيسية (Homepage Feature Toggles)</span>
            </h3>
            <span className="text-[11px] text-cyan-400 font-medium">
              تحديث فوري دون الحاجة لإعادة نشر الكود
            </span>
          </div>

          <div className="space-y-4">
            {/* Early Access CTA Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    إظهار قسم التسجيل المبكر للمكاتب في الصفحة الرئيسية
                  </span>
                  {showEarlyAccessCTA ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      معروض حالياً
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
                      مخفي
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  يتحكم في إظهار أو إخفاء قسم الدعوة الحصرية لمكاتب وشركات المساحة وموردي الأجهزة (Early Access CTA) مباشرة أسفل قسم الهيرو في الصفحة الرئيسية.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {isSavingToggle && (
                  <span className="text-xs text-cyan-400 animate-pulse">جاري الحفظ...</span>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEarlyAccessCTA}
                    disabled={isLoadingSetting || isSavingToggle}
                    onChange={(e) => handleToggleEarlyAccess(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Platform Settings */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800/50 pb-3 flex items-center gap-2">
              <span>🌐</span>
              <span>الإعدادات العامة وسياسات التأجير</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">اسم المنصة الرسمي</label>
                <input
                  type="text"
                  defaultValue="Survsta — منصة الأجهزة والخدمات المساحية"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">الحد الأدنى لمدة حجز الأجهزة</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none">
                  <option>يوم واحد (24 ساعة)</option>
                  <option>3 أيام</option>
                  <option>أسبوع كامل</option>
                </select>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/50">
                <div>
                  <div className="font-bold text-white">إلزامية شهادة المعايرة السنوية</div>
                  <div className="text-gray-400 text-[11px]">منع إدراج أي جهاز لا يحمل شهادة معايرة سارية</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-cyan-500 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Security & Sessions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800/50 pb-3 flex items-center gap-2">
              <span>🔒</span>
              <span>أمان المشرفين وإدارة الجلسات</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">مهلة انتهاء الجلسة عند عدم النشاط</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none">
                  <option>ساعتان (موصى به)</option>
                  <option>4 ساعات</option>
                  <option>8 ساعات</option>
                  <option>24 ساعة</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">البريد الإلكتروني للإشعارات العاجلة</label>
                <input
                  type="email"
                  defaultValue="ahmed@survsta.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/50">
                <div>
                  <div className="font-bold text-white">تسجيل التدقيق الصارم (Strict Audit)</div>
                  <div className="text-gray-400 text-[11px]">حفظ كافة استعلامات القراءة والكتابة وعناوين IP</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-cyan-500 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition">
            حفظ إعدادات النظام
          </button>
        </div>

        {/* Feedback Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-cyan-500/30 bg-gray-900/95 px-5 py-3 text-sm text-cyan-300 shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
}
