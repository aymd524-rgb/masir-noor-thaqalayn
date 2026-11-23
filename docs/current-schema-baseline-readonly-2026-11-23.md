# Current Supabase schema baseline — read-only snapshot

**Captured:** 2026-11-23T08:35:20.621127+00:00  
**Project ref:** `pxwdfwozinxipvudupbl`  
**Purpose:** forensic snapshot of the current catalog state only. This is NOT the original migration chain and MUST NOT be replayed as SQL.

## Summary

- Base tables: 18 in `public`, 1 in `private`.
- Views: 2.
- RLS: 19 base tables enabled; 0 disabled.
- Policies: 51.
- Indexes: 51.
- Constraints: 88.
- Non-internal table triggers: 3.
- Functions/procedures: 24.
- Both public dashboard views have `security_invoker=true`: `class_management_dashboard`, `enrollment_request_dashboard`.
- This capture did not select application rows, phone values, auth credentials, or secrets.

## Table inventory

### `public.profiles`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid), `full_name` (text), `role` (text; default 'student'::text), `created_at` (timestamp with time zone; default now()), `phone` (text)
- کلیدهای خارجی: messages_sender_id_fkey, profiles_id_fkey, classes_teacher_id_fkey, enrollments_student_id_fkey, messages_receiver_id_fkey, enrollment_requests_student_id_fkey, enrollment_requests_reviewed_by_fkey, quizzes_created_by_fkey, quiz_attempts_student_id_fkey, profile_contacts_user_id_fkey

### `public.courses`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `title` (text), `description` (text), `price` (numeric; default 0), `is_active` (boolean; default true), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: classes_course_id_fkey, quizzes_course_id_fkey

### `public.classes`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `course_id` (uuid), `teacher_id` (uuid), `title` (text), `created_at` (timestamp with time zone; default now()), `description` (text), `is_active` (boolean; default true), `capacity` (integer), `starts_at` (timestamp with time zone), `ends_at` (timestamp with time zone)
- کلیدهای خارجی: classes_course_id_fkey, enrollment_requests_class_id_fkey, enrollments_class_id_fkey, classes_teacher_id_fkey

### `public.enrollments`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `student_id` (uuid), `class_id` (uuid), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: hifz_records_enrollment_id_fkey, enrollments_student_id_fkey, enrollments_class_id_fkey, hifz_assignments_enrollment_id_fkey, attendance_enrollment_id_fkey, grades_enrollment_id_fkey

### `public.attendance`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `enrollment_id` (uuid), `session_date` (date), `status` (text), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: attendance_enrollment_id_fkey

### `public.grades`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `enrollment_id` (uuid), `title` (text), `score` (numeric), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: grades_enrollment_id_fkey

### `public.messages`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `sender_id` (uuid), `receiver_id` (uuid), `content` (text), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: messages_receiver_id_fkey, messages_sender_id_fkey

### `public.enrollment_requests`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `student_id` (uuid), `class_id` (uuid), `status` (text; default 'pending'::text), `payment_status` (text; default 'pending'::text), `created_at` (timestamp with time zone; default now()), `reviewed_at` (timestamp with time zone), `reviewed_by` (uuid)
- کلیدهای خارجی: enrollment_requests_class_id_fkey, enrollment_requests_reviewed_by_fkey, enrollment_requests_student_id_fkey

### `public.quizzes`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `title` (text), `description` (text; default ''::text), `course_id` (uuid), `created_by` (uuid), `time_limit_min` (integer; default 10), `is_competition` (boolean; default false), `is_published` (boolean; default false), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: quizzes_course_id_fkey, quizzes_created_by_fkey, quiz_questions_quiz_id_fkey, quiz_attempts_quiz_id_fkey

### `public.quiz_questions`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `quiz_id` (uuid), `prompt` (text), `options` (jsonb), `position` (integer)
- کلیدهای خارجی: quiz_answer_keys_question_id_fkey, quiz_questions_quiz_id_fkey

### `public.quiz_answer_keys`
- RLS: فعال؛ کلید اصلی: question_id
- ستون‌ها: `question_id` (uuid), `answer_index` (integer)
- کلیدهای خارجی: quiz_answer_keys_question_id_fkey

### `public.quiz_attempts`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `quiz_id` (uuid), `student_id` (uuid), `correct_count` (integer), `total_questions` (integer), `submitted_at` (timestamp with time zone; default now())
- کلیدهای خارجی: quiz_attempts_quiz_id_fkey, quiz_attempts_student_id_fkey

