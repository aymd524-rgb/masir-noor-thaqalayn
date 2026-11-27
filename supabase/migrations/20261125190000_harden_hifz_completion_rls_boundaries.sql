-- AND completion access with restrictive policies so any older/future broad
-- permissive policy cannot expose or alter another student's submission.
drop policy if exists hifz_completion_select_boundary on public.hifz_assignment_completions;
drop policy if exists hifz_completion_insert_boundary on public.hifz_assignment_completions;
drop policy if exists hifz_completion_update_boundary on public.hifz_assignment_completions;

create policy hifz_completion_select_boundary
on public.hifz_assignment_completions
as restrictive for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (
    select 1
    from public.hifz_assignments a
    where a.id = assignment_id
      and (private.can_manage_enrollment(a.enrollment_id) or private.is_admin())
  )
);

create policy hifz_completion_insert_boundary
on public.hifz_assignment_completions
as restrictive for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1
    from public.hifz_assignments a
    where a.id = assignment_id
      and private.owns_enrollment(a.enrollment_id)
  )
);

create policy hifz_completion_update_boundary
on public.hifz_assignment_completions
as restrictive for update to authenticated
using (student_id = (select auth.uid()))
with check (
  student_id = (select auth.uid())
  and exists (
    select 1
    from public.hifz_assignments a
    where a.id = assignment_id
      and private.owns_enrollment(a.enrollment_id)
  )
);

comment on policy hifz_completion_select_boundary on public.hifz_assignment_completions is
  'Restricts completion visibility to its student, assigned enrollment managers, or system admins.';
comment on policy hifz_completion_insert_boundary on public.hifz_assignment_completions is
  'Restricts completion creation to the authenticated student who owns the assigned enrollment.';
comment on policy hifz_completion_update_boundary on public.hifz_assignment_completions is
  'Restricts completion updates to its student and keeps assignment ownership valid.';
