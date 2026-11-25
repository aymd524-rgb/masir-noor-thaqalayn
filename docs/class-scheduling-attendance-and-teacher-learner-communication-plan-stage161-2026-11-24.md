# Stage 161 — Class Scheduling, Attendance, and Teacher–Learner Learning Communication
Date: 2026-11-24
Status: design/documentation only; no application, database, or messaging feature implemented.

## 1. Goals and boundaries
Design a reliable class operations workflow for scheduling sessions, recording attendance, sharing educational instructions and feedback, and producing useful class reports. The product serves minors: communication must remain educational, bounded, auditable and privacy-preserving. This proposal does not authorize open direct messaging or unsupervised adult–minor private chat.

## 2. Class and session lifecycle
- Class setup: title, learning level/age band, subject (reading, hifz, revision, tajwid, translation), teacher assignment, schedule, capacity and status.
- Enrollment: explicit learner enrollment with status, effective dates and an auditable actor. Guardian relationship, if later supported, must be verified and separately scoped.
- Session planning: date/time with timezone, duration, learning objective, assigned material, teacher and class.
- Session states: planned, rescheduled, completed, cancelled. Record who changed the state and why.
- Conflict handling: detect overlapping teacher/class schedules and show a warning before saving. Do not silently move sessions.
- Calendar display: show each learner only their enrolled classes; show teachers only their current assigned classes; show admins only what their operational role requires.
- Avoid publishing precise learner schedules or attendance publicly.

## 3. Attendance workflow
Attendance values should be a small approved set, for example: present, absent, excused, late, remote (if remote learning is approved). Define whether late/remote are needed before implementation.

Workflow:
1. Teacher opens an assigned class session.
2. System loads only the current authorized roster.
3. Teacher records one status per enrolled learner.
4. Unsaved changes are clearly indicated.
5. Teacher reviews a summary and confirms submission.
6. Corrections create an audit event with actor, timestamp and reason; history is not silently erased.

Attendance must be teacher-entered or otherwise explicitly authorized. A learner may submit an absence note/request, but must not directly overwrite official attendance. Do not collect detailed medical or family reasons; use a minimal optional note only if policy requires it.

## 4. Teacher–learner communication
Initial scope should favor structured class announcements, assignment instructions and teacher feedback attached to learning records rather than private chat.

- Announcements: class-scoped, teacher-authorized, moderated and visible only to enrolled learners during the relevant period.
- Assignment instructions: linked to an assignment, versioned and visible to its intended learners.
- Feedback: linked to an assessment or hifz record; constructive, concise and visible only to the learner and authorized teacher(s).
- Questions/help: use a structured help request with category and status, visible to authorized teaching staff. No public discussion feed.
- Notifications: in-app notification summaries; avoid sensitive content in push/email previews.
- No attachments or external links by default. If later enabled, apply file type/size scanning, moderation, retention and access controls.
- No ephemeral/private adult–minor messaging, disappearing messages, location sharing or unmoderated peer-to-peer chat.
- Establish reporting, escalation and safeguarding procedures before any expanded communication feature.

## 5. Role and visibility model
- Learner: view own schedule, own attendance history, class announcements and own feedback; submit a bounded help request.
- Teacher: view and manage sessions/attendance for currently assigned classes; send class-scoped announcements; see only necessary learner details.
- Admin: manage class structures and assignments with least privilege; access detailed learner information only for an approved operational purpose.
- Guardian (future option): no access unless a verified relationship and consent/authorization model is approved.
- Anonymous users: no access to class schedules, rosters, attendance or communications.

Every read and write must be enforced server-side. Hiding navigation or filtering a client query is not authorization. Teacher role and current class assignment must both be checked for teacher actions. Role demotion and assignment removal must revoke access, including stale sessions and cached data.

## 6. Conceptual data model
Logical concepts only; reconcile with the current live schema before proposing any migration:
- class_sessions: class_id, starts_at, ends_at, timezone, status, objective, created_by, updated_by.
- session_materials: session_id, content_reference, instructions_version.
- attendance_records: session_id, enrollment_id, status, recorded_by, recorded_at, corrected_from, correction_reason.
- attendance_events: record_id, action, actor_id, timestamp, minimal_change_summary.
- class_announcements: class_id, author_id, title, body, publication_state, visible_from, visible_until.
- announcement_reads (optional): announcement_id, learner_id, read_at; avoid tracking beyond a clear educational need.
- learning_feedback: learner_id, class_id, related_record_id, author_id, body, visibility, created_at.
- help_requests: learner_id, class_id, category, message, status, assigned_staff_id, created_at, resolved_at.
- notification_outbox: recipient_id, event_type, minimal_payload, status, created_at, delivered_at.

