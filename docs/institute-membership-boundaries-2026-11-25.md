# Institute membership and class boundary — migration review

## Status
- Migration file: `supabase/migrations/20261125120000_add_institute_membership_boundaries.sql`
- Added to the feature branch only.
- Not applied to Supabase; no live tables, policies, rows, or settings were changed.
- The application UI for institute creation, membership approval, and active-institute selection is not yet connected to this schema.

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
8. Restrictive policies are used so existing permissive policies cannot independently expose cross-institute rows.

## Provisioning path after review and rollout
- An administrator creates an institution and its initial owner membership.
- A user requests membership in an institution; it remains pending.
- An owner/manager approves the membership and assigns an appropriate role.
- The user then sees only institute-scoped classes and courses.
- The existing app still needs screens/actions for these steps and a server-backed active-institute context.

## RLS design review
- Operation-specific restrictive policies prevent a legacy permissive policy from granting students write access to course/class records or direct enrollment insertion.
- Students may submit their own enrollment request only when active in that institute; pending/suspended members cannot request enrollment.
- Staff enrollment writes are limited to active institute owner/manager/teacher members, and the trigger independently verifies the target student's active membership.

## Safety / validation limits
- The migration assumes the existing schema contains `courses.is_active`, `classes.is_active`, `classes.course_id`, `classes.teacher_id`, `enrollment_requests.student_id/class_id`, and `enrollments.student_id/class_id`, consistent with the repository's current code and prior schema audit.
- This file has not been executed against a disposable staging database. Review the SQL and test with admin, manager, teacher, student, pending member, suspended member, and cross-institute cases before applying.
- Existing rows are not automatically assigned to an institute; no guessed institute ownership is backfilled.
- This does not yet implement invite codes, cross-institute competition permissions, or active-institute switching UI.
