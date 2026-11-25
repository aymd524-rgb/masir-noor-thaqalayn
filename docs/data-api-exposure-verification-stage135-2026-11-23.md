# Stage 135 — Data API exposure boundary verification

**Date:** 2026-11-23  
**Supabase project:** `pxwdfwozinxipvudupbl`  
**Repository branch:** `docs/live-schema-security-inventory-2026-11-23`  
**Scope:** read-only verification of Data API exposure settings and routes to private-schema helpers.

## 1. Results verified

| Check | Result | Meaning |
|---|---|---|
| Supabase project status | `ACTIVE_HEALTHY` | Database inspection was available. |
| PostgreSQL version | 17.11 | Supports the existing invoker-security view approach. |
| SQL-visible PostgREST settings | No rows in `pg_settings` for names matching `pgrst` or `postgrest` | The runtime API schema allowlist is not exposed through this catalog view. This is not evidence that `private` is or is not exposed. |
| `private` schema ACL | `anon` has no USAGE; `authenticated` has USAGE | Authenticated role can resolve objects in the schema at SQL privilege level. |
| Private helper EXECUTE | Authenticated has EXECUTE on several SECURITY DEFINER helper routines | A direct call is possible at the SQL privilege layer; REST reachability depends on the Data API exposed-schema configuration. |
| Supabase Edge Functions | None listed | No Edge Function gateway was found in this project to serve as an alternate wrapper path. |
| Repository API config | No `supabase/config.toml` or other checked-in `api.schemas` / `db_schemas` configuration found on `main` | Repository does not establish the deployed API allowlist. |
| Existing public REST surface | Public schema remains the application-facing schema; public RPCs and tables are separately covered in Stage 134 | Public functions must retain explicit authorization, regardless of private-schema exposure. |

## 2. What cannot be proven from current access

The Supabase project tools available for this audit do not expose the Dashboard's Data API exposed-schema setting. A catalog query for PostgREST settings returned no rows, and the repository does not contain a checked-in `supabase/config.toml`. Therefore the following statement is **not yet verified**:

> Whether `private` is currently included in the Data API's exposed schemas.

Do not infer that `private` is hidden merely because it is named private, has no anon USAGE, or is absent from application code. Conversely, authenticated schema USAGE and EXECUTE do not by themselves prove that PostgREST exposes it.

## 3. Required dashboard verification

Open the project's Data API settings page:

[Supabase Dashboard — Data API settings](https://supabase.com/dashboard/project/pxwdfwozinxipvudupbl/integrations/data_api/settings)

Read the **Exposed schemas** list only. Do not change or save any settings during this audit.

- If `private` is **not** listed: record that PostgREST does not expose private-schema objects through the normal Data API route; retain SQL-level RLS and schema ACL as defense in depth.
- If `private` **is** listed: treat every authenticated-executable private SECURITY DEFINER helper as a potential direct RPC endpoint and conduct a full per-routine authorization review before any remediation.
- In either case, do not add `private` to the exposed list as a workaround.

The user can share only the schema names shown in that setting. Do not ask for API keys, JWTs, passwords, or screenshots containing secrets.

## 4. Current risk interpretation

1. `authenticated` schema USAGE plus EXECUTE on private helpers is a real SQL permission fact, but REST exposure remains conditional on the missing allowlist value.
2. The helper routines' in-body `auth.uid()` and `private.is_admin()` checks are positive signals from static source inspection, not a substitute for negative tests against non-admin and unauthenticated roles.
3. The two public admin contact RPCs remain SECURITY DEFINER and authenticated-executable, but have explicit `private.is_admin()` checks; anon cannot execute them. Keep the checks and test denial paths.
4. The six-table structural grants and authenticated access to legacy `profiles.phone` remain unresolved findings from Stage 134.
5. No Edge Functions were present in the project at the time of this check.

## 5. Verification and non-actions

- All database inspection was SELECT/catalog-only.
- No application rows, contact values, Auth records, credentials, or secrets were read.
- No functions were invoked.
- No SQL, schema, grants, policies, triggers, migrations, Auth settings, Data API settings, Edge Functions, deployments, or project configuration were changed.
- No new Supabase project or branch was created; no paid service was used.
- This report does not authorize a production permission change.

## 6. CI observation

For commit `aa42991cff879411cc88056a09947992db518c8e`, GitHub's `build` check completed successfully. A separate Cloudflare Workers Builds check for the same PR head reported failure. These are separate checks; the successful GitHub build does not erase the Cloudflare result, and the Cloudflare failure has not been diagnosed in this read-only security stage.
