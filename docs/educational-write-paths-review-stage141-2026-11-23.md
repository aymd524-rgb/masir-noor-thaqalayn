# Stage 141 — Educational write paths and table privileges review

Date: 2026-11-23
Supabase project: `pxwdfwozinxipvudupbl`
Repository: `aymd524-rgb/masir-noor-thaqalayn`

## Scope

Read-only review of live write policies and effective table privileges, selected trigger/function definitions, and repository backend helpers for teacher/student workflows. No application rows or personal data were queried. No writes were attempted.

## Application-to-policy mapping

### Student
- Student enrollment request helper inserts `enrollment_requests` with own student ID, class ID, pending status, and pending payment status.
- Live INSERT policy requires `student_id = auth.uid()`, pending initial status/payment, null review fields, and an active class/active linked course.
- Student workspace reads own requests and enrollments, then attendance, grades, hifz records and assignments through enrollment-scoped RLS.
- Student completion helper inserts/updates `hifz_assignment_completions` for its own student ID. Live INSERT and UPDATE policies require own student ID and verify the referenced assignment belongs to an enrollment owned by `auth.uid()`. No DELETE policy was observed; the helper has no delete path.

### Teacher
- Teacher backend loads classes, enrollments, pending requests, attendance, grades, hifz records, assignments and completion state.
- The client filters classes by supplied user ID, but this is only a convenience filter. The live class SELECT policy and `private.can_manage_enrollment()` are the server-side boundary.
- Attendance and grades INSERT/UPDATE policies require the enrollment to belong to a class whose `teacher_id = auth.uid()`, or an admin. DELETE is admin-only.
- Hifz record and assignment INSERT/UPDATE policies similarly require assigned-teacher scope or admin; inserts also bind `recorded_by` / `assigned_by` to `auth.uid()`.
- Related student profile names are fetched as `id,full_name`; live profile SELECT policy scopes related class members.

### Administrator
- Course/class creation and management, enrollment-request review, and role/admin management are protected by admin-only RLS policies in the inspected schema.
- The app's request review flow updates only a pending request and expects a returned row. The live `enrollment_requests_admin_manage` policy restricts this to admins.
- The BEFORE UPDATE trigger `process_enrollment_request_review` independently checks `auth.uid()` and `private.is_admin()`; on approval it requires paid/waived payment, active class/course, capacity, and creates an enrollment with conflict protection.

### Quizzes
- Quiz ownership policies restrict quiz/question/answer-key writes to the creator or admin, with teacher course ownership checks for non-admin quiz creation/update.
- Authenticated has no direct INSERT/UPDATE/DELETE table privileges on `quiz_attempts`; the expected submission path is a controlled RPC, which should be verified separately against its exact function definition and grants before relying on it.

## Important privilege finding — TRUNCATE

Effective table privilege inspection found `TRUNCATE` granted to both `authenticated` and `anon` on six public tables:
- `content_entries`
- `enrollment_requests`
- `game_questions`
- `hifz_assignment_completions`
- `hifz_assignments`
- `hifz_records`

This is materially different from ordinary row-level INSERT/UPDATE/DELETE: PostgreSQL TRUNCATE is not governed by RLS policies. The presence of the grant is confirmed at the database privilege layer. This inspection does **not** establish that a normal PostgREST browser endpoint exposes a TRUNCATE operation; exploitability through the configured API surface must not be assumed without a separate test. Nevertheless, public-role TRUNCATE grants are unnecessary for the reviewed browser workflows and should be reviewed for removal after dependency/owner confirmation and a rollback plan.

Other observations:
- `anon` had no ordinary INSERT/UPDATE/DELETE table privileges on the inspected public tables, but the six TRUNCATE grants above were present.
- `authenticated` had ordinary write privileges on several tables whose RLS policies narrow row operations; `quiz_attempts` was the exception and had no direct table write privileges.
- The live policy set includes intentional admin-only content/game-question management; earlier repository scan found no direct TypeScript references to `content_entries` or `game_questions`, but external integrations remain unverified.

## Recommended next steps (not performed)

1. Review ownership, external consumers, and Supabase API reachability for the six TRUNCATE grants; then prepare a separate least-privilege migration with rollback before any revocation.
2. Verify the quiz-attempt submission RPC's exact function body, EXECUTE grants, and caller authorization.
3. Add integration tests for student-owned completion writes, teacher assigned/unassigned enrollment writes, admin-only enrollment review, and capacity/payment enforcement.
4. Keep browser-supplied `userId` and `isAdmin` as UI filters only; authorization must remain based on `auth.uid()` and database role checks.

## Non-actions

No SQL/DDL/DML, GRANT/REVOKE, RLS/policy, trigger/function, Auth/Data API setting, migration, deployment, test-user creation, PR merge, or production data modification was performed.
