-- Secure Quran memorization and review records.
-- Students can read their own records; assigned teachers can manage records
-- for their enrollments; administrators can manage all records.
create table if not exists public.hifz_records (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  recorded_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_start smallint not null check (ayah_start between 1 and 286),
  ayah_end smallint not null check (ayah_end between ayah_start and 286),
  record_type text not null check (record_type in ('memorization', 'review')),
  assessment text not null check (assessment in ('excellent', 'good', 'fair', 'needs_practice')),
  session_date date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists hifz_records_enrollment_date_idx
  on public.hifz_records (enrollment_id, session_date desc, created_at desc);

alter table public.hifz_records enable row level security;

drop policy if exists hifz_records_select on public.hifz_records;
create policy hifz_records_select on public.hifz_records
for select to authenticated
using (
  private.owns_enrollment(enrollment_id)
  or private.can_manage_enrollment(enrollment_id)
  or private.is_admin()
);

drop policy if exists hifz_records_teacher_insert on public.hifz_records;
create policy hifz_records_teacher_insert on public.hifz_records
for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and (private.can_manage_enrollment(enrollment_id) or private.is_admin())
);

drop policy if exists hifz_records_teacher_update on public.hifz_records;
create policy hifz_records_teacher_update on public.hifz_records
for update to authenticated
using (private.can_manage_enrollment(enrollment_id) or private.is_admin())
with check (
  recorded_by = (select auth.uid())
  and (private.can_manage_enrollment(enrollment_id) or private.is_admin())
);

drop policy if exists hifz_records_admin_delete on public.hifz_records;
create policy hifz_records_admin_delete on public.hifz_records
for delete to authenticated
using (private.is_admin());

grant select, insert, update, delete on public.hifz_records to authenticated;
