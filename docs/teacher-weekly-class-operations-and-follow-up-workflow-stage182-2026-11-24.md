# Stage 182 — Teacher weekly class operations and follow-up workflow

**Date:** 2026-11-24  
**Status:** Cross-module product, UX, workflow, and security design proposal  
**Scope:** A unified weekly operating workflow for teachers, connecting existing class, assignment, assessment, attendance, hifz, and notification concepts.

## 1. Purpose and relationship to prior designs

This stage defines how a teacher can manage the practical rhythm of a teaching week from one coherent workspace. It connects, rather than duplicates, the prior designs for class scheduling and attendance (Stage 161), notifications and calendar (Stage 162), assignments and feedback (Stage 170), hifz planning (Stage 171), learner dashboards (Stage 154), and lesson authoring (Stage 180).

The goal is to reduce scattered navigation and missed follow-ups. This document does not claim that any of these modules are implemented or connected.

## 2. Teacher weekly workspace

The proposed landing view should summarize only the teacher's authorized classes and show:
- Today's classes and upcoming sessions.
- Weekly timetable with timezone clearly displayed.
- Lessons and approved content packs planned for each session.
- Assignments due soon and overdue, grouped by class.
- New learner submissions awaiting review.
- Oral recitations or assessments awaiting teacher feedback.
- Attendance records that need completion or correction.
- Learners who have requested help or whose work needs follow-up.
- Recent class announcements and relevant system notices.

Every summary item should open the underlying authorized record. Counts must be derived from records the teacher is allowed to access, not from global totals that could leak other classes' activity.

## 3. Weekly planning flow

Suggested weekly cycle:

1. **Review:** inspect the upcoming class schedule, last session's unresolved items, and class progress summaries.
2. **Prepare:** select approved lesson packs or create a lesson draft; verify age/level, objectives, duration, and required materials.
3. **Plan:** assign each session a lesson, hifz/revision focus, activity, and optional assessment.
4. **Assign:** create class-scoped tasks with clear instructions, due date, workload estimate, and submission format.
5. **Teach:** open the session roster, record attendance, and use the planned teaching materials.
6. **Review:** assess submissions and recitations using consistent rubrics; provide constructive, private feedback.
7. **Follow up:** identify learners needing clarification, additional practice, or a supportive check-in.
8. **Close the week:** review completion and learning evidence, prepare next week's plan, and leave unfinished work visible without punitive labeling.

The workflow should allow teachers to skip or reorder steps when classes meet less frequently or when a lesson needs to change.

## 4. Session preparation card

Each upcoming class session may have a preparation card containing:
- Class name and session date/time.
- Planned lesson and its exact published version.
- Learning objectives and expected duration.
- Hifz target and revision range, if applicable.
- Activity, discussion prompt, or group exercise.
- Materials and media needed, with license-aware access.
- Assessment or oral recitation plan.
- Accessibility and low-bandwidth alternatives.
- Teacher-only notes, separated from learner-visible instructions.
- Preparation status: not started, in preparation, ready, or changed.

A change to the lesson after learners have received it should create a visible update notice and preserve the original version associated with prior work.

## 5. Assignment and submission queue

A unified queue should group work by state and class:
- Draft assignments not yet published.
- Published assignments awaiting learner work.
- Submitted work awaiting teacher review.
- Work returned for revision.
- Accepted or reviewed work.
- Excused or cancelled work.
- Overdue work requiring teacher judgment.

The queue should distinguish a learner's self-reported completion from a teacher-reviewed result. An overdue indicator is an operational reminder, not a moral or academic judgment. Teachers should be able to record an agreed extension or excuse with a reason and audit trail.

## 6. Recitation and oral assessment queue

For hifz, revision, reading fluency, and tajwid:
- Display only learners in the teacher's assigned classes.
- Show the task's surah/ayah range and whether it is new memorization or revision.
- Provide a rubric appropriate to the assessed skill.
- Separate teacher observations from automated signals or learner self-assessment.
- Allow feedback to be saved as draft before it is shared.
- Keep learner audio private, optional, consent-based, and accessible only to authorized reviewers.
- Avoid exposing one learner's recording or assessment to classmates.
- Record the assessed lesson/task version and rubric version.

Automated speech or recitation analysis, if ever added, must remain advisory and cannot independently certify mastery or replace qualified teacher review.

## 7. Attendance and session closeout

At session close, the teacher may:
- Mark present, late, excused, or absent using the authorized roster.
- Save a session summary using structured learning topics rather than unnecessary personal details.
- Record the lesson actually taught if it differed from the plan.
- Attach the assignment or revision task for the next session.
- Leave a private teacher reminder for follow-up.

Corrections to attendance or session records should preserve the prior value, actor, timestamp, and correction reason. Do not expose private teacher notes to learners or guardians by default.

## 8. Learner follow-up and support

A follow-up list may include:
- Learner explicitly requested help.
- Submission needs revision or clarification.
- Learner missed a session and requires an appropriate catch-up option.
- A planned oral assessment has not yet occurred.
- A teacher promised feedback or a review.
- A learning plan needs adjustment after teacher assessment.

Follow-up should be supportive, specific, and private. Avoid stigmatizing labels such as “weak” or “lazy,” public lists of struggling learners, punitive streaks, or automated messages that shame a learner. A teacher may mark an item resolved, rescheduled, referred to an academic supervisor, or awaiting learner response.

## 9. Communication and reminders

