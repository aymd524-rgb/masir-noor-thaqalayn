-- A student may update the status/note of their own completion, but must not
-- reattach it to a different assignment or change its student identity.
create or replace function private.guard_hifz_completion_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.assignment_id is distinct from old.assignment_id
     or new.student_id is distinct from old.student_id then
    raise exception 'assignment and student identity cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$function$;

revoke all on function private.guard_hifz_completion_identity() from public, anon, authenticated;
drop trigger if exists hifz_completion_identity_guard on public.hifz_assignment_completions;
create trigger hifz_completion_identity_guard
before update on public.hifz_assignment_completions
for each row execute function private.guard_hifz_completion_identity();
