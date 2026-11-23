# Live Supabase schema and security inventory

**Audit date:** 2026-11-23  
**Project ref:** `pxwdfwozinxipvudupbl`  
**Method:** read-only SQL/catalog inspection; no database writes.

## Confirmed schema baseline

- 18 base tables in `public`.
- All 18 public base tables have RLS enabled.
- 50 public RLS policies.
- 24 application functions across `public` and `private`.
- 6 SECURITY DEFINER functions in `public`; 10 in `private`.
- Two public views: `class_management_dashboard` and `enrollment_request_dashboard`.
- Both views have `security_invoker=true`, are owned by `postgres`, and grant SELECT to `authenticated` but not `anon`.
- Seven enabled event triggers were observed, including `ensure_rls` invoking `rls_auto_enable()`.

## Contact-data access

- `profiles` includes legacy `phone` column.
- `profile_contacts` is the separate contact table used by the current application path.
- `admin_get_profile_contacts(uuid[])` and `admin_list_profile_contacts(integer, integer)` are SECURITY DEFINER functions. Both require `private.is_admin()` in their function bodies and have EXECUTE for authenticated users, but not anon.
- Prior audit established that authenticated has column SELECT on `profiles.phone`; this remains a required remediation item.
- No phone values were selected or copied as part of this audit.

## Role-protection trigger duplication

Two enabled BEFORE UPDATE triggers protect profile role changes:

- `profiles_prevent_role_escalation` calls `private.prevent_profile_role_escalation()`.
- `protect_profile_role_before_update` calls `public.protect_profile_role()`.

Both functions implement the same check: if role changes, the caller must satisfy `private.is_admin()`. This appears redundant. Do not remove either trigger until the migration history and application behavior are reconciled; record it for a later idempotent cleanup.

## Broad non-row-level grants requiring remediation review

Catalog checks show both `anon` and `authenticated` have TRUNCATE and TRIGGER privileges on these six public base tables:

- `content_entries`
- `enrollment_requests`
- `game_questions`
- `hifz_assignment_completions`
- `hifz_assignments`
- `hifz_records`

They also have REFERENCES on those tables. RLS does not govern TRUNCATE or table-level TRIGGER privileges. This is a high-priority least-privilege issue. The catalog grant alone does not establish that the exposed REST API provides a direct SQL execution route, but the privileges should be revoked from public client roles unless a documented requirement exists. Keep REFERENCES only if a real application need is established.

A separate privilege query also included `class_management_dashboard`; catalog inspection confirms this is a view, not a base table. TRUNCATE was not granted on that view; its TRIGGER privilege is not a reason to treat it as a truncatable table.

## Function execution review

The following public SECURITY DEFINER functions were observed:

| Function | anon EXECUTE | authenticated EXECUTE | Notes |
|---|---:|---:|---|
| `admin_get_profile_contacts(uuid[])` | no | yes | Explicit admin check in body |
| `admin_list_profile_contacts(integer, integer)` | no | yes | Explicit admin check in body |
| `check_game_answer(uuid, integer)` | no | no | Authenticated clients cannot execute this overload by current privilege check |
| `handle_new_user()` | no | no | Trigger function |
| `process_enrollment_request_review()` | no | no | Trigger function; checks auth and admin |
| `rls_auto_enable()` | no | no | Event-trigger function |

The integer overload of `check_game_answer` may be a client integration mismatch if the frontend calls it as authenticated; verify the exact RPC call path before changing grants. Do not broaden EXECUTE grants without confirming intended caller and function behavior.

## Recommended remediation order

1. Reconcile migration history and preserve a verified schema snapshot.
2. Remove authenticated SELECT from legacy `profiles.phone` after confirming no current client relies on it; keep phone access via `profile_contacts` and the checked admin functions.
3. Revoke unnecessary TRUNCATE and TRIGGER privileges from `anon` and `authenticated` on the six base tables; decide REFERENCES separately based on actual dependencies.
4. Verify the overloaded `check_game_answer` RPC caller and its intended role; add only the narrowest needed EXECUTE permission if confirmed.
5. Consolidate the duplicate profile-role trigger only in a later migration after verifying the exact migration chain.
6. Re-run RLS, grants, advisor, and role-based integration checks in a disposable database before any production change.


## Follow-up verification (2026-11-23)

### Exact profile grants and safe migration shape

A direct privilege check confirmed:

