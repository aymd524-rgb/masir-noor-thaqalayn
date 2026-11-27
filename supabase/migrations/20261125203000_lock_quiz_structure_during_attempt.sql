-- Serialize question/key edits with submissions by locking the parent quiz row.
-- submit_quiz_attempt already locks that same row before scoring.
create or replace function private.guard_quiz_question_after_attempts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_quiz_id uuid;
  old_quiz_id uuid;
  lock_id uuid;
begin
  target_quiz_id := case when tg_op = 'DELETE' then old.quiz_id else new.quiz_id end;
  old_quiz_id := case when tg_op = 'UPDATE' then old.quiz_id else null end;

  -- Lock all involved quiz rows in a stable order to avoid update deadlocks.
  for lock_id in
    select q.id
    from public.quizzes q
    where q.id = target_quiz_id or q.id = old_quiz_id
    order by q.id
    for update
  loop
    null;
  end loop;

  if tg_op <> 'DELETE' and not exists (
    select 1 from public.quizzes q where q.id = target_quiz_id
  ) then
    raise exception 'quiz does not exist' using errcode = '23503';
  end if;

  if exists (
    select 1 from public.quiz_attempts a
    where a.quiz_id = target_quiz_id or a.quiz_id = old_quiz_id
  ) then
    raise exception 'quiz questions cannot be changed after submissions' using errcode = '42501';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

revoke all on function private.guard_quiz_question_after_attempts() from public, anon, authenticated;

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
    if tg_op = 'DELETE' then
      return old;
    end if;
    raise exception 'quiz question does not exist' using errcode = '23503';
  end if;

  -- Same lock as submission and quiz/question edits.
  perform 1
  from public.quizzes q
  where q.id = target_quiz_id
  for update;

  if not found then
    if tg_op = 'DELETE' then
      return old;
    end if;
    raise exception 'quiz does not exist' using errcode = '23503';
  end if;

  if tg_op <> 'DELETE' and (new.answer_index < 0 or new.answer_index >= option_count) then
    raise exception 'answer index must point to an existing option' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.quiz_attempts a
    where a.quiz_id = target_quiz_id
  ) then
    raise exception 'quiz answer keys cannot be changed after submissions' using errcode = '42501';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

revoke all on function private.guard_quiz_answer_key() from public, anon, authenticated;
