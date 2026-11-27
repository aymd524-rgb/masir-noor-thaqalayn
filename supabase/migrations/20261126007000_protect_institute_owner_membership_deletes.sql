-- Prevent membership DELETE from bypassing the owner-role protections.
-- Managers may remove ordinary memberships, but cannot delete owner/manager
-- records. An institute must retain at least one active owner.
create or replace function private.guard_institute_membership_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_is_owner boolean;
  actor_is_manager boolean;
begin
  if private.is_admin() then
    return old;
  end if;

  if auth.uid() is null then
    raise exception 'authenticated institute manager required' using errcode = '42501';
  end if;

  -- Allow a user to withdraw their own pending request, as permitted by RLS.
  if old.user_id = auth.uid() and old.status = 'pending' then
    return old;
  end if;

  -- Serialize membership deletions against the institute row so concurrent
  -- owner removals cannot both observe the other owner and remove the last one.
  perform 1
  from public.institutions i
  where i.id = old.institute_id
  for update;

  actor_is_owner := private.is_institute_member(old.institute_id, array['owner']);
  actor_is_manager := private.is_institute_member(old.institute_id, array['manager']);

  if not actor_is_owner and not actor_is_manager then
    raise exception 'active institute owner or manager required' using errcode = '42501';
  end if;

  if old.role in ('owner','manager') and not actor_is_owner then
    raise exception 'only an institute owner or system administrator can delete owner/manager membership' using errcode = '42501';
  end if;

  if old.role = 'owner' and old.status = 'active'
     and not exists (
       select 1
       from public.institute_memberships other_owner
       where other_owner.institute_id = old.institute_id
         and other_owner.user_id <> old.user_id
         and other_owner.role = 'owner'
         and other_owner.status = 'active'
     ) then
    raise exception 'an institute must retain at least one active owner' using errcode = '23514';
  end if;

  return old;
end;
$function$;

revoke all on function private.guard_institute_membership_delete()
  from public, anon, authenticated;

drop trigger if exists institute_memberships_guard_delete
  on public.institute_memberships;
create trigger institute_memberships_guard_delete
before delete on public.institute_memberships
for each row execute function private.guard_institute_membership_delete();

comment on function private.guard_institute_membership_delete() is
  'Prevents managers from deleting owner/manager memberships and prevents deleting the last active institute owner; pending requests may be withdrawn by their requester.';
