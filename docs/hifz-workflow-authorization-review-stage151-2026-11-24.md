# Stage 151 — Quran memorization workflow authorization review

Date: 2026-11-24
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Supabase project: `pxwdfwozinxipvudupbl`

## Scope and evidence

Static source review of the current `main` branch files:
- `src/lib/backend/teacher.ts`
- `src/lib/backend/student.ts`
- `src/components/teacher/TeacherBackendPanel.tsx`
- `src/components/student/StudentBackendPanel.tsx`
- `supabase/migrations/20261112134500_create_secure_hifz_records.sql`
- `supabase/migrations/20261112150000_create_secure_hifz_weekly_assignments.sql`

This is a source/migration review, not a fresh live-database inspection or runtime test. The live catalog findings from Stages 141 and 148 are cited as prior evidence and must be revalidated before remediation.

## Workflow map

### Teacher record of memorization and review

- Teacher UI selects an enrollment, surah, ayah range, record type, assessment, session date, and notes.
- `saveTeacherHifzRecord` validates the surah and surah-specific ayah bounds in the browser helper before inserting into `hifz_records`.
- The migration's INSERT policy requires `recorded_by = auth.uid()` and assigned-enrollment management (or admin).
- Students can read records scoped to their own enrollment; assigned teachers and admins can read them.
- The UI presents teacher-recorded memorization and review assessments to the student.

### Teacher weekly assignment

- Teacher UI selects an enrollment and creates a memorization/review assignment with a due date and instructions.
- `saveTeacherHifzAssignment` validates the surah-specific ayah range and supplies `assigned_by = user.id`.
- The INSERT policy requires `assigned_by = auth.uid()` and assigned-enrollment management (or admin).
- Students can read assignments for their own enrollment; assigned teachers and admins can read them.

### Student completion update

- Student UI lets the student mark an assignment `in_progress`, `completed`, or `needs_help`, with an optional note.
- `saveStudentHifzAssignmentStatus` sends the supplied student ID, but database INSERT/UPDATE policies bind `student_id` to `auth.uid()` and verify that the assignment belongs to an enrollment owned by the caller.
- The student helper sets `submitted_at` when the student chooses `completed`; it is client-generated and is not independent teacher approval.
- Teacher workspace reads the completion status and note for assignments within the teacher's visible enrollments.

## Positive controls observed in source/migrations

1. Student completion writes are constrained by RLS to `student_id = auth.uid()`.
2. Student completion writes must reference an assignment connected to an enrollment owned by that student.
3. Teacher-created records bind `recorded_by` to the authenticated identity at INSERT.
4. Teacher-created assignments bind `assigned_by` to the authenticated identity at INSERT.
5. Teacher reads/writes are scoped through `private.can_manage_enrollment()`; admins are separately allowed.
6. The frontend helper validates surah-specific ayah ranges before normal UI writes.
7. Student helper does not use a privileged key; it uses the ordinary Supabase client and relies on RLS.

## Findings and gaps

### HIFZ-1 — Role demotion may not revoke assigned-class authority

Prior Stage 148 live-catalog review found that `private.can_manage_enrollment()` checks class assignment but not the caller's current `profiles.role`. The hifz record and assignment policies call this helper. Therefore changing a teacher's role to student without removing or changing their class assignment may leave hifz-management access in place.

This is a policy-design question with security impact, not proof of a tested exploit. Decide whether teacher role and class assignment must both be true. Reinspect the live helper and dependent policies before any fix.

### HIFZ-2 — Database constraints do not enforce surah-specific ayah bounds

The browser helper validates `ayah_end <= getSurah(surah).ayahCount`, but the `hifz_records` migration only constrains ayah values to a generic upper bound of 286. The weekly-assignment migration constrains surah number to 1–114 and `ayah_end >= ayah_start`, but does not enforce an upper ayah bound or the actual ayah count for that surah.

A direct authenticated API request can bypass frontend validation. Database-side validation should be considered after checking the canonical surah metadata source and agreeing on a migration/rollback design. Do not guess the surah counts or apply a production constraint in this stage.

### HIFZ-3 — Student completion is self-reported, not teacher-verified

The student can set `status = completed` and provide `submitted_at`; the current schema/policies do not make that status equivalent to teacher-reviewed mastery. The UI currently labels it as completed, which may be interpreted as verified completion.

Product decision required: should this mean “student says task is done”, “submitted for review”, or “teacher approved”? If teacher approval is required, model a distinct review state and authorized teacher action rather than trusting a client timestamp.

### HIFZ-4 — Assignment attribution can be changed on update

The assignment UPDATE policy checks management access for the old row and the new row, but its `WITH CHECK` does not require `assigned_by = auth.uid()` or preserve the original attribution. An authorized manager of the relevant enrollment may therefore be able to change the attribution field during an update. This is an integrity/audit-trail concern, not a demonstrated privilege escalation.

Decide whether `assigned_by` is immutable, admin-editable only, or transferable through an explicit reassignment workflow. Verify live policy and column privileges before proposing a change.

### HIFZ-5 — Record update attribution is more restrictive than assignment update

The hifz-record UPDATE policy's `WITH CHECK` requires `recorded_by = auth.uid()` as well as current management scope. This should be tested for intended behavior when one teacher needs to correct another teacher's record. No such correction workflow was confirmed in the reviewed UI.

### HIFZ-6 — Student completion update does not visibly constrain status transitions

The RLS policy binds ownership and assignment scope, while the database CHECK constraint limits status to the three allowed values. The source helper permits transitions in either direction, including from completed back to in-progress. If completion is intended to be final after teacher approval, a server-enforced transition policy is needed.

## Staging-only verification matrix

Use only disposable synthetic accounts and fixtures. Verify both API response and persisted state.

| Scenario | Expected property to verify |
|---|---|
| Student A creates completion for own assignment | Allowed; student_id persisted as auth.uid() |
| Student A supplies Student B as student_id | Rejected by RLS |
| Student A updates Student B's completion | No row updated / denied |
| Student A references assignment in Student B's enrollment | Rejected |
| Assigned teacher creates hifz record | Allowed; recorded_by is auth.uid() |
| Unassigned teacher creates or updates a record | Rejected |
| Teacher role is demoted but class assignment remains | Must match explicit role-revocation decision |
| Teacher changes assignment assigned_by | Must match approved attribution rule |
| Student directly submits impossible ayah range | Rejected by database, not merely by UI |
| Student marks assignment completed | Clearly represented as self-reported until reviewed, if that is the approved policy |
| Student changes completed back to in_progress | Must match approved transition rule |
| Student A reads another student's hifz records/completions | Denied or no visible rows |

## Decisions required before implementation

1. Does a student-completed assignment mean self-reported completion or teacher-approved completion?
2. Should a teacher's current role be required in addition to class assignment for hifz management?
3. Is assignment attribution immutable after creation?
4. Are students allowed to reopen a completed assignment?
5. Which canonical Quran metadata source should the database use to validate per-surah ayah bounds?

## Gates and non-actions

- Re-read live helper definitions, RLS policies, table grants, and current schema before any remediation.
- Agree on product semantics and a migration/rollback plan.
- Test positive and negative cases in disposable staging.
- No live RPC was called; no user or educational rows were read or changed.
- No SQL, DDL, DML, grant, revoke, policy, trigger, migration, Auth/Data API setting, or deployment was changed.
- No PR was merged or release published.

Stage 151 is a documentation-only review. The findings above are not authorization to modify production.
