import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { resolveAuthContext, homePathFor } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/dashboard';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  const response = NextResponse.redirect(new URL(safeNext(searchParams.get('next')), request.url));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let verifyError: unknown = null;

  if (tokenHash && type) {
    ({ error: verifyError } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error: verifyError } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    return response;
  }

  if (verifyError) {
    console.warn('[auth/confirm] verification failed:', verifyError);
    return NextResponse.redirect(new URL('/login?message=invalid_link', request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctx = user ? await resolveAuthContext(user) : null;
  if (!ctx) {
    return NextResponse.redirect(new URL('/login?message=invalid_link', request.url));
  }

  return NextResponse.redirect(new URL(homePathFor(ctx.role), request.url));
}
