# Stage 150 — Quiz submission authorization and attempt-policy verification plan

Date: 2026-11-24
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Related review: Stage 141 quiz submission RPC authorization addendum

## Scope

This stage records the quiz submission trust boundary, identifies product-rule gaps, and defines a staging-only verification matrix. It does not invoke the RPC, inspect quiz or answer rows, or change database/application state.

## Verified findings carried forward

The Stage 141 read-only catalog review recorded the following function contract:

- Public wrapper: `public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)`.
- Wrapper is `SECURITY INVOKER`, has an empty search path, and is executable by `authenticated` but not `anon`.
- It delegates to `private.submit_quiz_attempt_impl(p_quiz_id, p_answers)`.
- Private implementation is `SECURITY DEFINER`, has an empty search path, and is executable by `authenticated` but not `anon`.
- Implementation requires a non-null `auth.uid()`, checks that the caller's own `profiles.role` is `student`, requires a published quiz, validates the answers JSON structure and question/answer-key completeness, checks option bounds, calculates the score server-side, and inserts an attempt tied to `auth.uid()`.
- The return value contains an attempt identifier and aggregate score, not answer-key values.
- The reviewed function body did not visibly enforce class enrollment/course eligibility, a maximum number of attempts, or a per-user cooldown.

These are findings from the earlier catalog review, not a new live reinspection in Stage 150. Re-read the exact live definitions and grants before any implementation.

## Security assessment

### Positive controls recorded

1. The client cannot choose the `student_id` written to the attempt; the function binds it to `auth.uid()`.
2. The implementation checks the caller's database profile role rather than trusting browser-supplied role data.
3. Only published quizzes are accepted.
4. Answer shape, expected question/key coverage, and option bounds are checked server-side.
5. Score calculation occurs server-side.
6. The reviewed return payload does not disclose answer-key values.
7. Anonymous execution is not granted according to the prior privilege inspection.

### Unresolved product rules

The catalog review cannot decide these product questions:

- Must a student be enrolled in the class/course associated with the quiz?
- Can a student submit more than once? If so, how many attempts are allowed?
- Is there a cooldown or time window?
- If a quiz is unpublished after a student opens it, should an in-progress attempt still be accepted?
- Should the score be returned immediately, or held until teacher/admin review?
- How should a teacher's role demotion affect quizzes they created and existing attempts?

Do not add guessed defaults. Record explicit product decisions before changing function behavior.

## Required staging test matrix

Run only in a disposable staging project with synthetic accounts, quizzes, and answers.

| Caller / input | Expected security property |
|---|---|
| Anonymous caller | Cannot execute the public submission wrapper |
| Authenticated student submits a published quiz | Attempt is created with `student_id = auth.uid()` |
| Student supplies another user's ID in extra JSON fields | Extra identity data is ignored or rejected; persisted owner remains `auth.uid()` |
| Authenticated teacher submits | Rejected by server-side role check |
| Authenticated admin submits | Rejected unless a separate explicit admin-submission rule is approved |
| Student submits unpublished or nonexistent quiz | Rejected without creating an attempt |
| Student submits malformed JSON or missing/extra question data | Rejected without partial attempt creation |
| Student submits out-of-range option values | Rejected without partial attempt creation |
| Student submits answers for a quiz they are not enrolled in | Result follows the explicit enrollment policy; no implicit assumption |
| Student submits repeatedly | Result follows the approved attempt-limit/cooldown policy |
| Quiz is unpublished during an active attempt | Result follows the explicit in-progress-attempt policy |
| Student attempts to read answer-key rows directly | Denied by RLS/grants; no answer key is exposed through the response |
| Student A attempts to read Student B's attempt | Denied or no visible rows, according to the intended API contract |

For every case, assert both the API outcome and database state. A successful HTTP response alone is insufficient. A zero-row result must not be mistaken for an explicit permission error.

## SECURITY DEFINER review checklist

Before relying on the private implementation, revalidate:

- Function owner and `prosecdef` state.
- Empty `search_path` and schema-qualified object references throughout the body.
- Explicit `auth.uid()` null rejection.
- Current database-side role lookup for the same authenticated subject.
- No caller-controlled identity, score, or privileged flags.
- Strict JSON type/shape validation and bounded payload size.
- Atomicity: invalid submissions must not leave partial attempts.
- Exact EXECUTE grants on wrapper and implementation; no inherited PUBLIC/anon execution.
- No answer-key values in return payloads, raised exceptions, or logs.
- RLS and direct table grants on attempts, questions, and answer keys.

Do not execute the function against production as a test. Do not expose the private schema to the Data API to simplify testing.

## Implementation gates

1. Product owner decides enrollment, attempt count/cooldown, in-progress behavior, and score-release rules.
2. Reinspect the live function definitions, grants, and relevant RLS policies.
3. Confirm a disposable staging project and synthetic identities are available.
4. Add integration tests through the same authenticated API path used by the application.
5. If changes are needed, prepare a reviewed migration with a rollback plan; do not patch production ad hoc.
6. Run role-based positive and negative tests and verify no answer-key disclosure.
7. Obtain explicit approval before any production migration or deployment.

## Explicit non-actions

- No RPC was called.
- No quiz, question, answer-key, attempt, or user row was read or changed.
- No SQL, function, policy, grant, revoke, migration, Auth/Data API setting, or deployment was changed.
- No test identity or quiz fixture was created.
- No PR was merged and no release was published.

## Status

Stage 150 is a documentation-only security review. Enrollment eligibility, repeat-attempt policy, cooldown, in-progress behavior, and score-release rules remain product decisions. Production remediation is blocked until the decisions and staging tests are complete.
