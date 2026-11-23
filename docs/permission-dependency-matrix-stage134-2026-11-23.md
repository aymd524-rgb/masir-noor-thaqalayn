# Stage 134 — permission and security-dependency matrix

**Audit date:** 2026-11-23  
**Supabase project:** `pxwdfwozinxipvudupbl`  
**Branch:** `docs/live-schema-security-inventory-2026-11-23`  
**Method:** catalog-only, SELECT-only SQL plus Security Advisor. No application rows, contact values, credentials, or function calls were read/executed.

## 1. Schema access boundary

| Schema | anon USAGE | authenticated USAGE | Observation |
|---|---:|---:|---|
| `public` | yes | yes | API-facing schema; ordinary public objects must be reviewed as exposed surface |
| `private` | no | yes | Not usable by anon at SQL privilege layer; authenticated has schema USAGE |

The authenticated role has schema USAGE on `private` and explicit EXECUTE grants on the private helper routines listed below. This does **not** establish that PostgREST exposes `private`: the project's Data API exposed-schema configuration was not available in this catalog query. Confirm the exposed schema list before concluding whether those routines are directly callable over REST. Do not expose `private` merely to make helper routines work.

## 2. Table and view privilege matrix

All 19 base tables (18 in `public`, one in `private`) have RLS enabled. The 50 public policies and one private policy remain in place. The following are the material privilege exceptions from the effective-role checks:

| Object | Kind | RLS / view mode | anon | authenticated | Dependency / interpretation |
|---|---|---|---|---|---|
| `public.content_entries` | base table | RLS on | SELECT + TRUNCATE + REFERENCES + TRIGGER | SELECT + TRUNCATE + REFERENCES + TRIGGER | No direct TS/TSX use found in Stage 130; SQL/external dependency remains unknown. Published-content SELECT policy exists. |
| `public.enrollment_requests` | base table | RLS on | TRUNCATE + REFERENCES + TRIGGER | SELECT + TRUNCATE + REFERENCES + TRIGGER | Core student/admin workflow; normal DML remains RLS-controlled. Structural privileges are not governed by RLS. |
| `public.game_questions` | base table | RLS on | SELECT + TRUNCATE + REFERENCES + TRIGGER | SELECT + TRUNCATE + REFERENCES + TRIGGER | No direct TS/TSX use found in Stage 130; game RPC/SQL dependency remains possible. Published-question SELECT policy exists. |
| `public.hifz_assignment_completions` | base table | RLS on | TRUNCATE + REFERENCES + TRIGGER | SELECT + TRUNCATE + REFERENCES + TRIGGER | Student completion workflow; structural privileges are unnecessary absent a documented exception. |
| `public.hifz_assignments` | base table | RLS on | TRUNCATE + REFERENCES + TRIGGER | SELECT + TRUNCATE + REFERENCES + TRIGGER | Teacher assignment / student read workflow; structural privileges are not RLS-protected. |
| `public.hifz_records` | base table | RLS on | TRUNCATE + REFERENCES + TRIGGER | SELECT + TRUNCATE + REFERENCES + TRIGGER | Teacher/admin hifz workflow; structural privileges are not RLS-protected. |
| `public.profiles` | base table | RLS on | no client SELECT | SELECT and DML | Authenticated can SELECT every column permitted by row policies, including legacy `phone` and `role`; privacy and role-isolation issue remains. |
| `public.profile_contacts` | base table | RLS on | no access | SELECT / INSERT / UPDATE | Own-row policies; admin contact reads use separate admin-checked RPCs. |
| `private.game_answer_keys` | base table | RLS on | no access | no direct table privileges | Private answer-key table remains isolated at table ACL layer. |
| `public.class_management_dashboard` | view | `security_invoker=true` | no SELECT | SELECT | Authenticated-only view; underlying RLS applies through invoker semantics. |
| `public.enrollment_request_dashboard` | view | `security_invoker=true` | no SELECT | SELECT | Authenticated-only view; underlying RLS applies through invoker semantics. |

