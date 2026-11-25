-- Validate each quiz option at the database boundary, not only in the UI.
create or replace function private.valid_quiz_options(p_options jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $function$
declare
  item jsonb;
begin
  if p_options is null or jsonb_typeof(p_options) is distinct from 'array' then
    return false;
  end if;

  if jsonb_array_length(p_options) < 2 or jsonb_array_length(p_options) > 8 then
    return false;
  end if;

  for item in select value from jsonb_array_elements(p_options)
  loop
    if jsonb_typeof(item) is distinct from 'string'
       or char_length(btrim(item #>> '{}')) = 0 then
      return false;
    end if;
  end loop;

  return true;
end;
$function$;

revoke all on function private.valid_quiz_options(jsonb) from public, anon, authenticated;

alter table public.quiz_questions
  drop constraint if exists quiz_questions_options_valid;

alter table public.quiz_questions
  add constraint quiz_questions_options_valid
  check (private.valid_quiz_options(options)) not valid;

comment on function private.valid_quiz_options(jsonb) is
  'Checks quiz options are an array of 2-8 non-empty strings; enforced by the quiz_questions database constraint.';
