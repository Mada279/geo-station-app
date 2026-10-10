-- ============================================================================
-- Migration: 0002_platform_admins_policy.sql
-- Purpose: Allow authenticated admin users to SELECT from public.platform_admins
-- ============================================================================

-- 1. Grant SELECT privilege to authenticated users on platform_admins
grant select on table public.platform_admins to authenticated;

-- 2. Create RLS policy allowing platform admins or specific admin UID to select all rows
drop policy if exists "platform_admins: authenticated admins can select" on public.platform_admins;

create policy "platform_admins: authenticated admins can select"
  on public.platform_admins
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or auth.uid() = '80efaff5-8e2a-4479-b63e-c8ae9359d71e'::uuid
  );