- Class-wide notices should use the moderated communication model from Stage 168.
- Assignment reminders should follow learner and guardian notification permissions and quiet hours from Stage 162.
- A teacher may preview a reminder before sending it.
- Avoid repeated or excessive reminders; allow reasonable quiet periods and configurable frequency.
- No unrestricted private messaging between adults and minors should be introduced by this workflow.
- Notifications must not reveal sensitive grades, private notes, audio links, or other learner data on lock screens.
- Delivery failures should be visible to the sender without falsely marking a notice as delivered.

## 10. Weekly progress summary

The teacher's weekly summary may report:
- Sessions planned and held.
- Attendance completion status.
- Assignments issued, submitted, reviewed, and awaiting action.
- Hifz/revision tasks assigned and teacher-assessed.
- Assessment coverage by learning objective.
- Learner requests for help and unresolved follow-ups.
- Next week's preparation status.

Metrics must explain their denominator and time window. Do not merge attendance, assignment completion, and verified mastery into one score. Avoid public ranking or comparison between children. A teacher-facing class summary should be descriptive and actionable rather than a high-stakes judgment.

## 11. Learner and guardian views

Learners should see their own upcoming sessions, assigned tasks, due dates, feedback released to them, and personal progress distinctions. They must not see teacher-only notes, peer submissions, internal review queues, or private class analytics.

Guardians may see only information permitted by a verified relationship and purpose-specific consent. The guardian view should not automatically expose all teacher notes, group communication, or other learners' information. Consent withdrawal and relationship revocation must affect future access according to the approved policy.

## 12. Calendar and workload controls

- Show local class timezone and clearly handle daylight-saving transitions.
- Support recurring sessions, one-off changes, cancellations, and rescheduling.
- Prevent duplicate assignments caused by retries or repeated taps.
- Make workload and estimated time visible to teachers and learners.
- Flag overlapping deadlines within a class as a planning aid, not as an automatic prohibition.
- Allow rest days, flexible memorization targets, and teacher-approved extensions.
- Provide a low-bandwidth view and printable weekly plan where rights permit.
- Avoid relying on push notifications as the only way to discover important tasks.

## 13. Operational states and exception handling

The workflow should handle:
- Teacher loses class assignment while a workspace is open: subsequent reads and writes must re-check authorization.
- Learner transfers class: historical records remain attached to the original class context; future access follows the new approved scope.
- Session is cancelled: linked tasks require explicit keep, reschedule, or cancel decision.
- Assignment is edited after publication: create a new version and show which learners received each version.
- Submission is duplicated by network retry: idempotency prevents duplicate review items.
- Teacher is unavailable: an authorized substitute may receive temporary, auditable access if institution policy permits.
- Content pack is withdrawn: affected upcoming sessions are flagged for replacement; historical records remain interpretable.
- Offline actions conflict with server state: show a conflict and require resolution rather than silently overwriting.

## 14. Authorization, audit, and data minimization

- All workspace queries are class- and institution-scoped on the server.
- Client-side filters are presentation only and never the authorization boundary.
- Every write re-checks current role, membership, class assignment, and record ownership.
- Role demotion, class reassignment, or membership revocation must remove access on subsequent requests.
- Audit significant changes: schedule, attendance correction, assignment publish/edit/cancel, feedback release, grade correction, and follow-up resolution.
- Do not place sensitive learner details in notification payloads or broad analytics events.
- Teacher-only notes are separately permissioned and have a documented retention policy.
- Exports must enforce the same scope and minimize personal information.

## 15. Conceptual integration model (not migrations)

This workflow may compose existing or proposed records:
- class sessions and schedule occurrences;
- versioned lesson and content-pack references;
- assignment and assignment-version records;
- learner submissions and teacher review records;
- attendance and session closeout records;
- hifz assignment and teacher-assessed progress records;
- notification outbox and delivery state;
- teacher follow-up tasks;
- weekly summary snapshots, if needed for performance.

A follow-up item should reference its source record rather than duplicate learner details. A weekly summary should be derived from authorized source records and should not become a competing source of truth.

## 16. Staging verification matrix

Use synthetic teacher, learner, guardian, and institution accounts:
- Teacher A sees only assigned classes; Teacher B cannot open A's queue by guessing an identifier.
- Institution A cannot inspect Institution B's sessions, learners, submissions, or summary metrics.
- Learners see only their own assignments, feedback released to them, and authorized session details.
- Guardians see only permitted records under verified relationship and current consent.
- Every queue count matches the authorized underlying result set.
- Changing role or class assignment removes subsequent access.
- Publishing an assignment records its version and recipients.
- Retrying a submission or attendance save does not create duplicate records.
- Cancelled sessions require explicit handling of linked assignments.
- Private notes and audio are not exposed in notices, exports, or learner views.
- Feedback is not visible to a learner before its release state permits it.
- Weekly metrics disclose time window and denominator and do not imply verified mastery from self-reports.
- Offline conflict and stale-session cases fail safely.
- All material changes create the required audit event.

## 17. Decisions required before implementation

- Which roles may act as substitute teachers and how is temporary access approved?
- Which follow-up categories should be included in the first version?
- Which weekly metrics are genuinely useful to teachers without creating excessive monitoring?
- What is the retention period for teacher-only notes and operational reminders?
- Which reminder defaults and quiet-hour rules should institutions be allowed to configure?
- Should weekly summaries be live queries or stored snapshots, and what freshness is required?
- What learner/guardian visibility is appropriate for each feedback and progress category?

## 18. Explicit non-actions

This stage is documentation only. No teacher dashboard, weekly planner, assignment queue, calendar, attendance workflow, notification, follow-up task, progress metric, database table, RLS policy, SQL function, migration, storage change, Supabase setting, analytics event, deployment, merge, or production setting was created or changed. No learner or institution data was accessed. All capabilities remain proposals pending product, academic, privacy, safeguarding, and technical approval.
