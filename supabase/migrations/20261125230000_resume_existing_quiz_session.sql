-- Allow a student to resume their own still-valid timed quiz session after a reload.
-- This does not create a second attempt or extend the original deadline.
create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns table (session_id uuid, started_at timestamptz, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_session_id uuid;
  v_started_at timestamptz;
  v_expires_at timestamptz;
  v_submitted_at timestamptz;
begin
  if v_user_id is null then raise exception 'برای شروع آزمون وارد حساب شوید.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id and p.role = 'student') then
    raise exception 'فقط دانش‌پژوه می‌تواند آزمون را شروع کند.';
  end if;

  select q.time_limit_min into v_duration
  from public.quizzes q where q.id = p_quiz_id and q.is_published = true
  for update;
  if not found then raise exception 'آزمون منتشرشده‌ای با این شناسه وجود ندارد.'; end if;

  -- Reuse a prior session rather than extending its deadline or creating another.
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

  if exists (select 1 from public.quiz_attempts a where a.quiz_id = p_quiz_id and a.student_id = v_user_id) then
    raise exception 'برای این آزمون قبلاً نتیجه ثبت شده است؛ امکان شروع دوباره وجود ندارد.';
  end if;

  v_started_at := clock_timestamp();
  v_expires_at := v_started_at + make_interval(mins => v_duration);
  insert into public.quiz_attempt_sessions(quiz_id, student_id, started_at, expires_at)
  values (p_quiz_id, v_user_id, v_started_at, v_expires_at)
  returning id into v_session_id;
  return query select v_session_id, v_started_at, v_expires_at;
end;
$function$;
revoke all on function public.start_quiz_attempt(uuid) from public, anon;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;

comment on function public.start_quiz_attempt(uuid) is
  'Starts a single server-timed attempt or resumes the same unexpired session without extending its deadline.';
