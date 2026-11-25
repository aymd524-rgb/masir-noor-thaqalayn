# Stage 170 — Daily Qur'an Learning Assignments, Submission, and Teacher Feedback
Date: 2026-11-24
Status: design/documentation only; no assignment UI, submission workflow, grading logic, database object, storage bucket, notification or production setting implemented.

## 1. Purpose
Design a structured learning-task workflow for Qur'an learners and teachers. Teachers can assign age- and level-appropriate activities; learners can record progress and submit permitted evidence; teachers review work and provide constructive feedback. The system should support daily practice without creating excessive pressure or treating activity completion as proof of mastery.

## 2. Learning principles
- Assignments support reading, fluency, tajwid, memorization, revision, translation, tadabbur, hadith and class activities.
- Tasks are age-appropriate, achievable, flexible and aligned with the course curriculum.
- Distinguish assigned, attempted, learner-reported complete, teacher-reviewed and verified mastery states.
- Do not equate number of submissions, time spent or streaks with learning quality.
- Avoid punitive late labels, public comparisons and shame-based reminders.
- Allow teachers to adapt workload for learner needs and provide alternative formats.
- A learner can ask for help or report that a task is difficult without penalty.
- Preserve canonical Qur'an text and approved source references when tasks quote verses.

## 3. Assignment authoring
Authorized teachers may create tasks with:
- title and clear instructions
- course, class and lesson association
- learning objective and skill dimension
- age/level band and estimated workload
- task type (reading, memorization, revision, tajwid, translation, reflection, worksheet, oral practice)
- assigned learner(s) or class group
- assigned date, suggested due date and availability window
- required/optional status
- permitted submission methods
- rubric or review checklist
- approved resource links from the class library
- accommodation or alternative format notes
- revision/version and creator metadata

Due dates should guide planning rather than automatically penalize learners. Teachers should be able to extend or waive a due date with an auditable reason.

## 4. Learner task experience
Learners can:
- see current and upcoming tasks for their enrolled classes
- open instructions and linked resources
- mark a task as started or request help
- save a draft response
- submit text, a worksheet or approved audio evidence when enabled
- report a technical issue or request an extension
- see teacher feedback and resubmit when allowed
- view their own task history

A learner's self-reported completion must be labeled clearly and must not appear as teacher verification. Do not require audio/video evidence for every task; provide text or in-person assessment alternatives.

## 5. Submission types and evidence
Possible submission methods:
- self-attestation/checklist for routine practice
- short text response
- worksheet upload
- oral recitation audio, only when the course enables it and appropriate consent/retention rules are in place
- teacher-observed in-person performance recorded by the teacher
- quiz or linked assessment result

For media submissions:
- explain who can access the recording and how long it is retained
- obtain required consent/assent before recording
- use private storage, scanning and short-lived authorized access
- prohibit public sharing by default
- provide deletion/withdrawal handling consistent with safeguarding and legal requirements
- avoid capturing unrelated people or background personal information

## 6. Submission lifecycle
Suggested states:
- not_started
- in_progress
- submitted
- returned_for_revision
- reviewed
- accepted
- needs_support
- excused
- cancelled

State changes must be explicit and auditable. Repeated submissions should create version history rather than silently overwrite the prior submission. Define which states are learner-controlled and which require teacher authorization. A learner cannot set a teacher-reviewed or verified state.

## 7. Teacher review and feedback
Teachers can:
- view submissions only for learners in currently assigned classes
- use skill-specific rubrics
- provide encouraging, actionable feedback
- request revision with a clear explanation
- mark work as reviewed, accepted or needing support
- record observed recitation/fluency assessments separately from self-reported practice
- add a private teacher note only where policy permits, with strict access controls
- correct a review with an audit reason

Feedback should focus on learning objectives and next steps. Avoid public ranking, humiliating comments or comparing learners. Religious-content answers should be reviewed by a qualified teacher; AI-generated feedback must not be treated as authoritative religious judgment.

## 8. Rubrics and progress records
Rubrics should be versioned and appropriate to the task. Example dimensions:
- accuracy
- fluency
- tajwid application
- memorization retention
- revision consistency
- understanding of vocabulary/translation
- quality of reflection
- completion of required steps

Use descriptive levels (for example: developing, progressing, achieved, further practice) with written criteria. Numeric grades may be supported where a course requires them, but should not be the sole measure. A rubric version must be retained with the review so later changes do not rewrite historical meaning.

Progress views must distinguish:
- learner self-report
- teacher-reviewed work
- teacher-observed performance
- verified mastery under an approved rubric

Do not infer mastery from a checkbox, submission count or elapsed time.

## 9. Parent/guardian visibility
- Guardian access is governed by a verified relationship and explicit data scope from the guardian portal design.
- A guardian may see a summary of assigned, submitted and teacher-reviewed tasks if the relevant scope is enabled.
- Do not expose private teacher notes, other learners' work or class discussion content.
- Optional media/audio evidence is not automatically visible to guardians solely because a link exists.
- Guardian notification preferences and quiet hours apply.
- Learner privacy and age-appropriate assent must be considered under the approved policy.

## 10. Reminders and workload management
- In-app reminders may show upcoming tasks and teacher updates.
- Support quiet hours, digest mode and per-category preferences.
- Teachers can pause or adjust workload during holidays, illness or exceptional circumstances.
- Avoid streak-loss warnings, guilt language, countdown pressure and public completion badges.
- Limit reminder frequency and prevent duplicate notifications.
- Notifications should not expose sensitive submission details in lock-screen previews.
- A missed due date should prompt supportive options, not automatic punishment.

