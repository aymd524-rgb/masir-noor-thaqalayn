# Stage 136 — Owner-confirmed Data API schema exposure

**Date:** 2026-11-23  
**Supabase project:** `pxwdfwozinxipvudupbl`  
**Repository branch:** `docs/live-schema-security-inventory-2026-11-23`  
**Scope:** read-only confirmation of the dashboard's Exposed schemas and SQL-level schema privileges.

## 1. Dashboard setting reported by project owner

The owner inspected the Supabase Dashboard > Integrations > Data API > Exposed schemas page and reported these three entries:

- `graphql_public` — checked
- `public` — checked
- `private` — unchecked

Therefore, based on the owner's direct dashboard observation, **`private` is not in the Data API exposed-schema allowlist**. This resolves the specific uncertainty recorded in Stage 135 for the normal PostgREST/Data API route.

## 2. Read-only catalog cross-check

A catalog query on the same project returned:

| Schema | anon USAGE | authenticated USAGE | SECURITY DEFINER routines |
|---|---:|---:|---:|
| `graphql_public` | true | true | 0 |
| `public` | true | true | 6 |
| `private` | false | true | 10 |

Interpretation:

- The dashboard allowlist excludes `private`, so private-schema routines are not exposed through the normal Data API schema route.
- `authenticated` still has SQL-level USAGE on `private` and EXECUTE grants on private helper routines. This remains a real database privilege fact, but it does not override the API allowlist.
- `anon` has no USAGE on `private`, providing an additional SQL privilege boundary.
- `public` and `graphql_public` remain exposed. Their routines and objects must continue to be reviewed according to effective grants and authorization checks; exposure alone does not mean every object is callable or readable.

## 3. Security interpretation and remaining work

1. The previously unresolved question "is `private` exposed through Data API?" is now answered: **No, according to the owner-reported dashboard setting.**
2. Keep `private` out of Exposed schemas. Do not add it as a workaround.
3. Retain per-function authorization review for the private SECURITY DEFINER helpers as defense in depth and for any non-PostgREST SQL access paths.
4. Continue reviewing the exposed `public` schema, including the two admin contact RPCs, the six tables with structural grants, and the legacy `profiles.phone` privilege identified in Stages 134–135.
5. This confirmation does not establish that the exposed `graphql_public` endpoint has no separate concerns; its exposure and grants should be reviewed independently if GraphQL is enabled/used.

## 4. Non-actions

- No Data API setting was changed.
- No SQL/DDL/DML, GRANT/REVOKE, RLS policy, function, trigger, schema, migration, Auth setting, deployment, or project configuration was changed.
- No SECURITY DEFINER function was invoked.
- No user rows, contact values, Auth records, credentials, or secrets were read.
- No PR was merged; PR #9 remains an open draft for review.
