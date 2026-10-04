'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/utils/supabaseClient';
import { PaymentMethodsConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/payment/paymentConfig';

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string | null;
  currentBalance: number;
  onSuccess?: () => void;
}

interface PaymentRequestHistory {
  id: string;
  amount: number;
  payment_method: string;
  transfer_reference: string;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  admin_notes?: string;
  created_at: string;
}

export default function WalletTopUpModal({
  isOpen,
  onClose,
  providerId,
  currentBalance,
  onSuccess,
}: WalletTopUpModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Dynamic Payment Configuration State
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodsConfig>(DEFAULT_PAYMENT_CONFIG);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  // Form State
  const [amount, setAmount] = useState<string>('500');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash');
  const [transferReference, setTransferReference] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDesktopQr, setShowDesktopQr] = useState<boolean>(false);

  // History State
  const [historyItems, setHistoryItems] = useState<PaymentRequestHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    async function loadPaymentConfig() {
      setIsLoadingConfig(true);
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'payment_methods_config')
          .maybeSingle();

        if (data?.setting_value) {
          const parsed =
            typeof data.setting_value === 'string'
              ? JSON.parse(data.setting_value)
              : data.setting_value;

          const merged: PaymentMethodsConfig = {
            wallets: { ...DEFAULT_PAYMENT_CONFIG.wallets, ...(parsed.wallets || {}) },
            instapay: { ...DEFAULT_PAYMENT_CONFIG.instapay, ...(parsed.instapay || {}) },
          };
          setPaymentConfig(merged);

          // Auto-select the available method if one is inactive
          if (!merged.wallets.isActive && merged.instapay.isActive) {
            setPaymentMethod('instapay');
          } else if (!merged.instapay.isActive && merged.wallets.isActive) {
            setPaymentMethod('vodafone_cash');
          }
        }
      } catch (err) {
        console.warn('[WalletTopUpModal] Error loading payment config:', err);
      } finally {
        setIsLoadingConfig(false);
      }
    }

    if (isOpen) {
      setErrorMessage(null);
      setSuccessToast(null);
      loadPaymentConfig();
      if (activeTab === 'history') {
        fetchHistory();
      }
    }
  }, [isOpen, activeTab, providerId]);

  const fetchHistory = async () => {
    if (!providerId) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('manual_payment_requests')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHistoryItems(data);
      }
    } catch (err) {
      console.warn('[WalletTopUpModal] Error loading deposit history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    setErrorMessage(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `receipts/${cleanFileName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      let publicUrl = '';
      if (!uploadErr && uploadData) {
        const { data: pubData } = supabase.storage.from('payment-receipts').getPublicUrl(filePath);
        publicUrl = pubData?.publicUrl || '';
      } else {
        // Fallback to attachments bucket if payment-receipts is not yet created in remote storage
        const { data: fallbackData } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, { upsert: true });

        if (fallbackData) {
          const { data: fbPub } = supabase.storage.from('attachments').getPublicUrl(filePath);
          publicUrl = fbPub?.publicUrl || '';
        }
      }

      if (!publicUrl) {
        throw new Error('تعذر إنشاء رابط الملف. يرجى إعادة المحاولة.');
      }

      setReceiptUrl(publicUrl);
    } catch (err: any) {
      console.error('[Receipt Upload Error]:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء رفع صورة الإيصال.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('يرجى إدخال مبلغ صحيح بالجنيه المصري.');
      return;
    }

    if (!transferReference.trim()) {
      setErrorMessage('يرجى إدخال رقم المحفظة المحول منها أو معرف إنستاباي لسرعة المطابقة.');
      return;
    }

    if (!receiptUrl) {
      setErrorMessage('يرجى إرفاق صورة إيصال التحويل (سكرين شوت العملية).');
      return;
    }

    if (!providerId) {
      setErrorMessage('تعذر تحديد حساب المزود. يرجى إعادة تسجيل الدخول.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        provider_id: providerId,
        amount: numAmount,
        payment_method: paymentMethod,
        transfer_reference: transferReference.trim(),
        receipt_url: receiptUrl,
        status: 'pending',
      };

      const { error: insertErr } = await supabase
        .from('manual_payment_requests')
        .insert([payload]);

      if (insertErr) {
        throw insertErr;
      }

      setSuccessToast('✅ تم إرسال إيصال التحويل بنجاح! جاري مراجعته من قِبل الإدارة وسيتم شحن رصيدك فوراً.');
      setTransferReference('');
      setReceiptUrl('');

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setActiveTab('history');
        fetchHistory();
        setSuccessToast(null);
      }, 1500);
    } catch (err: any) {
      console.error('[Submit Payment Request Error]:', err);
      setErrorMessage(err.message || 'تعذر إرسال طلب الشحن. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyActiveMethod = paymentConfig.wallets.isActive || paymentConfig.instapay.isActive;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      style={{ direction: 'rtl' }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-[#081933] p-6 shadow-2xl text-right space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xl">💳</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">شحن محفظة الحساب (Wallet Top-Up)</h3>
              <p className="text-[11px] text-gray-400">إيداع فوري عبر المحافظ الإلكترونية أو إنستاباي لتفعيل طلبات الإيجار والخدمات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg text-base"
          >
            ✕
          </button>
        </div>

        {/* Current Balance Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-300 font-bold">الرصيد المتاح الحالي:</span>
          </div>
          <div className="text-base font-black text-emerald-400 font-mono">
            {currentBalance.toLocaleString('en-US')} ج.م
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'form'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ➕ طلب شحن جديد
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📜 سجل عمليات الشحن
          </button>
        </div>

        {/* Error / Success Toast */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <span>🎉</span>
            <span>{successToast}</span>
          </div>
        )}

        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Mandatory Instructional Microcopy Alert */}
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 shadow-inner">
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <p className="leading-relaxed font-medium">
                برجاء التأكد من تحويل المبلغ أولاً قبل رفع الإيصال. قم بإدخال الرقم أو المعرف الذي قمت بالتحويل منه لسرعة المطابقة.
              </p>
            </div>

            {!hasAnyActiveMethod ? (
              <div className="text-center py-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <span className="text-3xl">⏳</span>
                <p className="text-sm font-bold text-white">بوابات الدفع اليدوية قيد التحديث مؤقتاً</p>
                <p className="text-xs text-slate-400">يرجى التواصل مع خدمة عملاء المنصة لإتمام عملية الشحن.</p>
              </div>
            ) : (
              <>
                {/* Step 1: Transfer Channels */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-cyan-300">
                    1. اختر وسيلة التحويل وحوّل المبلغ المطلوب:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* E-Wallets Card (Only rendered if isActive is true) */}
                    {paymentConfig.wallets.isActive && (
                      <div
                        onClick={() => setPaymentMethod('vodafone_cash')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                          paymentMethod === 'vodafone_cash'
                            ? 'border-cyan-400 bg-cyan-950/20 shadow-md ring-1 ring-cyan-400/50'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>📱</span>
                              <span>المحافظ الإلكترونية</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                              E-Wallets
                            </span>
                          </div>

                          {/* 4 Network Visual Color Badges */}
                          <div className="flex items-center gap-1 flex-wrap mb-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 border border-red-500/40 text-red-400">
                              فودافون كاش
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                              اتصالات كاش
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/15 border border-orange-500/40 text-orange-400">
                              أورنج كاش
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 border border-purple-500/40 text-purple-400">
                              وي باي
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-400 mb-1.5">رقم محفظة المنصة المعتمدة:</div>
                        </div>

                        <div className="flex items-center justify-between bg-black/50 p-2 rounded-lg border border-slate-800 mt-1">
                          <span className="font-mono text-sm font-bold text-white" dir="ltr">
                            {paymentConfig.wallets.number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(paymentConfig.wallets.number, 'wallets');
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-black transition cursor-pointer"
                          >
                            {copiedKey === 'wallets' ? 'تم النسخ ✓' : 'نسخ الرقم'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* InstaPay Card (Only rendered if isActive is true) */}
                    {paymentConfig.instapay.isActive && (
                      <div
                        onClick={() => setPaymentMethod('instapay')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                          paymentMethod === 'instapay'
                            ? 'border-purple-500 bg-purple-950/30 shadow-md ring-1 ring-purple-500/50'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span className="text-purple-400 font-black">⚡</span>
                              <span>إنستاباي (InstaPay)</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                              تحويل لحظي IPN
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-400 mb-1.5">معرف الدفع اللحظي الرسمي:</div>
                          <div className="flex items-center justify-between bg-black/50 p-2 rounded-lg border border-slate-800 mb-2.5">
                            <span className="font-mono text-xs font-bold text-purple-300 truncate max-w-[170px]" dir="ltr">
                              {paymentConfig.instapay.handle}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(paymentConfig.instapay.handle, 'insta');
                              }}
                              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition shrink-0 cursor-pointer"
                            >
                              {copiedKey === 'insta' ? 'تم النسخ ✓' : 'نسخ المعرف'}
                            </button>
                          </div>
                        </div>

                        {/* Deep Link & QR Code Innovations */}
                        <div className="space-y-2 pt-1 border-t border-purple-500/20">
                          {paymentConfig.instapay.link && (
                            <a
                              href={paymentConfig.instapay.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-2 px-3 rounded-lg bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5 transition text-center"
                            >
                              <span>⚡</span>
                              <span>الدفع المباشر عبر تطبيق إنستاباي ↗</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDesktopQr(!showDesktopQr);
                            }}
                            className="w-full text-center text-[10px] text-purple-300 hover:text-purple-200 underline font-medium"
                          >
                            {showDesktopQr ? 'إخفاء رمز QR للمسح ▲' : 'عرض رمز QR لمسح التحويل بالهاتف ▼'}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* QR Code Presentation Box (when toggled on Desktop) */}
                  {showDesktopQr && paymentConfig.instapay.isActive && paymentConfig.instapay.link && (
                    <div className="p-4 rounded-xl border border-purple-500/40 bg-[#0B1528] flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2.5 bg-white rounded-xl shadow-lg shrink-0">
                        <QRCodeSVG
                          value={paymentConfig.instapay.link}
                          size={100}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          level="M"
                        />
                      </div>
                      <div className="text-right space-y-1 max-w-xs">
                        <p className="text-xs font-bold text-white">امسح الكود عبر تطبيق إنستاباي أو كاميرا هاتفك</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          سيتم توجيهك فوراً إلى صفحة التحويل في إنستاباي مع تحديد المستلم تلقائياً دون كتابة يدوية.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Form Inputs */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="block text-xs font-bold text-cyan-300">
                    2. أدخل بيانات الحوالة وارفع صورة الإيصال:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        المبلغ المحول (EGP) <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="50"
                        step="50"
                        placeholder="مثال: 500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {['200', '500', '1000', '2500'].map((quick) => (
                          <button
                            type="button"
                            key={quick}
                            onClick={() => setAmount(quick)}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-gray-300 hover:text-white hover:border-cyan-500/40 font-mono transition"
                          >
                            {quick} ج.م
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        {paymentMethod === 'vodafone_cash'
                          ? 'رقم المحفظة التي قمت بالتحويل منها'
                          : 'معرف / رقم إنستاباي المحول منه'}{' '}
                        <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        placeholder={paymentMethod === 'vodafone_cash' ? '010XXXXXXXX' : 'username@instapay'}
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-left"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">الرقم أو المعرف الذي قمت بالتحويل منه لسرعة المطابقة الفورية</p>
                    </div>
                  </div>

                  {/* Receipt File Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      صورة إيصال التحويل (Screenshot) <span className="text-cyan-400">*</span>
                    </label>

                    {receiptUrl ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✓ تم إرفاق صورة الإيصال بنجاح</span>
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 underline text-[11px]"
                          >
                            معاينة الصورة
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceiptUrl('')}
                          className="text-gray-400 hover:text-rose-400 text-xs transition"
                        >
                          تغيير الملف ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-950 transition cursor-pointer text-center">
                        <span className="text-2xl mb-1">📸</span>
                        <span className="text-xs font-bold text-slate-300">
                          {isUploadingReceipt ? 'جاري رفع الإيصال...' : 'اضغط لاختيار صورة إيصال التحويل'}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5">
                          يدعم JPG, PNG, WEBP أو PDF (الحد الأقصى 10MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={isUploadingReceipt}
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingReceipt}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        <span>جاري إرسال الإيصال...</span>
                      </>
                    ) : (
                      <span>إرسال الإيصال للاعتماد والشحن ←</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          /* History Tab */
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="text-center py-8 text-xs text-gray-400 animate-pulse">
                جاري تحميل سجل عمليات الشحن...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-2">
                <span className="text-3xl">📭</span>
                <p className="text-xs text-gray-400">لا توجد عمليات شحن سابقة مسجلة لحسابك بعد.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-mono">
                          {Number(item.amount).toLocaleString('en-US')} ج.م
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-gray-400">
                          {item.payment_method === 'vodafone_cash' ? 'محافظ إلكترونية' : 'إنستاباي'}
                        </span>
                        {item.status === 'approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ معتمد ومضاف
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ✕ مرفوض
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ قيد المراجعة
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        مرجع التحويل: <span className="font-mono text-gray-300" dir="ltr">{item.transfer_reference}</span>
                      </div>
                      {item.admin_notes && (
                        <div className="text-[11px] text-amber-300/90 pt-0.5">
                          ملاحظة الإدارة: {item.admin_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-[10px] text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {item.receipt_url && (
                        <a
                          href={item.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition text-[11px] font-bold"
                        >
                          عرض الإيصال ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:brightness-110 transition"
              >
                + شحن جديد
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
