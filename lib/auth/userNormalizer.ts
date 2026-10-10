export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'provider' | 'client' | 'customer';
  avatarUrl?: string;
  initials: string;
  organization?: string;
  modules?: Record<string, string>;
}

export function normalizeUser(rawUser: any, fallbackRole?: string): AuthenticatedUser | null {
  if (!rawUser) return null;

  // 1. Identify user identifiers
  const id: string = rawUser.id || rawUser.user_id || rawUser.sub || '';
  const email: string = (rawUser.email || rawUser.user_metadata?.email || '').toLowerCase().trim();

  if (!id && !email) return null;

  // 2. Extract name & organization
  const name: string =
    rawUser.name ||
    rawUser.user_metadata?.full_name ||
    rawUser.user_metadata?.name ||
    rawUser.raw_user_meta_data?.full_name ||
    rawUser.raw_user_meta_data?.name ||
    (email ? email.split('@')[0] : 'مستخدم سيرفستا');

  const organization: string | undefined =
    rawUser.org ||
    rawUser.organization ||
    rawUser.company_name ||
    rawUser.user_metadata?.organization ||
    rawUser.user_metadata?.company_name ||
    undefined;

  // 3. Resolve role. The authoritative value always comes from the caller
  // (server-resolved session or a cached display copy) — never from a cookie.
  let rawRole = (
    rawUser.user_role ||
    rawUser.user_metadata?.role ||
    rawUser.app_metadata?.role ||
    rawUser.role ||
    ''
  )
    .toString()
    .toLowerCase();

  if (!rawRole && fallbackRole) {
    rawRole = fallbackRole.toLowerCase();
  }

  let role: 'admin' | 'provider' | 'client' | 'customer' = 'client';

  if (rawRole === 'admin' || rawRole === 'super_admin') {
    role = 'admin';
  } else if (rawRole === 'provider') {
    role = 'provider';
  } else {
    role = 'client';
  }

  // 4. Initials generation (Arabic / English friendly)
  let initials = 'م';
  if (rawUser.av) {
    initials = rawUser.av;
  } else if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
    } else {
      initials = name.slice(0, 2);
    }
  } else if (email) {
    initials = email.slice(0, 2).toUpperCase();
  }

  const avatarUrl: string | undefined =
    rawUser.avatar_url ||
    rawUser.avatarUrl ||
    rawUser.user_metadata?.avatar_url ||
    undefined;

  const modules: Record<string, string> | undefined =
    rawUser.modules ||
    rawUser.active_modules ||
    rawUser.user_metadata?.active_modules ||
    undefined;

  return {
    id: id || `usr-${Date.now()}`,
    email,
    name,
    role,
    avatarUrl,
    initials,
    organization,
    modules,
  };
}
