# Stage 146 — Consolidated application security and release-readiness review

Date: 2026-11-23
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Reviewed ref: `docs/live-schema-security-inventory-2026-11-23`
Reviewed head: `f4eda047a21cdbcde97101171012b3137964807b`
Scope: Consolidated read-only review of authentication startup, route guards, backend access helpers, validation tests, server entry/error handling, existing database audit findings, and CI status. This is a source/configuration review, not a penetration test.

## Executive summary

The latest GitHub Actions **Build check passed** for the reviewed head commit. Its workflow runs `bun run test` and `bun run build`. This proves the configured test command and production build completed in CI; it does not prove live Supabase authorization, privacy boundaries, or production hosting configuration.

The project is **not yet ready to be declared production-ready**. The main remaining work is authorization verification and a small number of high-impact authentication/error-handling fixes, followed by role-based tests against an isolated environment.

## Findings by priority

### P1 — Fix before public launch

1. **Auth bootstrap can remain in loading state after a network or profile-resolution failure.**
   - In `src/lib/auth.tsx`, startup `sync()` awaits `sb.auth.getUser()` and `resolveBackendUser()` without a catch/finally path.
   - If either rejects, `setReady(true)` is not reached. The same function is invoked after auth-state events.
   - Add bounded error handling, always settle startup state, and show a recoverable unavailable/retry state. Do not convert a failed profile read into an authenticated student.

2. **Profile resolver still has fail-open defaults for profile-read failures.**
   - The reviewed `src/lib/backend/supabase.ts` destructures profile/contact data but ignores their query errors, maps missing/unknown role to `student`, and sets `active: true`.
   - A transient or denied profile lookup can therefore be represented in the UI as an ordinary active student instead of an explicit incomplete/unavailable identity.
   - Return a typed resolution error for missing/failed profile state; fail closed for authorization-sensitive operations. Keep authorization in database policies/RPCs, not in the cached client role.

3. **Live authorization boundaries still need negative and positive role tests.**
   - Earlier read-only stages found six public tables with broad structural privileges (`TRUNCATE`, `TRIGGER`, `REFERENCES`, `MAINTAIN`) for `anon` and `authenticated`; effective SQL grants do not alone prove PostgREST reachability, and no destructive request was attempted.
   - Earlier stages also found broad authenticated profile column UPDATE grants, legacy `profiles.phone` visibility, and two authenticated-callable admin contact `SECURITY DEFINER` RPCs.
   - Before launch, prove anon/student/teacher/admin allow/deny behavior for profile role and contact data, admin RPCs, class assignments, enrollments, attendance, grades, Hifz records/assignments, quiz keys, and quiz attempts. Then apply the separately reviewed least-privilege DB changes only after explicit approval and dependency review.

4. **No isolated staging environment or test accounts have been established.**
   - Consequently, actual RLS/API behavior under each role has not been exercised end-to-end.
   - Create a disposable test environment and synthetic accounts/data before any permission-hardening rollout. Do not use real student records as test fixtures.

### P2 — Complete before broad release

5. **Password recovery flow is absent from the reviewed auth page.**
   - `src/routes/auth.tsx` contains sign-in and sign-up UI; no password-reset request or callback flow was found in the reviewed route.
   - Add and test password reset, callback handling, and allowed redirect URLs before inviting general users.

6. **Server error reporting needs privacy review.**
   - `src/server.ts` and `src/lib/error-capture.ts` capture and log error stacks/cause chains.
   - Keep logs useful, but redact access tokens, authorization headers, cookies, email addresses, phone numbers, and user-submitted content before forwarding errors to external telemetry/logging. Confirm retention and access controls in the hosting provider.

7. **Teacher/admin client helpers must remain convenience filters, not security controls.**
   - `src/lib/backend/teacher.ts` accepts an `isAdmin` boolean to decide whether to add a client-side class filter.
   - The database must independently enforce class assignment and admin status for every read/write. Test that changing client parameters cannot expose or modify another teacher's class.
   - The admin panel reads large collections and calls the admin contact RPC with profile IDs; verify pagination and server-side bounds as user counts grow.

8. **Input validation and atomicity need more coverage.**
   - Existing validation tests cover attendance dates/statuses and basic grade values.
   - Extend tests for out-of-range scores, oversized text/arrays, malformed UUIDs, invalid Hifz dates and enum values, quiz answer payload limits, duplicate submissions, and partial quiz creation failure.
   - Multi-step quiz creation is currently several client requests followed by compensating deletion; consider a single database transaction/RPC if atomic creation is required.

9. **Auth and role test coverage is still narrow.**
   - Existing tests include redirect validation and input validation. Add tests for startup network failure, profile query failure, unknown/tampered metadata, disabled accounts, role changes, stale sessions, sign-out during refresh, and duplicate auth-state events.

### P3 — Operational hardening

10. Keep the browser bundle restricted to the Supabase URL and publishable/anon key. Never put service-role/secret keys in `VITE_*` variables.
11. Keep the private schema out of exposed Data API schemas; the owner previously verified `private` is unchecked.
12. Review Security Advisor after each approved change. Track the leaked-password protection warning and the two admin RPC warnings; do not silence warnings by weakening checks.
13. Maintain dependency updates and lockfile-based reproducible CI. Add secret scanning/push protection and scan repository history if there is any possibility that a secret was previously committed.
14. Confirm production redirect allowlist, email confirmation, SMTP, rate limits, MFA policy, session lifetime, CSP/security headers, backups, monitoring, and incident/revocation procedures in the hosting and Supabase dashboards. These settings were not fully observable in this source review.

## Verified positive controls

- Browser client configuration uses `VITE_SUPABASE_PUBLISHABLE_KEY` (with anon-key compatibility fallback), not a service-role key.
- No service-role/secret-key references were found in the reviewed repository searches. Historical repository secret exposure was not exhaustively established.
- No deployed Supabase Edge Functions were listed in Stage 145; no function code or function secrets were changed or inspected.
- `safeAuthRedirect` rejects external, protocol-relative, backslash, and control-character destinations; corresponding tests exist.
- Student registration in the reviewed auth flow creates student accounts; role assignment is described as admin-controlled.
- The GitHub Actions workflow passed on the reviewed commit. Workflow: `https://github.com/aymd524-rgb/masir-noor-thaqalayn/actions/runs/45248007725`.

## Release gate checklist

- [ ] Resolve auth bootstrap error handling and profile resolver fail-closed behavior.
- [ ] Establish isolated staging with synthetic student, teacher, admin, and anonymous sessions.
- [ ] Execute positive and negative RLS/RPC/API tests for every sensitive table and action.
- [ ] Review and approve a least-privilege SQL plan; snapshot grants/policies and prepare rollback.
- [ ] Add password recovery and verify Auth redirect/email settings.
- [ ] Redact sensitive data from error/telemetry logs and verify hosting controls.
- [ ] Add tests for role boundaries, session failures, validation limits, and quiz atomicity.
- [ ] Re-run CI and a production-like smoke test after approved fixes.
- [ ] Obtain a final human review before merge or production release.

## Boundaries

- This stage created documentation only.
- No application source, SQL, migrations, RLS policies, grants, Auth settings, Edge Functions, secrets, deployment, or production data were changed.
- No destructive API calls or role impersonation tests were performed.
- PR #9 remains open and draft; this report is not approval to merge or publish.
