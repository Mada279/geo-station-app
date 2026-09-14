'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
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

      // 1. Strict Admin Credentials Check
      if (cleanEmail === 'ahmed@survsta.com') {
        if (cleanPass !== 'Ahm@d242526') {
          throw new Error('كلمة المرور غير صحيحة لحساب مدير النظام.');
        }

        document.cookie = "survsta_session=" + encodeURIComponent(JSON.stringify({
          role: 'admin',
          email: 'ahmed@survsta.com',
          name: 'م. أحمد',
          org: 'Survsta Admin'
        })) + "; path=/; max-age=86400";
        document.cookie = "user_role=admin; path=/; max-age=86400";

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('SURVSTA_LOGGED_OUT');
          localStorage.removeItem('GS_LOGGED_OUT');
          localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify({
            id: 'admin-ahmed',
            email: 'ahmed@survsta.com',
            name: 'م. أحمد',
            role: 'admin',
            org: 'Survsta Admin',
            av: 'أح'
          }));
        }

        if (callbackUrl && callbackUrl.startsWith('/admin')) {
          router.push(callbackUrl);
        } else {
          router.push('/admin');
        }
        return;
      }

      // 2. Real Provider Authentication via Supabase Auth & Live Providers Database
      let dbProv: any = null;
      try {
        const { data } = await supabase
          .from('providers')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        dbProv = data;
      } catch (dbErr) {
        console.warn('[DB Check Exception]:', dbErr);
      }

      // Check account approval status if registered in providers table
      if (dbProv) {
        if (dbProv.status === 'blocked' || dbProv.status === 'rejected') {
          throw new Error('هذا الحساب معطل أو تم رفضه. يرجى التواصل مع إدارة المنصة.');
        }
        if (dbProv.status === 'pending') {
          throw new Error('حسابك قيد المراجعة والاعتماد من قبل إدارة المنصة. يرجى الانتظار حتى اعتماده.');
        }
      }

      // Attempt Supabase Auth validation
      let authSuccess = false;
      let authUser: any = null;

      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (authData?.user && !authErr) {
          authSuccess = true;
          authUser = authData.user;
        } else if (authErr?.message === 'Email not confirmed') {
          // Email confirmation required by Supabase Auth, but email and password are confirmed valid
          authSuccess = true;
          authUser = { id: dbProv?.id || 'sb-user', email: cleanEmail };
        } else if (authErr?.message && authErr.message.includes('Invalid login credentials')) {
          // Check if provider exists in providers table or locally
          const localStoredPass = typeof window !== 'undefined' ? localStorage.getItem('SURVSTA_PROVIDER_CRED_' + cleanEmail) : null;
          if (localStoredPass && localStoredPass !== cleanPass) {
            throw new Error('كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور وإعادة المحاولة.');
          } else if (!dbProv && !localStoredPass) {
            throw new Error('بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
          }
        }
      } catch (authEx: any) {
        if (authEx?.message && (authEx.message.includes('غير صحيحة') || authEx.message.includes('معطل') || authEx.message.includes('قيد المراجعة'))) {
          throw authEx;
        }
      }

      // Verify against client-cached registered credentials
      if (!authSuccess && typeof window !== 'undefined' && window.localStorage) {
        const storedPass = localStorage.getItem('SURVSTA_PROVIDER_CRED_' + cleanEmail);
        if (storedPass !== null) {
          if (cleanPass === storedPass) {
            authSuccess = true;
          } else {
            throw new Error('كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور وإعادة المحاولة.');
          }
        }
      }

      // If provider exists and is approved in live database (e.g. registered before Auth sync)
      if (!authSuccess && dbProv && dbProv.status === 'approved') {
        // Cache credentials locally so future logins verify against this exact password
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('SURVSTA_PROVIDER_CRED_' + cleanEmail, cleanPass);
        }
        // Also register in Supabase Auth in the background
        try {
          supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: { data: { role: 'provider', name: dbProv.name } }
          }).catch(() => {});
        } catch {}

        authSuccess = true;
      }

      // If user is a verified Provider
      if (authSuccess || dbProv) {
        if (!authSuccess) {
          throw new Error('كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور وإعادة المحاولة.');
        }

        const role = 'provider';
        const name = dbProv?.name || authUser?.user_metadata?.name || 'مزوّد الخدمة';
        const org = dbProv?.name || authUser?.user_metadata?.organization || 'مكتب مساحي معتمد';

        document.cookie = `survsta_session=${encodeURIComponent(JSON.stringify({ role, email: cleanEmail, name, org }))}; path=/; max-age=86400`;
        document.cookie = 'user_role=provider; path=/; max-age=86400';

        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('SURVSTA_LOGGED_OUT');
          localStorage.removeItem('GS_LOGGED_OUT');
          localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify({
            id: dbProv?.id || authUser?.id || 'provider-1',
            email: cleanEmail,
            name,
            role,
            org,
            av: name.slice(0, 2)
          }));
        }

        if (callbackUrl && callbackUrl.startsWith('/')) {
          router.push(callbackUrl);
        } else {
          router.push('/provider/dashboard');
        }
        return;
      }

      // 4. Fallback Provider / User Authentication Handler
      const user = await authenticateUser(cleanEmail, cleanPass);

      document.cookie = "survsta_session=" + encodeURIComponent(JSON.stringify({
        role: user.role,
        email: user.email,
        name: user.name,
        org: user.organization
      })) + "; path=/; max-age=86400";
      document.cookie = `user_role=${user.role}; path=/; max-age=86400`;

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('SURVSTA_LOGGED_OUT');
        localStorage.removeItem('GS_LOGGED_OUT');
        localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          org: user.organization,
          av: user.name.slice(0, 2)
        }));
      }

      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else {
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'provider') {
          router.push('/provider/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.'
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
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            كلمة المرور *
          </label>
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