## 11. Conceptual data model
Design only; reconcile with existing hifz assignments, completions, records, course and class structures before implementation. Avoid duplicate entities if existing tables can be safely extended:
- learning_assignments: course_id, class_id, lesson_id, title, instructions, objective, skill_dimension, task_type, level_band, required_state, created_by, available_from, suggested_due_at, status.
- assignment_targets: assignment_id, learner_id or enrollment_id, assigned_at, accommodation_reference, target_state.
- assignment_submissions: assignment_id, learner_id, submission_state, learner_note, submitted_at, current_version_id.
- submission_versions: submission_id, version_number, text_content or private_storage_key, media_type, checksum, scan_state, created_at.
- assignment_reviews: submission_version_id, reviewer_id, rubric_version_id, review_state, feedback, reviewed_at.
- rubric_definitions: course_id, task_type, version, criteria_definition, approved_by, published_at.
- rubric_scores: review_id, criterion_key, descriptive_level, optional_score, teacher_comment.
- assignment_extensions: assignment_id, learner_id, new_due_at, reason_code, approved_by.
- assignment_audit_events: actor_id, assignment_id, submission_id, action, reason_code, timestamp.

Do not store audio/video in public buckets or duplicate canonical Quran text in task records. Use references to approved resources and verse identifiers.

## 12. Authorization and data protection
- Learner reads and submits only their own assignments and submissions.
- Teacher reads/reviews only submissions for current assigned classes.
- A learner cannot alter reviewer identity, rubric version, teacher score, verified state or server timestamps.
- Guardian access is read-only and only for explicitly permitted fields of linked learners.
- Course managers can manage templates only within assigned scope.
- Admin operations are least-privilege and audited.
- Server derives actor identity from authenticated session and verifies enrollment, class assignment and assignment availability on every operation.
- RLS protects assignment and submission rows; server-side functions enforce state transitions and review permissions.
- Attachment authorization checks membership and submission state before issuing signed access.
- Role demotion, enrollment revocation and teacher reassignment must promptly update access.
- Do not expose private notes, media keys, other learners' submissions or answer keys through client queries.

## 13. Reliability and integrity
- Submission operations use idempotency keys to prevent duplicates on network retry.
- Server timestamps submission and review events.
- Preserve immutable submission versions and review audit history.
- Validate file size/type and scan media before teacher access.
- Apply per-learner quotas and rate limits without blocking reasonable accommodations.
- Support draft autosave with clear status and recovery after connection loss.
- Use stable pagination and avoid loading entire class submission history at once.
- Define backup, retention and deletion rules for student work.

## 14. Acceptance and security tests
1. Learner A cannot read or modify Learner B's assignment or submission.
2. Teacher cannot read or grade work outside currently assigned classes.
3. Guardian sees only permitted task summaries for verified linked learners.
4. Learner cannot set their submission to teacher-reviewed, accepted or verified.
5. Learner cannot alter reviewer identity, score, rubric version or server timestamps.
6. Duplicate network retries do not create duplicate submissions or reviews.
7. Resubmission creates a new version and preserves previous review history.
8. A teacher reassigned away from a class loses access promptly.
9. Enrollment revocation prevents new submissions and unauthorized reads according to policy.
10. Private media is inaccessible to anonymous and unrelated authenticated users.
11. Audio evidence requires the applicable consent/assent and retention controls.
12. Self-reported completion is never displayed as teacher-verified mastery.
13. Rubric changes do not alter historical review interpretation.
14. Due-date extension and excusal require authorized actor and audit reason.
15. Feedback is not publicly visible outside the learner and authorized staff.
16. No public leaderboard, punitive streak, or shame-based reminder is generated.
17. RTL, accessibility, low-bandwidth draft recovery and mobile upload flows are tested.
18. Lock-screen notifications do not reveal sensitive submission contents.
19. Qur'an verse references resolve to approved canonical text without mutation.
20. Data retention, correction and deletion requests follow approved policy.

## 15. Release sequence
1. Inventory current hifz assignment/completion/record tables and existing class/course authorization.
2. Decide whether existing hifz structures can be extended or a generic assignment model is justified.
3. Define task types, state transitions, rubric ownership and age/level guidance.
4. Prototype text-only tasks with synthetic learners and teachers.
5. Implement server-side authorization and immutable submission history before learner UI.
6. Add teacher review and descriptive rubrics.
7. Add media submissions only after consent, storage, scanning and retention review.
8. Add guardian summaries only after permission scopes are approved.
9. Pilot with one supervised class and review workload, accessibility and learner feedback.
10. Obtain explicit approval before any production schema change, migration or release.

## 16. Decisions required
- Should daily tasks be available to every course or only when a teacher enables them?
- Which task types are supported in the first release?
- Which rubric scales and grade display conventions should courses use?
- Can learners resubmit, and how many review cycles are allowed?
- Which media submission types are necessary, if any?
- What are media retention and consent requirements?
- Which task summaries may guardians see?
- What is the late/extension/excusal policy?
- Who can correct a review and how is an appeal handled?
- How should existing hifz assignment/completion structures integrate with the generic task workflow?

## 17. Status and safety
This is a design document only. No assignment, submission, review, rubric, notification, media upload, database table, RLS policy, RPC, trigger, storage bucket or live setting was created or changed. No learner records or personal data were accessed or modified. No migration, deployment, merge or release was performed.
