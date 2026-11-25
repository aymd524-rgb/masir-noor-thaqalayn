# Role-based access test plan (Stage 128)

**Status:** prepared only; NOT executed.  
**Target:** disposable staging database only. Never run role impersonation tests against the connected production project.  
**Prerequisites:** a verified migration/schema snapshot, synthetic users and class/enrollment fixtures, and PR #7 reviewed and merged by the repository owner before any profile-column privilege experiment.

## Non-negotiable safety gates

- Use four synthetic identities: student A, student B (unrelated), teacher T, and admin M. Create only synthetic rows in a disposable staging database.
- Never copy production users, phone numbers, emails, attendance, grades, or Qur'an memorization records into fixtures.
- Use the actual Supabase JWT claims for each synthetic account; do not trust client-supplied role metadata.
- Run negative tests as well as positive tests. A zero-row result is not equivalent to a permission error; assert the intended behavior explicitly.
- Do not apply the proposed profile column grant while the meaning of exposing `profiles.role` to every row visible to a teacher remains unresolved.
- Keep production SQL, grants, RLS, functions, triggers, migration ledger, and deployment untouched.

## Test matrix

| Actor | Operation | Expected result |
|---|---|---|
| Student A | SELECT own `profiles` identity fields | Allow only A's row |
| Student A | SELECT Student B's profile | Deny / zero visible rows |
| Student A | SELECT own `profile_contacts` row | Allow only A's contact row |
| Student A | SELECT or UPDATE Student B's contact row | Deny |
| Student A | Call `admin_get_profile_contacts(uuid[])` | Explicit authorization error; no contact data |
| Student A | Call `admin_list_profile_contacts(integer,integer)` | Explicit authorization error; no contact data |
| Teacher T | SELECT identity fields for assigned students | Allow only students permitted by existing class RLS |
| Teacher T | SELECT unrelated Student B profile | Deny / zero visible rows |
| Teacher T | SELECT any `profile_contacts` row | Deny unless an explicitly documented product rule says otherwise |
| Teacher T | Call either admin contact RPC | Explicit authorization error |
| Teacher T | Write attendance, grades, hifz records/assignments for managed class | Allow only within assigned class scope |
| Teacher T | Write those records for an unrelated class | Deny |
| Admin M | Read profile identity and perform approved role-management flow | Allow, subject to server-side role protections |
| Admin M | Read contact details through `admin_get_profile_contacts` | Allow only through the admin-checked RPC |
| Admin M | Call `admin_list_profile_contacts` | Allow with pagination limit enforced |
| Anonymous | Read profiles, contacts, enrollment, attendance, grades, hifz, quiz answer keys | Deny / no protected rows |
| Anonymous | Call admin contact RPCs or protected quiz RPCs | Deny |
| All roles | Student enrollment, teacher review, quiz submission, attendance, grade and hifz workflows | Preserve each documented role's existing allowed behavior |

## Profile column-grant decision

PR #7 changes the session resolver to select `id,full_name,role,created_at` and reads phone from `profile_contacts`. The proposed grant would allow every authenticated user to select `role` on every profile row visible to that user under RLS. The teacher client currently needs only `id,full_name` for related students, while the signed-in user's own role and the admin role-management screen need `role`.

Before considering the grant, choose and test one of these designs:

1. Confirm that revealing role values for all teacher-visible profiles is acceptable and document the decision; or
2. Keep role retrieval self/admin-only through a narrowly scoped server-side function or policy design, then grant teacher-facing identity columns separately.

Do not silently choose option 1. Also verify all embeds, views, profile edits, role changes, and session bootstrap queries after PR #7.

## Disposable staging execution outline

1. Build a disposable database from the reconciled schema/migration history; do not replay the incomplete production migration folder.
2. Seed only synthetic student A, student B, teacher T, admin M, two classes (one assigned to T, one unrelated), and synthetic attendance/grade/hifz/enrollment rows.
3. Sign in separately as each synthetic actor and run the matrix through the same browser/API calls used by the app.
4. For RPC negative tests, call the RPC directly as student and teacher; verify explicit authorization failure and verify that no contact values are returned.
5. For positive tests, verify exact allowed rows and mutations, not merely HTTP 200.
6. Run the read-only baseline script and Supabase Security Advisor after any staging-only ACL change.
7. Save test output with synthetic identifiers only. Any failure blocks the production change.

## Release gate

No production ACL migration until all tests pass, the migration chain is reconciled, the exact pre-change ACL snapshot is stored, and the repository owner explicitly approves a reviewed migration. If any role flow fails, restore the captured ACL state in staging first and stop. This plan itself changes no database state.
