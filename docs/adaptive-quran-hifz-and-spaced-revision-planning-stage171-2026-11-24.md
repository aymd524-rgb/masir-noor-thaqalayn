# Stage 171 — Adaptive Qur'an Memorization and Spaced Revision Planning
Date: 2026-11-24
Status: design/documentation only. No scheduler, learner plan, database object, migration, notification or production setting implemented.

## 1. Objective
Design a flexible, teacher-supervised plan for new memorization (sabaq), recent review (sabqi), and cumulative revision (manzil). The planner should help learners retain what they have learned without imposing a rigid daily quota or treating algorithmic predictions as proof of mastery.

## 2. Core learning model
Keep three distinct learning streams:
- New memorization: a learner's next approved passage.
- Recent revision: recently learned passages requiring frequent retrieval practice.
- Cumulative revision: previously memorized passages revisited over longer intervals.

A plan may include recitation, listening, reading from the mushaf, translation or reflection as separate activities. Do not mark a passage mastered merely because a learner checked a task as complete.

## 3. Learner profile and baseline
A planning profile may include:
- current course, class and teacher
- learner-selected goals and preferred study days
- available study time range, without requiring exact surveillance
- current memorization boundary, recorded by surah and ayah
- teacher-assessed recitation and retention observations
- learner-reported confidence or difficulty
- accessibility needs and approved accommodations
- temporary pause, absence or reduced-workload periods

Only collect information needed to create a useful plan. Do not infer age, ability or religious commitment from activity volume. Allow the learner and authorized teacher to correct the baseline.

## 4. Planning inputs
The planner may consider:
- canonical surah/ayah boundaries and mushaf ordering
- new memorization targets approved by the teacher
- recent learner submissions and teacher assessments
- prior review dates and outcomes
- learner-reported difficulty and requests for help
- chosen study days, rest days and available time
- course pacing and teacher-set limits
- upcoming class recitation or assessment dates

Client-supplied completion events are not trusted as verified mastery. Teacher assessment and learner self-report remain separate evidence sources.

## 5. Daily plan composition
A daily plan may contain:
1. A manageable new passage, only if enabled by the teacher.
2. Recent revision of passages learned in the current learning period.
3. Cumulative revision of earlier passages.
4. Optional listening, translation or tadabbur activity.
5. A short reflection: easy, manageable, difficult, or need teacher support.

Each activity should include:
- surah and ayah range
- activity type (new/revision/recitation/listening/meaning)
- estimated effort band, not a strict timer
- suggested completion order
- approved recitation or learning-resource reference
- optional teacher instruction
- learner-friendly completion and help controls

The system should allow a day to contain revision only, no new memorization, or a reduced plan.

## 6. Spaced-revision policy
Use configurable review intervals as suggestions, not universal religious or pedagogical rules. A possible initial policy can schedule a newly learned passage for a short-interval review, then progressively longer intervals when the learner demonstrates stable recall. Exact intervals must be configurable by the course and teacher.

Review outcomes can be:
- fluent and stable
- recalled with prompts
- partially recalled
- needs guided practice
- learner reports difficulty
- not assessed

A difficult review can bring the next suggested review closer; a stable teacher-assessed review can lengthen the interval cautiously. Avoid large automatic jumps. The algorithm must explain why a passage appears in today's plan and allow teacher override.

## 7. Workload, rest and learner wellbeing
- No universal daily quota is imposed by the platform.
- Teachers set a reasonable upper bound appropriate to the course and learner level.
- Provide rest days and pause controls for illness, travel, exams or family circumstances.
- If a learner falls behind, reschedule gently rather than stacking all missed work onto the next day.
- Do not use streak loss, guilt language, public ranking or punitive notifications.
- Never encourage sleep reduction or excessive study.
- Let learners report that the plan is too difficult or too long.
- Support small, achievable passages and flexible pacing.

## 8. Teacher controls
Authorized teachers can:
- approve or pause new memorization
- define learner-specific or class-level target ranges
- set review policy and workload bounds
- adjust daily plans and explain changes
- assess recitation and retention with a rubric
- identify passages needing guided practice
- review progress trends and distinguish self-report from assessment
- temporarily reduce workload or excuse a period
- transfer learner plans when class/teacher assignment changes

Teacher controls are limited to currently assigned classes. Role demotion or class reassignment must promptly remove unauthorized access.

## 9. Learner controls
Learners can:
- view today's plan and upcoming reviews
- mark an activity started or self-reported complete
- report difficulty or ask for help
- request a smaller plan or pause
- see their own review history and teacher feedback
- choose among teacher-approved activity formats
- correct an obvious passage selection error by requesting teacher review

Learners cannot edit teacher assessment, verified mastery, scheduling policy or another learner's data.

## 10. Parent/guardian summary
Guardian views are optional and require a verified relationship plus explicit permission scope. Where enabled, show a limited summary such as planned activities, submitted activities and teacher-reviewed progress. Do not expose private teacher notes, recordings or detailed learning difficulties by default. Apply guardian notification preferences and quiet hours.

## 11. Qur'an text and recitation integrity
- Display canonical Uthmani text from the approved source, preserving orthography and diacritics.
- Use stable surah/ayah identifiers; never generate canonical Arabic text from model output.
- Validate all ranges against the canonical surah and ayah catalogue.
- Recitation audio must include source, reciter, riwaya and licensing metadata.
- Audio alignment is a learning aid and must not silently alter the displayed Qur'an text.
- Keep translation, tafsir, teacher commentary and learner notes clearly separated from Qur'an text.
- If a source or range is uncertain, flag it for editorial review rather than guessing.

