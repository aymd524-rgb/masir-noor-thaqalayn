-- Revalidate the learner's institute membership at the moment an enrollment
-- request is approved. A pending request must not survive institute closure
-- or membership suspension and then grant an enrollment.
create or replace function private.create_enrollment_after_request_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  class_row record;
  enrolled_count bigint;
begin
  if new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;

  if new.payment_status is null or new.payment_status not in ('paid', 'waived') then
    raise exception 'approved enrollment requires verified payment or an authorized waiver'
      using errcode = '23514';
  end if;

  -- Serialize approvals for this class to avoid overbooking its capacity.
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

  if class_row.institute_id is null or not exists (
    select 1 from public.institutions i
    where i.id = class_row.institute_id and i.is_active is true
  ) then
    raise exception 'institute is inactive or unavailable'
      using errcode = '23514';
  end if;

  if not private.user_is_institute_member(
    new.student_id, class_row.institute_id, array['student']
  ) then
    raise exception 'student must have an active student membership in this institute at approval time'
      using errcode = '42501';
  end if;

  if class_row.course_id is not null and not exists (
    select 1 from public.courses co
    where co.id = class_row.course_id and co.is_active is true
  ) then
    raise exception 'linked course is missing or inactive'
      using errcode = '23514';
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

  -- Existing enrollment means the request may be approved without duplicating it.
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
  'Atomically creates enrollment on approval only when payment is verified, class/course/institute are active, and the student has active student membership at approval time; capacity is serialized.';
