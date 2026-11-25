-- Make approval and enrollment creation a single database transaction.
-- The approval UPDATE either creates the enrollment or fails completely.
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

  if new.payment_status not in ('paid', 'waived') then
    raise exception 'approved enrollment requires verified payment or an authorized waiver'
      using errcode = '23514';
  end if;

  -- Serialize approvals for this class to avoid overbooking its capacity.
  select c.id, c.is_active, c.capacity, c.course_id
    into class_row
  from public.classes c
  where c.id = new.class_id
  for update;

  if not found or class_row.is_active is not true then
    raise exception 'class is missing or inactive'
      using errcode = '23514';
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

drop trigger if exists enrollment_request_approval_creates_enrollment
  on public.enrollment_requests;
create trigger enrollment_request_approval_creates_enrollment
after update of status, payment_status on public.enrollment_requests
for each row
when (new.status = 'approved' and old.status is distinct from 'approved')
execute function private.create_enrollment_after_request_approval();

comment on function private.create_enrollment_after_request_approval() is
  'Atomically creates the enrollment when a pending request is approved with paid or waived payment status. Capacity and institute membership are validated by database constraints/triggers.';
