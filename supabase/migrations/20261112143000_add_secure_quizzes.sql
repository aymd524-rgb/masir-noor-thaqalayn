-- Secure quiz authoring and server-side grading.
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  course_id uuid references public.courses(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  time_limit_min integer not null default 10 check (time_limit_min between 1 and 240),
  is_competition boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null check (length(btrim(prompt)) > 0),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  position integer not null check (position > 0),
  unique (quiz_id, position)
);
create table if not exists public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions(id) on delete cascade,
  answer_index integer not null check (answer_index >= 0)
);
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete restrict,
  correct_count integer not null check (correct_count >= 0),
  total_questions integer not null check (total_questions > 0 and correct_count <= total_questions),
  submitted_at timestamptz not null default now()
);
create index if not exists quiz_questions_quiz_position_idx on public.quiz_questions(quiz_id, position);
create index if not exists quiz_attempts_quiz_student_idx on public.quiz_attempts(quiz_id, student_id, submitted_at desc);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists quizzes_select_published_or_owner on public.quizzes;
create policy quizzes_select_published_or_owner on public.quizzes for select to authenticated
using (is_published or created_by = (select auth.uid()) or (select private.is_admin()));
drop policy if exists quizzes_insert_teacher_owner on public.quizzes;
create policy quizzes_insert_teacher_owner on public.quizzes for insert to authenticated
with check (
  created_by = (select auth.uid())
  and ((select private.is_admin()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'teacher'))
  and (course_id is null or (select private.is_admin()) or exists (select 1 from public.classes c where c.course_id = quizzes.course_id and c.teacher_id = (select auth.uid())))
);
drop policy if exists quizzes_update_teacher_owner on public.quizzes;
create policy quizzes_update_teacher_owner on public.quizzes for update to authenticated
using (created_by = (select auth.uid()) or (select private.is_admin()))
with check (
  (created_by = (select auth.uid()) or (select private.is_admin()))
  and (course_id is null or (select private.is_admin()) or exists (select 1 from public.classes c where c.course_id = quizzes.course_id and c.teacher_id = (select auth.uid())))
);
drop policy if exists quizzes_delete_teacher_owner on public.quizzes;
create policy quizzes_delete_teacher_owner on public.quizzes for delete to authenticated
using (created_by = (select auth.uid()) or (select private.is_admin()));

drop policy if exists quiz_questions_select_accessible_quiz on public.quiz_questions;
create policy quiz_questions_select_accessible_quiz on public.quiz_questions for select to authenticated
using (exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id and (q.is_published or q.created_by = (select auth.uid()) or (select private.is_admin()))));
drop policy if exists quiz_questions_manage_quiz_owner on public.quiz_questions;
create policy quiz_questions_manage_quiz_owner on public.quiz_questions for all to authenticated
using (exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id and (q.created_by = (select auth.uid()) or (select private.is_admin()))))
with check (exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id and (q.created_by = (select auth.uid()) or (select private.is_admin()))));

drop policy if exists quiz_answer_keys_owner_only on public.quiz_answer_keys;
create policy quiz_answer_keys_owner_only on public.quiz_answer_keys for all to authenticated
using (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = quiz_answer_keys.question_id and (q.created_by = (select auth.uid()) or (select private.is_admin()))))
with check (exists (select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id where qq.id = quiz_answer_keys.question_id and (q.created_by = (select auth.uid()) or (select private.is_admin()))));

drop policy if exists quiz_attempts_select_own_or_quiz_manager on public.quiz_attempts;
create policy quiz_attempts_select_own_or_quiz_manager on public.quiz_attempts for select to authenticated
using (student_id = (select auth.uid()) or exists (select 1 from public.quizzes q where q.id = quiz_attempts.quiz_id and q.created_by = (select auth.uid())) or (select private.is_admin()));

-- Remove broad default table privileges, then grant only the operations needed by the app.
revoke all on table public.quizzes, public.quiz_questions, public.quiz_answer_keys, public.quiz_attempts from anon, authenticated;
grant select, insert, update, delete on table public.quizzes, public.quiz_questions, public.quiz_answer_keys to authenticated;
grant select on table public.quiz_attempts to authenticated;

create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns table (attempt_id uuid, correct_count integer, total_questions integer, percentage integer)
language plpgsql security definer set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_key_count integer;
  v_correct integer := 0;
  v_question record;
  v_answer integer;
  v_attempt_id uuid;
begin
  if v_user_id is null then raise exception 'برای ثبت نتیجه باید وارد حساب شوید.'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id and p.role = 'student') then
    raise exception 'فقط حساب دانش‌پژوه می‌تواند در آزمون شرکت کند.';
  end if;
  if not exists (select 1 from public.quizzes q where q.id = p_quiz_id and q.is_published = true) then
    raise exception 'آزمون منتشرشده‌ای با این شناسه وجود ندارد.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'ساختار پاسخ‌ها معتبر نیست.';
  end if;
  select count(*) into v_total from public.quiz_questions qq where qq.quiz_id = p_quiz_id;
  select count(*) into v_key_count from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id where qq.quiz_id = p_quiz_id;
  if v_total = 0 or v_key_count <> v_total or jsonb_object_length(p_answers) <> v_total then
    raise exception 'ساختار آزمون یا پاسخ‌ها کامل نیست.';
  end if;
  for v_question in
    select qq.id, qq.options, ak.answer_index from public.quiz_questions qq
    join public.quiz_answer_keys ak on ak.question_id = qq.id where qq.quiz_id = p_quiz_id
  loop
    if not (p_answers ? v_question.id::text) then raise exception 'پاسخ همه پرسش‌ها باید ثبت شود.'; end if;
    begin v_answer := (p_answers ->> v_question.id::text)::integer;
    exception when others then raise exception 'یکی از پاسخ‌ها معتبر نیست.'; end;
    if v_answer is null or v_answer < 0 or v_answer >= jsonb_array_length(v_question.options)
       or v_question.answer_index < 0 or v_question.answer_index >= jsonb_array_length(v_question.options) then
      raise exception 'گزینه انتخاب‌شده معتبر نیست.';
    end if;
    if v_answer = v_question.answer_index then v_correct := v_correct + 1; end if;
  end loop;
  insert into public.quiz_attempts (quiz_id, student_id, correct_count, total_questions)
  values (p_quiz_id, v_user_id, v_correct, v_total) returning id into v_attempt_id;
  return query select v_attempt_id, v_correct, v_total, round((v_correct::numeric / v_total::numeric) * 100)::integer;
end;
$function$;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