### `public.hifz_records`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `enrollment_id` (uuid), `recorded_by` (uuid; default auth.uid()), `surah_number` (smallint), `ayah_start` (smallint), `ayah_end` (smallint), `record_type` (text), `assessment` (text), `session_date` (date; default CURRENT_DATE), `notes` (text), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: hifz_records_enrollment_id_fkey, hifz_records_recorded_by_fkey

### `public.hifz_assignments`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `enrollment_id` (uuid), `assigned_by` (uuid), `surah_number` (smallint), `ayah_start` (smallint), `ayah_end` (smallint), `assignment_type` (text), `due_date` (date), `instructions` (text), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: hifz_assignments_assigned_by_fkey, hifz_assignments_enrollment_id_fkey, hifz_assignment_completions_assignment_id_fkey

### `public.hifz_assignment_completions`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `assignment_id` (uuid), `student_id` (uuid), `status` (text; default 'in_progress'::text), `submitted_at` (timestamp with time zone), `note` (text), `created_at` (timestamp with time zone; default now())
- کلیدهای خارجی: hifz_assignment_completions_student_id_fkey, hifz_assignment_completions_assignment_id_fkey

### `public.content_entries`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `content_type` (text), `title` (text), `body` (text; default ''::text), `summary` (text; default ''::text), `topic` (text; default ''::text), `language` (text; default 'fa'::text), `author_name` (text; default ''::text), `source_name` (text; default ''::text), `source_url` (text), `media_url` (text), `tags` (ARRAY; default '{}'::text[]), `metadata` (jsonb; default '{}'::jsonb), `is_published` (boolean; default false), `sort_order` (integer; default 0), `created_by` (uuid; default auth.uid()), `created_at` (timestamp with time zone; default now()), `updated_at` (timestamp with time zone; default now())
- کلیدهای خارجی: content_entries_created_by_fkey

### `public.game_questions`
- RLS: فعال؛ کلید اصلی: id
- ستون‌ها: `id` (uuid; default gen_random_uuid()), `game_type` (text), `prompt` (text), `options` (jsonb; default '[]'::jsonb), `explanation` (text; default ''::text), `topic` (text; default ''::text), `difficulty` (text; default 'medium'::text), `is_published` (boolean; default false), `sort_order` (integer; default 0), `created_by` (uuid; default auth.uid()), `created_at` (timestamp with time zone; default now()), `updated_at` (timestamp with time zone; default now()), `age_group` (text; default 'kids'::text)
- کلیدهای خارجی: game_questions_created_by_fkey, game_answer_keys_question_id_fkey

### `private.game_answer_keys`
- RLS: فعال؛ کلید اصلی: question_id
- ستون‌ها: `question_id` (uuid), `correct_option_index` (integer), `updated_at` (timestamp with time zone; default now()), `answer_payload` (jsonb)
- کلیدهای خارجی: game_answer_keys_question_id_fkey

### `public.profile_contacts`
- RLS: فعال؛ کلید اصلی: user_id
- ستون‌ها: `user_id` (uuid), `phone` (text), `updated_at` (timestamp with time zone; default now())
- کلیدهای خارجی: profile_contacts_user_id_fkey


## Views

- `public.class_management_dashboard`: owner `postgres`; security_invoker=true
- `public.enrollment_request_dashboard`: owner `postgres`; security_invoker=true

## RLS policy inventory

