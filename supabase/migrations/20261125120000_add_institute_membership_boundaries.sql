-- Institute tenancy foundation: each learner's class and enrollment must belong
-- to an institute they actively joined. This migration is code-only until applied.
create schema if not exists private;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.institute_memberships (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('owner','manager','teacher','student')),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (institute_id, user_id)
);

create index if not exists institute_memberships_user_status_idx
  on public.institute_memberships (user_id, status, institute_id);
create index if not exists institute_memberships_institute_role_idx
  on public.institute_memberships (institute_id, role, status);

-- Create the initial owner in the same transaction as institution creation.
create or replace function private.assign_institute_creator_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.is_admin() or auth.uid() is null then
    raise exception 'only a signed-in system administrator can create an institute' using errcode = '42501';
  end if;
  insert into public.institute_memberships
    (institute_id, user_id, role, status, reviewed_at, reviewed_by)
  values
    (new.id, auth.uid(), 'owner', 'active', now(), auth.uid());
  return new;
end;
$function$;

revoke all on function private.assign_institute_creator_owner() from public, anon, authenticated;
drop trigger if exists institutions_assign_creator_owner on public.institutions;
create trigger institutions_assign_creator_owner
after insert on public.institutions
for each row execute function private.assign_institute_creator_owner();

alter table public.courses
  add column if not exists institute_id uuid references public.institutions(id) on delete restrict;
alter table public.classes
  add column if not exists institute_id uuid references public.institutions(id) on delete restrict;

create index if not exists courses_institute_active_idx
  on public.courses (institute_id, is_active);
create index if not exists classes_institute_active_idx
  on public.classes (institute_id, is_active);

create or replace function private.is_institute_member(
  p_institute_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.institute_memberships as im
    where im.institute_id = p_institute_id
      and im.user_id = (select auth.uid())
      and im.status = 'active'
      and (p_roles is null or im.role = any(p_roles))
  );
$function$;

create or replace function private.user_is_institute_member(p_user_id uuid, p_institute_id uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.institute_memberships im
    where im.institute_id = p_institute_id and im.user_id = p_user_id
      and im.status = 'active' and (p_roles is null or im.role = any(p_roles))
  );
$function$;

create or replace function private.class_institute_id(p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select c.institute_id
  from public.classes as c
  where c.id = p_class_id;
$function$;

revoke all on function private.is_institute_member(uuid, text[]) from public, anon;
revoke all on function private.user_is_institute_member(uuid, uuid, text[]) from public, anon;
revoke all on function private.class_institute_id(uuid) from public, anon;
grant execute on function private.is_institute_member(uuid, text[]) to authenticated;
grant execute on function private.user_is_institute_member(uuid, uuid, text[]) to authenticated;
grant execute on function private.class_institute_id(uuid) to authenticated;

alter table public.institutions enable row level security;
alter table public.institute_memberships enable row level security;

grant select, insert, update on public.institutions to authenticated;
grant select, insert, update on public.institute_memberships to authenticated;

drop policy if exists institutions_select_member on public.institutions;
drop policy if exists institutions_select_active_catalog on public.institutions;
create policy institutions_select_active_catalog on public.institutions
for select to authenticated
using (is_active or private.is_institute_member(id) or private.is_admin());

drop policy if exists institutions_admin_insert on public.institutions;
create policy institutions_admin_insert on public.institutions
for insert to authenticated
with check (private.is_admin());

drop policy if exists institutions_manager_update on public.institutions;
create policy institutions_manager_update on public.institutions
for update to authenticated
using (private.is_institute_member(id, array['owner','manager']) or private.is_admin())
with check (private.is_institute_member(id, array['owner','manager']) or private.is_admin());

drop policy if exists institute_memberships_select_scope on public.institute_memberships;
create policy institute_memberships_select_scope on public.institute_memberships
for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_institute_member(institute_id, array['owner','manager'])
  or private.is_admin()
);

drop policy if exists institute_memberships_request_own on public.institute_memberships;
create policy institute_memberships_request_own on public.institute_memberships
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'student'
  and status = 'pending'
  and private.is_admin() is false
);

