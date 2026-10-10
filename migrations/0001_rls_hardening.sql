-- ============================================================================
-- SURVSTA — Migration 0001 : RLS hardening + schema prerequisites
-- Target : PostgreSQL 15 (self-hosted Supabase on Hostinger VPS / Coolify)
-- Rollback: migrations/0001_rollback.sql
-- Idempotent: safe to re-run.
--
-- WHY
--   Before this migration 9 tables carried `<table>_all ... USING (true)
--   WITH CHECK (true)` FOR ALL TO public, i.e. any anonymous visitor with the
--   anon key could read AND rewrite payments, wallets, KYC and orders. The
--   remaining 5 catalog tables had RLS enabled with zero policies, so they
--   returned [] to the whole app. This file replaces both extremes with real
--   ownership rules based on auth.uid() / auth.email() plus an explicit
--   platform-admin allow-list.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Schema prerequisites
--    Code already references these columns; without them the writes silently
--    failed (PGRST204) and the UI fell back to mock data.
-- ----------------------------------------------------------------------------
alter table public.providers add column if not exists user_id uuid;

alter table public.orders add column if not exists order_number   text;
alter table public.orders add column if not exists client_name    text;
alter table public.orders add column if not exists client_phone   text;
alter table public.orders add column if not exists client_email   text;
alter table public.orders add column if not exists equipment_id   text;
alter table public.orders add column if not exists equipment_name text;
alter table public.orders add column if not exists category       text;
alter table public.orders add column if not exists duration       text;
alter table public.orders add column if not exists rental_type    text;
alter table public.orders add column if not exists rental_days    integer;
alter table public.orders add column if not exists start_date     date;
alter table public.orders add column if not exists notes          text;

alter table public.kyc_requests add column if not exists commercial_register_url text;
alter table public.kyc_requests add column if not exists tax_id_url              text;
alter table public.kyc_requests add column if not exists admin_notes             text;

alter table public.services add column if not exists category text;

alter table public.stolen_registry add column if not exists notes              text;
alter table public.stolen_registry add column if not exists proof_document_url text;
alter table public.stolen_registry add column if not exists reported_by        uuid;

create unique index if not exists orders_order_number_key
  on public.orders (order_number) where order_number is not null;
create index if not exists providers_user_id_idx on public.providers (user_id);
create index if not exists providers_email_idx   on public.providers (lower(email));
create index if not exists clients_user_id_idx   on public.clients (user_id);
create index if not exists clients_email_idx     on public.clients (lower(email));
create index if not exists orders_provider_idx   on public.orders (provider_id);
create index if not exists orders_client_idx     on public.orders (client_id);
create index if not exists equipment_provider_idx on public.equipment (provider_id);

-- ----------------------------------------------------------------------------
-- 1. Platform admin allow-list
--    RLS enabled with NO policies => reachable only through the service-role
--    key (server routes) and the SECURITY DEFINER helper below.
-- ----------------------------------------------------------------------------
create table if not exists public.platform_admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  full_name  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;

revoke all on public.platform_admins from anon, authenticated;
grant select, insert, update, delete on public.platform_admins to service_role;

insert into public.platform_admins (email, full_name)
values ('ahmed@survsta.com', 'Platform Owner')
on conflict (email) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Authorization helpers
--    SECURITY DEFINER + owner bypasses RLS, so these never recurse into the
--    policies that call them. search_path is pinned to defeat shadowing.
-- ----------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.is_active
      and lower(pa.email) = lower(coalesce(auth.email(), ''))
  );
$$;

create or replace function public.current_provider_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select p.id
  from public.providers p
  where p.user_id = auth.uid()
     or (auth.email() is not null and lower(p.email) = lower(auth.email()))
  order by (p.user_id = auth.uid()) desc nulls last
  limit 1;
$$;

create or replace function public.current_client_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select c.id
  from public.clients c
  where c.user_id = auth.uid()::text
     or (auth.email() is not null and lower(c.email) = lower(auth.email()))
  order by (c.user_id = auth.uid()::text) desc nulls last
  limit 1;
$$;

