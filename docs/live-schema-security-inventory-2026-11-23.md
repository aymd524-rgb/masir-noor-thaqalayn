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

## Explicit non-actions

- No DDL or DML was executed.
- No grants, policies, triggers, functions, views, or event triggers were changed.
- No migration ledger entries were changed.
- No data values, phone numbers, or credentials were read.
- This file is an audit record, not an executable migration.
