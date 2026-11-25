-- Enforce class capacity for every enrollment write, not only request approval.
-- The class row lock serializes staff-created enrollments with each other and
-- with the approval trigger's capacity check.
create or replace function private.guard_student_institute_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  class_row record;
  enrolled_count bigint;
  enforce_capacity boolean := false;
begin
  if new.student_id is null then
    raise exception 'student id is required' using errcode = '23502';
  end if;

  if tg_table_name = 'enrollments' then
    if tg_op = 'INSERT' then
      enforce_capacity := true;
    elsif tg_op = 'UPDATE' then
      enforce_capacity := new.class_id is distinct from old.class_id;
    end if;
  end if;

  if enforce_capacity then
    select c.institute_id, c.capacity, c.is_active, c.course_id
      into class_row
    from public.classes c
    where c.id = new.class_id
    for update;
  else
    select c.institute_id, c.capacity, c.is_active, c.course_id
      into class_row
    from public.classes c
    where c.id = new.class_id;
  end if;

  if not found or class_row.institute_id is null then
    raise exception 'class is not assigned to an institute' using errcode = '23514';
  end if;

  if class_row.is_active is not true then
    raise exception 'class is inactive' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.institutions i
    where i.id = class_row.institute_id and i.is_active is true
  ) then
    raise exception 'institute is inactive or unavailable' using errcode = '23514';
  end if;

  if class_row.course_id is not null and not exists (
    select 1 from public.courses co
    where co.id = class_row.course_id and co.is_active is true
      and co.institute_id = class_row.institute_id
  ) then
    raise exception 'linked course is missing, inactive, or belongs to another institute' using errcode = '23514';
  end if;

  if auth.uid() is not null and new.student_id <> auth.uid()
     and not private.is_admin()
     and not private.is_institute_member(class_row.institute_id, array['owner','manager','teacher']) then
    raise exception 'cannot enroll another student' using errcode = '42501';
  end if;

  if not private.is_admin()
     and not private.user_is_institute_member(new.student_id, class_row.institute_id, array['student']) then
    raise exception 'student must be an active member of the class institute' using errcode = '42501';
  end if;

  if enforce_capacity and class_row.capacity is not null then
    if tg_op = 'UPDATE' then
      select count(*) into enrolled_count
      from public.enrollments e
      where e.class_id = new.class_id
        and e.id <> old.id;
    else
      select count(*) into enrolled_count
      from public.enrollments e
      where e.class_id = new.class_id;
    end if;

    if enrolled_count >= class_row.capacity then
      raise exception 'class capacity is full' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_student_institute_enrollment()
  from public, anon, authenticated;

comment on function private.guard_student_institute_enrollment() is
  'Validates institute membership for enrollment requests and enrollments; serializes enrollment inserts/class moves on the class row and enforces capacity for every enrollment write.';
