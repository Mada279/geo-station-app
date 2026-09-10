'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authenticateUser } from '@/services/userService';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Authenticate with mock user service
      const user = await authenticateUser(email, password);

      // 2. Set Session Cookie expected by RBAC Middleware
      const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      document.cookie =
        'survsta_session=' +
        encodeURIComponent(JSON.stringify(sessionData)) +
        '; path=/; max-age=86400';

      // Redundant user_role cookie for auxiliary guards
      document.cookie = `user_role=${user.role}; path=/; max-age=86400`;

      // 3. Smart Redirection
      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else {
        switch (user.role) {
          case 'admin':
            router.push('/admin/users');
            break;
          case 'provider':
            router.push('/provider/dashboard');
            break;
          case 'customer':
          default:
            router.push('/');
            break;
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تسجيل الدخول. يرجى مراجعة بيانات الاعتماد.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('demo1234');
    setError(null);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-md text-right">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block transition-opacity hover:opacity-90">
          <div className="relative mx-auto h-12 w-44">
            <Image
              src="/images/Designer.png"
              alt="Survsta Logo"
              fill
              priority
              sizes="176px"
              className="object-contain"
            />
          </div>
        </Link>
        <h1 className="mt-4 text-2xl font-black text-white">تسجيل الدخول</h1>
        <p className="mt-1 text-xs text-gray-400">
          ادخل إلى منصة مساحي والجيوماتكس الرقمية
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            البريد الإلكتروني *
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('في المرحلة التجريبية، استخدم أي كلمة مرور مع الإيميلات المتاحة بالأسفل.');
              }}
              className="text-xs text-cyan-400 hover:underline"
            >
              نسيت كلمة المرور؟
            </a>
            <label className="block text-xs font-semibold text-gray-300">
              كلمة المرور *
            </label>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
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
              <span>جاري التحقق...</span>
            </span>
          ) : (
            'دخول المنصة'
          )}
        </button>
      </form>

      {/* Helper Box: Test Credentials */}
      <div className="mt-8 rounded-xl border border-dashed border-gray-800 bg-gray-950/60 p-4 text-xs">
        <div className="font-semibold text-gray-400 mb-2 flex items-center justify-between">
          <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            تجربة الصلاحيات (RBAC Demo)
          </span>
          <span>بيانات الاختبار السريع:</span>
        </div>
        <div className="space-y-1.5 text-gray-400">
          <div
            onClick={() => handleQuickFill('admin@survsta.com')}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 bg-gray-900/80 hover:bg-gray-800 hover:text-white flex items-center justify-between transition"
          >
            <span className="text-red-400 text-[11px]">Admin (مدير)</span>
            <code className="text-cyan-300 font-mono text-[11px]">admin@survsta.com</code>
          </div>
          <div
            onClick={() => handleQuickFill('ahmed@elitesurvey.eg')}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 bg-gray-900/80 hover:bg-gray-800 hover:text-white flex items-center justify-between transition"
          >
            <span className="text-cyan-400 text-[11px]">Provider (مزوّد)</span>
            <code className="text-cyan-300 font-mono text-[11px]">ahmed@elitesurvey.eg</code>
          </div>
          <div
            onClick={() => handleQuickFill('procurement@orchid.com')}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 bg-gray-900/80 hover:bg-gray-800 hover:text-white flex items-center justify-between transition"
          >
            <span className="text-emerald-400 text-[11px]">Customer (عميل)</span>
            <code className="text-cyan-300 font-mono text-[11px]">procurement@orchid.com</code>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-gray-500 text-center">
          * اضغط على أي حساب لتعبئته تلقائياً واختبار التوجيه حسب الدور.
        </p>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-center text-xs text-gray-400">
        ليس لديك حساب بعد؟{' '}
        <Link href="/join" className="text-cyan-400 font-semibold hover:underline">
          انضم كشريك أو أنشئ حساباً جديداً
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <Suspense fallback={<div className="text-gray-400 text-xs">جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
