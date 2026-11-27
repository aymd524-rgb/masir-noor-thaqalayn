-- Preserve quiz integrity once a participant has submitted an attempt.
-- Teachers may still edit descriptive metadata, but cannot change scoring,
-- questions, answer keys, or delete the competition history after submissions.
create or replace function private.guard_quiz_after_attempts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if exists (select 1 from public.quiz_attempts a where a.quiz_id = old.id) then
    if tg_op = 'DELETE' then
      raise exception 'quiz with submitted attempts cannot be deleted' using errcode = '42501';
    end if;

    if new.course_id is distinct from old.course_id
       or new.time_limit_min is distinct from old.time_limit_min
       or new.is_competition is distinct from old.is_competition then
      raise exception 'quiz settings cannot be changed after submissions' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

revoke all on function private.guard_quiz_after_attempts() from public, anon, authenticated;
drop trigger if exists quizzes_guard_after_attempts on public.quizzes;
create trigger quizzes_guard_after_attempts
before update or delete on public.quizzes
for each row execute function private.guard_quiz_after_attempts();

create or replace function private.guard_quiz_question_after_attempts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_quiz_id uuid;
begin
  target_quiz_id := case when tg_op = 'DELETE' then old.quiz_id else new.quiz_id end;
  if exists (select 1 from public.quiz_attempts a where a.quiz_id = target_quiz_id)
     or (tg_op = 'UPDATE' and exists (
       select 1 from public.quiz_attempts a where a.quiz_id = old.quiz_id
     )) then
    raise exception 'quiz questions cannot be changed after submissions' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

revoke all on function private.guard_quiz_question_after_attempts() from public, anon, authenticated;
drop trigger if exists quiz_questions_guard_after_attempts on public.quiz_questions;
create trigger quiz_questions_guard_after_attempts
before insert or update or delete on public.quiz_questions
for each row execute function private.guard_quiz_question_after_attempts();

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
drop trigger if exists quiz_answer_keys_guard on public.quiz_answer_keys;
create trigger quiz_answer_keys_guard
before insert or update or delete on public.quiz_answer_keys
for each row execute function private.guard_quiz_answer_key();

comment on function private.guard_quiz_after_attempts() is
  'Protects quiz settings and attempt history after the first submission.';
comment on function private.guard_quiz_question_after_attempts() is
  'Locks question structure once any attempt has been submitted.';
comment on function private.guard_quiz_answer_key() is
  'Validates answer indexes and locks scoring keys after submissions.';
