# Stage 137 — Exposed public SECURITY DEFINER RPC review

**Date:** 2026-11-23  
**Supabase project:** `pxwdfwozinxipvudupbl`  
**Repository branch:** `docs/live-schema-security-inventory-2026-11-23`  
**Scope:** read-only catalog inspection and Security Advisor review for SECURITY DEFINER routines in the exposed `public` schema.

## 1. Effective routine privileges

The live catalog returned these six SECURITY DEFINER routines in `public`:

| Routine | anon EXECUTE | authenticated EXECUTE | Initial interpretation |
|---|---:|---:|---|
| `admin_get_profile_contacts(uuid[])` | no | yes | Authenticated RPC; body contains explicit admin check from prior static review |
| `admin_list_profile_contacts(integer, integer)` | no | yes | Authenticated RPC; body contains explicit admin check from prior static review |
| `check_game_answer(uuid, integer)` | no | no | Not executable by client roles under current effective privileges |
| `handle_new_user()` | no | no | Trigger-oriented function; not client-executable |
| `process_enrollment_request_review()` | no | no | Trigger-oriented function; not client-executable |
| `rls_auto_enable()` | no | no | Event-trigger function; not client-executable |

No routine was invoked. No function source or application row was read in this stage.

## 2. Security Advisor findings

The live Security Advisor returned:

1. Two WARN findings named `authenticated_security_definer_function_executable`, for the two admin contact RPCs above. The finding correctly identifies that signed-in users can reach the functions through the exposed public RPC route. It does **not** by itself establish unauthorized disclosure: prior static review found an explicit `private.is_admin()` guard in both function bodies, and anon EXECUTE is false. Negative-path authorization tests are still required.
2. One WARN finding `auth_leaked_password_protection`: leaked-password protection is disabled. Enabling it is an Auth configuration change and is deliberately not performed in this read-only stage.

Remediation references:
- [Database linter: authenticated SECURITY DEFINER function executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Auth password strength and leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## 3. Required tests before remediation

- A normal authenticated student and teacher must be denied by both admin contact RPCs.
- An authenticated administrator must retrieve only the requested/authorized contact records.
- Anonymous callers must remain unable to execute either RPC.
- Validate empty, oversized, duplicate, and unauthorized UUID lists; validate pagination bounds for the list RPC.
- Confirm all error paths fail closed and do not disclose whether arbitrary user IDs exist.
- Re-run the Security Advisor after any separately approved change.

## 4. Decisions not made

- Do not remove EXECUTE from authenticated without confirming the admin UI's intended RPC path and replacing it with a safe equivalent.
- Do not switch the functions to SECURITY INVOKER without evaluating their access to `profile_contacts` and RLS behavior.
- Do not change Auth password settings without separate owner approval.
- Keep `private` excluded from the Data API exposed-schema list, as confirmed in Stage 136.

## 5. Non-actions

- Only catalog SELECT and Security Advisor inspection were performed.
- No SECURITY DEFINER function was invoked.
- No user rows, contact values, Auth records, credentials, or secrets were read.
- No SQL/DDL/DML, GRANT/REVOKE, RLS policy, function, trigger, schema, migration, Auth setting, Data API setting, deployment, or project configuration was changed.
- No PR was merged; PR #9 remains an open draft.
