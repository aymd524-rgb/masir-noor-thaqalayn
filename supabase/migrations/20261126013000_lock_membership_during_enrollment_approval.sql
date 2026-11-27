-- Serialize enrollment approval against institute/course deactivation and
-- student membership suspension or deletion. Row locks remain held until the
-- approval transaction (including the enrollment insert) completes.
create or replace function private.create_enrollment_after_request_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  class_row record;
  enrolled_count bigint;
  locked_institute_id uuid;
  locked_course_id uuid;
  locked_membership_id uuid;
begin
  if new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;

  if new.payment_status is null or new.payment_status not in ('paid', 'waived') then
    raise exception 'approved enrollment requires verified payment or an authorized waiver'
      using errcode = '23514';
  end if;

  -- Keep the existing class-capacity serialization.
  select c.id, c.is_active, c.capacity, c.course_id, c.institute_id
    into class_row
  from public.classes c
  where c.id = new.class_id
  for update;

  if not found then
    raise exception 'class does not exist'
      using errcode = '23514';
  end if;
  if class_row.is_active is not true then
    raise exception 'class is inactive'
      using errcode = '23514';
  end if;

  -- FOR SHARE conflicts with deactivation UPDATEs and is held through commit.
  select i.id into locked_institute_id
  from public.institutions i
  where i.id = class_row.institute_id and i.is_active is true
  for share;

  if not found then
    raise exception 'institute is inactive or unavailable'
      using errcode = '23514';
  end if;

  if class_row.course_id is not null then
    select co.id into locked_course_id
    from public.courses co
    where co.id = class_row.course_id
      and co.institute_id = locked_institute_id
      and co.is_active is true
    for share;

    if not found then
      raise exception 'linked course is missing, inactive, or belongs to another institute'
        using errcode = '23514';
    end if;
  end if;

  -- Lock the exact active student membership so a concurrent suspension,
  -- role change, or deletion cannot slip between validation and enrollment.
  select im.id into locked_membership_id
  from public.institute_memberships im
  where im.institute_id = locked_institute_id
    and im.user_id = new.student_id
    and im.role = 'student'
    and im.status = 'active'
  for share;

  if not found then
    raise exception 'student must have an active student membership in this institute at approval time'
      using errcode = '42501';
  end if;

  if class_row.capacity is not null then
    select count(*) into enrolled_count
    from public.enrollments e
    where e.class_id = new.class_id;

    if enrolled_count >= class_row.capacity then
      raise exception 'class capacity is full'
        using errcode = '23514';
    end if;
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.student_id = new.student_id and e.class_id = new.class_id
  ) then
    insert into public.enrollments (student_id, class_id)
    values (new.student_id, new.class_id);
  end if;

  return new;
end;
$function$;

revoke all on function private.create_enrollment_after_request_approval()
  from public, anon, authenticated;

comment on function private.create_enrollment_after_request_approval() is
  'Atomically approves enrollment only with verified payment, active class/course/institute and active student membership; serializes capacity and locks institute/course/membership rows against concurrent deactivation or revocation.';
