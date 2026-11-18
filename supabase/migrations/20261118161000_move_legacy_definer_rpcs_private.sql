-- Keep privileged aggregate and quiz-key access in the non-exposed private schema.
-- Public RPCs remain SECURITY INVOKER wrappers with explicit authenticated grants.

create or replace function private.get_active_class_availability_impl()
returns table(class_id uuid, capacity integer, enrolled_count bigint, remaining_seats integer)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    c.id,
    c.capacity,
    count(e.id)::bigint as enrolled_count,
    case
      when c.capacity is null then null
      else greatest(c.capacity::bigint - count(e.id), 0)::integer
    end as remaining_seats
  from public.classes as c
  left join public.enrollments as e on e.class_id = c.id
  where c.is_active = true
    and (c.course_id is null or exists (
      select 1 from public.courses as co
      where co.id = c.course_id and co.is_active = true
    ))
    and (select auth.uid()) is not null
  group by c.id, c.capacity;
$function$;

create or replace function private.submit_quiz_attempt_impl(p_quiz_id uuid, p_answers jsonb)
returns table(attempt_id uuid, correct_count integer, total_questions integer, percentage integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_total integer;
  v_key_count integer;
  v_answer_count integer;
  v_correct integer := 0;
  v_question record;
  v_answer integer;
  v_attempt_id uuid;
begin
  if v_user_id is null then raise exception 'برای ثبت نتیجه باید وارد حساب شوید.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id and p.role = 'student') then
    raise exception 'فقط حساب دانش‌پژوه می‌تواند در آزمون شرکت کند.';
  end if;
  if not exists (select 1 from public.quizzes q where q.id = p_quiz_id and q.is_published = true) then
    raise exception 'آزمون منتشرشده‌ای با این شناسه وجود ندارد.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'ساختار پاسخ‌ها معتبر نیست.';
  end if;
  select count(*) into v_total from public.quiz_questions qq where qq.quiz_id = p_quiz_id;
  select count(*) into v_key_count from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id where qq.quiz_id = p_quiz_id;
  select count(*) into v_answer_count from jsonb_object_keys(p_answers);
  if v_total = 0 or v_key_count <> v_total or v_answer_count <> v_total then
    raise exception 'ساختار آزمون یا پاسخ‌ها کامل نیست.';
  end if;
  for v_question in
    select qq.id, qq.options, ak.answer_index from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id where qq.quiz_id = p_quiz_id
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
  insert into public.quiz_attempts (quiz_id, student_id, correct_count, total_questions)
  values (p_quiz_id, v_user_id, v_correct, v_total) returning id into v_attempt_id;
  return query select v_attempt_id, v_correct, v_total, round((v_correct::numeric / v_total::numeric) * 100)::integer;
end;
$function$;

revoke all on function private.get_active_class_availability_impl() from public, anon, authenticated;
revoke all on function private.submit_quiz_attempt_impl(uuid,jsonb) from public, anon, authenticated;
grant execute on function private.get_active_class_availability_impl() to authenticated;
grant execute on function private.submit_quiz_attempt_impl(uuid,jsonb) to authenticated;

create or replace function public.get_active_class_availability()
returns table(class_id uuid, capacity integer, enrolled_count bigint, remaining_seats integer)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from private.get_active_class_availability_impl();
$function$;

create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns table(attempt_id uuid, correct_count integer, total_questions integer, percentage integer)
language sql
security invoker
set search_path = ''
as $function$
  select * from private.submit_quiz_attempt_impl(p_quiz_id, p_answers);
$function$;

revoke all on function public.get_active_class_availability() from public, anon;
revoke all on function public.submit_quiz_attempt(uuid,jsonb) from public, anon;
grant execute on function public.get_active_class_availability() to authenticated;
grant execute on function public.submit_quiz_attempt(uuid,jsonb) to authenticated;