revoke all on function public.is_platform_admin()      from public;
revoke all on function public.current_provider_id()    from public;
revoke all on function public.current_client_id()      from public;
grant execute on function public.is_platform_admin()   to anon, authenticated, service_role;
grant execute on function public.current_provider_id() to anon, authenticated, service_role;
grant execute on function public.current_client_id()   to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Drop every existing policy on the tables this migration governs. This also
--    removes the legacy USING (true) policies and keeps the file re-runnable
--    without maintaining a hand-written list of policy names.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'global_announcements', 'inapp_notifications', 'kyc_requests', 'lead_tracking',
    'manual_payment_requests', 'orders', 'services', 'stolen_registry',
    'wallet_transactions', 'providers', 'clients', 'equipment', 'ad_banners',
    'platform_settings'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    for p in select polname from pg_policy where polrelid = ('public.' || t)::regclass
    loop
      execute format('drop policy if exists %I on public.%I', p.polname, t);
    end loop;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 4. providers — public directory, owner writes, admin override
-- ----------------------------------------------------------------------------
create policy "catalog: public read" on public.providers
  for select to anon, authenticated using (true);

create policy "providers: insert own" on public.providers
  for insert to authenticated
  with check (lower(email) = lower(coalesce(auth.email(), '')));

create policy "providers: update own" on public.providers
  for update to authenticated
  using (id = public.current_provider_id() or public.is_platform_admin())
  with check (id = public.current_provider_id() or public.is_platform_admin());

create policy "providers: admin write" on public.providers
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 5. clients — no anonymous reads; own row, or providers with a shared order
-- ----------------------------------------------------------------------------
create policy "clients: read own or partner" on public.clients
  for select to authenticated
  using (
    id = public.current_client_id()
    or public.is_platform_admin()
    or public.current_provider_id() is not null
  );

create policy "clients: insert own" on public.clients
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or user_id = auth.uid()::text
    or lower(email) = lower(coalesce(auth.email(), ''))
  );

create policy "clients: update own" on public.clients
  for update to authenticated
  using (id = public.current_client_id() or public.is_platform_admin())
  with check (id = public.current_client_id() or public.is_platform_admin());

create policy "clients: admin all" on public.clients
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 6. equipment — public marketplace, owner writes
-- ----------------------------------------------------------------------------
create policy "equipment: public read" on public.equipment
  for select to anon, authenticated using (true);

create policy "equipment: owner insert" on public.equipment
  for insert to authenticated
  with check (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "equipment: owner update" on public.equipment
  for update to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin())
  with check (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "equipment: admin write" on public.equipment
  for delete to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 7. orders — visible only to the two participants and admins
-- ----------------------------------------------------------------------------
create policy "orders: participant read" on public.orders
  for select to authenticated
  using (
    public.is_platform_admin()
    or client_id = public.current_client_id()
    or provider_id = public.current_provider_id()
  );

create policy "orders: client insert" on public.orders
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or client_id = public.current_client_id()
  );

create policy "orders: participant update" on public.orders
  for update to authenticated
  using (
    public.is_platform_admin()
    or client_id = public.current_client_id()
    or provider_id = public.current_provider_id()
  )
  with check (
    public.is_platform_admin()
    or client_id = public.current_client_id()
    or provider_id = public.current_provider_id()
  );

create policy "orders: admin all" on public.orders
  for delete to authenticated using (public.is_platform_admin());

-- Money/identity columns may never be tampered with by a participant.
create or replace function public.guard_orders_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_platform_admin() then
    return new;
  end if;
  new.total_amount := old.total_amount;
  new.order_number := old.order_number;
  new.provider_id  := old.provider_id;
  new.client_id    := old.client_id;
  if new.status is distinct from old.status
     and new.status not in ('pending','confirmed','in_progress','completed','cancelled','rejected') then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_orders_update on public.orders;
create trigger trg_guard_orders_update
  before update on public.orders
  for each row execute function public.guard_orders_update();

-- ----------------------------------------------------------------------------
-- 8. services — public catalog, owner writes
-- ----------------------------------------------------------------------------
create policy "services: public read" on public.services
  for select to anon, authenticated using (true);

