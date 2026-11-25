-- Keep published course quizzes private to their active institute.
-- Standalone published quizzes remain available as public quizzes.
-- Restrictive policies AND with legacy permissive policies to prevent a broad
-- older SELECT policy from leaking course questions across institute boundaries.

drop policy if exists quizzes_course_read_boundary on public.quizzes;
create policy quizzes_course_read_boundary
on public.quizzes
as restrictive
for select
to authenticated
using (
  (select private.is_admin())
  or created_by = (select auth.uid())
  or (
    is_published is true
    and (
      course_id is null
      or exists (
        select 1
        from public.courses co
        join public.institutions i on i.id = co.institute_id
        where co.id = quizzes.course_id
          and co.is_active is true
          and i.is_active is true
          and private.is_institute_member(co.institute_id)
      )
    )
  )
);

drop policy if exists quiz_questions_course_read_boundary on public.quiz_questions;
create policy quiz_questions_course_read_boundary
on public.quiz_questions
as restrictive
for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and (
        (select private.is_admin())
        or q.created_by = (select auth.uid())
        or (
          q.is_published is true
          and (
            q.course_id is null
            or exists (
              select 1
              from public.courses co
              join public.institutions i on i.id = co.institute_id
              where co.id = q.course_id
                and co.is_active is true
                and i.is_active is true
                and private.is_institute_member(co.institute_id)
            )
          )
        )
      )
  )
);

comment on policy quizzes_course_read_boundary on public.quizzes is
  'Restricts published course quiz metadata to active members of its active institute; standalone published quizzes remain public to authenticated users.';
comment on policy quiz_questions_course_read_boundary on public.quiz_questions is
  'Restricts course quiz questions to active institute members while retaining owner/admin and standalone published quiz access.';
