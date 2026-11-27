# Staging acceptance checklist — institute + phone OTP integration
Updated: 2026-11-27

Purpose: a repeatable, non-production test plan for PR #19 and its dependent PR #20. This document is a checklist, not evidence that tests have already passed.

## Safety and setup
- [ ] Use a disposable Supabase staging project, never the public production project.
- [ ] Confirm project ref and environment banner before applying any migration.
- [ ] Take a staging backup/snapshot and record the restore point.
- [ ] Review the migration order against the staging schema; stop on any missing prerequisite.
- [ ] Use test accounts only; do not copy real student phone numbers, records, or signatures.
- [ ] Configure SMS provider credentials only in the Supabase Auth dashboard/secret store; never commit them.
- [ ] Record migration filenames, timestamps, SQL errors, and test account roles.
- [ ] Do not deploy the public app until staging acceptance and owner review are complete.

## Migration order and checks
- [ ] Apply prerequisite institute/course/class schema migrations.
- [ ] Apply institute membership and restrictive RLS boundary migration.
- [ ] Apply enrollment/capacity/owner-membership/quiz-session guard migrations in chronological order.
- [ ] Apply optional contact email migration before testing client reads/writes to `profile_contacts.email`.
- [ ] Apply certificate settings, private signature storage, issue/revoke RPC migrations.
- [ ] Confirm every migration is recorded in staging migration history.
- [ ] Run repository CI against the exact release candidate after any SQL/code change.

## Test identity matrix
Create separate test users:
- system administrator
- institute A owner
- institute A manager
- institute A teacher assigned to a class
- institute A active student
- institute A pending student
- institute A suspended student
- institute B active student
- institute B teacher/manager
- user with no institute membership

## Institute and membership isolation
- [ ] A new membership request is `student / pending`; it grants no course/class access.
- [ ] Student can see and update only their own allowed membership/request data.
- [ ] Manager approves student request; status becomes active and access appears only for institute A.
- [ ] Manager cannot assign owner/manager role; owner/system admin can.
- [ ] Teacher cannot approve enrollment or change payment status.
- [ ] Suspended membership immediately loses institute-scoped access.
- [ ] Institute A user cannot read institute B courses, classes, enrollment requests, enrollments, or member details.
- [ ] User can belong to A and B using the same account; no duplicate account is created.
- [ ] Selecting an active institute is contextual UI state only; it does not bypass RLS.
- [ ] Legacy rows with null institute ID remain intact and are not exposed to non-admin users; assign them only through an authorized manager workflow.
- [ ] Last active owner cannot be demoted, suspended, or deleted; concurrent owner changes must not leave the institute without an active owner.

## Courses, classes, enrollment and capacity
- [ ] Manager can create a course assigned to their institute; student/teacher cannot.
- [ ] Class institute must match its linked course institute.
- [ ] Assigned teacher must be an active eligible member of the same institute.
- [ ] Pending/suspended/non-member student cannot request or be enrolled in an institute class.
- [ ] Student cannot insert an enrollment directly to bypass approval.
- [ ] Manager approves an eligible request; enrollment is created once and atomically.
- [ ] Duplicate approval/enrollment is rejected safely.
- [ ] Paid request cannot be approved as paid without verified payment; waiver requires authorized staff.
- [ ] At capacity, new enrollment fails; below capacity it succeeds.
- [ ] Two concurrent attempts for the final seat result in one successful enrollment.
- [ ] Moving an enrollment into a full class fails; null capacity remains unlimited.

## Phone OTP and contact data
- [ ] Signup requires a phone number and sends OTP using the configured provider.
- [ ] Correct OTP verifies the account; incorrect/expired OTP is rejected.
- [ ] Resend cooldown and rate limits work; repeated requests do not create unlimited SMS.
- [ ] Email is optional; signup succeeds without it.
- [ ] If email is supplied, it is stored only after the email migration is present.
- [ ] Profile is created once with role student; client cannot set role to teacher/admin.
- [ ] User can read/write only their own phone/contact row.
- [ ] Non-admin cannot use admin contact RPCs; authorized admin can access only through guarded RPCs.

## Certificates and signature storage (dependent PR #20)
- [ ] Only authorized teacher/manager can edit certificate settings for their institute.
- [ ] Teacher can upload supported image within size limit; unsupported/oversized file is rejected.
- [ ] Signature bucket is private; unauthenticated and cross-institute users cannot read signature objects.
- [ ] Only approved, active enrollment can receive a certificate.
- [ ] Duplicate certificate issuance for one enrollment is blocked.
- [ ] Student sees only their own certificate and can print/save as PDF.
- [ ] Revoked certificate shows revoked state and reason; cannot be presented as valid.
- [ ] Old certificate signature snapshot remains consistent after teacher changes their profile signature.

## Quiz and class-scope regressions
- [ ] Active student in correct institute can start/resume/submit course quiz.
- [ ] Pending/suspended student or user from another institute cannot start, resume, or submit.
- [ ] Membership suspension between start and resume blocks resume.
- [ ] Membership suspension between start and submit blocks submission.
- [ ] Standalone published quiz behavior remains unchanged.
- [ ] Concurrent membership revocation and quiz submission are tested with two database sessions.

## Evidence and sign-off
For each check, record: date/time, staging project ref (non-secret), test account role, expected result, actual result, and screenshot/log reference.
- [ ] All critical access-boundary checks pass.
- [ ] No migration errors or unexpected policy warnings remain.
- [ ] Restore/rollback procedure is rehearsed in staging.
- [ ] Project owner reviews evidence and explicitly authorizes release.
- [ ] Only after sign-off: plan production backup, migration, secrets, deployment, and post-deploy smoke test.

## Current status
All items above are **pending staging execution**. GitHub Actions passing is source-level validation only; it is not database, SMS, storage, or end-to-end release approval.