- `anon` cannot SELECT `profiles` or `profiles.phone`.
- `authenticated` can SELECT `profiles` and `profiles.phone`.
- The current admin UI reads profile identity fields from `profiles`, then fetches contact numbers through `admin_get_profile_contacts`.
- The admin UI does not select `phone` from `profiles`; its contact mapping is sourced from the RPC result. The signed-in user resolver will use only the four identity columns after the separate profile-query fix in PR #7 is merged; current `main` still contains the invalid `name` selection, so this grant change depends on that fix being accepted first.
- `profile_contacts` policies permit a user to SELECT/INSERT/UPDATE only their own row. Admin contact access is handled separately by the checked RPC.

**Important PostgreSQL detail:** a column-level REVOKE of `SELECT(phone)` alone will not neutralize a table-level SELECT grant. A safe staged test must instead remove table-level SELECT from `authenticated`, then grant SELECT only on the identity columns actually used:

```sql
-- Proposed only; NOT executed against production.
REVOKE SELECT ON TABLE public.profiles FROM authenticated;
GRANT SELECT (id, full_name, role, created_at)
ON TABLE public.profiles TO authenticated;
```

This must first be tested against every frontend query, relationship embed, view, and integration test. RLS policies remain in force for row visibility. The existing admin UI uses these four fields in its profile list; the signed-in user resolver also needs identity/role/created_at and reads phone from `profile_contacts`. Do not apply this until the complete query inventory and role-based tests pass.

### Table ACL and future-object defaults

The six affected base tables are owned by `postgres`. Their exact ACLs differ by table; authenticated has broad DML privileges on several, while anon has SELECT on `content_entries` and `game_questions`. All six show TRUNCATE/TRIGGER/REFERENCES for both public client roles.

The database also has creator-specific default privileges in `public`:

- Default privileges for objects created by `postgres` include TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN for `anon` and `authenticated`.
- Default privileges for objects created by `supabase_admin` include broad table privileges for those roles.

The first default ACL should be reviewed and narrowed so future application tables do not inherit unnecessary non-RLS privileges. Do not alter `supabase_admin` defaults as part of this task; that role may be used by Supabase-managed operations and needs separate platform-specific review.

### Security Advisor and privileged RPCs

The live Security Advisor reports two warnings for the authenticated-executable SECURITY DEFINER contact RPCs, plus one warning that leaked-password protection is disabled.

The two RPCs deliberately serve the current admin UI and both check `private.is_admin()` before returning contact records. The helper checks the caller's role in `public.profiles` using `auth.uid()`; it does not trust user-editable metadata. The advisor warning is therefore a review item, not proof that non-admins can retrieve contacts. Preserve the server-side admin check and add explicit non-admin denial tests. Do not revoke EXECUTE without first replacing the current admin UI path.

The leaked-password protection warning is an Auth dashboard setting, not a SQL grant. It requires a separate owner/admin decision and should be enabled through Supabase Auth settings after confirming the project's login requirements.

### Proposed least-privilege SQL for later reviewed migration

```sql
-- Proposed only; NOT executed.
REVOKE TRUNCATE, TRIGGER, REFERENCES
ON TABLE
  public.content_entries,
  public.enrollment_requests,
  public.game_questions,
  public.hifz_assignment_completions,
  public.hifz_assignments,
  public.hifz_records
FROM anon, authenticated;

-- Proposed only; NOT executed.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON TABLES FROM anon, authenticated;
```

Do not revoke INSERT/SELECT/UPDATE/DELETE as a blanket operation: the app's intended RLS-controlled workflows need those privileges selectively. Confirm each table's required operations and test anon/authenticated roles before finalizing grants. Revisit default privileges for any other role that creates exposed application tables.

## Required tests before production remediation

1. Signed-in student can read only their own profile identity fields and their own contact row.
2. Teacher can read identity fields for only the class-related profiles allowed by the existing RLS policy; cannot read any phone number through `profiles`.
3. Admin can read identity fields and retrieve contact numbers through the checked RPC.
4. Non-admin cannot retrieve contacts by calling either admin RPC directly.
5. All current profile update, role-management, class dashboard, enrollment, attendance, grade, hifz, quiz, and game flows still work.
6. Anonymous requests cannot read protected application records or call privileged RPCs.
7. No client role has TRUNCATE/TRIGGER/REFERENCES/MAINTAIN on application tables unless a documented requirement exists.
8. Re-run Supabase Security Advisor and role-based integration tests after changes.