The six listed public base tables are the confirmed application-table structural-privilege findings. The catalog also returns non-SELECT privilege bits for a dashboard view in the generic table-privilege helper; do not treat view-only privilege bits as evidence that a view can be truncated. Both views are `relkind=v` and use invoker security.

### Future-object defaults

- Default privileges for objects created by `postgres` in `public` include `MAINTAIN`, `REFERENCES`, `TRIGGER`, and `TRUNCATE` for both `anon` and `authenticated`.
- Separate default ACL entries for `supabase_admin` in `public` include broad table privileges. Keep these out of this app-specific remediation until Supabase-managed ownership/dependencies are reviewed.
- Additional default ACL entries exist in `storage`, `graphql`, and `graphql_public`; they are not included in the six-table application finding and must not be changed as part of this stage.

## 3. Routine execution and SECURITY DEFINER inventory

All observed SECURITY DEFINER routines in `public` and `private` have an empty function-level `search_path` setting, except `public.rls_auto_enable()`, which sets `search_path=pg_catalog`. Empty search_path is a positive hardening measure, but does not replace in-function authorization.

### Public routines

| Routine | SECURITY DEFINER | anon EXECUTE | authenticated EXECUTE | Static body indicator / purpose |
|---|---:|---:|---:|---|
| `admin_get_profile_contacts(uuid[])` | yes | no | yes | References `private.is_admin()`; raises exception on denial. Current admin contact path. |
| `admin_list_profile_contacts(integer,integer)` | yes | no | yes | References `private.is_admin()`; raises exception on denial. Current admin contact path. |
| `check_game_answer(uuid,integer)` | yes | no | no | Integer overload; authenticated cannot execute it under current ACL. |
| `handle_new_user()` | yes | no | no | Trigger function. |
| `process_enrollment_request_review()` | yes | no | no | Trigger function; body references caller/admin checks. |
| `rls_auto_enable()` | yes | no | no | Event-trigger function; `search_path=pg_catalog`. |

Other public application RPCs (`admin_create_game_question`, `admin_set_game_answer`, `check_game_answer(uuid,jsonb)`, `get_active_class_availability`, `is_admin`, and `submit_quiz_attempt`) are SECURITY INVOKER and have authenticated EXECUTE grants. Their existing RLS/authorization behavior still requires role regression tests.

### Private routines

Authenticated has schema USAGE on `private` and explicit EXECUTE grants on these private helpers:

| Routine | SECURITY DEFINER | authenticated EXECUTE | Static body indicator |
|---|---:|---:|---|
| `admin_create_game_question_impl(...)` | yes | yes | References `auth.uid()` and `private.is_admin()`; raises exception. |
| `admin_set_game_answer_impl(...)` | yes | yes | References `private.is_admin()`; raises exception. |
| `can_manage_enrollment(uuid)` | yes | yes | References `auth.uid()`. |
| `check_game_answer_impl(uuid,jsonb)` | yes | yes | References `auth.uid()`. |
| `get_active_class_availability_impl()` | yes | yes | References `auth.uid()`. |
| `is_admin()` | yes | yes | References `auth.uid()` and profile role. |
| `is_enrolled_in_class(uuid)` | yes | yes | References `auth.uid()`. |
| `is_teacher_of_class(uuid)` | yes | yes | References `auth.uid()`. |
| `owns_enrollment(uuid)` | yes | yes | References `auth.uid()`. |
| `submit_quiz_attempt_impl(uuid,jsonb)` | yes | yes | References `auth.uid()`; raises exception. |

The helper `private.prevent_profile_role_escalation()` is SECURITY INVOKER and has a PUBLIC EXECUTE ACL, but is a trigger function and cannot be invoked as an ordinary scalar RPC. Do not classify this alone as a remotely exploitable endpoint.

The body indicators above are static text-presence checks, not proof that every execution path is correctly authorized. Full semantic review and negative tests are still required. Because authenticated has `private` schema USAGE, confirm whether `private` is absent from the Data API exposed schemas. If it is exposed, review every directly callable private routine before proceeding. Do not remove helper EXECUTE blindly: RLS policies and public wrapper functions may rely on these helpers.