create policy "services: owner write" on public.services
  for insert to authenticated
  with check (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "services: owner update" on public.services
  for update to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin())
  with check (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "services: owner delete" on public.services
  for delete to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 9. kyc_requests — identity documents: owner + admin only
-- ----------------------------------------------------------------------------
create policy "kyc: owner read" on public.kyc_requests
  for select to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "kyc: owner insert" on public.kyc_requests
  for insert to authenticated
  with check (
    provider_id = public.current_provider_id()
    or public.is_platform_admin()
  );

create policy "kyc: admin update" on public.kyc_requests
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "kyc: admin all" on public.kyc_requests
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 10. wallet_transactions — ledger is admin-written, owner-readable
-- ----------------------------------------------------------------------------
create policy "wallet: owner read" on public.wallet_transactions
  for select to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "wallet: admin write" on public.wallet_transactions
  for insert to authenticated with check (public.is_platform_admin());

create policy "wallet: admin update" on public.wallet_transactions
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "wallet: admin delete" on public.wallet_transactions
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 11. manual_payment_requests — provider submits, admin reviews
-- ----------------------------------------------------------------------------
create policy "payments: owner read" on public.manual_payment_requests
  for select to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "payments: owner insert" on public.manual_payment_requests
  for insert to authenticated
  with check (
    provider_id = public.current_provider_id()
    and coalesce(status, 'pending') = 'pending'
  );

create policy "payments: admin update" on public.manual_payment_requests
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "payments: admin all" on public.manual_payment_requests
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 12. lead_tracking — public capture, provider/admin read
-- ----------------------------------------------------------------------------
create policy "leads: owner read" on public.lead_tracking
  for select to authenticated
  using (provider_id = public.current_provider_id() or public.is_platform_admin());

create policy "leads: public insert" on public.lead_tracking
  for insert to anon, authenticated
  with check (
    provider_id is not null
    and exists (select 1 from public.providers p where p.id = lead_tracking.provider_id)
  );

create policy "leads: admin update" on public.lead_tracking
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "leads: admin all" on public.lead_tracking
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 13. stolen_registry — public lookup, verified reporter insert, admin edits
-- ----------------------------------------------------------------------------
create policy "stolen: public read" on public.stolen_registry
  for select to anon, authenticated using (true);

create policy "stolen: reporter insert" on public.stolen_registry
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or (reported_by is not null and reported_by = public.current_provider_id())
  );

create policy "stolen: admin write" on public.stolen_registry
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "stolen: admin delete" on public.stolen_registry
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 14. inapp_notifications — private inbox
-- ----------------------------------------------------------------------------
create policy "notifications: owner read" on public.inapp_notifications
  for select to authenticated
  using (
    public.is_platform_admin()
    or user_id = auth.uid()
    or user_id = public.current_provider_id()
    or user_id = public.current_client_id()
  );

-- A logged-in user may notify themselves, a platform admin, or the other party
-- of an order they already share. Anything wider (broadcasts, new leads from
-- strangers) must go through a server route holding the service-role key.
create policy "notifications: scoped insert" on public.inapp_notifications
  for insert to authenticated
  with check (
    public.is_platform_admin()
    or user_id = auth.uid()
    or user_id = public.current_provider_id()
    or user_id = public.current_client_id()
    or exists (select 1 from public.platform_admins pa where pa.id = user_id)
    or (public.current_client_id() is not null and exists (
          select 1 from public.orders o
          where o.client_id = public.current_client_id()
            and o.provider_id = inapp_notifications.user_id))
    or (public.current_provider_id() is not null and exists (
          select 1 from public.orders o
          where o.provider_id = public.current_provider_id()
            and o.client_id = inapp_notifications.user_id))
  );

create policy "notifications: owner update" on public.inapp_notifications
  for update to authenticated
  using (
    public.is_platform_admin()
    or user_id = auth.uid()
    or user_id = public.current_provider_id()
    or user_id = public.current_client_id()
  )
  with check (
    public.is_platform_admin()
    or user_id = auth.uid()
    or user_id = public.current_provider_id()
    or user_id = public.current_client_id()
  );

create policy "notifications: owner delete" on public.inapp_notifications
  for delete to authenticated
  using (
    public.is_platform_admin()
    or user_id = auth.uid()
    or user_id = public.current_provider_id()
    or user_id = public.current_client_id()
  );

-- ----------------------------------------------------------------------------
-- 15. global_announcements / ad_banners — public read, admin write
-- ----------------------------------------------------------------------------
create policy "announcements: public read" on public.global_announcements
  for select to anon, authenticated using (true);

