-- Serialize concurrent owner demotions/status changes with owner deletions.
-- The DELETE guard already locks the institution row; UPDATE must take the
-- same lock before checking whether another active owner remains.
create or replace function private.guard_institute_membership_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_is_owner boolean;
  actor_is_manager boolean;
begin
  if new.institute_id is distinct from old.institute_id
     or new.user_id is distinct from old.user_id then
    raise exception 'membership institute and user are immutable' using errcode = '42501';
  end if;

  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  -- Take the institute-level lock before checking owner retention. This uses
  -- the same lock target as the DELETE trigger, serializing these operations.
  if old.role = 'owner' and (new.role <> 'owner' or new.status <> 'active') then
    perform 1
    from public.institutions i
    where i.id = old.institute_id
    for update;
  end if;

  actor_is_owner := private.is_institute_member(old.institute_id, array['owner']);
  actor_is_manager := private.is_institute_member(old.institute_id, array['manager']);

  if not actor_is_owner and not actor_is_manager then
    raise exception 'active institute owner or manager required' using errcode = '42501';
  end if;

  if old.role in ('owner','manager') and not actor_is_owner then
    raise exception 'only an institute owner or system administrator can modify owner/manager membership' using errcode = '42501';
  end if;

  if new.role in ('owner','manager') and not actor_is_owner then
    raise exception 'only an institute owner or system administrator can assign owner/manager roles' using errcode = '42501';
  end if;

  if old.role = 'owner' and (new.role <> 'owner' or new.status <> 'active')
     and not exists (
       select 1 from public.institute_memberships other_owner
       where other_owner.institute_id = old.institute_id
         and other_owner.user_id <> old.user_id
         and other_owner.role = 'owner'
         and other_owner.status = 'active'
     ) then
    raise exception 'an institute must retain at least one active owner' using errcode = '23514';
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_institute_membership_update()
  from public, anon, authenticated;

comment on function private.guard_institute_membership_update() is
  'Protects immutable membership identity and owner/manager authority; serializes non-admin owner demotion against institute-level owner deletion checks.';