## Read-only baseline test run (2026-11-23)

A reusable SELECT-only check script was added at `scripts/audit/security-baseline-readonly.sql`. It reports pass/fail for RLS coverage, legacy phone access, broad TRUNCATE/TRIGGER privileges, dashboard view security mode, and anonymous access to contact RPCs. It does not read user rows or contact values.

The script was executed against the currently connected project as a baseline (not as a staging test):

| Check | Result |
|---|---|
| All 18 public base tables have RLS | PASS |
| anon cannot SELECT `profiles.phone` | PASS |
| authenticated cannot SELECT `profiles.phone` | FAIL — expected remediation |
| Both dashboard views use `security_invoker` | PASS |
| anon cannot execute the two contact RPCs | PASS |
| No anon TRUNCATE/TRIGGER on public base tables | FAIL — remediation needed |
| No authenticated TRUNCATE/TRIGGER on public base tables | FAIL — remediation needed |

Only one Supabase project is currently connected to this account, so a separate staging project was not available. No staging database was created, because a new project/branch may incur cost and the user has a strict no-paid-tools constraint. The SQL file is a baseline checker, not a migration and must not be mistaken for role-based application integration tests.

## Stage 126 limitations and next safe step

The current account/project inventory exposes only the production project. Full student/teacher/admin behavior tests require a disposable staging database with representative test users and rows. Until a no-cost staging environment is available, do not simulate these tests against real user data or make production ACL changes. The next safe step is to complete a static query/permission dependency inventory, then present the exact migration and rollback plan for explicit review before any production execution.

## Explicit non-actions

- No DDL or DML was executed.
- No grants, policies, triggers, functions, views, or event triggers were changed.
- No migration ledger entries were changed.
- No data values, phone numbers, or credentials were read.
- This file is an audit record, not an executable migration.


## Stage 127 — frontend query and privilege dependency map (2026-11-23)

Inspected the current `main` source files: `src/lib/backend/supabase.ts`, `src/lib/auth.tsx`, `src/lib/backend/student.ts`, `src/lib/backend/teacher.ts`, `src/lib/backend/quizzes.ts`, and `src/components/admin/AdminBackendPanel.tsx`. This is a static source audit, not a runtime role test.

### Profile and contact dependencies

| Flow | Profile columns / contact path | Required access model |
|---|---|---|
| Session bootstrap | Own profile: `id, full_name, role, created_at`; own `profile_contacts.phone` | authenticated self row; own contact row |
| Teacher workspace | Related student profiles: `id, full_name` | RLS only for related class members |
| Admin workspace | Profile identity and role columns; contact numbers via `admin_get_profile_contacts(uuid[])` | admin profile policy and admin-checked RPC |
| Profile edit | Updates own `profiles.full_name` and own `profile_contacts.phone` | own-row UPDATE/INSERT policies |
| Role management | Admin updates `profiles.role` | admin-only UPDATE policy and role-protection triggers |

Important: current `main` still selects nonexistent `profiles.name` in `src/lib/backend/supabase.ts`. PR #7 removes that column and selects `id,full_name,role,created_at`; it remains open and unmerged. Do not apply a column-level profile SELECT restriction until PR #7 has passed CI, is reviewed/merged by the repository owner, and the app has passed the role smoke tests.

The admin UI already reads contact numbers through `admin_get_profile_contacts`, not directly from `profiles.phone`. The function body checks `private.is_admin()` and raises SQLSTATE 42501 for non-admin callers. The student session bootstrap reads only the user's own `profile_contacts` row. Therefore the legacy `profiles.phone` column is not required by the inspected frontend flows.

### Student, teacher, and admin table usage

- Student: reads active courses/classes, own enrollment requests and enrollments, class availability via `get_active_class_availability()`, own attendance/grades/hifz records/assignments/completions; inserts enrollment requests and own assignment completions.
- Teacher: reads assigned classes, related enrollments and pending requests, related student identity fields, attendance/grades/hifz data; writes attendance, grades, hifz records, and assignments for enrollments they manage.
- Admin: reads profiles, courses, classes, enrollment requests/enrollments, attendance, grades, hifz records/assignments/completions; updates profile roles and reviews enrollment requests; retrieves contacts through the admin RPC.
- Quiz workspace: uses `quizzes`, `quiz_questions`, `quiz_answer_keys`, and `quiz_attempts`; submits answers through `submit_quiz_attempt`.
- No frontend references were found in the inspected backend modules for legacy `content_entries` or `game_questions`. They must be treated as potentially legacy tables until the full repository search and product-owner review confirm they are unused. Do not revoke their normal DML/SELECT permissions in this stage.

