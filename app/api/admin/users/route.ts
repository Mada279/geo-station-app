import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/serverAuth';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { User } from '@/types/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx || ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    const usersMap = new Map<string, User>();

    // 1. Fetch platform admins table
    const { data: padmins } = await supabaseAdmin.from('platform_admins').select('*');
    const adminEmailMap = new Map<string, any>();
    (padmins || []).forEach((pa: any) => {
      const email = (pa.email || '').toLowerCase().trim();
      if (email) adminEmailMap.set(email, pa);
    });

    // 2. Fetch all auth.users to inspect metadata and roles
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) {
      console.warn('[api/admin/users] Error listing auth users:', authErr.message);
    }

    const authUsers = authData?.users || [];

    // Register admins from auth.users and platform_admins
    for (const authUser of authUsers) {
      const email = (authUser.email || '').toLowerCase().trim();
      if (!email) continue;

      const pa = adminEmailMap.get(email);
      const appRole = authUser.app_metadata?.role;
      const userRole = authUser.user_metadata?.role;
      const isAdmin =
        Boolean(pa) ||
        appRole === 'admin' ||
        userRole === 'admin' ||
        authUser.id === '80efaff5-8e2a-4479-b63e-c8ae9359d71e' ||
        email === 'ahmed@survsta.com';

      if (isAdmin) {
        usersMap.set(email, {
          id: authUser.id, // Preserves the exact Auth UID (e.g. 80efaff5-8e2a-4479-b63e-c8ae9359d71e)
          name:
            authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            pa?.full_name ||
            'مدير المنصة',
          email: authUser.email || email,
          role: 'admin',
          status: pa?.is_active === false ? 'suspended' : 'active',
          organization: 'إدارة منصة Survsta',
          phone: authUser.phone || authUser.user_metadata?.phone || '',
          createdAt: authUser.created_at || new Date().toISOString(),
          sourceTable: 'platform_admins',
          is_suspended: pa?.is_active === false,
        });
      }
    }

    // Add any platform_admins not found in auth.users
    adminEmailMap.forEach((pa, email) => {
      if (!usersMap.has(email)) {
        usersMap.set(email, {
          id: pa.id || `admin_${email}`,
          name: pa.full_name || 'مدير المنصة',
          email: pa.email,
          role: 'admin',
          status: pa.is_active ? 'active' : 'suspended',
          organization: 'إدارة منصة Survsta',
          createdAt: pa.created_at || new Date().toISOString(),
          sourceTable: 'platform_admins',
          is_suspended: !pa.is_active,
        });
      }
    });

    // 3. Fetch clients
    const { data: clientsData, error: clientsErr } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsErr) {
      console.warn('[api/admin/users] Error fetching clients:', clientsErr.message);
    } else if (clientsData) {
      clientsData.forEach((c: any) => {
        const email = (c.email || '').toLowerCase().trim();
        if (!email) return;

        const existing = usersMap.get(email);
        if (existing && existing.role === 'admin') {
          // Keep admin role, enrich with phone / organization if missing
          usersMap.set(email, {
            ...existing,
            organization: existing.organization || c.company_name || c.category,
            phone: existing.phone || (c.phone_number ? String(c.phone_number) : ''),
          });
          return;
        }

        let role: 'admin' | 'provider' | 'customer' = 'customer';
        if (Array.isArray(c.active_modules) && c.active_modules.includes('provider')) {
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

    // 4. Fetch providers
    const { data: providersData, error: provErr } = await supabaseAdmin
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (provErr) {
      console.warn('[api/admin/users] Error fetching providers:', provErr.message);
    } else if (providersData) {
      providersData.forEach((p: any) => {
        const email = (p.email || '').toLowerCase().trim();
        if (!email) return;

        const isSuspended = p.status === 'suspended';
        const existing = usersMap.get(email);

        if (existing) {
          if (existing.role === 'admin') {
            usersMap.set(email, {
              ...existing,
              organization: existing.organization || p.name || p.location,
              phone: existing.phone || (p.phone ? String(p.phone) : ''),
            });
          } else {
            usersMap.set(email, {
              ...existing,
              name: p.name || existing.name,
              role: 'provider',
              organization: p.name || p.location || existing.organization,
              phone: p.phone ? String(p.phone) : existing.phone,
              status: isSuspended || existing.is_suspended ? 'suspended' : existing.status,
              is_suspended: isSuspended || existing.is_suspended,
            });
          }
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

    return NextResponse.json({ users: Array.from(usersMap.values()) });
  } catch (err: any) {
    console.error('[api/admin/users] Fatal error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
