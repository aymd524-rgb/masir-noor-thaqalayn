-- Fix cascading answer-key deletion and serialize quiz submission with quiz edits.
-- A parent question may already be gone when its answer-key FK cascade fires.
create or replace function private.guard_quiz_answer_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_question_id uuid;
  target_quiz_id uuid;
  option_count integer;
begin
  target_question_id := case when tg_op = 'DELETE' then old.question_id else new.question_id end;

  select qq.quiz_id, jsonb_array_length(qq.options)
    into target_quiz_id, option_count
  from public.quiz_questions qq
  where qq.id = target_question_id;

  if not found then
    -- Allow FK-driven cleanup after the parent question has been deleted.
    -- An explicit insert/update still must reference an existing question.
    if tg_op = 'DELETE' then
      return old;
    end if;
    raise exception 'quiz question does not exist' using errcode = '23503';
  end if;

  if tg_op <> 'DELETE' and (new.answer_index < 0 or new.answer_index >= option_count) then
    raise exception 'answer index must point to an existing option' using errcode = '23514';
  end if;

  if exists (select 1 from public.quiz_attempts a where a.quiz_id = target_quiz_id)
     or (tg_op = 'UPDATE' and exists (
       select 1 from public.quiz_questions old_question
       join public.quiz_attempts a on a.quiz_id = old_question.quiz_id
       where old_question.id = old.question_id
     )) then
    raise exception 'quiz answer keys cannot be changed after submissions' using errcode = '42501';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

revoke all on function private.guard_quiz_answer_key() from public, anon, authenticated;

-- Lock the published quiz row before reading its questions and answer keys.
-- Quiz edits/deletes take the same row lock, so submissions cannot score
-- against one version while an editor changes another version concurrently.
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns table (attempt_id uuid, correct_count integer, total_questions integer, percentage integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_key_count integer;
  v_correct integer := 0;
  v_question record;
  v_answer integer;
  v_attempt_id uuid;
begin
  if v_user_id is null then
    raise exception 'برای ثبت نتیجه باید وارد حساب شوید.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user_id and p.role = 'student'
  ) then
    raise exception 'فقط حساب دانش‌پژوه می‌تواند در آزمون شرکت کند.';
  end if;

  perform 1
  from public.quizzes q
  where q.id = p_quiz_id and q.is_published = true
  for update;

  if not found then
    raise exception 'آزمون منتشرشده‌ای با این شناسه وجود ندارد.';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'ساختار پاسخ‌ها معتبر نیست.';
  end if;

  select count(*) into v_total
  from public.quiz_questions qq where qq.quiz_id = p_quiz_id;

  select count(*) into v_key_count
  from public.quiz_questions qq
  join public.quiz_answer_keys ak on ak.question_id = qq.id
  where qq.quiz_id = p_quiz_id;

  if v_total = 0 or v_key_count <> v_total or jsonb_object_length(p_answers) <> v_total then
    raise exception 'ساختار آزمون یا پاسخ‌ها کامل نیست.';
  end if;

  for v_question in
    select qq.id, qq.options, ak.answer_index
    from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id
    where qq.quiz_id = p_quiz_id
  loop
    if not (p_answers ? v_question.id::text) then
      raise exception 'پاسخ همه پرسش‌ها باید ثبت شود.';
    end if;

    begin
      v_answer := (p_answers ->> v_question.id::text)::integer;
    exception when others then
      raise exception 'یکی از پاسخ‌ها معتبر نیست.';
    end;

    if v_answer is null
       or v_answer < 0
       or v_answer >= jsonb_array_length(v_question.options)
       or v_question.answer_index < 0
       or v_question.answer_index >= jsonb_array_length(v_question.options) then
      raise exception 'گزینه انتخاب‌شده معتبر نیست.';
    end if;

    if v_answer = v_question.answer_index then
      v_correct := v_correct + 1;
    end if;
  end loop;

  insert into public.quiz_attempts (quiz_id, student_id, correct_count, total_questions)
  values (p_quiz_id, v_user_id, v_correct, v_total)
  returning id into v_attempt_id;

  return query
  select v_attempt_id, v_correct, v_total,
         round((v_correct::numeric / v_total::numeric) * 100)::integer;
end;
$function$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
