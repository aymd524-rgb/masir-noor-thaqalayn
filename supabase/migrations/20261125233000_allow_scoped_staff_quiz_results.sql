-- Let institute staff view quiz results only within their legitimate scope.
-- Quiz creators, students viewing their own attempts, and system admins retain
-- the existing policy. This adds assigned teachers and institute managers.
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
    join public.classes cl on cl.course_id = q.course_id
    where q.id = quiz_attempts.quiz_id
      and cl.teacher_id = (select auth.uid())
      and cl.is_active is true
      and private.is_institute_member(cl.institute_id, array['teacher','owner','manager'])
  )
);

comment on policy quiz_attempts_select_assigned_institute_staff on public.quiz_attempts is
  'Allows active institute owners/managers to review institute quiz results and assigned teachers to review results for their active classes.';
