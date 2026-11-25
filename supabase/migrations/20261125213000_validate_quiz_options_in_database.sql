-- Validate each quiz option at the database boundary, not only in the UI.
create or replace function private.valid_quiz_options(p_options jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select jsonb_typeof(p_options) = 'array'
    and jsonb_array_length(p_options) between 2 and 8
    and not exists (
      select 1
      from jsonb_array_elements(p_options) as item(value)
      where jsonb_typeof(item.value) is distinct from 'string'
         or char_length(btrim(item.value #>> '{}')) = 0
    );
$function$;

revoke all on function private.valid_quiz_options(jsonb) from public, anon, authenticated;

alter table public.quiz_questions
  drop constraint if exists quiz_questions_options_valid;

alter table public.quiz_questions
  add constraint quiz_questions_options_valid
  check (private.valid_quiz_options(options)) not valid;

comment on function private.valid_quiz_options(jsonb) is
  'Checks quiz options are an array of 2-8 non-empty strings; enforced by the quiz_questions database constraint.';
