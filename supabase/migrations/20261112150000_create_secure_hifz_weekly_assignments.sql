create table if not exists public.hifz_assignments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_start smallint not null check (ayah_start >= 1),
  ayah_end smallint not null check (ayah_end >= ayah_start),
  assignment_type text not null check (assignment_type in ('memorization','review')),
  due_date date not null,
  instructions text,
  created_at timestamptz not null default now()
);
create index if not exists hifz_assignments_enrollment_due_idx
  on public.hifz_assignments(enrollment_id, due_date desc);

create table if not exists public.hifz_assignment_completions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.hifz_assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','needs_help')),
  submitted_at timestamptz,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists hifz_assignment_completions_student_idx
  on public.hifz_assignment_completions(student_id, status);

alter table public.hifz_assignments enable row level security;
alter table public.hifz_assignment_completions enable row level security;

drop policy if exists hifz_assignments_select on public.hifz_assignments;
create policy hifz_assignments_select on public.hifz_assignments
for select to authenticated
using (
  private.owns_enrollment(enrollment_id)
  or private.can_manage_enrollment(enrollment_id)
  or private.is_admin()
);

drop policy if exists hifz_assignments_teacher_insert on public.hifz_assignments;
create policy hifz_assignments_teacher_insert on public.hifz_assignments
for insert to authenticated
with check (
  assigned_by = (select auth.uid())
  and (private.can_manage_enrollment(enrollment_id) or private.is_admin())
);

drop policy if exists hifz_assignments_teacher_update on public.hifz_assignments;
create policy hifz_assignments_teacher_update on public.hifz_assignments
for update to authenticated
using (private.can_manage_enrollment(enrollment_id) or private.is_admin())
with check (private.can_manage_enrollment(enrollment_id) or private.is_admin());

drop policy if exists hifz_assignments_admin_delete on public.hifz_assignments;
create policy hifz_assignments_admin_delete on public.hifz_assignments
for delete to authenticated
using (private.is_admin());

drop policy if exists hifz_assignment_completions_select on public.hifz_assignment_completions;
create policy hifz_assignment_completions_select on public.hifz_assignment_completions
for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (
    select 1 from public.hifz_assignments a
    where a.id = assignment_id
      and (private.can_manage_enrollment(a.enrollment_id) or private.is_admin())
  )
);

drop policy if exists hifz_assignment_completions_student_insert on public.hifz_assignment_completions;
create policy hifz_assignment_completions_student_insert on public.hifz_assignment_completions
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1 from public.hifz_assignments a
    where a.id = assignment_id
      and private.owns_enrollment(a.enrollment_id)
  )
);

drop policy if exists hifz_assignment_completions_student_update on public.hifz_assignment_completions;
create policy hifz_assignment_completions_student_update on public.hifz_assignment_completions
for update to authenticated
using (student_id = (select auth.uid()))
with check (
  student_id = (select auth.uid())
  and exists (
    select 1 from public.hifz_assignments a
    where a.id = assignment_id
      and private.owns_enrollment(a.enrollment_id)
  )
);

grant select, insert, update, delete on public.hifz_assignments to authenticated;
grant select, insert, update on public.hifz_assignment_completions to authenticated;
