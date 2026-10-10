import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-gray-950 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">403 — غير مصرح لك بالدخول</h1>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        عذراً، حسابك لا يملك الصلاحيات الكافية للوصول إلى هذا المسار. يرجى التأكد من تسجيل الدخول بالحساب الصحيح.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gray-900 border border-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          العودة للرئيسية
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-gray-950 hover:bg-cyan-400"
        >
          تبديل الحساب
        </Link>
      </div>
    </div>
  );
}