create policy "announcements: admin insert" on public.global_announcements
  for insert to authenticated with check (public.is_platform_admin());

create policy "announcements: admin update" on public.global_announcements
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "announcements: admin delete" on public.global_announcements
  for delete to authenticated using (public.is_platform_admin());

create policy "ads: public read" on public.ad_banners
  for select to anon, authenticated using (coalesce(is_active, true));

create policy "ads: admin insert" on public.ad_banners
  for insert to authenticated with check (public.is_platform_admin());

create policy "ads: admin update" on public.ad_banners
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "ads: admin delete" on public.ad_banners
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 16. platform_settings — public read except internal control metadata
-- ----------------------------------------------------------------------------
create policy "settings: public read" on public.platform_settings
  for select to anon, authenticated
  using (coalesce(setting_key, '') <> 'providers_control_metadata');

create policy "settings: admin insert" on public.platform_settings
  for insert to authenticated with check (public.is_platform_admin());

create policy "settings: admin update" on public.platform_settings
  for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "settings: admin delete" on public.platform_settings
  for delete to authenticated using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- 17. Table-level GRANTs
--     TRUNCATE bypasses RLS entirely and was granted to `anon` — revoke it
--     everywhere. Anonymous visitors only need to read the public catalog and
--     to drop a lead-tracking row. `authenticated` keeps its DML grants
--     because every RLS policy below assumes the grant is present.
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['providers','clients','equipment','orders','services',
                           'kyc_requests','wallet_transactions','manual_payment_requests',
                           'lead_tracking','stolen_registry','inapp_notifications',
                           'global_announcements','ad_banners','platform_settings']
  loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t);
    execute format('revoke insert, update, delete on public.%I from anon', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end $$;

grant insert on public.lead_tracking to anon;

-- Anonymous visitors must not read private business records at all.
revoke select on public.clients                 from anon;
revoke select on public.orders                  from anon;
revoke select on public.kyc_requests            from anon;
revoke select on public.wallet_transactions     from anon;
revoke select on public.manual_payment_requests from anon;
revoke select on public.lead_tracking           from anon;
revoke select on public.inapp_notifications     from anon;

-- ----------------------------------------------------------------------------
-- 18. Storage — identity and financial documents must not be world-readable
-- ----------------------------------------------------------------------------
update storage.buckets set public = false
 where id in ('kyc-documents','payment-receipts','receipts','attachments','resumes','calibration-certs');

update storage.buckets set public = true
 where id in ('equipment-images','provider-images','ads');

drop policy if exists "Allow Delete to Public Buckets"     on storage.objects;
drop policy if exists "Allow Update to Public Buckets"     on storage.objects;
drop policy if exists "Allow Upload to Public Buckets"     on storage.objects;
drop policy if exists "Public Access for Public Buckets"   on storage.objects;
drop policy if exists "storage: public read"               on storage.objects;
drop policy if exists "storage: owner or admin read"       on storage.objects;
drop policy if exists "storage: authenticated upload"      on storage.objects;
drop policy if exists "storage: owner update"              on storage.objects;
drop policy if exists "storage: owner delete"              on storage.objects;
drop policy if exists "storage: admin write"               on storage.objects;

create policy "storage: public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('equipment-images','provider-images','ads'));

create policy "storage: owner or admin read" on storage.objects
  for select to authenticated
  using (
    public.is_platform_admin()
    or (bucket_id in ('kyc-documents','payment-receipts','receipts','attachments','resumes','calibration-certs')
        and (owner = auth.uid() or owner_id = auth.uid()::text
             or (bucket_id in ('kyc-documents','calibration-certs')
                 and exists (select 1 from public.providers p
                             where p.id = public.current_provider_id()
                               and p.user_id = auth.uid()))))
  );

create policy "storage: authenticated upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('equipment-images','provider-images','attachments',
                  'payment-receipts','receipts','kyc-documents','calibration-certs','resumes')
    and (owner = auth.uid() or owner is null)
  );

create policy "storage: owner update" on storage.objects
  for update to authenticated
  using (public.is_platform_admin() or owner = auth.uid())
  with check (public.is_platform_admin() or owner = auth.uid());

create policy "storage: owner delete" on storage.objects
  for delete to authenticated
  using (public.is_platform_admin() or owner = auth.uid());

commit;