drop policy if exists institute_memberships_admin_insert on public.institute_memberships;
create policy institute_memberships_admin_insert on public.institute_memberships
for insert to authenticated
with check (private.is_admin());

drop policy if exists institute_memberships_manager_update on public.institute_memberships;
create policy institute_memberships_manager_update on public.institute_memberships
for update to authenticated
using (private.is_institute_member(institute_id, array['owner','manager']) or private.is_admin())
with check (private.is_institute_member(institute_id, array['owner','manager']) or private.is_admin());

-- Restrictive boundaries AND with all legacy permissive policies. Prevent
-- older broad policies from granting membership data access or role changes.
drop policy if exists institute_memberships_select_boundary on public.institute_memberships;
drop policy if exists institute_memberships_insert_boundary on public.institute_memberships;
drop policy if exists institute_memberships_update_boundary on public.institute_memberships;
drop policy if exists institute_memberships_delete_boundary on public.institute_memberships;

create policy institute_memberships_select_boundary on public.institute_memberships
as restrictive for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_institute_member(institute_id, array['owner','manager'])
  or private.is_admin()
);

create policy institute_memberships_insert_boundary on public.institute_memberships
as restrictive for insert to authenticated
with check (
  private.is_admin()
  or (
    user_id = (select auth.uid())
    and role = 'student'
    and status = 'pending'
  )
);

create policy institute_memberships_update_boundary on public.institute_memberships
as restrictive for update to authenticated
using (
  private.is_admin()
  or private.is_institute_member(institute_id, array['owner','manager'])
)
with check (
  private.is_admin()
  or private.is_institute_member(institute_id, array['owner','manager'])
);

create policy institute_memberships_delete_boundary on public.institute_memberships
as restrictive for delete to authenticated
using (
  private.is_admin()
  or private.is_institute_member(institute_id, array['owner','manager'])
  or (user_id = (select auth.uid()) and status = 'pending')
);

-- Managers can approve members and assign teacher/student roles, but cannot
-- promote themselves or others to owner/manager. Only an institute owner or
-- system administrator may grant or revoke manager/owner roles.
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

revoke all on function private.guard_institute_membership_update() from public, anon, authenticated;
drop trigger if exists institute_memberships_guard_update on public.institute_memberships;
create trigger institute_memberships_guard_update
before update on public.institute_memberships
for each row execute function private.guard_institute_membership_update();

