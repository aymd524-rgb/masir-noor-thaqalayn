-- Restrict assignment edits to the assigning teacher or an administrator.
-- The original policy allowed any teacher managing an enrollment to change
-- assigned_by on another teacher's assignment.
drop policy if exists hifz_assignments_teacher_update on public.hifz_assignments;
create policy hifz_assignments_teacher_update on public.hifz_assignments
for update to authenticated
using (
  (assigned_by = (select auth.uid()) and private.can_manage_enrollment(enrollment_id))
  or private.is_admin()
)
with check (
  (assigned_by = (select auth.uid()) and private.can_manage_enrollment(enrollment_id))
  or private.is_admin()
);