### Current privilege observations

A catalog-only query confirmed that both `anon` and `authenticated` currently have TRUNCATE, REFERENCES, and TRIGGER on each of these six tables: `content_entries`, `enrollment_requests`, `game_questions`, `hifz_assignment_completions`, `hifz_assignments`, and `hifz_records`. This is distinct from RLS; RLS does not govern TRUNCATE or table-level TRIGGER privileges. On `profile_contacts`, authenticated has SELECT/INSERT/UPDATE and anon has none. On `profiles`, authenticated currently has table-level SELECT and DML privileges; RLS constrains rows, but table-level SELECT still exposes every selectable column, including legacy `phone`.

### Proposed remediation sequence — NOT EXECUTED

1. Review and merge PR #7 only after its CI and manual role smoke tests pass. This is a prerequisite, not an automatic action.
2. In a disposable staging database, verify student self-profile/contact reads; teacher related-profile reads; admin profile/role/contact flows; non-admin denial of both contact RPCs; and all attendance, grade, enrollment, hifz, and quiz workflows.
3. Only after those tests, consider replacing the broad `profiles` table SELECT grant with a column grant for the columns used by the inspected client:
   ```sql
   REVOKE SELECT ON TABLE public.profiles FROM authenticated;
   GRANT SELECT (id, full_name, role, created_at)
   ON TABLE public.profiles TO authenticated;
   ```
   This preserves the profile fields used by the current client and still relies on RLS to restrict rows. It intentionally does not grant SELECT on `profiles.phone`. Recheck whether revealing the `role` column for related class members is acceptable; if not, move role lookup into an admin/self-only RPC before applying this grant.
4. Revoke only structural privileges from the six catalog-confirmed tables, after confirming no documented client-side administrative need:
   ```sql
   REVOKE TRUNCATE, REFERENCES, TRIGGER
   ON TABLE public.content_entries, public.enrollment_requests,
     public.game_questions, public.hifz_assignment_completions,
     public.hifz_assignments, public.hifz_records
   FROM anon, authenticated;
   ```
5. Narrow future defaults for objects created by `postgres` in `public`, after confirming the owner and PostgreSQL 17 syntax in staging:
   ```sql
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
   REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
   ON TABLES FROM anon, authenticated;
   ```
   Do not modify `supabase_admin` default privileges. Do not broadly revoke SELECT/INSERT/UPDATE/DELETE, because the app's RLS-protected workflows depend on those operations.
6. Re-run the read-only baseline script, role-based tests, Security Advisor, and the complete student/teacher/admin smoke-test matrix. Roll back by restoring the exact previous ACLs captured immediately before the migration; do not rely on generic blanket GRANTs.

### Rollback and release gate

Before any production migration, export the exact current table ACLs and default ACLs for the affected owners/roles, save a schema backup/snapshot if available, and prepare a reverse migration restoring those exact ACLs. Apply one reviewed migration only after staging passes. Immediately re-run the baseline and app smoke tests; if any role flow fails, restore the captured ACLs and stop release. No production execution is authorized by this report.

### Explicit limitations

Only the connected production project is available; no separate staging project was created. No authenticated test accounts were impersonated, no user rows/contact values were read, and no real student/teacher/admin UI session was exercised. No SQL migration, grant/revoke, RLS policy, function, trigger, or production data was changed.


## Stage 128 — role test plan and ACL snapshot preparation (2026-11-23)

Added two review artifacts to this documentation branch:

- `docs/role-based-access-test-plan-2026-11-23.md`: synthetic student A/student B/teacher/admin/anonymous test matrix, positive and negative checks, staged execution outline, and release gates.
- `scripts/audit/acl-snapshot-readonly.sql`: SELECT-only JSON snapshot of table ACLs, column ACL entries, table default ACLs, owners, and effective anon/authenticated table privileges.

### Verification of the snapshot script

The new SQL file was executed against the connected project as a catalog-only read. It returned successfully and did not read application rows or contact values. The snapshot confirmed:

