# Institute membership and class boundary — migration review

## Status
- Migration file: `supabase/migrations/20261125120000_add_institute_membership_boundaries.sql`
- Added to the feature branch only.
- Not applied to Supabase; no live tables, policies, rows, or settings were changed.
- A first `/institutes` page is now in the feature branch for active institute discovery, student membership requests, manager approval/suspension, basic role changes, and system-admin institute creation.
- The global navigation now links to the institute page.
- Persistent active-institute switching and full institute-scoped dashboard context are not yet implemented.

## Intended behavior
1. Each course and class is assigned to one institute.
2. A class linked to a course must use the same institute as that course.
3. Membership requests start as `student / pending`; pending membership grants no institute content access.
4. Only active membership grants access to the institute's courses and classes.
5. Enrollment requests and enrollments are restricted to the class institute; a student must be an active student member.
6. An assigned teacher must be an active teacher/manager/owner member of that institute.
7. Existing legacy courses/classes with `institute_id IS NULL` are preserved, but are not visible to non-admin authenticated users under the new restrictive policies. They must be assigned by an authorized manager before students can use them.
8. Restrictive policies separate read and write operations: active members can read course/class data, but only owners/managers can create or edit courses/classes. Students cannot directly insert enrollment rows to bypass approval; authorized institute staff create enrollments after approving requests.
9. Enrollment triggers require the enrolled student to have active student membership in that institute. Staff may create a record for another student only when the student is an active member of the same institute.
10. Restrictive policies prevent existing permissive policies from independently exposing cross-institute rows.

## Provisioning path after review and rollout
- A system administrator creates an institution; a database trigger creates the initial owner membership atomically in the same transaction.
- A user requests membership in an institution; it remains pending.
- An owner/manager approves the membership and assigns an appropriate role.
- The user then sees only institute-scoped classes and courses.
- The existing app still needs screens/actions for these steps and a server-backed active-institute context.

## RLS design review
- Operation-specific restrictive policies prevent a legacy permissive policy from granting students write access to course/class records or direct enrollment insertion.
- Students may submit their own enrollment request only when active in that institute; pending/suspended members cannot request enrollment.
- Staff enrollment writes are limited to active institute owner/manager/teacher members, and the trigger independently verifies the target student's active membership.

## UI implementation status
- The page uses the signed-in Supabase client and relies on RLS; it does not use a service-role key.
- Managers can approve/suspend members and change a student to teacher or vice versa. Only institute owners or system administrators can grant owner/manager roles; a trigger prevents managers from escalating privileges and prevents removing the last active owner.
- Active institutions are discoverable by authenticated users; institution details remain limited by active membership/admin policies.
- No active-institute preference is persisted yet; this page does not claim that switching institute changes the app-wide current context.

## Safety / validation limits
- The migration assumes the existing schema contains `courses.is_active`, `classes.is_active`, `classes.course_id`, `classes.teacher_id`, `enrollment_requests.student_id/class_id`, and `enrollments.student_id/class_id`, consistent with the repository's current code and prior schema audit.
- This file has not been executed against a disposable staging database. Review the SQL and test with admin, manager, teacher, student, pending member, suspended member, and cross-institute cases before applying.
- Existing rows are not automatically assigned to an institute; no guessed institute ownership is backfilled.
- This does not yet implement invite codes, cross-institute competition permissions, or active-institute switching UI.


## Active institute selection

The institutes page now allows a signed-in user to select an active institute from their own active memberships and persist that choice in `user_institute_preferences`. Clearing the selection removes the preference. A security-definer trigger validates active membership on every insert/update; the preference is contextual UI state only and never grants access. If a membership is suspended, the app does not restore it as a valid active selection after reload. This preference is not yet wired as a global course/dashboard filter; that requires each data query and RLS policy to enforce the selected institute independently.

## Enrollment request review permissions
- Active institute owners and managers, plus system administrators, may update enrollment request status and payment status.
- Active teachers may read requests within their institute but cannot approve/reject requests or change payment verification.
- The restrictive RLS update policy enforces this even if an older permissive policy grants broader update access.
- The admin backend panel remains system-admin-only; institute-scoped manager approval UI is not yet wired to the institute dashboard.
- The approval trigger creates the enrollment in the same transaction as approval; payment marked `paid` must be verified outside the app, and `waived` requires an authorized waiver.
- CI passed for the previous code head (`0ce9d651`); the new manager-only policy commit requires its own CI run. This migration remains unexecuted on the live database.


