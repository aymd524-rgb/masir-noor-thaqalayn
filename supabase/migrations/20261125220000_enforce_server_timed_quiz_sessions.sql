-- Server-authoritative quiz timing. Legacy attempts remain readable; new attempts
-- must be linked to a server-created timed session.
create table if not exists public.quiz_attempt_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  constraint quiz_attempt_sessions_expiry_check check (expires_at > started_at)
);
create index if not exists quiz_attempt_sessions_student_idx
  on public.quiz_attempt_sessions(student_id, quiz_id, started_at desc);
alter table public.quiz_attempt_sessions enable row level security;
revoke all on table public.quiz_attempt_sessions from anon, authenticated;
alter table public.quiz_attempts add column if not exists session_id uuid
  references public.quiz_attempt_sessions(id) on delete set null;
create unique index if not exists quiz_attempts_session_unique
  on public.quiz_attempts(session_id) where session_id is not null;

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns table (session_id uuid, started_at timestamptz, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_session_id uuid;
  v_started_at timestamptz := clock_timestamp();
  v_expires_at timestamptz;
begin
  if v_user_id is null then raise exception 'برای شروع آزمون وارد حساب شوید.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id and p.role = 'student') then
    raise exception 'فقط دانش‌پژوه می‌تواند آزمون را شروع کند.';
  end if;
  select q.time_limit_min into v_duration
  from public.quizzes q where q.id = p_quiz_id and q.is_published = true
  for update;
  if not found then raise exception 'آزمون منتشرشده‌ای با این شناسه وجود ندارد.'; end if;
  v_expires_at := v_started_at + make_interval(mins => v_duration);
  insert into public.quiz_attempt_sessions(quiz_id, student_id, started_at, expires_at)
  values (p_quiz_id, v_user_id, v_started_at, v_expires_at)
  returning id into v_session_id;
  return query select v_session_id, v_started_at, v_expires_at;
end;
$function$;
revoke all on function public.start_quiz_attempt(uuid) from public, anon;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;

-- Remove the old public signature so a caller cannot bypass the timer.
drop function if exists public.submit_quiz_attempt(uuid, jsonb);
create or replace function public.submit_quiz_attempt(p_session_id uuid, p_answers jsonb)
returns table (attempt_id uuid, correct_count integer, total_questions integer, percentage integer)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_quiz_id uuid;
  v_expires_at timestamptz;
  v_submitted_at timestamptz;
  v_total integer;
  v_key_count integer;
  v_correct integer := 0;
  v_question record;
  v_answer integer;
  v_attempt_id uuid;
begin
  if v_user_id is null then raise exception 'برای ثبت نتیجه باید وارد حساب شوید.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id and p.role = 'student') then
    raise exception 'فقط دانش‌پژوه می‌تواند در آزمون شرکت کند.';
  end if;
  select s.quiz_id, s.expires_at, s.submitted_at
    into v_quiz_id, v_expires_at, v_submitted_at
  from public.quiz_attempt_sessions s
  where s.id = p_session_id and s.student_id = v_user_id
  for update;
  if not found then raise exception 'جلسه آزمون معتبر نیست یا متعلق به شما نیست.'; end if;
  if v_submitted_at is not null then raise exception 'پاسخ این جلسه قبلاً ثبت شده است.'; end if;
  if clock_timestamp() > v_expires_at + interval '15 seconds' then raise exception 'زمان آزمون به پایان رسیده است.'; end if;
  if not exists (select 1 from public.quizzes q where q.id = v_quiz_id and q.is_published = true) then
    raise exception 'این آزمون دیگر منتشرشده نیست.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'ساختار پاسخ‌ها معتبر نیست.';
  end if;
  select count(*) into v_total from public.quiz_questions qq where qq.quiz_id = v_quiz_id;
  select count(*) into v_key_count from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id where qq.quiz_id = v_quiz_id;
  if v_total = 0 or v_key_count <> v_total or jsonb_object_length(p_answers) <> v_total then
    raise exception 'ساختار آزمون یا پاسخ‌ها کامل نیست.';
  end if;
  for v_question in
    select qq.id, qq.options, ak.answer_index from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id where qq.quiz_id = v_quiz_id
  loop
    if not (p_answers ? v_question.id::text) then raise exception 'پاسخ همه پرسش‌ها باید ثبت شود.'; end if;
    begin v_answer := (p_answers ->> v_question.id::text)::integer;
    exception when others then raise exception 'یکی از پاسخ‌ها معتبر نیست.'; end;
    if v_answer is null or v_answer < 0 or v_answer >= jsonb_array_length(v_question.options)
       or v_question.answer_index < 0 or v_question.answer_index >= jsonb_array_length(v_question.options) then
      raise exception 'گزینه انتخاب‌شده معتبر نیست.';
    end if;
    if v_answer = v_question.answer_index then v_correct := v_correct + 1; end if;
  end loop;
  insert into public.quiz_attempts(quiz_id, student_id, correct_count, total_questions, session_id)
  values (v_quiz_id, v_user_id, v_correct, v_total, p_session_id)
  returning id into v_attempt_id;
  update public.quiz_attempt_sessions set submitted_at = clock_timestamp() where id = p_session_id;
  return query select v_attempt_id, v_correct, v_total,
    round((v_correct::numeric / v_total::numeric) * 100)::integer;
end;
$function$;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- A started session freezes quiz structure/settings as well as submitted attempts.
create or replace function private.guard_quiz_after_attempts()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  if exists (select 1 from public.quiz_attempts a where a.quiz_id = old.id)
     or exists (select 1 from public.quiz_attempt_sessions s where s.quiz_id = old.id) then
    if tg_op = 'DELETE' then
      raise exception 'quiz with started sessions cannot be deleted' using errcode = '42501';
    end if;
    if new.course_id is distinct from old.course_id
       or new.time_limit_min is distinct from old.time_limit_min
       or new.is_competition is distinct from old.is_competition then
      raise exception 'quiz settings cannot be changed after a session starts' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;
revoke all on function private.guard_quiz_after_attempts() from public, anon, authenticated;

create or replace function private.guard_quiz_question_after_attempts()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
  target_quiz_id uuid;
  old_quiz_id uuid;
  lock_id uuid;
begin
  target_quiz_id := case when tg_op = 'DELETE' then old.quiz_id else new.quiz_id end;
  old_quiz_id := case when tg_op = 'UPDATE' then old.quiz_id else null end;
  for lock_id in
    select q.id from public.quizzes q
    where q.id = target_quiz_id or q.id = old_quiz_id order by q.id for update
  loop null; end loop;
  if exists (
    select 1 from public.quiz_attempts a where a.quiz_id = target_quiz_id or a.quiz_id = old_quiz_id
    union all
    select 1 from public.quiz_attempt_sessions s where s.quiz_id = target_quiz_id or s.quiz_id = old_quiz_id
  ) then
    raise exception 'quiz questions cannot be changed after a session starts' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;
revoke all on function private.guard_quiz_question_after_attempts() from public, anon, authenticated;

create or replace function private.guard_quiz_answer_key()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
  target_question_id uuid;
  old_question_id uuid;
  target_quiz_id uuid;
  old_quiz_id uuid;
  option_count integer;
  lock_id uuid;
begin
  target_question_id := case when tg_op = 'DELETE' then old.question_id else new.question_id end;
  old_question_id := case when tg_op = 'UPDATE' then old.question_id else null end;
  select qq.quiz_id, jsonb_array_length(qq.options) into target_quiz_id, option_count
  from public.quiz_questions qq where qq.id = target_question_id;
  if not found then
    if tg_op = 'DELETE' then return old; end if;
    raise exception 'quiz question does not exist' using errcode = '23503';
  end if;
  if old_question_id is not null then
    select qq.quiz_id into old_quiz_id from public.quiz_questions qq where qq.id = old_question_id;
  end if;
  for lock_id in
    select q.id from public.quizzes q
    where q.id = target_quiz_id or q.id = old_quiz_id order by q.id for update
  loop null; end loop;
  if tg_op <> 'DELETE' and (new.answer_index < 0 or new.answer_index >= option_count) then
    raise exception 'answer index must point to an existing option' using errcode = '23514';
  end if;
  if exists (select 1 from public.quiz_attempts a where a.quiz_id = target_quiz_id or a.quiz_id = old_quiz_id)
     or exists (select 1 from public.quiz_attempt_sessions s where s.quiz_id = target_quiz_id or s.quiz_id = old_quiz_id) then
    raise exception 'quiz answer keys cannot be changed after a session starts' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;
revoke all on function private.guard_quiz_answer_key() from public, anon, authenticated;