- The six previously identified tables are owned by `postgres`; their raw ACL arrays differ in some ordinary DML privileges, which is why generic blanket GRANT statements are not a safe rollback.
- `profiles` has table-level SELECT for `authenticated`; `anon` has no SELECT. `profile_contacts` has authenticated SELECT/INSERT/UPDATE and no anon access.
- The six flagged tables still show TRUNCATE, REFERENCES, and TRIGGER privileges for both anon and authenticated.
- The `postgres` table default ACL for `public` includes broad client-role privileges. The snapshot also records other schemas' defaults so future rollback review has the complete captured scope.
- `supabase_admin` has separate default ACL entries in several schemas, including `public`; these remain explicitly out of scope and must not be modified as part of this application remediation.
- No column-level ACL entries were present for the inspected public base tables at capture time.

The snapshot output is an audit artifact from the current time, not a permanent backup. Re-run it immediately before any separately approved migration and securely retain the complete JSON output. Exact restoration must be generated and reviewed from that fresh snapshot, preserving table owners, grantors, PUBLIC entries, grant options, column ACLs, and default ACLs. Do not use blanket GRANTs or infer rollback from effective privilege booleans alone. If exact grantor-preserving restoration cannot be guaranteed, do not proceed with production ACL changes.

### Role-test and profile-column caveat

The role test plan is prepared but has NOT been executed. No staging project is connected, and no synthetic users or fixtures were created. Do not impersonate roles or fabricate JWT claims against production.

The proposed `profiles` column grant still requires an explicit decision: it includes `role`, which would expose role values for every profile row visible to an authenticated caller under existing RLS. Teacher-facing profile queries need only `id,full_name`; session bootstrap and admin role management need `role`. Before any grant change, either document that teacher-visible role disclosure is acceptable or redesign role retrieval as self/admin-only. This remains a blocking design decision, not an approved SQL change.

### Repository search limitation

Additional GitHub code-search queries for profile/contact and legacy-table references returned no indexed matches. This does not prove those references are absent from the full repository. The earlier inspected backend modules remain a partial static dependency map; a complete local repository-wide search is still required before changing ordinary DML/SELECT privileges on legacy tables.

### Explicit non-actions

- No GRANT/REVOKE, DDL, DML, RLS, function, trigger, view, migration ledger, or deployment change was made.
- No staging users or production role impersonation tests were run.
- PR #7 and PR #9 remain review items; neither was merged by this work.
- The new snapshot and role-test files are documentation/audit assets only.


## Stage 129 — profile role isolation design (2026-11-23)

Catalog and targeted source review confirmed that the existing `profiles_select_related_class_members` policy allows teachers to read profile rows for class-related students/teachers, while `profiles_select` permits self/admin and `profiles_admin` is admin-only. Therefore a column-level SELECT grant on `role` to all authenticated users would expose role values for those related profiles. The risk is real even though the current teacher query selects only `id,full_name`.

Source touchpoints reviewed on `main`:
- `src/lib/auth.tsx` calls `resolveBackendUser` on session restore and sign-in; profile edit updates `full_name`, contact update writes `profile_contacts`.
- `src/lib/backend/supabase.ts` session resolver selects profile role; PR #7 removes nonexistent `name` but still selects role.
- `src/components/admin/AdminBackendPanel.tsx` reads profile roles for admin directory and updates roles directly.
- `src/components/admin/AdminCourseClassManager.tsx` filters profiles by `role='teacher'`.
- `src/lib/backend/teacher.ts` needs only `id,full_name` for related student rows.
- GitHub code-search returned no indexed matches; this is not proof of absence. A complete local repository-wide search remains a pre-migration gate.

Prepared `docs/profile-role-isolation-proposal-2026-11-23.md`, a docs-only design for:
1. `get_my_profile_role()`: no user-id argument; returns only the authenticated caller's own role; SECURITY DEFINER with empty search_path and strict EXECUTE grants.
2. `admin_list_profiles(offset,limit,role)`: admin-only directory RPC with explicit `private.is_admin()` check, bounded pagination, and only identity/role fields; no contact data.
3. Ordinary authenticated table SELECT limited to `id,full_name,created_at`, while role values are served only through the self-role RPC and admin directory RPC.
4. Updating the session resolver and the two admin UI call sites, plus role-based integration tests and fail-closed auth bootstrap.

No proposed function was created. No policy, grant, revoke, trigger, view, data, migration, production setting, or deployment was changed. The proposal requires full repository search, reconciled migration history, disposable staging tests, and separate approval before any production rollout.
