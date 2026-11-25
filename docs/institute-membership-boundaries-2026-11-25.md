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
