-- Keep a hifz assignment attached to the enrollment and teacher that created it.
-- Teachers may still edit the lesson details and due date under the existing RLS policy.
create or replace function private.guard_hifz_assignment_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.enrollment_id is distinct from old.enrollment_id
     or new.assigned_by is distinct from old.assigned_by then
    raise exception 'assignment enrollment and creator cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$function$;

revoke all on function private.guard_hifz_assignment_identity() from public, anon, authenticated;
drop trigger if exists hifz_assignment_identity_guard on public.hifz_assignments;
create trigger hifz_assignment_identity_guard
before update on public.hifz_assignments
for each row execute function private.guard_hifz_assignment_identity();
