'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/utils/supabaseClient';
import { PaymentMethodsConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/payment/paymentConfig';

interface WelcomeEmailTemplate {
  subject: string;
  badge_text: string;
  badge_bg: string;
  title: string;
  main_message: string;
  cta_text: string;
  cta_url: string;
  secondary_cta_text: string;
  secondary_cta_url: string;
}

const DEFAULT_WELCOME_TEMPLATE: WelcomeEmailTemplate = {
  subject: '🌟 أهلاً بك في منصة Survsta | بوابتك الرقمية المتكاملة لقطاع المساحة والجيوماتكس',
  badge_text: 'شريك معتمد جديد',
  badge_bg: '#0284c7',
  title: 'أهلاً ومرحباً بك معنا، {recipient_name} 👋',
  main_message: `يسعدنا ويشرفنا انضمامك إلى منصة Survsta — المنظومة الرقمية الأولى والأشمل في مصر المتخصصة في خدمات وأجهزة المساحة والجيوماتكس.\n\nابدأ الآن بعرض معداتك وأجهزتك المساحية لتصل إلى آلاف المهندسين وشركات المقاولات الباحثة عن أجهزة للإيجار يومياً.`,
  cta_text: '➕ أضف معداتك وأجهزتك المساحية الآن',
  cta_url: 'https://survsta.com/provider/dashboard#equipment',
  secondary_cta_text: 'الدخول إلى لوحة التحكم',
  secondary_cta_url: 'https://survsta.com/provider/dashboard',
};

export default function AdminSettingsPage() {
  const [showEarlyAccessCTA, setShowEarlyAccessCTA] = useState<boolean>(true);
  const [autoApproveProviders, setAutoApproveProviders] = useState<boolean>(false);
  const [isLoadingSetting, setIsLoadingSetting] = useState<boolean>(true);
  const [isSavingToggle, setIsSavingToggle] = useState<boolean>(false);
  const [isSavingAutoApprove, setIsSavingAutoApprove] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Payment Gateways State
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodsConfig>(DEFAULT_PAYMENT_CONFIG);
  const [isSavingPayments, setIsSavingPayments] = useState<boolean>(false);

  // Email Template State
  const [emailTemplate, setEmailTemplate] = useState<WelcomeEmailTemplate>(DEFAULT_WELCOME_TEMPLATE);
  const [templateTab, setTemplateTab] = useState<'edit' | 'preview'>('edit');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadSettings() {
      setIsLoadingSetting(true);
      try {
        // 1. Load Early Access CTA setting
        const { data: eaData } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'show_provider_early_access_cta')
          .maybeSingle();

        if (eaData && eaData.setting_value !== undefined && eaData.setting_value !== null) {
          setShowEarlyAccessCTA(eaData.setting_value === true || eaData.setting_value === 'true');
        }

        // 2. Load Auto-Approve Providers setting
        const { data: autoData } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'auto_approve_providers')
          .maybeSingle();

        if (autoData && autoData.setting_value !== undefined && autoData.setting_value !== null) {
          setAutoApproveProviders(autoData.setting_value === true || autoData.setting_value === 'true');
        }

        // 3. Load Dynamic Welcome Email Template
        const { data: tplData } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'template_welcome_email')
          .maybeSingle();

        if (tplData?.setting_value) {
          const parsed = typeof tplData.setting_value === 'string'
            ? JSON.parse(tplData.setting_value)
            : tplData.setting_value;
          setEmailTemplate({
            ...DEFAULT_WELCOME_TEMPLATE,
            ...parsed,
          });
        }

        // 4. Load Dynamic Payment Gateways Configuration
        const { data: payData } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'payment_methods_config')
          .maybeSingle();

        if (payData?.setting_value) {
          const parsed = typeof payData.setting_value === 'string'
            ? JSON.parse(payData.setting_value)
            : payData.setting_value;
          setPaymentConfig({
            wallets: {
              ...DEFAULT_PAYMENT_CONFIG.wallets,
              ...(parsed.wallets || {}),
            },
            instapay: {
              ...DEFAULT_PAYMENT_CONFIG.instapay,
              ...(parsed.instapay || {}),
            },
          });
        }
      } catch (err) {
        console.warn('Could not load settings from Supabase:', err);
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
      console.error('Failed to update early access platform setting:', err);
      setShowEarlyAccessCTA(!nextValue);
      showToast('❌ حدث خطأ أثناء حفظ الإعداد، يرجى المحاولة لاحقاً');
    } finally {
      setIsSavingToggle(false);
    }
  };

  const handleToggleAutoApprove = async (nextValue: boolean) => {
    setIsSavingAutoApprove(true);
    setAutoApproveProviders(nextValue);

    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          {
            setting_key: 'auto_approve_providers',
            setting_value: nextValue,
            description: 'Toggle automatic approval of newly registered providers',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (error) {
        const { error: updateErr } = await supabase
          .from('platform_settings')
          .update({
            setting_value: nextValue,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'auto_approve_providers');

        if (updateErr) throw updateErr;
      }

      showToast(
        nextValue
          ? '⚡ تم تفعيل الاعتماد التلقائي للمزوّدين (الموافقة الفورية عند التسجيل)'
          : '🛡️ تم تفعيل المراجعة اليدوية (يتطلب موافقة الإدارة من طابور الاعتمادات)'
      );
    } catch (err) {
      console.error('Failed to update auto approve setting:', err);
      setAutoApproveProviders(!nextValue);
      showToast('❌ حدث خطأ أثناء حفظ إعداد الاعتماد التلقائي');
    } finally {
      setIsSavingAutoApprove(false);
    }
  };

  const handleSaveEmailTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          {
            setting_key: 'template_welcome_email',
            setting_value: emailTemplate,
            description: 'Dynamic welcome email template for newly registered providers',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (error) {
        const { error: updateErr } = await supabase
          .from('platform_settings')
          .update({
            setting_value: emailTemplate,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'template_welcome_email');

        if (updateErr) throw updateErr;
      }

      showToast('✅ تم حفظ قالب إيميل الترحيب وتحديث نصوص الـ CTA بنجاح');
    } catch (err) {
      console.error('Failed to save email template:', err);
      showToast('❌ حدث خطأ أثناء حفظ قالب الإيميل');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetTemplate = () => {
    setEmailTemplate(DEFAULT_WELCOME_TEMPLATE);
    showToast('🔄 تمت استعادة القالب الافتراضي (اضغط حفظ لتأكيد التغيير)');
  };

  const handleSavePaymentConfig = async (overrideConfig?: PaymentMethodsConfig) => {
    setIsSavingPayments(true);
    const configToSave = overrideConfig || paymentConfig;
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          {
            setting_key: 'payment_methods_config',
            setting_value: configToSave,
            description: 'Dynamic configuration for manual payment methods (E-Wallets and InstaPay)',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'setting_key' }
        );

      if (error) {
        const { error: updateErr } = await supabase
          .from('platform_settings')
          .update({
            setting_value: configToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'payment_methods_config');

        if (updateErr) throw updateErr;
      }

      showToast('✅ تم حفظ إعدادات بوابات الدفع اليدوية بنجاح');
    } catch (err) {
      console.error('Failed to save payment methods config:', err);
      showToast('❌ حدث خطأ أثناء حفظ إعدادات بوابات الدفع');
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleToggleWallet = (isActive: boolean) => {
    const updated: PaymentMethodsConfig = {
      ...paymentConfig,
      wallets: {
        ...paymentConfig.wallets,
        isActive,
      },
    };
    setPaymentConfig(updated);
    handleSavePaymentConfig(updated);
  };

  const handleToggleInstapay = (isActive: boolean) => {
    const updated: PaymentMethodsConfig = {
      ...paymentConfig,
      instapay: {
        ...paymentConfig.instapay,
        isActive,
      },
    };
    setPaymentConfig(updated);
    handleSavePaymentConfig(updated);
  };

  const handleResetPayments = () => {
    setPaymentConfig(DEFAULT_PAYMENT_CONFIG);
    handleSavePaymentConfig(DEFAULT_PAYMENT_CONFIG);
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
            <h1 className="text-2xl sm:text-3xl font-black text-white">إعدادات النظام والاعتمادات</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              تهيئة سياسات المنصة، تفعيل الاعتماد التلقائي للمزوّدين، وتخصيص قوالب الإشعارات الرسمية.
            </p>
          </div>
        </div>

        {/* Dynamic Feature Toggles Section */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚀</span>
              <span>التحكم في سياسات التسجيل والظهور (Platform Feature Toggles)</span>
            </h3>
            <span className="text-[11px] text-cyan-400 font-medium">
              تحديث فوري دون الحاجة لإعادة نشر الكود
            </span>
          </div>

          <div className="space-y-4">
            {/* Auto-Approval Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    ⚡ الاعتماد التلقائي الفوري للمزوّدين (Auto-Approve Providers)
                  </span>
                  {autoApproveProviders ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      مفعل (اعتماد فوري)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      مراجعة يدوية (طابور الاعتمادات)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  عند التفعيل، يتم اعتماد حساب أي مزوّد جديد فور تسجيله بنجاح وتفعيل كتالوجه وإرسال إيميل الترحيب الرسمي فوراً بدون انتظار موافقة الإدارة اليدوية.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {isSavingAutoApprove && (
                  <span className="text-xs text-cyan-400 animate-pulse">جاري الحفظ...</span>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveProviders}
                    disabled={isLoadingSetting || isSavingAutoApprove}
                    onChange={(e) => handleToggleAutoApprove(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

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

        {/* Manual Payment Gateways Configuration Section */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-1.5">
                <span>💳 البوابات اليدوية والمعاملات المالية</span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>إعدادات بوابات الدفع اليدوية (Manual Payment Gateways)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                إدارة أرقام وعناوين التحويل المباشر المعروضة للمزوّدين لشحن المحفظة (فودافون كاش، محافظ المحمول، وإنستاباي).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetPayments}
                disabled={isSavingPayments}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                استعادة الافتراضي
              </button>
              <button
                type="button"
                onClick={() => handleSavePaymentConfig()}
                disabled={isSavingPayments}
                className="px-5 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingPayments ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>حفظ إعدادات بوابات الدفع</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* E-Wallets Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-4 hover:border-slate-700 transition">
              {/* Card Header & Master Toggle */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span className="font-bold text-sm text-white">المحافظ الإلكترونية (E-Wallets)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">فودافون كاش، أورنج كاش، اتصالات كاش، وي باي</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    paymentConfig.wallets.isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {paymentConfig.wallets.isActive ? 'مفعّلة' : 'معطّلة'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.wallets.isActive}
                      disabled={isSavingPayments}
                      onChange={(e) => handleToggleWallet(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Supported Network Badges */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                  Vodafone Cash
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Etisalat Cash
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 border border-orange-500/30 text-orange-400">
                  Orange Money
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  WE Pay
                </span>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رقم محفظة التحويل (Wallet Number)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={paymentConfig.wallets.number}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        wallets: { ...paymentConfig.wallets, number: e.target.value.trim() },
                      })
                    }
                    placeholder="01147554019"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400 text-left"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">الرقم الذي سيقوم المزود بتحويل مبلغ الشحن إليه عبر أي محفظة إلكترونية.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الشبكات المدعومة / ملاحظة التوجيه
                  </label>
                  <input
                    type="text"
                    value={paymentConfig.wallets.networks}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        wallets: { ...paymentConfig.wallets, networks: e.target.value },
                      })
                    }
                    placeholder="Vodafone, Etisalat, Orange, WE"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* InstaPay Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-4 hover:border-slate-700 transition">
              {/* Card Header & Master Toggle */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-purple-400">⚡</span>
                    <span className="font-bold text-sm text-white">إنستاباي (InstaPay IPN)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">التحويل اللحظي المباشر عبر البنك المركزي المصري</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    paymentConfig.instapay.isActive
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {paymentConfig.instapay.isActive ? 'مفعّل' : 'معطّل'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.instapay.isActive}
                      disabled={isSavingPayments}
                      onChange={(e) => handleToggleInstapay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* InstaPay Branding Pill */}
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300">
                  Instant Payment Network (IPN)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                  يدعم التحويل من كافة البنوك المصرية
                </span>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    عنوان الدفع اللحظي (InstaPay Handle / Address)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={paymentConfig.instapay.handle}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        instapay: { ...paymentConfig.instapay, handle: e.target.value.trim() },
                      })
                    }
                    placeholder="ahmed.elsayed.74@instapay"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-400 text-left"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">المعرف الرسمي الذي يُدخل في خانة التحويل بتطبيق إنستاباي.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      رابط الدفع المباشر (InstaPay Direct Deep Link)
                    </label>
                    {paymentConfig.instapay.link && (
                      <a
                        href={paymentConfig.instapay.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                      >
                        اختبار الرابط ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    dir="ltr"
                    value={paymentConfig.instapay.link}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        instapay: { ...paymentConfig.instapay, link: e.target.value.trim() },
                      })
                    }
                    placeholder="https://ipn.eg/S/..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400 text-left"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">رابط مباشر يفتح تطبيق إنستاباي على هاتف المستخدم أو يولد QR للمسح من الديسكتوب.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Welcome Email Template Editor */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✉️</span>
                <span>محرر رسالة الترحيب (Welcome Email Editor)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                تخصيص رسالة الترحيب الرسمية التي تصل للمزوّد تلقائياً فور اعتماده، وضبط أزرار الإجراء (CTA) لإضافة الأجهزة والمعدات المساحية.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTemplateTab('edit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  templateTab === 'edit'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                ✏️ تحرير القالب
              </button>
              <button
                type="button"
                onClick={() => setTemplateTab('preview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  templateTab === 'preview'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                👁️ معاينة مباشرة
              </button>
            </div>
          </div>

          {templateTab === 'edit' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">موضوع الرسالة (Subject)</label>
                  <input
                    type="text"
                    value={emailTemplate.subject}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">شارة الترحيب (Badge Text)</label>
                  <input
                    type="text"
                    value={emailTemplate.badge_text}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, badge_text: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  العنوان الرئيسي (Title)
                  <span className="text-[11px] text-cyan-400 font-normal mr-2">
                    (يمكنك استخدام المتغير: {'{recipient_name}'})
                  </span>
                </label>
                <input
                  type="text"
                  value={emailTemplate.title}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">نص الترحيب (Main Message)</label>
                <textarea
                  rows={4}
                  value={emailTemplate.main_message}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, main_message: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* CTAs Section */}
              <div className="p-4 rounded-xl border border-cyan-500/20 bg-slate-950/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-300">🎯 أزرار الإجراء السريع (Call To Action - CTA)</h4>
                  <span className="text-[10px] text-gray-400">يوجه المزود مباشرة لإضافة معداته</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">نص زر الإجراء (CTA Button Text)</label>
                    <input
                      type="text"
                      value={emailTemplate.cta_text}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, cta_text: e.target.value })}
                      placeholder="➕ أضف معداتك وأجهزتك المساحية الآن"
                      className="w-full rounded-xl border border-cyan-500/40 bg-slate-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">رابط الزر الرئيسي (Target URL)</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={emailTemplate.cta_url}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, cta_url: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-300 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">نص الزر الثانوي (Secondary Link)</label>
                    <input
                      type="text"
                      value={emailTemplate.secondary_cta_text}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, secondary_cta_text: e.target.value })}
                      placeholder="الدخول إلى لوحة التحكم"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">رابط الزر الثانوي</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={emailTemplate.secondary_cta_url}
                      onChange={(e) => setEmailTemplate({ ...emailTemplate, secondary_cta_url: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-gray-400 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-gray-400 hover:text-white hover:bg-slate-800 transition"
                >
                  استعادة القالب الافتراضي
                </button>

                <button
                  type="button"
                  disabled={isSavingTemplate}
                  onClick={handleSaveEmailTemplate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingTemplate ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري حفظ القالب...</span>
                    </>
                  ) : (
                    <span>💾 حفظ وتطبيق قالب الإيميل</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Live Email Preview */
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-6 flex justify-center">
              <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 text-right" style={{ direction: 'rtl' }}>
                <div className="bg-[#081933] p-6 text-center border-b-2 border-cyan-500">
                  <div className="text-xl font-black text-white">
                    Surv<span className="text-cyan-400">sta</span>.com
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div>
                    <span className="inline-block bg-sky-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {emailTemplate.badge_text || 'شريك معتمد جديد'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {(emailTemplate.title || '').replace('{recipient_name}', 'م. أحمد مهدي')}
                  </h3>

                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {(emailTemplate.main_message || '').replace('{recipient_name}', 'م. أحمد مهدي')}
                  </div>

                  <div className="py-6 text-center space-y-2 border-t border-b border-slate-100 my-4">
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm px-7 py-3 rounded-xl shadow-md transition"
                    >
                      {emailTemplate.cta_text || '➕ أضف معداتك وأجهزتك المساحية الآن'} ←
                    </a>
                    {emailTemplate.secondary_cta_url && (
                      <div>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          {emailTemplate.secondary_cta_text || 'الدخول إلى لوحة التحكم'}
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2">
                    هذه الرسالة آلية من إدارة منصة Survsta لشركائها المعتمدين في جمهورية مصر العربية.
                  </p>
                </div>

                <div className="bg-slate-100 p-4 text-center text-[10px] text-slate-500 border-t border-slate-200">
                  جميع الحقوق محفوظة © {new Date().getFullYear()} منصة Survsta
                </div>
              </div>
            </div>
          )}
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

