import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createRequestSupabaseClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';

export type PlatformRole = 'admin' | 'provider' | 'customer';

export interface AuthContext {
  user: User;
  role: PlatformRole;
  email: string;
  name: string;
  providerId: string | null;
  providerStatus: string | null;
  clientId: string | null;
}

export const DENIED_PROVIDER_STATUSES = ['suspended', 'blocked', 'rejected'];

async function isPlatformAdmin(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('platform_admins')
    .select('email')
    .eq('email', email.toLowerCase())
    .limit(1)
    .maybeSingle();

  return !!data;
}

/**
 * Role lookups always go through the service-role client so a caller blocked by
 * RLS cannot change the answer, and so nobody can claim a role from client data.
 */
export async function resolveAuthContext(user: User): Promise<AuthContext | null> {
  const email = (user.email || '').toLowerCase().trim();
  if (!email) return null;

  if (await isPlatformAdmin(email)) {
    return {
      user,
      role: 'admin',
      email,
      name: user.user_metadata?.name || user.user_metadata?.full_name || 'مدير المنصة',
      providerId: null,
      providerStatus: null,
      clientId: null,
    };
  }

  const { data: provider } = await supabaseAdmin
    .from('providers')
    .select('id, name, status')
    .eq('email', email)
    .maybeSingle();

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, full_name')
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  const providerAllowed = !!provider && !DENIED_PROVIDER_STATUSES.includes(provider.status || '');

  return {
    user,
    role: providerAllowed ? 'provider' : 'customer',
    email,
    name: provider?.name || client?.full_name || user.user_metadata?.name || 'مستخدم المنصة',
    providerId: providerAllowed ? String(provider.id) : null,
    providerStatus: provider?.status || null,
    clientId: client?.id ? String(client.id) : null,
  };
}

/** Resolves the caller's identity from the Supabase session held in the request cookies. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase: SupabaseClient = createRequestSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return resolveAuthContext(user);
}

/** Redirects to /login when unauthenticated, or /unauthorized when the role is wrong. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect(`/login?callbackUrl=${encodeURIComponent('/admin')}`);
  if (ctx.role !== 'admin') redirect('/unauthorized');
  return ctx;
}

export async function requireProvider(callbackUrl = '/provider/dashboard'): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (ctx.role !== 'provider' && ctx.role !== 'admin') redirect('/unauthorized');
  return ctx;
}

export async function requireUser(callbackUrl = '/dashboard'): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return ctx;
}

export function homePathFor(role: PlatformRole): string {
  if (role === 'admin') return '/admin';
  if (role === 'provider') return '/provider/dashboard';
  return '/dashboard';
}
