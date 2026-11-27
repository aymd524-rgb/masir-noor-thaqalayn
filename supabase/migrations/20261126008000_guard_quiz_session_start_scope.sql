-- Prevent the SECURITY DEFINER start-quiz RPC from creating sessions for
-- published course quizzes outside the caller's active institute.
-- RLS on quizzes/questions does not automatically apply inside a definer RPC.
create or replace function private.guard_quiz_session_start_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
  quiz_row record;
begin
  if caller_id is null or new.student_id is distinct from caller_id then
    raise exception 'quiz session must belong to the signed-in student'
      using errcode = '42501';
  end if;

  select q.is_published, q.course_id
    into quiz_row
  from public.quizzes q
  where q.id = new.quiz_id;

  if not found or quiz_row.is_published is not true then
    raise exception 'published quiz not found'
      using errcode = '42501';
  end if;

  -- Standalone published quizzes are available to authenticated students.
  -- Course quizzes require an active course, active institute, and active
  -- institute membership; otherwise a student could lock an unseen quiz
  -- against edits by calling the SECURITY DEFINER RPC with a guessed UUID.
  if quiz_row.course_id is not null and not exists (
    select 1
    from public.courses co
    join public.institutions i on i.id = co.institute_id
    where co.id = quiz_row.course_id
      and co.is_active is true
      and i.is_active is true
      and private.is_institute_member(co.institute_id)
  ) then
    raise exception 'active membership in the quiz institute is required'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_quiz_session_start_scope()
  from public, anon, authenticated;

drop trigger if exists quiz_attempt_sessions_guard_scope
  on public.quiz_attempt_sessions;
create trigger quiz_attempt_sessions_guard_scope
before insert on public.quiz_attempt_sessions
for each row execute function private.guard_quiz_session_start_scope();

comment on function private.guard_quiz_session_start_scope() is
  'Verifies caller identity and active institute access for new timed quiz sessions created by the SECURITY DEFINER RPC.';
