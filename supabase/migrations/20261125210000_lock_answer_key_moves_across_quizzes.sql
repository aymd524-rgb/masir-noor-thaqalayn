-- Lock both quiz parents when an answer key moves between questions.
-- This closes the gap where an update could check the destination quiz only.
create or replace function private.guard_quiz_answer_key()
returns trigger
language plpgsql
security definer
set search_path = ''
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

  if old_question_id is not null then
    select qq.quiz_id into old_quiz_id
    from public.quiz_questions qq
    where qq.id = old_question_id;

    if not found then
      raise exception 'source quiz question does not exist' using errcode = '23503';
    end if;
  end if;

  -- Lock both quiz rows in a stable order, matching the submission lock.
  for lock_id in
    select q.id
    from public.quizzes q
    where q.id = target_quiz_id or q.id = old_quiz_id
    order by q.id
    for update
  loop
    null;
  end loop;

  if tg_op <> 'DELETE' and (new.answer_index < 0 or new.answer_index >= option_count) then
    raise exception 'answer index must point to an existing option' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.quiz_attempts a
    where a.quiz_id = target_quiz_id or a.quiz_id = old_quiz_id
  ) then
    raise exception 'quiz answer keys cannot be changed after submissions' using errcode = '42501';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

revoke all on function private.guard_quiz_answer_key() from public, anon, authenticated;

comment on function private.guard_quiz_answer_key() is
  'Validates answer indexes and locks both source and destination quiz rows before allowing answer-key edits.';
