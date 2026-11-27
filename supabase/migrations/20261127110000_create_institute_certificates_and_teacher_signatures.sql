-- Institute-scoped certificates and teacher signatures.
-- Code-only migration: do not apply to production until reviewed and tested.
-- Requires the institute membership foundation migration.

create table if not exists public.institute_certificate_settings (
  institute_id uuid primary key references public.institutions(id) on delete cascade,
  certificate_heading text not null default 'گواهی پایان دوره'
    check (char_length(btrim(certificate_heading)) between 2 and 180),
  default_body text not null default 'بدین‌وسیله گواهی می‌شود که'
    check (char_length(btrim(default_body)) between 2 and 1000),
  updated_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_signatures (
  teacher_id uuid primary key references auth.users(id) on delete cascade,
  storage_path text not null unique
    check (storage_path = teacher_id::text || '/signature'),
  updated_at timestamptz not null default now()
);

create table if not exists public.issued_certificates (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutions(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  certificate_number text not null unique
    check (char_length(btrim(certificate_number)) between 6 and 64),
  heading_snapshot text not null
    check (char_length(btrim(heading_snapshot)) between 2 and 180),
  body_snapshot text not null
    check (char_length(btrim(body_snapshot)) between 2 and 1000),
  issued_by uuid not null references auth.users(id) on delete restrict,
  signature_teacher_id uuid references auth.users(id) on delete restrict,
  status text not null default 'issued' check (status in ('issued','revoked')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete restrict,
  revoke_reason text check (revoke_reason is null or char_length(revoke_reason) <= 500),
  constraint issued_certificates_revoke_state check (
    (status = 'issued' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null and revoked_by is not null)
  ),
  constraint issued_certificates_enrollment_unique unique (enrollment_id)
);

create index if not exists issued_certificates_student_idx
  on public.issued_certificates (student_id, issued_at desc);
create index if not exists issued_certificates_institute_idx
  on public.issued_certificates (institute_id, issued_at desc);

-- Shared authorization predicate: only an active institute owner/manager,
-- or the assigned teacher who is an active institute teacher, may manage
-- certificates for this class. System administrators are also allowed.
create or replace function private.can_manage_class_certificates(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.institute_id is not null
      and (
        private.is_admin()
        or private.is_institute_member(c.institute_id, array['owner','manager'])
        or (
          c.teacher_id = (select auth.uid())
          and private.is_institute_member(c.institute_id, array['teacher'])
        )
      )
  );
$function$;

revoke all on function private.can_manage_class_certificates(uuid) from public, anon;
grant execute on function private.can_manage_class_certificates(uuid) to authenticated;

alter table public.institute_certificate_settings enable row level security;
alter table public.teacher_signatures enable row level security;
alter table public.issued_certificates enable row level security;

grant select, insert, update on public.institute_certificate_settings to authenticated;
grant select, insert, update, delete on public.teacher_signatures to authenticated;
grant select, insert, update on public.issued_certificates to authenticated;

-- Settings are visible to active institute members; only owner/manager and
-- assigned active teachers can change them.
drop policy if exists certificate_settings_member_read on public.institute_certificate_settings;
create policy certificate_settings_member_read on public.institute_certificate_settings
for select to authenticated
using (private.is_institute_member(institute_id) or private.is_admin());

drop policy if exists certificate_settings_staff_write on public.institute_certificate_settings;
create policy certificate_settings_staff_write on public.institute_certificate_settings
for all to authenticated
using (
  private.is_admin()
  or private.is_institute_member(institute_id, array['owner','manager'])
  or exists (
    select 1 from public.classes c
    where c.institute_id = institute_certificate_settings.institute_id
      and private.can_manage_class_certificates(c.id)
  )
)
with check (
  private.is_admin()
  or private.is_institute_member(institute_id, array['owner','manager'])
  or exists (
    select 1 from public.classes c
    where c.institute_id = institute_certificate_settings.institute_id
      and c.teacher_id = (select auth.uid())
      and private.can_manage_class_certificates(c.id)
  )
);

-- A teacher may manage only their own signature record. The private storage
-- bucket below stores the image; this table does not expose image bytes.
drop policy if exists teacher_signature_owner_access on public.teacher_signatures;
create policy teacher_signature_owner_access on public.teacher_signatures
for all to authenticated
using (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.institute_memberships im
    where im.user_id = teacher_signatures.teacher_id
      and im.role = 'teacher' and im.status = 'active'
  )
)
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.institute_memberships im
    where im.user_id = teacher_signatures.teacher_id
      and im.role = 'teacher' and im.status = 'active'
  )
);

-- Students can read their own certificate. Issuance and revocation are staff-only
-- and require the class, enrollment, student and institute to agree.
drop policy if exists issued_certificates_read_scope on public.issued_certificates;
create policy issued_certificates_read_scope on public.issued_certificates
for select to authenticated
using (
  student_id = (select auth.uid())
  or private.can_manage_class_certificates(class_id)
);

drop policy if exists issued_certificates_staff_issue on public.issued_certificates;
create policy issued_certificates_staff_issue on public.issued_certificates
for insert to authenticated
with check (
  issued_by = (select auth.uid())
  and status = 'issued'
  and revoked_at is null
  and revoked_by is null
  and exists (
    select 1
    from public.classes c
    join public.enrollments e on e.class_id = c.id
    where c.id = issued_certificates.class_id
      and c.institute_id = issued_certificates.institute_id
      and e.id = issued_certificates.enrollment_id
      and e.student_id = issued_certificates.student_id
      and private.can_manage_class_certificates(c.id)
  )
  and (
    signature_teacher_id is null
    or signature_teacher_id = (select auth.uid())
    or private.is_admin()
  )
);

drop policy if exists issued_certificates_staff_revoke on public.issued_certificates;
create policy issued_certificates_staff_revoke on public.issued_certificates
for update to authenticated
using (private.can_manage_class_certificates(class_id))
with check (
  private.can_manage_class_certificates(class_id)
  and status in ('issued','revoked')
  and (status <> 'revoked' or (revoked_at is not null and revoked_by = (select auth.uid())))
);

-- Never permit deletion through the client: preserve an audit trail.
drop policy if exists issued_certificates_no_delete on public.issued_certificates;
create policy issued_certificates_no_delete on public.issued_certificates
as restrictive for delete to authenticated
using (false);

-- Private bucket for signature images. Objects must use the exact key
-- <auth.uid()>/signature; no public URLs. PDF generation/download is a
-- separate authenticated server-side step and is intentionally not enabled here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-signatures', 'teacher-signatures', false, 524288, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 524288,
    allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists teacher_signature_object_owner on storage.objects;
create policy teacher_signature_object_owner on storage.objects
for all to authenticated
using (
  bucket_id = 'teacher-signatures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/signature'
  and exists (
    select 1 from public.institute_memberships im
    where im.user_id = (select auth.uid())
      and im.role = 'teacher' and im.status = 'active'
  )
)
with check (
  bucket_id = 'teacher-signatures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/signature'
  and exists (
    select 1 from public.institute_memberships im
    where im.user_id = (select auth.uid())
      and im.role = 'teacher' and im.status = 'active'
  )
);

comment on table public.issued_certificates is
  'Institute-scoped issued certificates. Students may read their own; issuance/revocation is staff-controlled and records are not client-deletable.';
comment on table public.teacher_signatures is
  'Private signature image pointer owned by the teacher. Signature image objects live in the private teacher-signatures storage bucket.';
