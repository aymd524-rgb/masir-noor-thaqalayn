-- Narrow assigned-teacher result access to active, institute-consistent classes.
-- Institute owners/managers retain institute-wide review access.
drop policy if exists quiz_attempts_select_assigned_institute_staff on public.quiz_attempts;

create policy quiz_attempts_select_assigned_institute_staff
on public.quiz_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    join public.courses co on co.id = q.course_id
    where q.id = quiz_attempts.quiz_id
      and private.is_institute_member(co.institute_id, array['owner','manager'])
  )
  or exists (
    select 1
    from public.quizzes q
    join public.courses co on co.id = q.course_id
    join public.classes cl on cl.course_id = co.id
      and cl.institute_id = co.institute_id
    join public.institutions i on i.id = co.institute_id
    where q.id = quiz_attempts.quiz_id
      and cl.teacher_id = (select auth.uid())
      and cl.is_active is true
      and co.is_active is true
      and i.is_active is true
      and private.is_institute_member(co.institute_id, array['teacher','owner','manager'])
  )
);

comment on policy quiz_attempts_select_assigned_institute_staff on public.quiz_attempts is
  'Allows active institute owners/managers to review institute quiz results and assigned teachers to review results for active classes in active courses and institutions.';