- `private.game_answer_keys.game_answer_keys_deny_client_access` — ALL; roles: anon, authenticated
- `public.attendance.attendance_admin` — DELETE; roles: authenticated
- `public.attendance.attendance_select` — SELECT; roles: authenticated
- `public.attendance.attendance_teacher_insert` — INSERT; roles: authenticated
- `public.attendance.attendance_teacher_update` — UPDATE; roles: authenticated
- `public.classes.classes_admin` — ALL; roles: authenticated
- `public.classes.classes_select` — SELECT; roles: authenticated
- `public.content_entries.content_entries_admin_manage` — ALL; roles: authenticated
- `public.content_entries.content_entries_read_published` — SELECT; roles: anon, authenticated
- `public.courses.courses_admin` — ALL; roles: authenticated
- `public.courses.courses_select` — SELECT; roles: authenticated
- `public.enrollment_requests.enrollment_requests_admin_manage` — ALL; roles: authenticated
- `public.enrollment_requests.enrollment_requests_select` — SELECT; roles: authenticated
- `public.enrollment_requests.enrollment_requests_student_insert` — INSERT; roles: authenticated
- `public.enrollments.enrollments_admin` — ALL; roles: authenticated
- `public.enrollments.enrollments_select` — SELECT; roles: authenticated
- `public.game_questions.game_questions_admin_manage` — ALL; roles: authenticated
- `public.game_questions.game_questions_read_published` — SELECT; roles: anon, authenticated
- `public.grades.grades_admin` — DELETE; roles: authenticated
- `public.grades.grades_select` — SELECT; roles: authenticated
- `public.grades.grades_teacher_insert` — INSERT; roles: authenticated
- `public.grades.grades_teacher_update` — UPDATE; roles: authenticated
- `public.hifz_assignment_completions.hifz_assignment_completions_select` — SELECT; roles: authenticated
- `public.hifz_assignment_completions.hifz_assignment_completions_student_insert` — INSERT; roles: authenticated
- `public.hifz_assignment_completions.hifz_assignment_completions_student_update` — UPDATE; roles: authenticated
- `public.hifz_assignments.hifz_assignments_admin_delete` — DELETE; roles: authenticated
- `public.hifz_assignments.hifz_assignments_select` — SELECT; roles: authenticated
- `public.hifz_assignments.hifz_assignments_teacher_insert` — INSERT; roles: authenticated
- `public.hifz_assignments.hifz_assignments_teacher_update` — UPDATE; roles: authenticated
- `public.hifz_records.hifz_records_admin_delete` — DELETE; roles: authenticated
- `public.hifz_records.hifz_records_select` — SELECT; roles: authenticated
- `public.hifz_records.hifz_records_teacher_insert` — INSERT; roles: authenticated
- `public.hifz_records.hifz_records_teacher_update` — UPDATE; roles: authenticated
- `public.messages.messages_admin` — ALL; roles: authenticated
- `public.messages.messages_insert` — INSERT; roles: authenticated
- `public.messages.messages_select` — SELECT; roles: authenticated
- `public.profile_contacts.profile_contacts_insert_own` — INSERT; roles: authenticated
- `public.profile_contacts.profile_contacts_select_own` — SELECT; roles: authenticated
- `public.profile_contacts.profile_contacts_update_own` — UPDATE; roles: authenticated
- `public.profiles.profiles_admin` — ALL; roles: authenticated
- `public.profiles.profiles_select` — SELECT; roles: authenticated
- `public.profiles.profiles_select_related_class_members` — SELECT; roles: authenticated
- `public.profiles.profiles_self_update` — UPDATE; roles: authenticated
- `public.quiz_answer_keys.quiz_answer_keys_owner_only` — ALL; roles: authenticated
- `public.quiz_attempts.quiz_attempts_select_own_or_quiz_manager` — SELECT; roles: authenticated
- `public.quiz_questions.quiz_questions_manage_quiz_owner` — ALL; roles: authenticated
- `public.quiz_questions.quiz_questions_select_accessible_quiz` — SELECT; roles: authenticated
- `public.quizzes.quizzes_delete_teacher_owner` — DELETE; roles: authenticated
- `public.quizzes.quizzes_insert_teacher_owner` — INSERT; roles: authenticated
- `public.quizzes.quizzes_select_published_or_owner` — SELECT; roles: authenticated
- `public.quizzes.quizzes_update_teacher_owner` — UPDATE; roles: authenticated

## Functions and procedures

Signatures and SECURITY DEFINER flags only; function bodies are intentionally omitted from this concise baseline.

