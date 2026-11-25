-- Restrict quiz-attempt reads even when legacy permissive policies remain.
-- PostgreSQL ORs permissive policies; this restrictive policy ANDs with them.
drop policy if exists quiz_attempts_select_scope_boundary on public.quiz_attempts;

create policy quiz_attempts_select_scope_boundary
on public.quiz_attempts
as restrictive
for select
to authenticated
using (
  student_id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.quizzes q
    where q.id = quiz_attempts.quiz_id
      and q.course_id is null
      and q.created_by = (select auth.uid())
  )
  or exists (
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

comment on policy quiz_attempts_select_scope_boundary on public.quiz_attempts is
  'Restrictive read boundary: students see their own attempts, system admins retain access, standalone quiz creators see their own quiz results, institute managers see institute results, and teachers see results only for active assigned classes.';
