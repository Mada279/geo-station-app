#!/usr/bin/env node
/**
 * Provisions the platform owner inside Supabase Auth and registers the address
 * in `platform_admins`. Re-runnable — safe to execute again after migrating the
 * database to the Hostinger VPS.
 *
 * The password is never stored in this repository. Provide it per run:
 *
 *   ADMIN_EMAIL=you@survsta.com ADMIN_PASSWORD='...' node scripts/provision-admin.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the env
 * (or in .env.local, which Node 20+ loads with --env-file).
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_EMAIL || 'ahmed@survsta.com').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME || 'Platform Owner';

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!password || password.length < 10) {
  console.error('Set ADMIN_PASSWORD (min 10 chars) in the environment. It is never read from the repo.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: existing } = await admin.auth.admin.listUsers();
const found = (existing?.users || []).find((u) => (u.email || '').toLowerCase() === email);

let userId = found?.id;
if (found) {
  const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  console.log(error ? `Password update failed: ${error.message}` : `Updated existing auth user ${userId}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: fullName, role: 'admin' },
    app_metadata: { role: 'admin' },
  });
  if (error) {
    console.error(`createUser failed: ${error.message}`);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Created auth user ${userId}`);
}

const { error: adminRowError } = await admin.from('platform_admins').upsert(
  { email, full_name: fullName, is_active: true },
  { onConflict: 'email' },
);
console.log(adminRowError ? `platform_admins upsert failed: ${adminRowError.message}` : `platform_admins row ready for ${email}`);

// Link any pre-existing profile rows that share this address so
// current_provider_id() / current_client_id() resolve immediately.
const { data: prov } = await admin.from('providers').update({ user_id: userId }).ilike('email', email).select('id');
const { data: cli } = await admin.from('clients').update({ user_id: userId }).ilike('email', email).select('id');
console.log(`Linked providers: ${prov?.length || 0}, clients: ${cli?.length || 0}`);

console.log('\nAdmin ready. Sign in at /login with:');
console.log(`  email:    ${email}`);
console.log('  password: the value you passed in ADMIN_PASSWORD');
