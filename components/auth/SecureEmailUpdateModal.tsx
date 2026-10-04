'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

interface SecureEmailUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  userId?: string;
  providerId?: string;
  role?: 'provider' | 'client' | 'freelancer';
  onSuccess: (newEmail: string) => void;
}

export default function SecureEmailUpdateModal({
  isOpen,
  onClose,
  currentEmail,
  userId,
  providerId,
  role = 'provider',
  onSuccess,
}: SecureEmailUpdateModalProps) {
  const [step, setStep] = useState<'request' | 'verify' | 'done'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setNewEmail('');
      setOtpToken('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      setResendCooldown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Initiate Email Change via Supabase Auth
  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNew = newEmail.trim().toLowerCase();
    if (!cleanNew || !cleanNew.includes('@') || !cleanNew.includes('.')) {
      setErrorMessage('يرجى إدخال عنوان بريد إلكتروني صالح.');
      return;
    }

    if (cleanNew === (currentEmail || '').trim().toLowerCase()) {
      setErrorMessage('البريد الإلكتروني الجديد مطابق تماماً للبريد الحالي.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: cleanNew,
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          throw new Error('تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار بضع دقائق والمحاولة مجدداً.');
        }
        if (error.message.includes('already registered') || error.message.includes('taken')) {
          throw new Error('هذا البريد الإلكتروني مسجل بالفعل بحساب آخر على المنصة.');
        }
        throw new Error(error.message || 'فشل إرسال رمز التحقق إلى البريد الجديد.');
      }

      setStep('verify');
      setResendCooldown(60);
      setSuccessMessage(`تم إرسال رمز التحقق (OTP) أو رابط التفعيل إلى بريدك الجديد: ${cleanNew}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء طلب تغيير البريد.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP Token
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام بدقة.');
      return;
    }

    const cleanNew = newEmail.trim().toLowerCase();
    setIsLoading(true);

    try {
      // 1. Verify via Supabase Auth OTP (email_change type)
      let verifyRes = await supabase.auth.verifyOtp({
        email: cleanNew,
        token: cleanToken,
        type: 'email_change',
      });

      // Fallback to 'email' type if project auth configuration expects email
      if (verifyRes.error) {
        const fallbackRes = await supabase.auth.verifyOtp({
          email: cleanNew,
          token: cleanToken,
          type: 'email',
        });
        if (!fallbackRes.error) {
          verifyRes = fallbackRes;
        }
      }

      if (verifyRes.error) {
        if (verifyRes.error.message.includes('expired')) {
          throw new Error('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
        }
        throw new Error(verifyRes.error.message || 'رمز التحقق غير صحيح. يرجى إعادة المحاولة.');
      }

      // 2. Synchronize new email to providers table
      if (providerId) {
        try {
          await supabase
            .from('providers')
            .update({ email: cleanNew })
            .eq('id', providerId);
        } catch (dbErr) {
          console.warn('[SecureEmailUpdate] providers table sync warning:', dbErr);
        }
      }

      // 3. Synchronize new email to clients table
      if (userId) {
        try {
          await supabase
            .from('clients')
            .update({ email: cleanNew })
            .eq('user_id', userId);
        } catch (dbErr) {
          console.warn('[SecureEmailUpdate] clients table sync warning:', dbErr);
        }
      }

      // 4. Update local session & cookies
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.email = cleanNew;
            localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify(parsed));
          } catch {}
        }
      }

      setStep('done');
      onSuccess(cleanNew);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحقق من رمز OTP. يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    setIsLoading(true);

    const cleanNew = newEmail.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.updateUser({
        email: cleanNew,
      });

      if (error) throw error;

      setResendCooldown(60);
      setSuccessMessage('تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.');
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إعادة إرسال الرمز حالياً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      style={{ direction: 'rtl' }}
    >
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#081933] p-6 shadow-2xl text-right space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-lg">🔐</span>
            <div>
              <h3 className="text-base font-bold text-white">تحديث البريد الإلكتروني الآمن</h3>
              <p className="text-[11px] text-gray-400">توثيق الهوية بالرمز السري (Supabase OTP)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && step !== 'done' && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-start gap-2">
            <span>✉️</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Request New Email */}
        {step === 'request' && (
          <form onSubmit={handleRequestChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">البريد الإلكتروني الحالي</label>
              <input
                type="text"
                disabled
                dir="ltr"
                value={currentEmail || 'غير محدد'}
                className="w-full rounded-xl border border-gray-800 bg-[#040d1a] px-3.5 py-2 text-xs text-gray-400 font-mono cursor-not-allowed text-left opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1">
                البريد الإلكتروني الجديد <span className="text-cyan-400">*</span>
              </label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="new-email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/40 bg-[#0F253E] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-300 font-mono text-left"
              />
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                سيتم إرسال رمز تحقق سري (OTP) إلى بريدك الجديد لتأكيد الملكية وحماية حسابك.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-l from-cyan-500 to-sky-500 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <span>إرسال رمز التحقق ←</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1">
                رمز التحقق المكون من 6 أرقام (OTP Code)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                dir="ltr"
                placeholder="123456"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-lg font-bold rounded-xl border border-cyan-500/50 bg-[#0F253E] px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-300 font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                أدخل الرمز المرسل إلى: <span className="text-cyan-300 font-mono">{newEmail}</span>
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className="text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 transition font-medium"
              >
                {resendCooldown > 0 ? `إعادة الإرسال بعد (${resendCooldown}s)` : 'إعادة إرسال الرمز'}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-gray-400 hover:text-white transition"
              >
                تغيير البريد المدخل
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <span>تأكيد واعتماد البريد الجديد ✅</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-2xl text-emerald-400">
              ✓
            </div>
            <div>
              <h4 className="text-base font-bold text-white">تم تحديث البريد الإلكتروني بنجاح!</h4>
              <p className="text-xs text-gray-300 mt-1 font-mono">{newEmail}</p>
              <p className="text-[11px] text-gray-400 mt-2">
                تم توثيق بريدك الجديد في قاعدة بيانات الأمان والمصادقة وتحديث بيانات حسابك.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:brightness-110 transition"
            >
              تم، العودة إلى لوحة التحكم
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