- `private.admin_create_game_question_impl(p_game_type text, p_prompt text, p_options jsonb, p_explanation text, p_topic text, p_difficulty text, p_age_group text, p_answer_payload jsonb, p_is_published boolean)` → uuid; SECURITY DEFINER: true
- `private.admin_set_game_answer_impl(p_question_id uuid, p_answer_payload jsonb)` → void; SECURITY DEFINER: true
- `private.can_manage_enrollment(p_id uuid)` → boolean; SECURITY DEFINER: true
- `private.check_game_answer_impl(p_question_id uuid, p_selected_answer jsonb)` → boolean; SECURITY DEFINER: true
- `private.get_active_class_availability_impl()` → TABLE(class_id uuid, capacity integer, enrolled_count bigint, remaining_seats integer); SECURITY DEFINER: true
- `private.is_admin()` → boolean; SECURITY DEFINER: true
- `private.is_enrolled_in_class(p_class_id uuid)` → boolean; SECURITY DEFINER: true
- `private.is_teacher_of_class(p_class_id uuid)` → boolean; SECURITY DEFINER: true
- `private.owns_enrollment(p_id uuid)` → boolean; SECURITY DEFINER: true
- `private.prevent_profile_role_escalation()` → trigger; SECURITY DEFINER: false
- `private.submit_quiz_attempt_impl(p_quiz_id uuid, p_answers jsonb)` → TABLE(attempt_id uuid, correct_count integer, total_questions integer, percentage integer); SECURITY DEFINER: true
- `public.admin_create_game_question(p_game_type text, p_prompt text, p_options jsonb, p_explanation text, p_topic text, p_difficulty text, p_age_group text, p_answer_payload jsonb, p_is_published boolean)` → uuid; SECURITY DEFINER: false
- `public.admin_get_profile_contacts(p_user_ids uuid[])` → TABLE(user_id uuid, phone text); SECURITY DEFINER: true
- `public.admin_list_profile_contacts(p_offset integer, p_limit integer)` → TABLE(user_id uuid, phone text); SECURITY DEFINER: true
- `public.admin_set_game_answer(p_question_id uuid, p_answer_payload jsonb)` → void; SECURITY DEFINER: false
- `public.check_game_answer(p_question_id uuid, p_selected_answer jsonb)` → boolean; SECURITY DEFINER: false
- `public.check_game_answer(p_question_id uuid, p_selected_index integer)` → boolean; SECURITY DEFINER: true
- `public.get_active_class_availability()` → TABLE(class_id uuid, capacity integer, enrolled_count bigint, remaining_seats integer); SECURITY DEFINER: false
- `public.handle_new_user()` → trigger; SECURITY DEFINER: true
- `public.is_admin()` → boolean; SECURITY DEFINER: false
- `public.process_enrollment_request_review()` → trigger; SECURITY DEFINER: true
- `public.protect_profile_role()` → trigger; SECURITY DEFINER: false
- `public.rls_auto_enable()` → event_trigger; SECURITY DEFINER: true
- `public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)` → TABLE(attempt_id uuid, correct_count integer, total_questions integer, percentage integer); SECURITY DEFINER: false

## Non-internal triggers

- `public.enrollment_requests.trg_process_enrollment_request_review` (enabled=O)
- `public.profiles.profiles_prevent_role_escalation` (enabled=O)
- `public.profiles.protect_profile_role_before_update` (enabled=O)

## Default privileges

```json
[
  {
    "acl": "{postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}",
    "type": "S",
    "owner": "supabase_admin",
    "schema": "public"
  },
  {
    "acl": "{postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}",
    "type": "r",
    "owner": "supabase_admin",
    "schema": "public"
  },
  {
    "acl": "{postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}",
    "type": "f",
    "owner": "supabase_admin",
    "schema": "public"
  },
  {
    "acl": "{postgres=arwdDxtm/postgres,anon=Dxtm/postgres,authenticated=Dxtm/postgres,service_role=Dxtm/postgres}",
    "type": "r",
    "owner": "postgres",
    "schema": "public"
  },
  {
    "acl": "{postgres=rwU/postgres}",
    "type": "S",
    "owner": "postgres",
    "schema": "public"
  },
  {
    "acl": "{postgres=X/postgres}",
    "type": "f",
    "owner": "postgres",
    "schema": "public"
  }
]
```

## Important observations

1. The `profiles` table still has a legacy `phone` column alongside the separate `profile_contacts.phone` field. Prior audit confirmed authenticated SELECT access to the legacy column; this remains an outstanding privacy issue and was not changed here.
2. All 19 base tables in the inspected schemas currently have RLS enabled. RLS enablement alone does not establish that each policy is least-privilege.
3. Prior audit found broad TRUNCATE/TRIGGER/REFERENCES privileges on selected public tables and broad default ACLs for client roles. This snapshot records catalog structure; it does not remediate those grants.
4. The private schema includes `game_answer_keys`; client-deny policy is present in the policy inventory. Do not infer Data API exposure from schema usage alone.
5. Two public views are configured with `security_invoker=true`, reducing the usual view-owner RLS bypass concern.

## Scope and limitations

- Read-only catalog queries and the Supabase table-list metadata endpoint were used.
- Table column types, nullability, defaults, primary keys, foreign-key names, policy definitions, index definitions count, function signatures/security-definer flags, view options, trigger names, and default ACL records were inventoried.
- This document is not a byte-for-byte schema dump. It does not reconstruct historical migration bodies, enumerate every role grant as a full ACL snapshot, or certify application behavior.
- A catalog snapshot is point-in-time evidence. Re-capture before any future approved migration or security change.

## Explicit non-actions

No DDL or DML was executed. No rows were read. No grants, revokes, policies, RLS settings, triggers, functions, views, migration ledger entries, project settings, deployments, or branches were changed.
