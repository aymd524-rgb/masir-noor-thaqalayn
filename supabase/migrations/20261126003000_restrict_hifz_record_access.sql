-- Restrictive RLS boundaries for hifz records.
-- These AND with all permissive policies, preventing older broad policies
-- from exposing another student's memorization and assessment history.
drop policy if exists hifz_records_select_boundary on public.hifz_records;
create policy hifz_records_select_boundary
on public.hifz_records
as restrictive for select to authenticated
using (
  private.owns_enrollment(enrollment_id)
  or private.can_manage_enrollment(enrollment_id)
  or private.is_admin()
);

drop policy if exists hifz_records_insert_boundary on public.hifz_records;
create policy hifz_records_insert_boundary
on public.hifz_records
as restrictive for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and (private.can_manage_enrollment(enrollment_id) or private.is_admin())
);

drop policy if exists hifz_records_update_boundary on public.hifz_records;
create policy hifz_records_update_boundary
on public.hifz_records
as restrictive for update to authenticated
using (private.can_manage_enrollment(enrollment_id) or private.is_admin())
with check (
  recorded_by = (select auth.uid())
  and (private.can_manage_enrollment(enrollment_id) or private.is_admin())
);

drop policy if exists hifz_records_delete_boundary on public.hifz_records;
create policy hifz_records_delete_boundary
on public.hifz_records
as restrictive for delete to authenticated
using (private.is_admin());

comment on policy hifz_records_select_boundary on public.hifz_records is
  'Restricts hifz record reads to the student owner, assigned enrollment managers, or system admins.';
comment on policy hifz_records_insert_boundary on public.hifz_records is
  'Restricts new hifz records to authorized enrollment managers and requires recorded_by to match the caller.';
comment on policy hifz_records_update_boundary on public.hifz_records is
  'Restricts hifz record updates to authorized enrollment managers and prevents recorded_by reassignment.';
comment on policy hifz_records_delete_boundary on public.hifz_records is
  'Restricts deletion of hifz records to system administrators.';
