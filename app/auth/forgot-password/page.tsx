'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail) {
        throw new Error('يرجى إدخال عنوان البريد الإلكتروني.');
      }

      // Compute redirect URL pointing to update-password page
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/update-password`
        : '/auth/update-password';

      // Supabase Password Reset Call
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.warn('Supabase resetPasswordForEmail notice:', resetError.message);
        // Supabase rate limiting or other errors
        if (resetError.message.includes('rate limit')) {
          throw new Error('تم إرسال عدة طلبات مؤخراً. يرجى الانتظار بضع دقائق قبل المحاولة مرة أخرى.');
        }
      }

      // Optimistic Success Feedback
      setIsSuccess(true);
      showToast('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر إرسال رابط الاستعادة حالياً. يرجى التأكد من صحة البريد والمحاولة لاحقاً.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gray-950 px-4 py-12" dir="rtl">
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
          <h1 className="mt-4 text-2xl font-black text-white">استعادة كلمة المرور</h1>
          <p className="mt-1 text-xs text-gray-400">
            أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Success State Card */}
        {isSuccess ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl flex items-center justify-center mx-auto">
                ✉️
              </div>
              <h3 className="text-sm font-bold text-white">تم إرسال الرابط بنجاح</h3>
              <p className="text-xs text-emerald-300 leading-relaxed">
                تم إرسال رابط استعادة كلمة المرور إلى{' '}
                <span className="font-mono font-bold text-white underline">{email}</span>.
                يرجى مراجعة صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها Spam).
              </p>
            </div>

            <div className="pt-2 text-center space-y-3">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
              >
                لم تستلم البريد؟ أعد المحاولة
              </button>

              <div>
                <Link
                  href="/login"
                  className="inline-block w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-2.5 text-xs font-bold text-white transition border border-gray-700"
                >
                  العودة لصفحة تسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                البريد الإلكتروني المسجل *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
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
                  <span>جاري إرسال الرابط...</span>
                </span>
              ) : (
                'إرسال رابط الاستعادة'
              )}
            </button>

            <div className="pt-3 text-center">
              <Link
                href="/login"
                className="text-xs text-gray-400 hover:text-cyan-400 transition"
              >
                تذكرت كلمة المرور؟ <span className="text-cyan-400 font-semibold underline">العودة لتسجيل الدخول</span>
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
    </div>
  );
}
