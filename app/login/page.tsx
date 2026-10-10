'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

interface ResolvedSession {
  authenticated: boolean;
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'provider' | 'customer';
  providerStatus: string | null;
  home: string;
}

const BLOCKED_PROVIDER_STATUSES: Record<string, string> = {
  suspended: 'تم إيقاف هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.',
  blocked: 'هذا الحساب معطل. يرجى التواصل مع إدارة المنصة.',
  rejected: 'تم رفض طلب التسجيل. يرجى التواصل مع إدارة المنصة.',
  pending: 'حسابك قيد المراجعة والاعتماد من قبل إدارة المنصة. يرجى الانتظار حتى اعتماده.',
};

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.';
  }
  if (message.includes('Email not confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني من رسالة التفعيل قبل تسجيل الدخول.';
  }
  if (message.toLowerCase().includes('rate limit')) {
    return 'تمت محاولات دخول كثيرة متتالية. يرجى الانتظار دقائق ثم المحاولة مرة أخرى.';
  }
  if (message.includes('Email rate limit exceeded')) {
    return 'تم تجاوز حد المحاولات المسموح. يرجى الانتظار قليلاً وإعادة المحاولة.';
  }
  return 'تعذر تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeTarget = (fallback: string) =>
    callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : fallback;

  // An active session makes the login form meaningless — send the user to their portal.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) return;
        const session: ResolvedSession = await res.json();
        if (cancelled || !session?.role) return;
        window.location.replace(safeTarget(session.home));
      } catch {
        // Offline or server error: stay on the form.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanPass = password;

      if (!cleanEmail || !cleanPass) {
        throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      }

      // Supabase Auth is the credential authority.
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (authError || !authData?.user) {
        throw new Error(translateAuthError(authError?.message || ''));
      }

      // Allow cookies to synchronize, then verify session with retry
      let session: ResolvedSession | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch('/api/auth/session', { cache: 'no-store' });
          if (res.ok) {
            const data: ResolvedSession = await res.json();
            if (data?.authenticated) {
              session = data;
              break;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 150));
      }

      // Fallback: If session route was slightly delayed in cookie propagation, derive from user metadata
      if (!session || !session.authenticated) {
        const userMeta = authData.user.user_metadata || {};
        const role = userMeta.role === 'provider' ? 'provider' : userMeta.role === 'admin' ? 'admin' : 'customer';
        const home = role === 'admin' ? '/admin' : role === 'provider' ? '/provider/dashboard' : '/dashboard';

        session = {
          authenticated: true,
          id: authData.user.id,
          email: authData.user.email || cleanEmail,
          name: userMeta.name || userMeta.full_name || 'مستخدم المنصة',
          role: role as any,
          providerStatus: null,
          home,
        };
      }

      const blockedReason = session.providerStatus
        ? BLOCKED_PROVIDER_STATUSES[session.providerStatus]
        : null;

      if (blockedReason) {
        await supabase.auth.signOut();
        throw new Error(blockedReason);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('SURVSTA_LOGGED_OUT');
        localStorage.removeItem('GS_LOGGED_OUT');
        localStorage.setItem(
          'SURVSTA_AUTH_USER',
          JSON.stringify({
            id: session.id,
            email: session.email,
            name: session.name,
            role: session.role === 'customer' ? 'client' : session.role,
            av: (session.name || '').slice(0, 2),
          })
        );

        try {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('survsta_auth_channel');
            bc.postMessage({ type: 'AUTH_STATE_CHANGED', email: session.email });
            bc.close();
          }
        } catch {}
      }

      window.location.replace(safeTarget(session.home));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsLoading(false);
    }
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

      {/* Success Alert */}
      {searchParams.get('message') === 'password_updated' && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <span>✓</span>
          <span>تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</span>
        </div>
      )}

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
            <label className="block text-xs font-semibold text-gray-300">
              كلمة المرور *
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition"
            >
              هل نسيت كلمة المرور؟
            </Link>
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

      {/* Footer Navigation */}
      <div className="mt-6 text-center text-xs text-gray-400">
        ليس لديك حساب بعد؟{' '}
        <Link href="/onboarding" className="text-cyan-400 font-semibold hover:underline">
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
