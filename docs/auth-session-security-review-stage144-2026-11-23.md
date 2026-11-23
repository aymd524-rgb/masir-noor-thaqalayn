# Stage 144 — Authentication and session security review

Date: 2026-11-23
Project: `pxwdfwozinxipvudupbl`
Repository reviewed: `aymd524-rgb/masir-noor-thaqalayn`
Scope: Static review of the public repository's authentication flow, read-only Supabase Security Advisor, and current Supabase documentation. No user records, passwords, email addresses, access tokens, refresh tokens, or raw authentication logs were inspected.

## Findings

### 1. Leaked-password protection is disabled — confirmed platform warning

The current Supabase Security Advisor reports `auth_leaked_password_protection` as WARN. This means Auth is not currently rejecting passwords known to have appeared in data breaches. Supabase documentation states this feature is available on Pro plan and above; do not upgrade or incur cost without an explicit decision. Keep the existing minimum password length policy and encourage unique passwords. The minimum length setting itself was not read through the available read-only database interface.

### 2. Auth session bootstrap does not handle all failures — code finding

In `src/lib/auth.tsx`, the startup `sync` function calls `sb.auth.getUser()` and then `resolveBackendUser()`, but does not catch thrown errors or inspect the returned `getUser` error. A transient network/auth failure or profile resolution exception can leave the provider's `ready` flag false, leaving the UI in its loading state. The same sync function is called from the auth-state listener.

Recommendation: handle both returned Auth errors and thrown errors, set a safe signed-out/unavailable state, and always settle the bootstrap state in a `finally` path. Do not treat an Auth service failure as a verified signed-in session.

### 3. Profile resolver fix exists in PR #7 but is not merged

The default `main` branch version of `src/lib/backend/supabase.ts` selects a `name` column from `profiles`, although the verified PR #7 branch changes the select list to `id,full_name,role,created_at`. PR #7 is still open and unmerged at the time of this review. This mismatch can cause profile resolution to fail on the live schema.

Recommendation: review and test PR #7, then merge only after the owner explicitly authorizes it. This report does not merge it.

### 4. Resolver silently defaults role to student after profile read failure — code finding

The resolver uses the returned profile data without checking the query error. If the profile query fails, it falls back to the student role and still returns a user marked active. This is safer than accidentally granting teacher/admin access, but it masks an infrastructure/authorization failure and can misrepresent the user's account state.

Recommendation: distinguish a verified student role from a missing/failed profile lookup. Fail closed into a recoverable unavailable state, rather than silently converting query errors or absent profiles into a valid student account. Never derive privileged roles from editable user metadata.

### 5. No password-reset flow found in reviewed auth route

The reviewed `src/routes/auth.tsx` supports email/password sign-in and sign-up, and handles email-confirmation-required responses. No password-reset UI or recovery callback route was found in the reviewed auth route. This is a usability and account-recovery gap, not evidence of an authentication bypass.

Recommendation: implement the full Supabase recovery flow, including a safe same-origin callback, recovery session validation, and a form to set a new password. Test invalid/expired recovery links and ensure redirect targets remain same-origin.

### 6. Redirect validation is present

`src/lib/auth-redirect.ts` rejects protocol-relative URLs, backslash variants, control characters, and off-origin destinations. This is a positive control. Keep all post-auth redirects routed through this validator.

### 7. Browser session persistence

The browser client explicitly enables persistent sessions, automatic refresh, and `window.localStorage` storage. This is a common SPA configuration, but tokens accessible to JavaScript increase impact if an XSS flaw is introduced.

Recommendation: keep dependencies current, avoid unsafe HTML injection, enforce a restrictive Content Security Policy where deployment permits, and never log or expose access/refresh tokens. Consider a server-side cookie architecture only if the application is deliberately redesigned for it; do not change session storage ad hoc.

### 8. Admin contact RPC warnings remain

The Security Advisor still reports two authenticated-callable SECURITY DEFINER functions: `public.admin_get_profile_contacts` and `public.admin_list_profile_contacts`. This was already identified in earlier audit stages. Their function bodies were not re-executed in this stage; prior review reported explicit `private.is_admin()` checks. Keep these warnings tracked until authorization tests and a considered API design justify any change.

## Not verified in this stage

The available read-only database interface did not expose the hosted Auth dashboard settings for email confirmation, password policy, MFA enrollment/requirements, redirect allowlist, SMTP provider, rate limits, JWT expiry, or session lifetime controls. These settings must be checked in Supabase Dashboard > Authentication before launch. No account-level data or raw Auth logs were inspected.

## Prioritized follow-up

1. Review PR #7 and resolve the profile column mismatch through the normal review/approval process.
2. Harden Auth bootstrap error handling and fail-closed profile resolution.
3. Add and test password recovery.
4. Verify hosted Auth settings: email confirmation, allowed redirect URLs, password minimum, MFA policy appropriate to admin/teacher accounts, rate limits, and SMTP delivery.
5. Retain short-lived access tokens (Supabase default is generally one hour); do not set extremely short JWT expiry. Review session lifetime controls against the app's needs.
6. Add tests for network failure, missing profile, query errors, unverified email, expired recovery links, redirect attacks, and role escalation attempts.

## Status

- Read-only review and documentation only.
- No Auth settings, users, passwords, sessions, database schema, RLS, functions, or application code were changed.
- No PR was merged and no deployment was performed.