## Capacity enforcement follow-up — 2026-11-25
- Migration: `supabase/migrations/20261126006000_enforce_capacity_for_all_enrollment_writes.sql`
- It replaces the existing enrollment guard function in-place; existing triggers continue to reference the same function.
- Enrollment inserts and moves into another class lock the target class row and count existing enrollments before allowing the write.
- Approval-trigger enrollments and direct staff enrollment writes share the same class-row lock, preventing concurrent writers from exceeding a finite capacity.
- Updates that do not change class assignment still validate institute membership but do not consume an additional seat.
- The GitHub application build and test workflow passed for commit `a963accd484076c9543d2f400e18af2e960b8fae`.
- Cloudflare Workers build failed for that commit; inspect the linked Cloudflare build logs before treating deployment compatibility as verified.
- This migration is branch-only and has not been run against staging or production.

### Required staging checks before rollout
1. At capacity, a new enrollment insert fails with a capacity constraint error.
2. Below capacity, one insert succeeds.
3. Two concurrent inserts for the final seat result in exactly one successful enrollment.
4. Approving a paid request at capacity fails and rolls back the request status update.
5. Approving a paid request below capacity creates exactly one enrollment.
6. A direct staff insert cannot exceed capacity.
7. Moving an enrollment to a full destination class fails; moving to a class with a free seat succeeds.
8. A suspended or non-member student cannot be enrolled even when the class has available capacity.
9. A class with null capacity remains unlimited.


## Owner-membership deletion hardening — 2026-11-26
- Migration: `supabase/migrations/20261126007000_protect_institute_owner_membership_deletes.sql`
- Review found that the existing UPDATE guard protected owner/manager role changes, but DELETE was a separate operation and could bypass that guard.
- The new BEFORE DELETE trigger blocks managers from deleting owner/manager membership rows, blocks deleting the last active owner, serializes membership deletion on the institute row, and still permits a user to withdraw their own pending request.
- This is a new branch-only migration; it has not been applied to Supabase.
- Add staging tests: manager attempts to delete owner/manager (must fail); owner attempts to delete last active owner (must fail); owner removes an owner while another active owner exists (allowed); user withdraws own pending request (allowed); concurrent deletion attempts cannot leave zero active owners.

## Latest branch checks
- Latest reviewed head before this follow-up: `bc92b23fbdac083294e9c889f40012cfd726f3e7` — GitHub build/test workflow passed; Cloudflare Workers build failed. Cloudflare's check exposes a build log link but no error text in the GitHub check output.
- Latest code head after owner-membership deletion hardening: `8738cacd385db3acee4fa1ae5e1d401ee728b741`. GitHub build/test workflow passed for this exact code SHA. Cloudflare Workers build failed for that code SHA; inspect build `a5e57956-b6de-42cc-81db-a2097d521614` for the underlying log.
- Documentation-only follow-up head: `f7c1cb66b006ee5ef85b71caf8a838d07cfea2d2`. GitHub build/test workflow passed on this latest PR head; Cloudflare Workers build failed again, build ID `a5bb2010-3ad3-4d50-8fd3-b9bf23d7e8c4`: https://dash.cloudflare.com/01269ddae83800dfe633b467e3811c6a/workers/services/view/masir-noor-thaqalayn/production/builds/a5bb2010-3ad3-4d50-8fd3-b9bf23d7e8c4 . The underlying Cloudflare error text still needs to be retrieved from its dashboard. No deployment or live database action has been performed.


## Quiz session scope hardening — 2026-11-26
- Review found that the `SECURITY DEFINER` `start_quiz_attempt` RPC checks that a quiz is published, but its internal lookup bypasses normal quiz RLS. Without an additional database guard, a signed-in student who knows a course quiz UUID could create a timed session outside their institute, consuming the single-attempt/session lock.
- Added migration `supabase/migrations/20261126008000_guard_quiz_session_start_scope.sql`. Its `BEFORE INSERT` trigger on `quiz_attempt_sessions` requires the session owner to match `auth.uid()` and, for course quizzes, requires the course and institute to be active and the caller to have active institute membership. Standalone published quizzes remain accessible to authenticated students.
- This migration is branch-only and has not been applied to Supabase. Test with a student in the correct institute, a student from another institute, a pending/suspended member, a standalone published quiz, and a non-published quiz.
