-- Keep completion timestamps server-authored and consistent with the submitted status.
-- Client-provided timestamps are ignored; created_at cannot be rewritten.
create or replace function private.guard_hifz_completion_timestamps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    if new.status = 'completed' then
      new.submitted_at := now();
    else
      new.submitted_at := null;
    end if;
    return new;
  end if;

  new.created_at := old.created_at;
  if new.status = 'completed' then
    if old.status = 'completed' then
      new.submitted_at := old.submitted_at;
    else
      new.submitted_at := now();
    end if;
  else
    new.submitted_at := null;
  end if;
  return new;
end;
$function$;

revoke all on function private.guard_hifz_completion_timestamps() from public, anon, authenticated;
drop trigger if exists hifz_completion_timestamps_guard on public.hifz_assignment_completions;
create trigger hifz_completion_timestamps_guard
before insert or update on public.hifz_assignment_completions
for each row execute function private.guard_hifz_completion_timestamps();