## 12. Conceptual data model
Design only; inspect existing hifz structures before deciding whether to extend them:
- memorization_profiles: learner_id, course_id, class_id, current_boundary, preferences, approved_by, updated_at.
- memorization_targets: learner_id, surah_id, start_ayah, end_ayah, target_type, status, assigned_by.
- revision_items: learner_id, surah_id, start_ayah, end_ayah, learned_at, source_assessment_id.
- revision_schedule: learner_id, revision_item_id, suggested_due_at, interval_policy_version, scheduling_reason, status.
- revision_attempts: learner_id, revision_item_id, attempted_at, learner_report, teacher_assessment_id.
- planning_preferences: learner_id, study_days, rest_days, workload_band, pause_until.
- plan_snapshots: learner_id, plan_date, policy_version, generated_at, approved_by, snapshot_status.
- plan_activities: plan_snapshot_id, activity_type, surah_id, start_ayah, end_ayah, estimated_effort_band, resource_id.
- plan_overrides: plan_activity_id, actor_id, prior_value, new_value, reason_code, created_at.

Use references to existing enrollment, hifz records and approved resource-library objects where appropriate. Do not duplicate sensitive learner profile fields.

## 13. Scheduling and algorithm governance
- Start with a deterministic, explainable rules engine rather than opaque personalization.
- Store policy version and scheduling reason for reproducibility.
- Use teacher-approved limits and explicit learner preferences.
- Keep recommendations advisory; teacher and learner can review or override.
- Do not use unrelated personal data or sensitive profiling.
- Avoid inferring a learner's capability from missed days alone.
- Provide a safe fallback plan if scheduling data is incomplete.
- Prevent duplicate daily activities and overlapping ayah ranges unless intentionally assigned.
- Use the learner's course timezone for due dates and day boundaries.
- Recompute future suggestions without rewriting historical plan snapshots.

## 14. Authorization, privacy and audit
- Learner reads own plan, preferences and history.
- Teacher reads and edits plans only for currently assigned learners.
- Guardian reads only explicitly permitted summaries.
- Admin access is least-privilege and audited.
- Server validates actor, enrollment, class assignment, ayah boundaries and state transitions.
- RLS protects all learner-specific records; client filtering is not an authorization boundary.
- Teacher overrides, target changes, assessment changes and pause/resume actions create audit events.
- Never expose another learner's schedule or assessment through search, exports or notifications.
- Use minimal retention for obsolete plan snapshots and any optional media.

## 15. Reliability and accessibility
- Generate plans idempotently for learner/date/policy version.
- Preserve a stable snapshot if the learner opens the plan offline.
- Queue offline self-report actions safely and reconcile on reconnect.
- Resolve conflicts without overwriting teacher assessments.
- Support screen readers, scalable text, RTL layout and low-bandwidth access.
- Provide non-audio alternatives and avoid requiring microphone access.
- Paginate history and avoid loading all revision records at once.

## 16. Acceptance and security tests
1. Learner A cannot read or alter Learner B's plan or revision history.
2. Teacher outside the assigned class cannot view or change learner targets.
3. Guardian sees only approved summary fields for a verified linked learner.
4. Learner self-report never becomes teacher-verified mastery automatically.
5. Invalid surah/ayah ranges are rejected server-side.
6. Overlapping or duplicate plan activities are detected or explicitly justified.
7. Repeated generation for the same date/policy is idempotent.
8. Teacher overrides are attributed and auditable.
9. Role demotion and class reassignment revoke access promptly.
10. Pause and rest-day settings prevent inappropriate workload accumulation.
11. Missed tasks are rescheduled without punitive stacking or streak-loss pressure.
12. Historical plan snapshots retain their original policy version.
13. Client-supplied timestamps, scores or reviewer identities cannot override server values.
14. Canonical Uthmani text remains unchanged when plans are generated.
15. Audio resource references enforce licensing and private access rules.
16. Offline retries do not duplicate attempts or overwrite teacher reviews.
17. Notifications respect quiet hours and do not expose sensitive learning details.
18. Accessibility and low-bandwidth flows work on mobile devices.

## 17. Rollout sequence
1. Inventory existing hifz assignments, completions, teacher records and Uthmani verse catalogue.
2. Decide whether existing hifz tables can support revision scheduling without duplication.
3. Approve task definitions, workload policy and teacher override rules.
4. Prototype a deterministic planner with synthetic learners and sample passages.
5. Validate the suggested intervals with qualified Qur'an educators.
6. Test RLS, role changes, guardian scopes and offline retry behavior.
7. Pilot in one supervised class with teacher review of every suggested plan.
8. Collect learner/teacher feedback and adjust policy before broader rollout.
9. Obtain explicit approval before any schema migration, production setting or release.

## 18. Decisions required
- Which memorization/revision terminology and workflow should the course use?
- Who approves the initial memorization boundary?
- Which configurable review intervals are appropriate for each course level?
- What workload limits and rest-day defaults should apply?
- Can learners request a reduced plan directly, or should teacher approval be required?
- Which teacher assessment rubric should influence suggested intervals?
- Should guardian summaries be enabled by default or opt-in only?
- How should existing hifz assignments, completions and teacher records map into the planner?

## 19. Status and safety
This document records a proposed design only. No scheduler, algorithm, learner plan, database table, migration, RLS policy, RPC, trigger, notification, storage object or production setting was created or changed. No learner data was accessed or modified. No merge, deployment or release was performed.
