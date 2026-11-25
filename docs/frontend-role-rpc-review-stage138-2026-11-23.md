# Stage 138 — Frontend role-resolution and admin RPC call-site review

Date: 2026-11-23
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Branch: `docs/live-schema-security-inventory-2026-11-23`

## Scope and method

Read-only inspection of the frontend role resolver, the focused backend-auth unit test, and admin dashboard call sites. No application code was changed. No tests were executed against the live Supabase project, no user rows or contact values were read from the database, and no authentication session was created.

Files inspected:
- `src/lib/backend/supabase.ts`
- `src/test/backend-auth.test.ts` (from PR #7 branch `fix/profile-query-column-scope-2026-11-23`)
- `src/components/admin/AdminBackendPanel.tsx`
- `src/components/admin/AdminCourseClassManager.tsx`

## Findings

### 1. Session role resolution uses the authenticated user's own profile row

`resolveBackendUser` filters `profiles` by `authUser.id`, and maps only the exact values `admin` and `teacher` to privileged UI roles; any other or missing value becomes `student`. This is a fail-closed UI fallback in the sense that unknown values do not become admin/teacher.

However, the resolver does not inspect or propagate errors from either the profile query or the `profile_contacts` query. A failed profile query can therefore silently produce a student-role user object instead of surfacing an authentication/bootstrap error. The full authorization boundary must remain database-side; UI role state alone is not authorization.

The resolver also uses `authUser.user_metadata.full_name` as a display-name fallback. It does not use user metadata to determine role.

### 2. Current unit-test coverage is narrow

The inspected `backend-auth.test.ts` contains one test. It verifies the selected profile columns, that phone is read from `profile_contacts`, and that a teacher-shaped profile maps to a teacher app user.

It does not currently verify:
- profile query errors or missing profile rows;
- contact query errors;
- unknown, null, or tampered user metadata role values;
- explicit non-admin/admin access outcomes for privileged RPCs;
- role changes during an active session or stale session state.

These are coverage gaps, not proof of an exploitable vulnerability.

### 3. Admin dashboard directly reads profile role data and calls the contact RPC

`AdminBackendPanel` loads profile identity and role columns directly from `profiles`, then calls `admin_get_profile_contacts` with the returned IDs. It repeats the contact RPC for pagination and missing enrollment profiles. It also updates another user's `profiles.role` directly from the client.

The database must independently enforce admin-only access for these operations. The RPC's existing `private.is_admin()` guard was statically observed in earlier review (Stage 137), but positive-admin and negative-student/teacher execution tests have not been performed. RLS/policies and UPDATE authorization for role changes also need explicit verification.

`AdminCourseClassManager` directly selects teacher profiles using `role = 'teacher'`. Whether this is appropriate depends on the current profiles SELECT policy and the intended teacher-picker visibility; do not infer authorization solely from the UI component being named “Admin”.

## Recommended next verification (not performed)

1. Add unit tests for profile/contact query errors and missing profile behavior; consider failing session resolution explicitly when the authenticated profile is missing or unreadable rather than silently defaulting.
2. Add tests proving user metadata cannot elevate role and that unknown role values do not unlock privileged UI.
3. In a safe non-production test environment, verify admin RPC and direct profile role read/update behavior for anon, student, teacher, and admin sessions.
4. Confirm the route/component mounting guard for admin panels and treat it only as UX; retain database-side authorization as the security boundary.
5. Verify whether teachers should be visible through the current direct `profiles` SELECT query, and whether the role update policy restricts writes to admins and protects the current administrator account.

## Limitations and non-actions

This was a source-level review of the listed files, not a complete repository-wide call-graph audit or runtime authorization test. No SQL, DDL, DML, grants, revokes, RLS policies, functions, triggers, schema settings, Auth settings, migrations, deployments, or production data were changed. No PR was merged.
