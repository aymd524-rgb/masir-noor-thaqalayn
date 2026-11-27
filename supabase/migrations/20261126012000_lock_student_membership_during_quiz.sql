-- Serialize course-quiz start/resume/submission against membership suspension,
-- role changes, and deletion. A FOR SHARE lock conflicts with membership UPDATE
-- and DELETE row locks and is held until the surrounding RPC transaction ends.
create or replace function private.lock_active_student_membership(p_institute_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or p_institute_id is null then
    return false;
  end if;

  perform 1
  from public.institute_memberships im
  where im.institute_id = p_institute_id
    and im.user_id = (select auth.uid())
    and im.role = 'student'
    and im.status = 'active'
  for share;

  return found;
end;
$function$;

revoke all on function private.lock_active_student_membership(uuid)
  from public, anon;
grant execute on function private.lock_active_student_membership(uuid)
  to authenticated;

-- Recheck and lock membership in the session INSERT trigger as a second
-- independent boundary, including any direct authenticated INSERT attempt.
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

  if quiz_row.course_id is not null and not exists (
    select 1
    from public.courses co
    join public.institutions i on i.id = co.institute_id
    where co.id = quiz_row.course_id
      and co.is_active is true
      and i.is_active is true
      and private.lock_active_student_membership(co.institute_id)
  ) then
    raise exception 'active student membership in the quiz institute is required'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_quiz_session_start_scope()
  from public, anon, authenticated;

-- start_quiz_attempt checks and locks membership before either resuming or
-- creating a session. The lock prevents a concurrent membership update from
-- completing until this transaction ends.
create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns table (session_id uuid, started_at timestamptz, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_session_id uuid;
  v_started_at timestamptz;
  v_expires_at timestamptz;
  v_submitted_at timestamptz;
  v_course_id uuid;
begin
  if v_user_id is null then
    raise exception 'برای شروع آزمون وارد حساب شوید.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user_id and p.role = 'student'
  ) then
    raise exception 'فقط دانش‌پژوه می‌تواند آزمون را شروع کند.';
  end if;

  select q.time_limit_min, q.course_id
    into v_duration, v_course_id
  from public.quizzes q
  where q.id = p_quiz_id and q.is_published = true
  for update;

  if not found then
    raise exception 'آزمون منتشرشده‌ای با این شناسه وجود ندارد.';
  end if;

  if v_course_id is not null and not exists (
    select 1
    from public.courses co
    join public.institutions i on i.id = co.institute_id
    where co.id = v_course_id
      and co.is_active is true
      and i.is_active is true
      and private.lock_active_student_membership(co.institute_id)
  ) then
    raise exception 'برای آزمون این دوره عضویت فعال دانش‌پژوه لازم است.';
  end if;

  select s.id, s.started_at, s.expires_at, s.submitted_at
    into v_session_id, v_started_at, v_expires_at, v_submitted_at
  from public.quiz_attempt_sessions s
  where s.quiz_id = p_quiz_id and s.student_id = v_user_id
  order by s.started_at desc
  limit 1
  for update;

  if found then
    if v_submitted_at is not null or exists (
      select 1 from public.quiz_attempts a
      where a.quiz_id = p_quiz_id and a.student_id = v_user_id
    ) then
      raise exception 'برای این آزمون قبلاً نتیجه ثبت شده است؛ امکان شروع دوباره وجود ندارد.';
    end if;

    if clock_timestamp() > v_expires_at + interval '15 seconds' then
      raise exception 'زمان جلسه قبلی به پایان رسیده است؛ امکان شروع مجدد وجود ندارد.';
    end if;

    return query select v_session_id, v_started_at, v_expires_at;
    return;
  end if;

  if exists (
    select 1 from public.quiz_attempts a
    where a.quiz_id = p_quiz_id and a.student_id = v_user_id
  ) then
    raise exception 'برای این آزمون قبلاً نتیجه ثبت شده است؛ امکان شروع دوباره وجود ندارد.';
  end if;

  v_started_at := clock_timestamp();
  v_expires_at := v_started_at + make_interval(mins => v_duration);

  insert into public.quiz_attempt_sessions
    (quiz_id, student_id, started_at, expires_at)
  values (p_quiz_id, v_user_id, v_started_at, v_expires_at)
  returning id into v_session_id;

  return query select v_session_id, v_started_at, v_expires_at;
end;
$function$;

revoke all on function public.start_quiz_attempt(uuid)
  from public, anon;
grant execute on function public.start_quiz_attempt(uuid)
  to authenticated;

-- Lock/recheck again at the final submit transition. If membership is suspended
-- first, submit fails; if submit acquires the lock first, suspension waits
-- until the submission transaction commits or rolls back.
create or replace function private.guard_quiz_session_submission_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  course_id uuid;
  institute_id uuid;
begin
  if old.submitted_at is null and new.submitted_at is not null then
    select q.course_id into course_id
    from public.quizzes q
    where q.id = new.quiz_id and q.is_published is true;

    if not found then
      raise exception 'published quiz not found'
        using errcode = '42501';
    end if;

    if course_id is not null then
      select co.institute_id into institute_id
      from public.courses co
      join public.institutions i on i.id = co.institute_id
      where co.id = course_id and co.is_active is true and i.is_active is true;

      if not found or not private.lock_active_student_membership(institute_id) then
        raise exception 'active student membership is required to submit this course quiz'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_quiz_session_submission_membership()
  from public, anon, authenticated;

comment on function private.lock_active_student_membership(uuid) is
  'Checks and row-locks the caller active student membership to serialize course-quiz operations against membership revocation.';
