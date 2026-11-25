# Stage 149 — Authorization revocation decision record and verification design

Date: 2026-11-24
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Related review: Stage 148 account-state and role-permission audit

## Purpose

Convert the unresolved Stage 148 findings into explicit product/security decisions and a staging-only verification plan. This is a design record, not an implementation change.

## Evidence carried forward

The Stage 148 catalog review reported:

- `private.can_manage_enrollment(p_id)` checks whether the enrollment belongs to a class assigned to `auth.uid()`, but does not check the caller's current `profiles.role`.
- Attendance, grades, hifz assignments, and hifz records use that helper for teacher-scoped writes.
- Quiz owner policies permit owner-based management alongside admin access; the reviewed update/delete owner conditions do not consistently require the creator to remain a teacher.
- The live `profiles` table has no verified account enabled/disabled field. The `active: true` value in the proposed client resolver is not server verification.
- Staging identities and end-to-end role tests were not available. Catalog inspection is not proof of runtime behavior.

No new live database inspection was performed for this stage. The statements above are carried forward from the cited Stage 148 report and must be revalidated against the live catalog before implementation.

## Decision record — must be answered by the product owner

| Question | Option A | Option B | Required consequence |
|---|---|---|---|
| Should changing a teacher to student revoke teacher write access immediately? | Yes: current role is required in addition to class assignment. | No: class assignment remains an independent authorization grant until explicitly removed. | Document the selected rule and test both role-change and class-reassignment paths. |
| What happens to quizzes created by a teacher after role demotion? | Revoke owner management until the account is again an eligible teacher or admin. | Preserve owner management as a separate ownership permission. | Document whether edit, delete, question, and answer-key management all follow the same rule. |
| Must administrators disable accounts? | Yes: define a server-owned account-state source and its effect on new and existing sessions. | No: do not represent an unimplemented account-state feature in the client model. | Do not treat client `active: true` as authoritative in either case. |
| What is the intended role of class assignment? | Assignment is necessary but not sufficient; role is also required. | Assignment itself grants scoped teaching permissions, independent of role. | Align helper, policies, UI labels, and operational offboarding process. |

No option is selected by this report. Implementation must not infer the product decision.

## Recommended authorization invariants to approve

1. Every protected write is authorized server-side using the authenticated subject, never a browser-supplied user ID or role.
2. A teacher-only workflow must have one documented rule for the interaction between current role and class assignment.
3. Quiz creator ownership and teacher eligibility must be treated as separate concepts; policies must state whether either one is sufficient.
4. If account suspension is supported, it must be enforced server-side on every relevant access path, including existing sessions; a client boolean is insufficient.
5. Admin status must continue to come from the trusted database-side role check, not user-editable auth metadata.
6. A role change must have a defined effect on existing assignments, quiz ownership, and currently issued sessions.

## Staging-only test matrix

Use only a disposable staging project and synthetic accounts. Do not impersonate roles or run destructive tests against production.

| Actor / state | Operation | Expected result after product decision |
|---|---|---|
| Teacher T assigned to class C | Write attendance, grade, hifz assignment, hifz record for C | Allow only if the selected teacher-authorization rule is satisfied |
| Teacher T assigned to C, then role changed to student while assignment remains | Repeat each teacher write | Allow or deny according to the explicit decision above; result must be consistent across all four resources |
| Student S with no class assignment | Attempt teacher writes using a forged client user ID | Deny |
| Teacher T assigned to C | Attempt teacher writes for unrelated class D | Deny |
| Teacher T creates quiz, then role changed to student | Update/delete quiz and manage questions/answer keys | Allow or deny consistently with the explicit ownership decision |
| Admin M | Perform approved role-management and quiz-management operations | Allow only the documented admin operations |
| Suspended synthetic account, if suspension is approved | Attempt new login and use an already-issued session | Deny according to the approved suspension semantics |
| Anonymous caller | Attempt all protected writes and protected RPCs | Deny |

For each test, record the HTTP/API result, database result, and whether any row changed. A zero-row response must not be confused with an explicit authorization error. Verify both positive and negative cases.

## Implementation gates

Before any production change:

1. Product owner records decisions for all four questions above.
2. Re-read the live function and policy definitions; do not rely only on prior summaries.
3. Confirm the authoritative role and account-state source, if any.
4. Prepare a narrowly scoped migration and rollback based on a fresh ACL/policy snapshot.
5. Apply and test the change in disposable staging with synthetic JWT identities.
6. Verify student, teacher, admin, anonymous, and demoted-teacher flows.
7. Review the migration diff and obtain explicit approval before any production execution.

If a disposable staging project is unavailable, stop at documentation and source review. Do not simulate a production change.

## Explicit non-actions

- No SQL, DDL, DML, migration, RLS policy, function, trigger, grant, or revoke was executed or changed.
- No Supabase Auth, Data API, exposed-schema, secret, or deployment setting was changed.
- No user rows, contact values, credentials, tokens, or secrets were read.
- No production role was changed and no test account was created.
- No pull request was merged and no release was published.

## Status

Stage 149 is a decision-and-test design only. The four product decisions remain open; production remediation is blocked until they are explicitly approved and verified in staging.
