-- ============================================================================
-- SURVSTA — Migration 0001 ROLLBACK
-- Restores the pre-hardening state: permissive USING (true) policies, full
-- grants for anon/authenticated and public storage buckets.
-- USE ONLY FOR EMERGENCY RECOVERY. This re-opens every hole 0001 closed.
-- ============================================================================

begin;

-- policies -------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname not like '%\_all' escape '\'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  for r in
    select schemaname, policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

drop trigger if exists trg_guard_orders_update on public.orders;
drop function if exists public.guard_orders_update();
drop function if exists public.is_platform_admin();
drop function if exists public.current_provider_id();
drop function if exists public.current_client_id();
drop table if exists public.platform_admins;

-- original permissive policies ----------------------------------------------
create policy global_announcements_all    on public.global_announcements    for all to public using (true) with check (true);
create policy inapp_notifications_all     on public.inapp_notifications     for all to public using (true) with check (true);
create policy kyc_requests_all            on public.kyc_requests            for all to public using (true) with check (true);
create policy lead_tracking_all           on public.lead_tracking           for all to public using (true) with check (true);
create policy manual_payment_requests_all on public.manual_payment_requests for all to public using (true) with check (true);
create policy orders_all                  on public.orders                  for all to public using (true) with check (true);
create policy services_all                on public.services                for all to public using (true) with check (true);
create policy stolen_registry_all         on public.stolen_registry         for all to public using (true) with check (true);
create policy wallet_transactions_all     on public.wallet_transactions     for all to public using (true) with check (true);

-- original grants -----------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['providers','clients','equipment','orders','services',
                           'kyc_requests','wallet_transactions','manual_payment_requests',
                           'lead_tracking','stolen_registry','inapp_notifications',
                           'global_announcements','ad_banners','platform_settings']
  loop
    execute format('grant all on public.%I to anon, authenticated', t);
  end loop;
end $$;

-- original storage ----------------------------------------------------------
update storage.buckets set public = true;

create policy "Allow Upload to Public Buckets" on storage.objects
  for insert to public with check (bucket_id in
  ('equipment-images','provider-images','attachments','payment-receipts','receipts','ads','calibration-certs','kyc-documents','resumes'));

create policy "Public Access for Public Buckets" on storage.objects
  for select to public using (bucket_id in
  ('equipment-images','provider-images','attachments','payment-receipts','receipts','ads','calibration-certs','kyc-documents','resumes'));

create policy "Allow Update to Public Buckets" on storage.objects
  for update to public using (bucket_id in
  ('equipment-images','provider-images','attachments','payment-receipts','receipts','ads','calibration-certs','kyc-documents','resumes'));

create policy "Allow Delete to Public Buckets" on storage.objects
  for delete to public using (bucket_id in
  ('equipment-images','provider-images','attachments','payment-receipts','receipts','ads','calibration-certs','kyc-documents','resumes'));

commit;
