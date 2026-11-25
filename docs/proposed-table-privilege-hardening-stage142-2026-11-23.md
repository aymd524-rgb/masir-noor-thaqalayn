# Stage 142 — Proposed table-privilege hardening (read-only review)

Date: 2026-11-23
Project: Supabase project `pxwdfwozinxipvudupbl`
Scope: catalog-only inspection and preparation of a proposed SQL patch. No SQL below was executed.

## Verified live findings

The six public tables below are owned by `postgres`, have RLS enabled (per the prior live inventory), and currently report effective privileges `TRUNCATE`, `TRIGGER`, `REFERENCES`, and PostgreSQL 17 `MAINTAIN` for both `anon` and `authenticated`:

- `public.content_entries`
- `public.enrollment_requests`
- `public.game_questions`
- `public.hifz_assignment_completions`
- `public.hifz_assignments`
- `public.hifz_records`

The live `pg_default_acl` catalog also shows, for objects created by role `postgres` in schema `public`, default table privileges `TRUNCATE`, `TRIGGER`, `REFERENCES`, and `MAINTAIN` granted to both client roles. Separate `supabase_admin` default ACL entries exist for platform-managed schemas/objects; they are explicitly outside this proposed app-level change.

RLS does not filter or block table-level `TRUNCATE`, `TRIGGER`, `REFERENCES`, or `MAINTAIN` privileges. Effective SQL privileges alone do not establish that each operation is reachable through PostgREST/Data API; no destructive/API exploit test was run.

## Proposed SQL — NOT EXECUTED

Preconditions:
1. Review all application, migration, scheduled-job, and operational dependencies for the four privileges.
2. Confirm no application role is expected to create triggers, truncate tables, create foreign-key references, or invoke table maintenance.
3. Take and retain an ACL snapshot; schedule a maintenance window and prepare rollback.
4. Run first in an isolated staging project with role-specific tests. This project has no staging environment available in this workflow.

If approved after those checks, the proposed statements are:

```sql
BEGIN;

REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN
ON TABLE
  public.content_entries,
  public.enrollment_requests,
  public.game_questions,
  public.hifz_assignment_completions,
  public.hifz_assignments,
  public.hifz_records
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN
ON TABLES
FROM anon, authenticated;

COMMIT;
```

Important: this default-privilege statement applies only to future objects created by `postgres` in `public`. It does not change existing objects, other owners, or `supabase_admin` defaults. Re-check ownership and default ACLs after any migration that changes the object owner.

## Rollback draft — NOT EXECUTED

Only if rollback is required and the pre-change ACL snapshot confirms these exact grants were present:

```sql
BEGIN;

GRANT TRUNCATE, TRIGGER, REFERENCES, MAINTAIN
ON TABLE
  public.content_entries,
  public.enrollment_requests,
  public.game_questions,
  public.hifz_assignment_completions,
  public.hifz_assignments,
  public.hifz_records
TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT TRUNCATE, TRIGGER, REFERENCES, MAINTAIN
ON TABLES
TO anon, authenticated;

COMMIT;
```

Do not run rollback blindly: it may restore privileges that were intentionally removed after this snapshot.

## Required verification after a separately approved change

- Re-run `has_table_privilege` for all four privileges and both client roles on the six tables.
- Re-read `pg_default_acl` for owner `postgres`, schema `public`, object type `r`.
- Verify ordinary student, teacher, and admin flows still work: enrollment request, teacher attendance/grade/hifz writes, admin review, and quiz flows.
- Confirm no client role has acquired unintended table-level privileges on newly created public tables.
- Run Supabase Security Advisor and application tests.
- Do not use destructive `TRUNCATE` tests against production data.

## Status

- Catalog inspection only; no application rows or contact data read.
- No GRANT/REVOKE, DDL/DML, RLS, trigger, function, migration, Auth/Data API setting, or deployment was changed.
- PR #9 remains open, draft, and unmerged. This document is a proposal, not authorization to change production.
