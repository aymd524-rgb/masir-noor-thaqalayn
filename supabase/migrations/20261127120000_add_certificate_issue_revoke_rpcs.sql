-- Authenticated, server-validated certificate issuance and revocation.
-- This migration is code-only and must be tested on staging before production.

alter table public.issued_certificates
  add column if not exists student_name_snapshot text;

update public.issued_certificates ic
set student_name_snapshot = p.full_name
from public.profiles p
where p.id = ic.student_id and ic.student_name_snapshot is null;

alter table public.issued_certificates
  alter column student_name_snapshot set not null;

alter table public.issued_certificates
  add constraint issued_certificates_student_name_snapshot_check
  check (char_length(btrim(student_name_snapshot)) between 2 and 200);

alter table public.issued_certificates
  add column if not exists class_title_snapshot text;

update public.issued_certificates ic
set class_title_snapshot = c.title
from public.classes c
where c.id = ic.class_id and ic.class_title_snapshot is null;

alter table public.issued_certificates
  alter column class_title_snapshot set not null;

alter table public.issued_certificates
  add constraint issued_certificates_class_title_snapshot_check
  check (char_length(btrim(class_title_snapshot)) between 2 and 180);

-- Direct client writes are disabled. The SECURITY DEFINER RPCs below perform
-- their own identity, membership, class, enrollment and staff checks.
revoke insert, update, delete on public.issued_certificates from authenticated;
grant select on public.issued_certificates to authenticated;

create or replace function public.issue_course_certificate(
  p_enrollment_id uuid,
  p_include_signature boolean default true
)
returns table (
  certificate_id uuid,
  certificate_number text,
  issued_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
  enrollment_row record;
  student_name text;
  heading_text text;
  body_text text;
  signature_id uuid;
  certificate_code text;
begin
  if actor_id is null then
    raise exception 'sign-in required'
      using errcode = '42501';
  end if;

  select e.id, e.student_id, e.class_id, c.institute_id, c.teacher_id,
         c.title as class_title, c.is_active as class_active,
         i.is_active as institute_active
    into enrollment_row
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  join public.institutions i on i.id = c.institute_id
  where e.id = p_enrollment_id
  for share of e, c, i;

  if not found
     or enrollment_row.class_active is not true
     or enrollment_row.institute_active is not true then
    raise exception 'active class enrollment not found'
      using errcode = '23514';
  end if;

  if not private.can_manage_class_certificates(enrollment_row.class_id) then
    raise exception 'assigned class teacher or institute owner/manager required'
      using errcode = '42501';
  end if;

  if not private.user_is_institute_member(
    enrollment_row.student_id, enrollment_row.institute_id, array['student']
  ) then
    raise exception 'student must have active student membership in this institute'
      using errcode = '42501';
  end if;

  select nullif(btrim(p.full_name), '')
    into student_name
  from public.profiles p
  where p.id = enrollment_row.student_id;

  if student_name is null then
    raise exception 'student profile name is unavailable'
      using errcode = '23514';
  end if;

  select s.certificate_heading, s.default_body
    into heading_text, body_text
  from public.institute_certificate_settings s
  where s.institute_id = enrollment_row.institute_id;

  if not found then
    heading_text := 'گواهی پایان دوره';
    body_text := 'بدین‌وسیله گواهی می‌شود که';
  end if;

  if p_include_signature is true and enrollment_row.teacher_id is not null
     and exists (
       select 1
       from public.teacher_signatures ts
       join public.institute_memberships im on im.user_id = ts.teacher_id
       where ts.teacher_id = enrollment_row.teacher_id
         and im.institute_id = enrollment_row.institute_id
         and im.role = 'teacher' and im.status = 'active'
     ) then
    signature_id := enrollment_row.teacher_id;
  else
    signature_id := null;
  end if;

  certificate_code := 'CERT-' || upper(replace(gen_random_uuid()::text, '-', ''));

  return query
  insert into public.issued_certificates (
    institute_id, class_id, enrollment_id, student_id,
    certificate_number, heading_snapshot, body_snapshot,
    student_name_snapshot, class_title_snapshot, issued_by, signature_teacher_id
  )
  values (
    enrollment_row.institute_id, enrollment_row.class_id,
    enrollment_row.id, enrollment_row.student_id,
    certificate_code, heading_text, body_text,
    student_name, enrollment_row.class_title, actor_id, signature_id
  )
  returning issued_certificates.id,
            issued_certificates.certificate_number,
            issued_certificates.issued_at;
end;
$function$;

revoke all on function public.issue_course_certificate(uuid, boolean) from public, anon, authenticated;
grant execute on function public.issue_course_certificate(uuid, boolean) to authenticated;

create or replace function public.revoke_course_certificate(
  p_certificate_id uuid,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
  class_id uuid;
  current_status text;
begin
  if actor_id is null then
    raise exception 'sign-in required'
      using errcode = '42501';
  end if;

  select c.class_id, c.status
    into class_id, current_status
  from public.issued_certificates c
  where c.id = p_certificate_id
  for update;

  if not found then
    raise exception 'certificate not found'
      using errcode = 'P0002';
  end if;

  if not private.can_manage_class_certificates(class_id) then
    raise exception 'assigned class teacher or institute owner/manager required'
      using errcode = '42501';
  end if;

  if current_status <> 'issued' then
    raise exception 'certificate is already revoked'
      using errcode = '23514';
  end if;

  update public.issued_certificates
  set status = 'revoked',
      revoke_reason = nullif(left(btrim(coalesce(p_reason, '')), 500), '')
  where id = p_certificate_id;

  return true;
end;
$function$;

revoke all on function public.revoke_course_certificate(uuid, text) from public, anon, authenticated;
grant execute on function public.revoke_course_certificate(uuid, text) to authenticated;

comment on function public.issue_course_certificate(uuid, boolean) is
  'Issues one institute-scoped certificate after validating active enrollment, active student membership, and authorized staff. Snapshots heading, body and student name; optional signature is the assigned teacher only.';
comment on function public.revoke_course_certificate(uuid, text) is
  'Revokes an issued certificate once. Only authorized class staff can revoke; database trigger stamps actor and timestamp.';