## 4. Profile/contact column exposure

Catalog column checks reconfirm:

- `anon` cannot SELECT columns from `profiles` or `profile_contacts`.
- `authenticated` can SELECT `profiles.id`, `full_name`, `role`, `created_at`, and legacy `phone`.
- `authenticated` can SELECT `profile_contacts.phone`, but the own-row RLS policy limits visible rows.
- No column-level ACL entries were present in the inspected profile/contact tables; the table-level SELECT grant is why the legacy phone column remains selectable for rows allowed by RLS.

This is not fixed by a column-only REVOKE of `profiles.phone`; table-level SELECT must be replaced with a carefully tested column-level grant or a redesigned RPC architecture. The existing teacher-related-profile policy means exposing `role` through a general authenticated column grant would disclose role values for related profiles. The Stage 129 self-role/admin-directory RPC design remains the safer proposal, but is not implemented.

## 5. Security Advisor — fresh result

The current Security Advisor returned three warnings:

1. Two `authenticated_security_definer_function_executable` findings:
   - `public.admin_get_profile_contacts(uuid[])`
   - `public.admin_list_profile_contacts(integer,integer)`
   
   Both are expected current admin UI RPCs, both have explicit `private.is_admin()` checks in their bodies, and neither is executable by anon. The warnings identify a privileged API boundary, not proof of unauthorized contact disclosure. Preserve the checks and add direct non-admin denial tests before any permission change. [Advisor remediation guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

2. One `auth_leaked_password_protection` warning: leaked-password protection is disabled. This is an Auth configuration item, not a SQL privilege. Review and enable it through Auth settings only after a separate owner/admin decision and login-requirement check. [Password security guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## 6. Role and membership notes

- `anon` and `authenticated` are non-login, non-superuser roles and do not have BYPASSRLS.
- `service_role` has BYPASSRLS; it is a server-side role and must never be placed in a public client.
- `authenticator` is the login role and is a member of `anon`, `authenticated`, and `service_role` for request-role switching.
- `postgres` is not marked superuser in this catalog output but has BYPASSRLS and elevated database privileges.
- No unexpected direct role memberships were observed for `anon` or `authenticated`.

## 7. Recommended order — proposals only

1. Verify Data API exposed schemas and confirm `private` is not exposed. If it is, perform a dedicated direct-RPC review before any change.
2. Keep the two admin contact RPCs only with their existing in-function admin checks, anon denial, and explicit non-admin integration tests. Do not blindly revoke EXECUTE because the admin UI currently depends on them.
3. Reconcile the migration ledger and PR #7 before changing profile grants. Then implement/test self-only role retrieval and admin-only directory retrieval; only afterward consider removing general authenticated access to `profiles.role` and legacy `profiles.phone`.
4. Confirm all SQL, trigger, and external dependencies for the six tables. Then prepare a reviewed, exact ACL rollback before revoking only unnecessary `TRUNCATE`, `TRIGGER`, and `REFERENCES` from client roles.
5. Review the `postgres` public-schema default ACL in a separate controlled change. Do not change `supabase_admin` or Supabase-managed schema defaults as part of this app remediation.
6. Run student, teacher, admin, and anon tests in a no-cost disposable environment before any production change. If no staging environment exists, defer production ACL changes.
7. Handle leaked-password protection as a separate Auth configuration decision.
8. Re-run the Security Advisor, catalog checks, and complete application role smoke tests after any separately approved remediation.

## 8. Explicit non-actions and limitations

- No SQL DDL/DML, GRANT/REVOKE, policy, function, trigger, view, schema, migration ledger, Auth setting, or deployment was changed.
- No user rows, contact values, auth records, credentials, or secrets were read.
- No SECURITY DEFINER function was invoked; function-body inspection used catalog metadata and static text indicators only.
- No staging project or synthetic test users were created.
- The Data API exposed-schema configuration was not available from the inspected catalog; direct REST reachability of `private` routines remains unverified.
- This report is an audit artifact, not an executable migration or authorization to make production changes.
