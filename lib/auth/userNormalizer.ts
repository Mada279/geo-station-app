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

  // 3. Resolve role (Strictly guard against Supabase 'authenticated' token overriding provider role)
  let rawRole = (
    rawUser.user_role ||
    rawUser.user_metadata?.role ||
    rawUser.app_metadata?.role ||
    (rawUser.role && rawUser.role !== 'authenticated' ? rawUser.role : '') ||
    ''
  ).toLowerCase();

  // If role is missing from auth token, check fallbackRole provided by caller
  if (!rawRole && fallbackRole) {
    rawRole = fallbackRole.toLowerCase();
  }

  // In browser environment, check cookies for existing role before falling back
  if (!rawRole && typeof document !== 'undefined') {
    try {
      const match = document.cookie.match(/(?:^|;\s*)user_role=([^;]+)/);
      if (match && match[1] && match[1] !== 'undefined') {
        rawRole = decodeURIComponent(match[1]).toLowerCase();
      }
    } catch {}
  }

  // In browser environment, check localStorage for existing provider role
  if (!rawRole && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('SURVSTA_AUTH_USER');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role && parsed.role !== 'client') {
          rawRole = parsed.role.toLowerCase();
        }
      }
    } catch {}
  }

  let role: 'admin' | 'provider' | 'client' | 'customer' = 'client';

  if (email === 'ahmed@survsta.com' || rawRole === 'admin' || rawRole === 'super_admin') {
    role = 'admin';
  } else if (
    rawRole === 'provider' ||
    rawUser.active_modules?.provider ||
    rawUser.user_metadata?.active_modules?.provider ||
    rawUser.modules?.provider === 'active'
  ) {
    role = 'provider';
  } else if (rawRole === 'client' || rawRole === 'customer' || rawUser.active_modules?.client) {
    role = 'client';
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
