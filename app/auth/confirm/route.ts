import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  const redirectUrl = new URL(next, request.url);

  // 1. Verify via token_hash (PKCE / Email OTP Link)
  if (token_hash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error && data?.user) {
        const user = data.user;
        const role =
          user.email === 'ahmed@survsta.com'
            ? 'admin'
            : user.user_metadata?.role ||
              (user.user_metadata?.active_modules?.provider ? 'provider' : 'client');

        const name = user.user_metadata?.name || user.user_metadata?.full_name || 'مستخدم سيرفستا';
        const org = user.user_metadata?.organization || user.user_metadata?.company_name || '';

        const targetDestination =
          role === 'admin'
            ? '/admin'
            : role === 'provider'
            ? '/provider/dashboard'
            : '/dashboard';

        const finalUrl = new URL(targetDestination, request.url);
        const response = NextResponse.redirect(finalUrl);

        response.cookies.set(
          'survsta_session',
          encodeURIComponent(
            JSON.stringify({
              id: user.id,
              email: user.email,
              name,
              role,
              org,
            })
          ),
          { path: '/', maxAge: 86400 * 30, sameSite: 'lax' }
        );

        response.cookies.set('user_role', role, {
          path: '/',
          maxAge: 86400 * 30,
          sameSite: 'lax',
        });

        return response;
      }
    } catch (err) {
      console.error('[auth/confirm error]:', err);
    }
  }

  // 2. Verify via Authorization Code (OAuth / PKCE flow)
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const user = data.user;
        const role =
          user.email === 'ahmed@survsta.com'
            ? 'admin'
            : user.user_metadata?.role ||
              (user.user_metadata?.active_modules?.provider ? 'provider' : 'client');

        const name = user.user_metadata?.name || user.user_metadata?.full_name || 'مستخدم سيرفستا';
        const org = user.user_metadata?.organization || user.user_metadata?.company_name || '';

        const targetDestination =
          role === 'admin'
            ? '/admin'
            : role === 'provider'
            ? '/provider/dashboard'
            : '/dashboard';

        const finalUrl = new URL(targetDestination, request.url);
        const response = NextResponse.redirect(finalUrl);

        response.cookies.set(
          'survsta_session',
          encodeURIComponent(
            JSON.stringify({
              id: user.id,
              email: user.email,
              name,
              role,
              org,
            })
          ),
          { path: '/', maxAge: 86400 * 30, sameSite: 'lax' }
        );

        response.cookies.set('user_role', role, {
          path: '/',
          maxAge: 86400 * 30,
          sameSite: 'lax',
        });

        return response;
      }
    } catch (err) {
      console.error('[auth/callback code exchange error]:', err);
    }
  }

  // Fallback to destination if verification already occurred or direct redirect
  return NextResponse.redirect(redirectUrl);
}
