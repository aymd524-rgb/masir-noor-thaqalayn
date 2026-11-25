# Profile role isolation proposal (Stage 129)

**Status:** design proposal only — NOT implemented, NOT executed, NOT a migration.  
**Purpose:** remove broad client SELECT access to `profiles.role` while preserving session bootstrap, teacher identity lookup, and admin role management.

## Verified current behavior

Catalog inspection of the connected project confirms these `profiles` RLS policies:

- `profiles_select`: authenticated users can read their own row; admins can read all rows.
- `profiles_select_related_class_members`: a teacher can read profiles of students/teachers related to that teacher's enrollments/classes (and related pending requests).
- `profiles_admin`: admin-only ALL policy.
- `profiles_self_update`: user can update their own row, subject to existing role-protection triggers.

This means the proposed table-level SELECT grant (or any column grant including `role`) to all authenticated users would allow teachers to read the `role` value for class-related profile rows. The current teacher profile query itself selects only `id,full_name`, but the global column privilege would still make `role` queryable.

Current source touchpoints on `main`:

1. `src/lib/backend/supabase.ts` — `resolveBackendUser` selects `id,full_name,name,role,created_at`; PR #7 corrects the nonexistent `name` column but still selects `role` for the signed-in user.
2. `src/components/admin/AdminBackendPanel.tsx` — reads `id,full_name,role,created_at` for the admin user directory and changes roles via a direct UPDATE.
3. `src/components/admin/AdminCourseClassManager.tsx` — filters `profiles` by `role = 'teacher'` while selecting `id,full_name`.
4. `src/lib/backend/teacher.ts` — reads only `id,full_name` for related students.
5. `src/lib/auth.tsx` — profile edits update `full_name`; contact edits write to `profile_contacts`. Auth bootstrap and sign-in call `resolveBackendUser`.

The repository-wide GitHub code-search endpoint returned no indexed matches, so this is a targeted source review of the known application entry points, not proof that no other reference exists. Before implementation, repeat a full local source search over the checked-out repository and inspect all SQL migrations/triggers.

## Recommended design

Use two narrowly scoped RPCs and remove `role` from ordinary client SELECT:

### A. Current user's own role

`public.get_my_profile_role()` returns only the role belonging to `auth.uid()`. It must return no row / NULL for an unauthenticated caller.

Proposed definition for review (not executed):

```sql
CREATE OR REPLACE FUNCTION public.get_my_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.get_my_profile_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_role() TO authenticated;
```

Security properties to test:
- Fully qualified object names and empty search_path.
- No user ID parameter; caller cannot ask for another user's role.
- `auth.uid()` is checked inside the function.
- Function returns no phone, email, profile list, or other user's data.
- `anon` and `PUBLIC` cannot execute it; authenticated can.
- Changing client `user_metadata` does not change the result.

### B. Admin-only profile directory and teacher filter

`public.admin_list_profiles(p_offset, p_limit, p_role)` returns only `id, full_name, role, created_at`, and only after calling `private.is_admin()`. Optional `p_role` accepts only `student`, `teacher`, `admin`, or NULL. Offset is clamped to zero or greater; limit is clamped to a modest maximum (for example 500). It must not return contact details; the existing admin contact RPC remains separate.

Proposed logic outline (not executable migration text):

```sql
-- SECURITY DEFINER, STABLE, SET search_path = ''
-- Reject unless private.is_admin() is true (raise SQLSTATE 42501).
-- Validate p_role against ('student','teacher','admin') or NULL.
-- Return rows from public.profiles filtered by p_role,
-- ordered by created_at DESC, then id, with bounded OFFSET/LIMIT.
-- Return only id, full_name, role, created_at.
-- Revoke EXECUTE from PUBLIC and anon; grant only to authenticated.
```

Use this RPC in:
- `AdminBackendPanel.tsx` for paginated profile directory and role display.
- `AdminCourseClassManager.tsx` with `p_role='teacher'` for teacher selection.
- Keep the existing admin-only `admin_get_profile_contacts` RPC for contact data.
- Keep role updates behind existing admin RLS policy and role-protection triggers; verify UPDATE behavior separately.

### C. Ordinary profile identity reads

After both RPCs exist and all app call sites are migrated:
- Revoke table-level SELECT on `public.profiles` from `authenticated`.
- Grant only `SELECT (id, full_name, created_at)` to `authenticated`.
- Preserve existing RLS policies; they continue to determine which rows are visible.
- Do not grant SELECT on `role` or legacy `phone` to authenticated.
- Do not alter UPDATE/INSERT/DELETE privileges as part of this narrow change unless a separate reviewed need is proven.
- Keep `profile_contacts` on its existing self-row policy and admin RPC access.

This column grant preserves the teacher query (id/full_name) and the self profile query (id/full_name/created_at), while role values are available only via self-role RPC or admin-only directory RPC.

## Required application changes

1. In `resolveBackendUser`, query profile identity fields only: `id,full_name,created_at`; call `get_my_profile_role` separately and fail closed if the RPC errors or returns an invalid role.
2. Do not silently default an RPC failure to `student` if doing so could produce an incorrect session state; show a controlled auth/bootstrap error and keep the user signed out until role resolution succeeds.
3. Change admin directory loads and pagination to use `admin_list_profiles`; keep contacts separate through `admin_get_profile_contacts`.
4. Change teacher selection in `AdminCourseClassManager` to use the admin-only RPC with `p_role='teacher'`.
5. Keep teacher's related-profile query on `id,full_name`.
6. Add unit tests for RPC invocation and fail-closed behavior, plus integration tests for each role.
7. Inspect all relationship embeds and indirect views/functions for dependencies on `profiles.role` or `profiles.phone`.

## Acceptance tests

- Student: can read own identity and own role; cannot read any other role through table or RPC; cannot call admin directory or contact RPCs.
- Teacher: can read allowed related identities but cannot select `profiles.role`; own role RPC returns teacher; admin directory and contact RPCs return 42501.
- Admin: own role RPC returns admin; admin directory RPC returns all permitted pages/role filter; contact RPC remains admin-only; role update remains protected.
- Anonymous: cannot execute either RPC or read protected profile data.
- Tampered `user_metadata.role='admin'`: no authorization change.
- Existing sign-in, sign-up, profile edit, class assignment, student list, role changes, contact display, enrollment, attendance, grades, hifz, and quiz flows continue working.

## Rollout / rollback gates

1. Reconcile migration history before creating a migration.
2. Test on a disposable staging database only; no production role impersonation.
3. Capture a fresh ACL snapshot immediately before the approved staging migration.
4. Run the full role matrix and all existing app tests.
5. Review Supabase Security Advisor and function EXECUTE privileges.
6. Generate a reviewed migration only after staging passes.
7. Production rollout requires separate explicit approval. Preserve the exact pre-change ACL snapshot and rollback script; never restore with blanket GRANTs.

## Explicit non-actions in Stage 129

No function, policy, grant, revoke, trigger, view, data, migration, or production setting was changed. No RPC above was created or executed. This document is a proposal for review only.
