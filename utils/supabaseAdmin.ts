import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey) {
  // Fail loudly instead of silently degrading to the anon key: the service role
  // bypasses RLS, so a wrong key here would look like "no data" rather than an error.
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Server-only database access is disabled.');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