-- Restrictive policies AND with existing permissive policies. Keep read access
-- for active members, but explicitly limit writes so legacy broad policies
-- cannot let students modify courses/classes or self-create enrollments.
drop policy if exists courses_institute_boundary on public.courses;
drop policy if exists courses_select_institute_boundary on public.courses;
drop policy if exists courses_insert_institute_boundary on public.courses;
drop policy if exists courses_update_institute_boundary on public.courses;
drop policy if exists courses_delete_institute_boundary on public.courses;
create policy courses_select_institute_boundary on public.courses
as restrictive for select to authenticated
using (private.is_admin() or private.is_institute_member(institute_id));
create policy courses_insert_institute_boundary on public.courses
as restrictive for insert to authenticated
with check (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']));
create policy courses_update_institute_boundary on public.courses
as restrictive for update to authenticated
using (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']))
with check (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']));
create policy courses_delete_institute_boundary on public.courses
as restrictive for delete to authenticated
using (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']));

drop policy if exists classes_institute_boundary on public.classes;
drop policy if exists classes_select_institute_boundary on public.classes;
drop policy if exists classes_insert_institute_boundary on public.classes;
drop policy if exists classes_update_institute_boundary on public.classes;
drop policy if exists classes_delete_institute_boundary on public.classes;
create policy classes_select_institute_boundary on public.classes
as restrictive for select to authenticated
using (private.is_admin() or private.is_institute_member(institute_id));
create policy classes_insert_institute_boundary on public.classes
as restrictive for insert to authenticated
with check (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']));
create policy classes_update_institute_boundary on public.classes
as restrictive for update to authenticated
using (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']))
with check (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']));
create policy classes_delete_institute_boundary on public.classes
as restrictive for delete to authenticated
using (private.is_admin() or private.is_institute_member(institute_id, array['owner','manager']));

drop policy if exists enrollment_requests_institute_boundary on public.enrollment_requests;
drop policy if exists enrollment_requests_select_institute_boundary on public.enrollment_requests;
drop policy if exists enrollment_requests_insert_institute_boundary on public.enrollment_requests;
drop policy if exists enrollment_requests_update_institute_boundary on public.enrollment_requests;
drop policy if exists enrollment_requests_delete_institute_boundary on public.enrollment_requests;
create policy enrollment_requests_select_institute_boundary on public.enrollment_requests
as restrictive for select to authenticated
using (private.is_admin() or (
  private.class_institute_id(class_id) is not null and (
    student_id = (select auth.uid())
    or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager','teacher'])
  )
));
create policy enrollment_requests_insert_institute_boundary on public.enrollment_requests
as restrictive for insert to authenticated
with check (private.is_admin() or (
  private.class_institute_id(class_id) is not null and (
    (student_id = (select auth.uid()) and private.is_institute_member(private.class_institute_id(class_id), array['student']))
    or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager','teacher'])
  )
));
-- Only institute owners/managers (or system administrators) may change
-- request status/payment approval. Teachers may read requests in their institute
-- but cannot approve/reject or alter payment verification.
create policy enrollment_requests_update_institute_boundary on public.enrollment_requests
as restrictive for update to authenticated
using (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager']))
with check (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager']));
create policy enrollment_requests_delete_institute_boundary on public.enrollment_requests
as restrictive for delete to authenticated
using (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager']));

drop policy if exists enrollments_institute_boundary on public.enrollments;
drop policy if exists enrollments_select_institute_boundary on public.enrollments;
drop policy if exists enrollments_insert_institute_boundary on public.enrollments;
drop policy if exists enrollments_update_institute_boundary on public.enrollments;
drop policy if exists enrollments_delete_institute_boundary on public.enrollments;
create policy enrollments_select_institute_boundary on public.enrollments
as restrictive for select to authenticated
using (private.is_admin() or (
  private.class_institute_id(class_id) is not null and (
    student_id = (select auth.uid())
    or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager','teacher'])
  )
));
-- Enrollment records are created after an approved request; students cannot
-- bypass that approval by inserting directly into enrollments.
create policy enrollments_insert_institute_boundary on public.enrollments
as restrictive for insert to authenticated
with check (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager','teacher']));
create policy enrollments_update_institute_boundary on public.enrollments
as restrictive for update to authenticated
using (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager','teacher']))
with check (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager','teacher']));
create policy enrollments_delete_institute_boundary on public.enrollments
as restrictive for delete to authenticated
using (private.is_admin() or private.is_institute_member(private.class_institute_id(class_id), array['owner','manager']));

-- New/changed courses and classes must be assigned to an institute. Legacy
-- unassigned rows remain intact but are hidden from non-admin authenticated users.
create or replace function private.guard_course_institute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' or new.institute_id is distinct from old.institute_id then
    if new.institute_id is null then
      raise exception 'course must be assigned to an institute' using errcode = '23514';
    end if;
    if not private.is_admin()
       and not private.is_institute_member(new.institute_id, array['owner','manager']) then
      raise exception 'institute manager permission required' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function private.guard_class_institute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  course_institute uuid;
begin
  if tg_op = 'INSERT' or new.institute_id is distinct from old.institute_id then
    if new.institute_id is null then
      raise exception 'class must be assigned to an institute' using errcode = '23514';
    end if;
    if not private.is_admin()
       and not private.is_institute_member(new.institute_id, array['owner','manager']) then
      raise exception 'institute manager permission required' using errcode = '42501';
    end if;
  end if;

  if new.course_id is not null then
    select co.institute_id into course_institute
    from public.courses as co where co.id = new.course_id;
    if course_institute is distinct from new.institute_id then
      raise exception 'class and course must belong to the same institute' using errcode = '23514';
    end if;
  end if;

  if new.teacher_id is not null
     and not private.is_admin()
     and not private.user_is_institute_member(new.teacher_id, new.institute_id, array['owner','manager','teacher']) then
    raise exception 'assigned teacher must be an active institute member' using errcode = '23514';
  end if;
  return new;
end;
$function$;

create or replace function private.guard_student_institute_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  class_institute uuid;
begin
  class_institute := private.class_institute_id(new.class_id);
  if class_institute is null then
    raise exception 'class is not assigned to an institute' using errcode = '23514';
  end if;
  if new.student_id is null then
    raise exception 'student id is required' using errcode = '23502';
  end if;
  if auth.uid() is not null and new.student_id <> auth.uid()
     and not private.is_admin()
     and not private.is_institute_member(class_institute, array['owner','manager','teacher']) then
    raise exception 'cannot enroll another student' using errcode = '42501';
  end if;
  if not private.is_admin()
     and not private.user_is_institute_member(new.student_id, class_institute, array['student']) then
    raise exception 'student must be an active member of the class institute' using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists courses_guard_institute on public.courses;
create trigger courses_guard_institute
before insert or update of institute_id on public.courses
for each row execute function private.guard_course_institute();

drop trigger if exists classes_guard_institute on public.classes;
create trigger classes_guard_institute
before insert or update of institute_id, course_id, teacher_id on public.classes
for each row execute function private.guard_class_institute();

drop trigger if exists enrollment_requests_guard_institute on public.enrollment_requests;
create trigger enrollment_requests_guard_institute
before insert or update of student_id, class_id on public.enrollment_requests
for each row execute function private.guard_student_institute_enrollment();

drop trigger if exists enrollments_guard_institute on public.enrollments;
create trigger enrollments_guard_institute
before insert or update of student_id, class_id on public.enrollments
for each row execute function private.guard_student_institute_enrollment();

revoke all on function private.guard_course_institute() from public, anon, authenticated;
revoke all on function private.guard_class_institute() from public, anon, authenticated;
revoke all on function private.guard_student_institute_enrollment() from public, anon, authenticated;

comment on table public.institutions is 'Organizations that own courses and classes; institute access is membership-scoped.';
comment on table public.institute_memberships is 'Membership requests and active roles within an institute; pending requests grant no data access.';
comment on column public.courses.institute_id is 'Institute owner; null legacy rows are not visible to non-admin authenticated users.';
comment on column public.classes.institute_id is 'Institute owner; must match the linked course institute when course_id is set.';


-- Persist the user's currently selected institute separately from profile data.
-- The database trigger is authoritative: client-side selection never grants access.
create table if not exists public.user_institute_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institute_id uuid not null references public.institutions(id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.user_institute_preferences enable row level security;
grant select, insert, update, delete on public.user_institute_preferences to authenticated;

drop policy if exists user_institute_preferences_select_own on public.user_institute_preferences;
create policy user_institute_preferences_select_own on public.user_institute_preferences
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists user_institute_preferences_insert_own on public.user_institute_preferences;
create policy user_institute_preferences_insert_own on public.user_institute_preferences
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists user_institute_preferences_update_own on public.user_institute_preferences;
create policy user_institute_preferences_update_own on public.user_institute_preferences
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists user_institute_preferences_delete_own on public.user_institute_preferences;
create policy user_institute_preferences_delete_own on public.user_institute_preferences
for delete to authenticated using (user_id = (select auth.uid()));

create or replace function private.guard_user_institute_preference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.user_id <> (select auth.uid()) and not private.is_admin() then
    raise exception 'cannot change another user institute preference' using errcode = '42501';
  end if;
  if not private.user_is_institute_member(new.user_id, new.institute_id, null) then
    raise exception 'selected institute requires an active membership' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$function$;

revoke all on function private.guard_user_institute_preference() from public, anon, authenticated;
drop trigger if exists user_institute_preferences_guard on public.user_institute_preferences;
create trigger user_institute_preferences_guard
before insert or update on public.user_institute_preferences
for each row execute function private.guard_user_institute_preference();

comment on table public.user_institute_preferences is 'User-selected active institute. Selection is validated against active membership and does not grant permissions.';
