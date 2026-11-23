# Stage 141 addendum — Quiz submission RPC authorization review

Date: 2026-11-23
Project: `pxwdfwozinxipvudupbl`

Read-only catalog review of the quiz submission function and its private implementation.

## Observed call path

- Public wrapper: `public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)`
  - SECURITY INVOKER (not SECURITY DEFINER).
  - `search_path = ''`.
  - EXECUTE: authenticated = true; anon = false.
  - Delegates to `private.submit_quiz_attempt_impl(p_quiz_id, p_answers)`.
- Private implementation:
  - SECURITY DEFINER.
  - `search_path = ''`.
  - EXECUTE: authenticated = true; anon = false.
  - Requires non-null `auth.uid()`.
  - Requires caller's own `profiles.role = 'student'`.
  - Requires quiz exists and `is_published = true`.
  - Validates answers JSON object, question/key completeness, number of answers, question option bounds, and calculates score server-side.
  - Inserts attempt using `student_id = auth.uid()`; returns attempt ID and aggregate score only.

## Assessment

The inspected implementation does not accept a caller-supplied student ID and does not return answer-key values. Its student-role check and published-quiz check are positive controls. Because the private implementation is SECURITY DEFINER, its explicit identity/role checks are particularly important and are present in the inspected body.

The implementation does not visibly enforce class enrollment/course eligibility, a maximum number of attempts, or a per-user attempt cooldown. Whether those are required is a product rule not established by this catalog review. Add tests or confirm requirements before changing behavior.

## Non-actions

No RPC was invoked; no answers, answer keys, quiz rows, or attempt rows were read. No function, grant, schema, or application code was changed.