Use existing enrollment/session tables where possible; avoid duplicate sources of truth. Do not place sensitive personal details in announcement, notification or audit payloads.

## 7. Data integrity and audit
- Enforce one attendance record per enrollment/session unless a documented correction/version model says otherwise.
- Validate session end is after start, session belongs to the class, and attendance enrollment belongs to that class.
- Derive actor identity from authenticated server context.
- Use server timestamps for authoritative records.
- Restrict state transitions to approved values.
- Make writes transactional and idempotent where retry is possible.
- Audit role changes, class assignment changes, attendance corrections, announcement publication and help-request access.
- Audit records should be append-only to ordinary users; define retention and privileged review.
- Avoid recording message bodies, phone numbers, secrets or excessive personal data in audit logs.

## 8. Privacy, retention and child safety
- Collect the minimum attendance and learning information needed.
- Do not require learners to disclose reasons for absence.
- Do not show attendance percentages or comments publicly.
- Define retention periods for attendance, help requests, feedback and notification metadata.
- Give learners a clear route to report inappropriate content or conduct.
- Establish who reviews reports, expected response times and escalation steps.
- Do not introduce direct messaging, file uploads, external social integrations or peer chat without a separate safety review.
- Age-appropriate language, accessibility and guardian/consent obligations require product and legal review for relevant jurisdictions.

## 9. UX and accessibility
- Calendar/list toggle with readable date, timezone and session status.
- Mobile-friendly attendance grid with large targets and clear confirmation.
- Screen-reader labels for attendance values; never rely on color alone.
- RTL-safe Persian/Arabic text and clear mixed-direction handling.
- Empty, loading, save, offline, permission-denied and conflict states.
- Confirmation before publishing announcements or finalizing attendance.
- Provide a clear correction workflow rather than destructive edits.

## 10. Acceptance and security tests
1. Anonymous users cannot access class/session/attendance endpoints.
2. Learners cannot read another learner's attendance or help requests by changing identifiers.
3. Teacher without current assignment cannot view roster or record attendance.
4. Demoted teacher loses access even when an old class assignment remains.
5. Attendance cannot be written for an enrollment outside the session's class.
6. Duplicate/retried submissions do not create inconsistent attendance records.
7. Learners cannot alter official attendance or teacher feedback.
8. Announcements are visible only to intended enrolled learners and authorized staff.
9. No unapproved direct private messaging or peer-to-peer chat endpoints exist.
10. Notification payloads do not reveal sensitive attendance reasons or private feedback.
11. Corrections retain an auditable history and require authorized actor/reason.
12. Stale sessions and client caches do not preserve access after role or enrollment changes.
13. RTL, keyboard and screen-reader checks pass for schedule and attendance workflows.

## 11. Delivery sequence
1. Inventory current class, enrollment, schedule and attendance tables, RLS policies, RPCs and UI.
2. Resolve teacher role-demotion and class-assignment authorization gaps.
3. Approve attendance vocabulary, correction rules and retention.
4. Approve safeguarding model and communication scope.
5. Build schedule and attendance flows with synthetic data in a feature branch.
6. Add class announcements and structured help requests only after moderation and escalation processes are approved.
7. Run negative authorization, privacy, accessibility and child-safety tests in staging.
8. Obtain explicit approval before any production migration, deployment or release.

## 12. Decisions required
- Which attendance states are necessary?
- Can learners request attendance corrections, and who approves them?
- Which schedule timezone and recurrence rules are required?
- Are class announcements sufficient, or is a structured help-request workflow needed?
- Who can publish, edit and retire announcements?
- What moderation/escalation team and reporting process will exist?
- What retention periods apply to attendance and feedback?
- Are guardians in scope, and how is their relationship verified?

## 13. Status and safety
This document is a proposal only. No code, UI, schema, RLS, grants, functions, triggers, notifications, messaging, attendance records or live settings were changed. No live learner data was accessed or modified. No migration, deployment, merge or release was performed.
