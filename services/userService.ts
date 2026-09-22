import { User, CreateUserInput, UpdateUserInput } from '@/types/user';
import { supabase } from '@/utils/supabaseClient';

export const ADMIN_EMAIL = 'ahmed@survsta.com';

/**
 * Super Admin default system user representation
 */
const SYSTEM_ADMIN_USER: User = {
  id: 'usr_admin',
  name: 'م. أحمد (مدير النظام)',
  email: ADMIN_EMAIL,
  role: 'admin',
  status: 'active',
  organization: 'إدارة منصة Survsta',
  phone: '01001234567',
  createdAt: '2026-08-15T10:00:00Z',
  sourceTable: 'system',
  is_suspended: false,
};

/**
 * Explicit Authentication handler for Admin & Provider accounts
 */
export async function authenticateUser(email: string, password?: string): Promise<User> {
  await new Promise((res) => setTimeout(res, 150));
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = (password || '').trim();

  // Strict check for Admin
  if (cleanEmail === ADMIN_EMAIL) {
    if (cleanPass !== 'Ahm@d242526') {
      throw new Error('كلمة المرور غير صحيحة لحساب مدير النظام.');
    }
    return SYSTEM_ADMIN_USER;
  }

  // Check Provider in Supabase
  try {
    const { data: prov } = await supabase
      .from('providers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (prov) {
      if (prov.status === 'suspended' || prov.is_suspended) {
        throw new Error('تم إيقاف هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.');
      }
      if (prov.status === 'blocked' || prov.status === 'rejected') {
        throw new Error('هذا الحساب معطل أو تم رفضه من قبل إدارة المنصة.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('إيقاف')) throw err;
  }

  // Check Client in Supabase
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (client) {
      if (client.status === 'suspended' || client.is_suspended) {
        throw new Error('تم إيقاف هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('إيقاف')) throw err;
  }

  // Fallback demo check
  return {
    id: `usr_${Date.now()}`,
    name: 'مستخدم منصة Survsta',
    email: cleanEmail,
    role: 'customer',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Fetch all registered users dynamically from Supabase (clients + providers + admin)
 */
export async function getUsers(): Promise<User[]> {
  try {
    const usersMap = new Map<string, User>();

    // 1. Always include System Admin
    usersMap.set(ADMIN_EMAIL, SYSTEM_ADMIN_USER);

    // 2. Fetch all registered clients
    const { data: clientsData, error: clientsErr } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsErr) {
      console.warn('[userService] Error fetching clients:', clientsErr.message);
    } else if (clientsData) {
      clientsData.forEach((c: any) => {
        const email = (c.email || '').toLowerCase().trim();
        if (!email) return;

        let role: 'admin' | 'provider' | 'customer' = 'customer';
        if (email === ADMIN_EMAIL) {
          role = 'admin';
        } else if (
          Array.isArray(c.active_modules) &&
          c.active_modules.includes('provider')
        ) {
          role = 'provider';
        }

        const isSuspended = c.status === 'suspended' || c.is_suspended === true;

        usersMap.set(email, {
          id: String(c.id),
          name: c.full_name || 'عميل مسجل',
          email: c.email,
          role,
          status: isSuspended ? 'suspended' : (c.status === 'pending' ? 'pending' : 'active'),
          organization: c.company_name || c.category || '—',
          phone: c.phone_number || '',
          createdAt: c.created_at || new Date().toISOString(),
          sourceTable: 'clients',
          is_suspended: isSuspended,
        });
      });
    }

    // 3. Fetch all registered providers
    const { data: providersData, error: provErr } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (provErr) {
      console.warn('[userService] Error fetching providers:', provErr.message);
    } else if (providersData) {
      providersData.forEach((p: any) => {
        const email = (p.email || '').toLowerCase().trim();
        if (!email) return;

        const isSuspended = p.status === 'suspended' || p.is_suspended === true;

        // If user already exists as client, merge information with provider precedence
        const existing = usersMap.get(email);
        if (existing) {
          usersMap.set(email, {
            ...existing,
            name: p.name || existing.name,
            role: existing.role === 'admin' ? 'admin' : 'provider',
            organization: p.name || p.location || existing.organization,
            phone: p.phone || existing.phone,
            status: isSuspended || existing.is_suspended ? 'suspended' : existing.status,
            is_suspended: isSuspended || existing.is_suspended,
          });
        } else {
          usersMap.set(email, {
            id: String(p.id),
            name: p.name || 'مزوّد خدمة',
            email: p.email,
            role: 'provider',
            status: isSuspended ? 'suspended' : (p.status === 'pending' ? 'pending' : 'active'),
            organization: p.name || p.location || 'مكتب مساحي معتمد',
            phone: p.phone || '',
            createdAt: p.created_at || new Date().toISOString(),
            sourceTable: 'providers',
            is_suspended: isSuspended,
          });
        }
      });
    }

    return Array.from(usersMap.values());
  } catch (err) {
    console.error('[userService] Fatal error fetching users:', err);
    return [SYSTEM_ADMIN_USER];
  }
}

/**
 * Toggle user account status between active and suspended
 */
export async function toggleUserSuspension(user: User): Promise<User> {
  const isCurrentlySuspended = user.status === 'suspended' || user.is_suspended === true;
  const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
  const newSuspended = !isCurrentlySuspended;

  // Don't suspend super admin
  if (user.email === ADMIN_EMAIL) {
    throw new Error('لا يمكن إيقاف حساب مدير النظام الرئيسي.');
  }

  // 1. Update in clients table if user belongs or matches email
  try {
    const clientUpdate: any = { status: newStatus };
    // Try updating status
    await supabase
      .from('clients')
      .update(clientUpdate)
      .eq('email', user.email.toLowerCase().trim());
  } catch (cErr) {
    console.warn('[userService] Notice updating client status:', cErr);
  }

  // 2. Update in providers table if user belongs or matches email
  try {
    const provStatus = newSuspended ? 'suspended' : 'approved';
    await supabase
      .from('providers')
      .update({ status: provStatus })
      .eq('email', user.email.toLowerCase().trim());
  } catch (pErr) {
    console.warn('[userService] Notice updating provider status:', pErr);
  }

  return {
    ...user,
    status: newStatus,
    is_suspended: newSuspended,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const allUsers = await getUsers();
  return allUsers.find((u) => u.id === id) || null;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const email = data.email.toLowerCase().trim();
  const newUser: User = {
    ...data,
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: data.status || 'active',
    is_suspended: data.status === 'suspended',
  };

  // Insert into clients table
  try {
    await supabase.from('clients').insert([
      {
        full_name: data.name,
        email,
        phone_number: data.phone || '01000000000',
        company_name: data.organization || null,
        status: data.status || 'active',
        active_modules: data.role === 'provider' ? ['client', 'provider'] : ['client'],
      },
    ]);
  } catch (err) {
    console.warn('[userService] Insert into clients notice:', err);
  }

  return newUser;
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  const allUsers = await getUsers();
  const existing = allUsers.find((u) => u.id === id);

  const updated: User = {
    id,
    name: data.name || existing?.name || '',
    email: data.email || existing?.email || '',
    role: data.role || existing?.role || 'customer',
    status: data.status || existing?.status || 'active',
    organization: data.organization !== undefined ? data.organization : existing?.organization,
    phone: data.phone !== undefined ? data.phone : existing?.phone,
    createdAt: existing?.createdAt || new Date().toISOString(),
    sourceTable: existing?.sourceTable,
    is_suspended: data.status === 'suspended',
  };

  // Persist to Supabase
  if (updated.email) {
    try {
      await supabase
        .from('clients')
        .update({
          full_name: updated.name,
          phone_number: updated.phone,
          company_name: updated.organization,
          status: updated.status,
        })
        .eq('email', updated.email.toLowerCase().trim());
    } catch {}

    try {
      await supabase
        .from('providers')
        .update({
          name: updated.name,
          phone: updated.phone,
          status: updated.status === 'suspended' ? 'suspended' : 'approved',
        })
        .eq('email', updated.email.toLowerCase().trim());
    } catch {}
  }

  return updated;
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await supabase.from('clients').delete().eq('id', userId);
  } catch {}

  try {
    await supabase.from('providers').delete().eq('id', userId);
  } catch {}
}
