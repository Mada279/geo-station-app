import { User, CreateUserInput, UpdateUserInput } from '@/types/user';
import { supabase } from '@/utils/supabaseClient';
import { setProviderSuspension } from '@/services/providerControlService';

/**
 * Platform administrators are rows in `platform_admins`, not hardcoded
 * credentials. Seeding is done by `scripts/provision-admin.mjs`.
 */
export async function getPlatformAdminEmails(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('platform_admins').select('email');
    if (error || !data) return [];
    return data.map((row: any) => String(row.email).toLowerCase().trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Fetch all registered users dynamically from Supabase (clients + providers + admins)
 */
export async function getUsers(): Promise<User[]> {
  // 0. Use secure API route if in browser to guarantee admin permissions and auth.users role mapping
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.users)) {
          return json.users;
        }
      }
    } catch (apiErr) {
      console.warn('[userService] Failed to fetch users via API route, falling back to direct query:', apiErr);
    }
  }

  try {
    const usersMap = new Map<string, User>();

    const adminEmails = await getPlatformAdminEmails();

    // 1. Platform administrators
    for (const email of adminEmails) {
      usersMap.set(email, {
        id: `admin_${email}`,
        name: 'مدير المنصة',
        email,
        role: 'admin',
        status: 'active',
        organization: 'إدارة منصة Survsta',
        createdAt: new Date().toISOString(),
        sourceTable: 'platform_admins',
        is_suspended: false,
      });
    }

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

        const isAdmin = adminEmails.includes(email);
        let role: 'admin' | 'provider' | 'customer' = 'customer';
        if (isAdmin) {
          role = 'admin';
        } else if (Array.isArray(c.active_modules) && c.active_modules.includes('provider')) {
          role = 'provider';
        }

        const isSuspended = c.status === 'suspended';

        usersMap.set(email, {
          id: String(c.id),
          name: c.full_name || 'عميل مسجل',
          email: c.email,
          role,
          status: isSuspended ? 'suspended' : c.status === 'pending' ? 'pending' : 'active',
          organization: c.company_name || c.category || '—',
          phone: c.phone_number ? String(c.phone_number) : '',
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

        const isSuspended = p.status === 'suspended';

        // If user already exists as client, merge information with provider precedence
        const existing = usersMap.get(email);
        if (existing) {
          usersMap.set(email, {
            ...existing,
            name: p.name || existing.name,
            role: existing.role === 'admin' ? 'admin' : 'provider',
            organization: p.name || p.location || existing.organization,
            phone: p.phone ? String(p.phone) : existing.phone,
            status: isSuspended || existing.is_suspended ? 'suspended' : existing.status,
            is_suspended: isSuspended || existing.is_suspended,
          });
        } else {
          usersMap.set(email, {
            id: String(p.id),
            name: p.name || 'مزوّد خدمة',
            email: p.email,
            role: 'provider',
            status: isSuspended ? 'suspended' : p.status === 'pending' ? 'pending' : 'active',
            organization: p.name || p.location || 'مكتب مساحي معتمد',
            phone: p.phone ? String(p.phone) : '',
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
    return [];
  }
}

/**
 * Toggle user account status between active and suspended
 */
export async function toggleUserSuspension(user: User): Promise<User> {
  const isCurrentlySuspended = user.status === 'suspended' || user.is_suspended === true;
  const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
  const newSuspended = !isCurrentlySuspended;

  const adminEmails = await getPlatformAdminEmails();
  if (adminEmails.includes((user.email || '').toLowerCase().trim())) {
    throw new Error('لا يمكن إيقاف حساب مدير المنصة.');
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  // 1. Update in clients table if user belongs or matches email
  try {
    await supabase.from('clients').update({ status: newStatus }).eq('email', normalizedEmail);
  } catch (cErr) {
    console.warn('[userService] Notice updating client status:', cErr);
  }

  // 2. Update in providers table if user belongs or matches email
  try {
    const provStatus = newSuspended ? 'suspended' : 'approved';
    await supabase.from('providers').update({ status: provStatus }).eq('email', normalizedEmail);
  } catch (pErr) {
    console.warn('[userService] Notice updating provider status:', pErr);
  }

  // 3. Keep suspension metadata synchronized
  if (user.id) {
    try {
      await setProviderSuspension({
        providerId: user.id,
        isSuspended: newSuspended,
        providerEmail: user.email,
        suspensionReason: newSuspended ? 'إيقاف إداري من لوحة المستخدمين' : null,
      });
    } catch {}
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

  const { data: inserted, error } = await supabase
    .from('clients')
    .insert([
      {
        full_name: data.name,
        email,
        phone_number: data.phone || null,
        company_name: data.organization || null,
        status: data.status || 'active',
        active_modules: data.role === 'provider' ? ['client', 'provider'] : ['client'],
      },
    ])
    .select('id, created_at')
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    id: String(inserted.id),
    createdAt: inserted.created_at || new Date().toISOString(),
    status: data.status || 'active',
    is_suspended: data.status === 'suspended',
    sourceTable: 'clients',
  };
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
    const normalizedEmail = updated.email.toLowerCase().trim();

    try {
      await supabase
        .from('clients')
        .update({
          full_name: updated.name,
          phone_number: updated.phone || null,
          company_name: updated.organization || null,
          status: updated.status,
        })
        .eq('email', normalizedEmail);
    } catch {}

    try {
      await supabase
        .from('providers')
        .update({
          name: updated.name,
          phone: updated.phone || null,
          status: updated.status === 'suspended' ? 'suspended' : 'approved',
        })
        .eq('email', normalizedEmail);
    } catch {}
  }

  return updated;
}

export async function deleteUser(userId: string): Promise<void> {
  const target = await getUserById(userId);
  if (!target) return;

  // Deleting by email would wipe a person's client *and* provider records with
  // one call, so scope each delete to the table the row actually came from.
  if (!target.sourceTable || target.sourceTable === 'clients') {
    const { error } = await supabase.from('clients').delete().eq('id', userId);
    if (error) console.warn('[userService] delete from clients:', error.message);
  }

  if (!target.sourceTable || target.sourceTable === 'providers') {
    const { error } = await supabase.from('providers').delete().eq('id', userId);
    if (error) console.warn('[userService] delete from providers:', error.message);
  }
}
