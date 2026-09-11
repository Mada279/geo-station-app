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
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = password.trim();

      // Explicit Admin Login Logic
      if (cleanEmail === 'admin@survsta.com' && cleanPass === 'admin') {
        document.cookie = "survsta_session=" + encodeURIComponent(JSON.stringify({ role: 'admin', email: 'admin@survsta.com', name: 'م. محمد فرج', org: 'Survsta Admin' })) + "; path=/; max-age=86400";
        document.cookie = "user_role=admin; path=/; max-age=86400";
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('SURVSTA_LOGGED_OUT');
          localStorage.removeItem('GS_LOGGED_OUT');
          localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify({
            id: 'admin-demo-1',
            email: 'admin@survsta.com',
            name: 'م. محمد فرج',
            role: 'admin',
            org: 'Survsta Admin',
            av: 'مف'
          }));
        }
        
        if (callbackUrl && callbackUrl.startsWith('/')) {
          router.push(callbackUrl);
        } else {
          router.push('/a-dashboard');
        }
        return;
      }

      // Explicit Provider Login Logic
      if (cleanEmail === 'provider@survsta.com' && cleanPass === 'provider') {
        document.cookie = "survsta_session=" + encodeURIComponent(JSON.stringify({ role: 'provider', email: 'provider@survsta.com', name: 'م. أحمد النجار', org: 'مكتب النخبة للمساحة' })) + "; path=/; max-age=86400";
        document.cookie = "user_role=provider; path=/; max-age=86400";
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('SURVSTA_LOGGED_OUT');
          localStorage.removeItem('GS_LOGGED_OUT');
          localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify({
            id: 'provider-demo-1',
            email: 'provider@survsta.com',
            name: 'م. أحمد النجار',
            role: 'provider',
            org: 'مكتب النخبة للمساحة',
            av: 'أن'
          }));
        }
        
        if (callbackUrl && callbackUrl.startsWith('/')) {
          router.push(callbackUrl);
        } else {
          router.push('/p-dashboard');
        }
        return;
      }

      // General / Fallback Authentication
      const user = await authenticateUser(cleanEmail, cleanPass);

      // Set cookie exactly as requested
      document.cookie = "survsta_session=" + encodeURIComponent(JSON.stringify({ role: user.role })) + "; path=/; max-age=86400";
      document.cookie = `user_role=${user.role}; path=/; max-age=86400`;

      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else {
        if (user.role === 'admin') {
          router.push('/a-dashboard');
        } else if (user.role === 'provider') {
          router.push('/p-dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تسجيل الدخول. يرجى التحقق من البريد وكلمة المرور.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/95 p-8 shadow-2xl backdrop-blur-md text-right">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center w-auto shrink-0 mx-auto transition-opacity hover:opacity-90" style={{ minWidth: '220px' }}>
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
        <h1 className="mt-4 text-2xl font-black text-white">تسجيل الدخول</h1>
        <p className="mt-1 text-xs text-gray-400">
          منصة المساحة والجيوماتكس الرقمية — بوابة الشركاء والعملاء
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
            placeholder="admin@survsta.com أو provider@survsta.com"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-500">(admin أو provider)</span>
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
              <span>جاري تسجيل الدخول...</span>
            </span>
          ) : (
            'دخول المنصة'
          )}
        </button>
      </form>

      {/* Helper Box: Official Test Accounts */}
      <div className="mt-8 rounded-xl border border-dashed border-gray-800 bg-gray-950/60 p-4 text-xs">
        <div className="font-semibold text-gray-400 mb-2 flex items-center justify-between">
          <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            حسابات الاختبار المعتمدة (Mock Accounts)
          </span>
          <span>بيانات التجربة المباشرة:</span>
        </div>
        <div className="space-y-2 text-gray-400">
          <div
            onClick={() => handleQuickFill('admin@survsta.com', 'admin')}
            className="cursor-pointer rounded-lg p-2.5 bg-gray-900 hover:bg-gray-800 hover:text-white transition border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-bold text-xs">🛡️ Admin (مدير النظام)</span>
              <span className="text-[10px] text-gray-500">اضغط للتعبئة التلقائية</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
              <span className="text-cyan-300">admin@survsta.com</span>
              <span className="text-gray-400">كلمة المرور: <b className="text-white">admin</b></span>
            </div>
          </div>

          <div
            onClick={() => handleQuickFill('provider@survsta.com', 'provider')}
            className="cursor-pointer rounded-lg p-2.5 bg-gray-900 hover:bg-gray-800 hover:text-white transition border border-gray-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold text-xs">🏢 Provider (مزوّد الخدمة)</span>
              <span className="text-[10px] text-gray-500">اضغط للتعبئة التلقائية</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
              <span className="text-cyan-300">provider@survsta.com</span>
              <span className="text-gray-400">كلمة المرور: <b className="text-white">provider</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-center text-xs text-gray-400">
        ليس لديك حساب بعد؟{' '}
        <Link href="/join" className="text-cyan-400 font-semibold hover:underline">
          انضم كشريك أو سجّل حساباً جديداً
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gray-950 px-4 py-12">
      <Suspense fallback={<div className="text-gray-400 text-xs">جاري التحميل...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
