# Stage 145 — Server code, Edge Functions, and API key exposure review

Date: 2026-11-23
Project: `pxwdfwozinxipvudupbl`
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Scope: Read-only inventory of deployed Edge Functions, repository server-side paths, browser Supabase configuration, environment-variable naming, dependency lock/build setup, and current Security Advisor findings. No secret values, tokens, account data, or file contents containing credentials were requested or inspected.

## 1. Deployed Edge Functions

Supabase project inventory returned an empty function list: **zero Edge Functions deployed**.

Consequences:
- There are no deployed function handlers to review for JWT verification, caller authorization, input validation, rate limiting, CORS, webhook signature verification, or privileged service-role client usage.
- No Edge Function secrets were inspected. Their existence or values cannot be inferred from an empty function list.
- The absence of Edge Functions is not itself a vulnerability. Current application backend operations appear to use the Supabase Data API and database RPCs.

## 2. Repository server-side inventory

The default branch contains no `supabase/functions/` directory and no `supabase/config.toml` file was found at the expected path. The repository has database migrations, but no checked-in Edge Function implementation.

The GitHub source search for Edge Function entry points and Supabase Functions invocations returned no matches. Search-index coverage can be incomplete; the tree inventory is stronger evidence for the absence of the conventional `supabase/functions/` directory.

## 3. Browser API key handling

The reviewed `src/lib/backend/config.ts` reads only:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`, with a compatibility fallback to `VITE_SUPABASE_ANON_KEY`.

The reviewed `src/lib/backend/supabase.ts` initializes the browser client using that public key. This is the correct class of key for a browser client. Publishable/anon keys are not secrets; database safety must come from RLS and server-side authorization.

The checked-in `.env.example` contains only the two variable names above. Its values were intentionally not reproduced in this report.

Repository-wide code searches for `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, and related privileged key names returned no matches. This is reassuring but is not a substitute for GitHub secret scanning and a complete historical commit scan. No secret value was copied or displayed.

## 4. CI and dependency locking

The repository's GitHub Actions build workflow installs with `bun install --frozen-lockfile`, then runs tests and a production build. This indicates CI expects a committed Bun lockfile and prevents silent lockfile regeneration during that workflow.

The package manifest uses version ranges for dependencies, including `@supabase/supabase-js`; the lockfile is therefore important for repeatable builds. Review dependency updates through normal pull requests and keep the lockfile in sync.

## 5. Database RPCs are separate from Edge Functions

The Security Advisor continues to report two authenticated-callable `SECURITY DEFINER` RPCs:
- `public.admin_get_profile_contacts(uuid[])`
- `public.admin_list_profile_contacts(integer, integer)`

These are database functions exposed through the Data API, not Edge Functions. Prior audit stages reported explicit `private.is_admin()` checks in their bodies. The warnings should remain tracked until authorization tests prove the intended admin-only behavior. Do not remove or weaken their checks merely to silence the Advisor.

The Advisor also continues to report leaked-password protection disabled. This is an Auth setting, not an API-key leak.

## 6. Recommendations

1. Keep the browser bundle limited to the project URL and publishable/anon key. Never add a `VITE_*` variable containing a secret, service-role key, database password, or JWT signing secret.
2. If server-side privileged work is needed later, implement it in a controlled backend/Edge Function and store secret keys only in server-side secrets. Never return them to the browser.
3. For user-facing Edge Functions, require and verify the user's JWT and perform authorization for the specific resource/action; a valid JWT alone is not sufficient.
4. For webhooks, verify the provider's signature before performing privileged operations; do not simply disable JWT verification without an alternate authentication check.
5. Add request validation, bounded payload sizes, rate limiting appropriate to the operation, safe error responses, and audit logging without tokens or personal data.
6. Enable GitHub secret scanning / push protection where available and review any detected historical exposure. If a real secret was ever committed, revoke/rotate it; deleting it from the latest commit alone is insufficient.
7. Add automated checks that reject service-role/secret-key names and values in client-side source and build artifacts.
8. Keep the two admin RPC authorization warnings and the Auth leaked-password warning on the pre-launch checklist.

## Status and limitations

- Read-only inventory and source review only.
- No Edge Functions were created, deployed, modified, or invoked.
- No API keys, secret values, environment settings, Auth settings, database objects, policies, or application code were changed.
- No secret values, user records, access tokens, or refresh tokens were read.
- This review does not establish that the entire Git history is free of previously committed secrets.
