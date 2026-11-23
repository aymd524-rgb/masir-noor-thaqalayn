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


## Explicit non-actions

- No DDL or DML was executed.
- No grants, policies, triggers, functions, views, or event triggers were changed.
- No migration ledger entries were changed.
- No data values, phone numbers, or credentials were read.
- This file is an audit record, not an executable migration.
