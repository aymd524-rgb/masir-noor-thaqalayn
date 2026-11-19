-- Keep private contact data out of the broadly readable profiles row.
create table if not exists public.profile_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  updated_at timestamptz not null default now()
);

alter table public.profile_contacts enable row level security;
grant select, insert, update on table public.profile_contacts to authenticated;

drop policy if exists profile_contacts_select_own on public.profile_contacts;
create policy profile_contacts_select_own
  on public.profile_contacts for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists profile_contacts_insert_own on public.profile_contacts;
create policy profile_contacts_insert_own
  on public.profile_contacts for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists profile_contacts_update_own on public.profile_contacts;
create policy profile_contacts_update_own
  on public.profile_contacts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.admin_get_profile_contacts(p_user_ids uuid[])
returns table(user_id uuid, phone text)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not private.is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  return query
  select pc.user_id, pc.phone
  from public.profile_contacts as pc
  where pc.user_id = any(coalesce(p_user_ids, array[]::uuid[]));
end;
$function$;

create or replace function public.admin_list_profile_contacts(
  p_offset integer default 0,
  p_limit integer default 500
)
returns table(user_id uuid, phone text)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not private.is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  return query
  select pc.user_id, pc.phone
  from public.profile_contacts as pc
  order by pc.user_id
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 500), 1), 5000);
end;
$function$;

revoke all on function public.admin_get_profile_contacts(uuid[]) from public, anon;
revoke all on function public.admin_list_profile_contacts(integer, integer) from public, anon;
grant execute on function public.admin_get_profile_contacts(uuid[]) to authenticated;
grant execute on function public.admin_list_profile_contacts(integer, integer) to authenticated;
