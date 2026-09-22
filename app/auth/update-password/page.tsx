'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

function UpdatePasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Inspect session or recovery token on mount
  useEffect(() => {
    async function checkRecoverySession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && typeof window !== 'undefined') {
          // If hash has error or expired
          const hash = window.location.hash;
          if (hash.includes('error_description')) {
            const params = new URLSearchParams(hash.replace('#', '?'));
            const desc = params.get('error_description');
            if (desc) {
              setError(`انتهت صلاحية الرابط أو تم استخدامه: ${decodeURIComponent(desc)}`);
            }
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      }
    }

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const pass = newPassword.trim();
      const confirmPass = confirmPassword.trim();

      // Validation
      if (!pass) {
        throw new Error('يرجى إدخال كلمة المرور الجديدة.');
      }
      if (pass.length < 6) {
        throw new Error('يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام.');
      }
      if (pass !== confirmPass) {
        throw new Error('كلمة المرور وتأكيدها غير متطابقين. يرجى التأكد وإعادة المحاولة.');
      }

      // Supabase Update Password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: pass,
      });

      if (updateError) {
        console.warn('Supabase updateUser error:', updateError.message);
        if (updateError.message.includes('Auth session missing')) {
          throw new Error('جلسة الاستعادة مفقودة أو منتهية الصلاحية. يرجى طلب رابط استعادة جديد.');
        }
        throw new Error(updateError.message);
      }

      // Update local storage credentials if user was locally cached
      if (typeof window !== 'undefined' && data?.user?.email) {
        const emailKey = 'SURVSTA_PROVIDER_CRED_' + data.user.email.toLowerCase().trim();
        localStorage.setItem(emailKey, pass);
      }

      setIsSuccess(true);
      showToast('تم تغيير كلمة المرور بنجاح');

      // Redirect user to login after short delay
      setTimeout(() => {
        router.push('/login?message=password_updated');
      }, 2000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحديث كلمة المرور حالياً. يرجى المحاولة لاحقاً.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/95 p-8 shadow-2xl backdrop-blur-md text-right">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-auto shrink-0 mx-auto transition-opacity hover:opacity-90"
          style={{ minWidth: '220px' }}
        >
          <Image
            alt="Survsta"
            className="object-contain w-[220px] md:w-[240px] h-auto mx-auto"
            height={70}
            priority
            src="/images/Designer.png"
            style={{ maxHeight: '70px' }}
            width={240}
          />
        </Link>
        <h1 className="mt-4 text-2xl font-black text-white">تعيين كلمة المرور الجديدة</h1>
        <p className="mt-1 text-xs text-gray-400">
          أدخل كلمة المرور الجديدة لحسابك وقم بتأكيدها للمتابعة
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Success Notification Box */}
      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-base font-bold text-white">تم تغيير كلمة المرور بنجاح</h3>
            <p className="text-xs text-emerald-300">
              تم تحديث كلمة المرور الخاصة بحسابك. جاري تحويلك لصفحة تسجيل الدخول...
            </p>
          </div>

          <Link
            href="/login"
            className="inline-block w-full rounded-xl bg-cyan-500 py-3 text-xs font-bold text-gray-950 hover:bg-cyan-400 transition"
          >
            الانتقال لتسجيل الدخول الآن ←
          </Link>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-white text-xs"
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">
              يجب أن تتكون من 6 خانات على الأقل
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              تأكيد كلمة المرور الجديدة *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-950 border-t-transparent" />
                <span>جاري حفظ كلمة المرور...</span>
              </span>
            ) : (
              'حفظ كلمة المرور الجديدة'
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-gray-400 hover:text-cyan-400 transition"
            >
              هل انتهت صلاحية الرابط؟ <span className="text-cyan-400 underline">طلب رابط جديد</span>
            </Link>
          </div>
        </form>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-emerald-500/50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gray-950 px-4 py-12" dir="rtl">
      <Suspense fallback={<div className="text-gray-400 text-xs">جاري التحميل...</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
