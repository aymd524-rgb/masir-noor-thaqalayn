# Stage 152 — Student data privacy, profile contact access, and auditability review

Date: 2026-11-24
Repository: `aymd524-rgb/masir-noor-thaqalayn`

## Scope and evidence

Static review of:
- `supabase/migrations/20261119103000_isolate_profile_contacts.sql`
- `src/lib/backend/student.ts`
- `src/lib/backend/teacher.ts`
- `src/lib/backend/validation.ts`
- `src/components/student/StudentBackendPanel.tsx`
- `src/components/teacher/TeacherBackendPanel.tsx`

Prior live-catalog findings are carried forward from Stage 148 and are not represented as a fresh live inspection in this stage. No personal row values, phone numbers, credentials, tokens, or secrets were accessed.

## 1. Contact-data separation

The profile-contact migration:
- Creates `public.profile_contacts` with `user_id`, `phone`, and `updated_at`.
- Enables RLS and defines own-row SELECT, INSERT, and UPDATE policies.
- Copies non-empty legacy `profiles.phone` values into `profile_contacts` without overwriting an existing contact row.
- Adds two SECURITY DEFINER admin RPCs to retrieve contacts by IDs or by a bounded page.
- Explicitly checks `private.is_admin()` inside both RPCs and revokes execution from PUBLIC/anon, granting EXECUTE to authenticated.

Positive control: the new contact table is intended to isolate phone data behind self-row policies, with a separate server-side admin gate for administrative retrieval.

## 2. Legacy phone-column concern

Stage 148's live catalog report found that `profiles.phone` still existed and authenticated users had SELECT access to the legacy column under the reviewed profile policies/column grants.

The inspected migration copies phone values to `profile_contacts`, but the migration text does not itself drop the legacy `profiles.phone` column or explicitly revoke legacy column SELECT privileges. Therefore data migration alone does not prove the old exposure path has been closed.

Required action before claiming contact isolation complete:
1. Reinspect the live `profiles` columns, table grants, column grants, and all SELECT policies.
2. Confirm every application path has stopped reading `profiles.phone`.
3. Determine whether the legacy column is still needed for compatibility.
4. If approved, prepare a reviewed migration to remove or restrict the legacy field, with a rollback/data-retention plan.
5. Verify with synthetic authenticated accounts that unrelated users cannot retrieve another user's phone through table queries, views, RPCs, or API projections.

Do not drop or revoke anything based only on this report.

## 3. Admin contact RPC review

The migration's two RPCs:
- Check admin status inside the SECURITY DEFINER body.
- Use an empty search_path.
- Qualify referenced objects with schema names.
- Revoke PUBLIC/anon execution and grant authenticated execution, with the function body providing the admin gate.
- Bound list pagination to at most 5,000 rows per call.

Open verification items:
- Re-read live function definitions, owners, grants, and `prosecdef` state.
- Confirm there is no alternate overload with broader grants.
- Confirm admin role changes take effect as intended for existing sessions.
- Verify that returned contact data is not written to client logs, analytics, error messages, or broad caches.
- Consider whether the maximum page size is appropriate for the admin UI and operational need.

No contact RPC was called in this stage.

## 4. Student and teacher data access paths

### Student workspace

The student backend requests enrollments and requests filtered by the supplied user ID, then reads attendance, grades, memorization records, assignments, and completion rows by enrollment IDs. The helper uses the ordinary Supabase client and no service-role key.

These client-side filters improve query scope but are not authorization boundaries. The security guarantee must come from live RLS policies that bind the caller to `auth.uid()` and ensure each enrollment belongs to that caller. This stage did not run API requests or revalidate those policies.

### Teacher workspace

The teacher backend filters classes by the supplied user ID for non-admins, then loads student names, attendance, grades, hifz records, assignments, and completions for those classes. The UI receives names and learning-progress details for assigned students.

The query filters are not a substitute for RLS. Confirm that every downstream table policy independently limits access to the current authorized teacher/class relationship, including after role demotion or class reassignment. Do not assume a class list filtered in the browser makes subsequent queries safe.

### Data minimization

The teacher workspace loads full attendance, grade, hifz-record, and assignment histories for all visible enrollments to build report cards and progress summaries. Review whether the interface needs all historical notes and assessment details on every load. If not, introduce date windows, pagination, or narrower projections after product approval, without weakening RLS.

## 5. Auditability and educational record integrity

The reviewed teacher helper inserts grades and hifz records and updates attendance, while the student helper creates/updates completion status. The inspected code does not show a dedicated append-only audit event being written for each change.

The tracked migration files inspected in this review do not provide evidence of a dedicated audit-log schema for these educational mutations. This is not proof that no such object exists in the live database; verify the live catalog before deciding.

Product/security questions:
- Should edits to grades, attendance, teacher assessments, or hifz assignments retain old and new values, actor, timestamp, and reason?
- Which roles may view audit history?
- How long should audit events be retained?
- Should teacher approval of student-reported completion be a separate event from the student's submission?
- Must the original creator/recorder remain immutable?

Recommended design principle: keep audit events append-only and server-generated; do not accept actor identity or event timestamp as trusted client-supplied facts. Minimize sensitive free-text notes in audit payloads.

## 6. Validation is not authorization

The current frontend validation checks attendance date/status, non-negative grade score, and Quran surah/ayah ranges. These checks improve usability but can be bypassed by direct API calls.

Before relying on these invariants, verify corresponding database constraints or server-side validation for:
- Attendance status and real calendar date.
- Grade score bounds and a defined maximum score.
- Surah-specific ayah range limits.
- Allowed completion status transitions.
- Text length limits for notes and instructions.

Do not invent a grade maximum or Quran metadata source; obtain product/domain approval first.

## 7. Staging-only verification matrix

Use synthetic accounts and a disposable staging project only.

| Scenario | Required assertion |
|---|---|
| User A queries own profile contact | Only A's contact is returned |
| User A queries User B's legacy `profiles.phone` | Denied or column not present |
| User A calls admin contact RPC | Explicit authorization denial |
| Admin calls admin contact RPC | Only requested contacts are returned |
| Anonymous caller calls contact RPC | Denied |
| Student A queries Student B's enrollment-linked attendance/grades/hifz | Denied or no visible rows |
| Teacher A queries unrelated class data | Denied or no visible rows |
| Teacher A loses class assignment | Subsequent reads and writes follow the approved revocation policy |
| Student submits malformed score/date/ayah range directly | Server/database rejects invalid input |
| Authorized teacher edits an educational record | Audit event captures actor, target, action, and timestamp without leaking unnecessary note content |

Record API outcome and persisted state. A zero-row result is not automatically proof of a permission error.

## 8. Decisions and gates

1. Confirm whether legacy `profiles.phone` can be removed or must be retained.
2. Confirm the minimum admin roles and workflows that require phone access.
3. Decide which educational record mutations require immutable audit history.
4. Decide retention and audit-reader roles.
5. Reinspect live grants, RLS, functions, views, and schema before implementation.
6. Prepare migrations and rollback plans only after approval.
7. Verify in disposable staging with synthetic users before production approval.

## Explicit non-actions

- No phone/contact values or user rows were read.
- No RPC was invoked.
- No SQL, DDL, DML, policy, grant, revoke, function, trigger, or migration was executed or changed.
- No Auth/Data API setting, secret, deployment, merge, or release was changed.

## Status

Stage 152 is a documentation-only privacy and auditability review. The legacy phone-column access path and the existence/coverage of live audit objects remain verification items. Production remediation is not authorized by this report.
