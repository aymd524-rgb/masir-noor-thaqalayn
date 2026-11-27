-- Restrictive RLS boundary for private contact data.
-- Older permissive policies must not broaden direct contact-table access;
-- administrator access remains available only through the guarded RPCs.
drop policy if exists profile_contacts_select_boundary on public.profile_contacts;
create policy profile_contacts_select_boundary
on public.profile_contacts
as restrictive for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists profile_contacts_insert_boundary on public.profile_contacts;
create policy profile_contacts_insert_boundary
on public.profile_contacts
as restrictive for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists profile_contacts_update_boundary on public.profile_contacts;
create policy profile_contacts_update_boundary
on public.profile_contacts
as restrictive for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

comment on policy profile_contacts_select_boundary on public.profile_contacts is
  'Direct reads are restricted to the authenticated owner; administrators use guarded contact RPCs.';
comment on policy profile_contacts_insert_boundary on public.profile_contacts is
  'Direct contact inserts must belong to the authenticated owner.';
comment on policy profile_contacts_update_boundary on public.profile_contacts is
  'Direct contact updates cannot read or reassign another users contact row.';
