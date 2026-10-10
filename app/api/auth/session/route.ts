import { NextResponse } from 'next/server';
import { getAuthContext, homePathFor } from '@/lib/serverAuth';
import { createRequestSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Returns the server-resolved identity of the signed-in caller. The login page
 * uses this to route the user, so the role is never decided in the browser.
 */
export async function GET() {
  const ctx = await getAuthContext();

  if (!ctx) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    id: ctx.user.id,
    email: ctx.email,
    name: ctx.name,
    role: ctx.role,
    providerId: ctx.providerId,
    providerStatus: ctx.providerStatus,
    clientId: ctx.clientId,
    home: homePathFor(ctx.role),
  });
}

export async function DELETE() {
  const supabase = createRequestSupabaseClient();
  await supabase.auth.signOut({ scope: 'global' });

  const response = NextResponse.json({ success: true });
  response.cookies.delete('survsta_session');
  response.cookies.delete('user_role');
  return response;
}
