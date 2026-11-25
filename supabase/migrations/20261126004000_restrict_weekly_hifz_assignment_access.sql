-- Restrictive boundaries for weekly hifz assignments.
-- Older permissive policies cannot widen assignment visibility or writes.
drop policy if exists hifz_assignments_select_boundary on public.hifz_assignments;
create policy hifz_assignments_select_boundary
on public.hifz_assignments
as restrictive for select to authenticated
using (
  private.owns_enrollment(enrollment_id)
  or private.can_manage_enrollment(enrollment_id)
  or private.is_admin()
);

drop policy if exists hifz_assignments_insert_boundary on public.hifz_assignments;
create policy hifz_assignments_insert_boundary
on public.hifz_assignments
as restrictive for insert to authenticated
with check (
  assigned_by = (select auth.uid())
  and (private.can_manage_enrollment(enrollment_id) or private.is_admin())
);

drop policy if exists hifz_assignments_update_boundary on public.hifz_assignments;
create policy hifz_assignments_update_boundary
on public.hifz_assignments
as restrictive for update to authenticated
using (private.can_manage_enrollment(enrollment_id) or private.is_admin())
with check (private.can_manage_enrollment(enrollment_id) or private.is_admin());

drop policy if exists hifz_assignments_delete_boundary on public.hifz_assignments;
create policy hifz_assignments_delete_boundary
on public.hifz_assignments
as restrictive for delete to authenticated
using (private.is_admin());

-- Students may only edit their own completion while it remains tied to an
-- assignment in their enrollment; only system administrators can delete.
drop policy if exists hifz_completion_delete_boundary on public.hifz_assignment_completions;
create policy hifz_completion_delete_boundary
on public.hifz_assignment_completions
as restrictive for delete to authenticated
using (private.is_admin());

comment on policy hifz_assignments_select_boundary on public.hifz_assignments is
  'Restricts assignment reads to enrolled students, assigned enrollment managers, or system admins.';
comment on policy hifz_assignments_insert_boundary on public.hifz_assignments is
  'Restricts assignment creation to authorized managers and requires assigned_by to match the caller.';
comment on policy hifz_assignments_update_boundary on public.hifz_assignments is
  'Restricts assignment updates to authorized enrollment managers or system admins.';
comment on policy hifz_assignments_delete_boundary on public.hifz_assignments is
  'Restricts assignment deletion to system administrators.';
comment on policy hifz_completion_delete_boundary on public.hifz_assignment_completions is
  'Restricts completion deletion to system administrators.';
