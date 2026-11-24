# Stage 160 — Question Bank, Assessments, and Quran Learning Report Card
Date: 2026-11-24
Status: design/documentation only. No runtime feature or database change is implemented by this document.

## 1. Purpose
Specify an assessment system that supports learning and constructive feedback across Quran reading, memorization, revision, translation and understanding. Assessments should guide instruction, not shame learners or reduce Quran learning to a single score.

## 2. Assessment types
- Reading fluency: teacher-selected short passage and a transparent rubric.
- Memorization: learner-selected or assigned passage, assessed by an authorized teacher.
- Revision: retrieval of previously learned passages, with clear distinction between practice and formal assessment.
- Tajwid: selected taught rules assessed with observable criteria.
- Vocabulary/translation: questions based on an approved translation and learning level.
- Understanding/tadabbur: age-appropriate short response evaluated with a rubric that accepts reasoned answers and does not imply one educator's reflection is canonical tafsir.
- Hadith/content knowledge: only from approved, source-attributed materials and with authenticity labels where verified.

Do not use automated voice recognition or AI grading as an authoritative Quran recitation/tajwid assessor without a separately approved validation, consent, bias, and human-review process. Initial design assumes teacher assessment for recitation.

## 3. Question bank design
Conceptual fields:
- question_id, content_version, subject, skill_dimension, age_band, learning_level.
- question_type: multiple_choice, true_false, short_text, matching, oral_teacher_assessed, passage_reference.
- prompt, options, correct_answer or scoring_rubric, explanation, source_reference.
- difficulty_label, learning_objective, tags, status, author_id, reviewer_id, created_at, reviewed_at.
- publication_state and license/provenance for any external content or media.

Question content must be reviewed before publication. Keep answer keys and unpublished questions inaccessible to learners. Do not embed answer keys in public page payloads or rely on client-side hiding. Avoid ambiguous distractors, trick questions, sectarian or age-inappropriate content, and questions that reward memorizing unverified claims.

## 4. Assessment creation and delivery
Teachers/admins with explicit permissions can create an assessment from approved questions or a teacher-reviewed passage/rubric. Specify:
- learning objective and skill dimensions;
- target age/learning level;
- allowed attempts and time expectations (avoid unnecessary time pressure);
- availability window and accommodations;
- scoring rubric and feedback release policy;
- whether the result is formative practice or a formal teacher assessment.

Learner view should present clear instructions, progress and save state. Confirm before final submission. Support interruption/recovery where safe. Never disclose correct answers before the configured release point.

## 5. Scoring and result semantics
- Objective question scoring may be computed server-side using the stored question version and answer key.
- Short text and reflection require a teacher rubric; do not claim a single objectively correct answer where multiple reasoned responses are acceptable.
- Oral recitation and tajwid remain teacher-assessed in this initial plan.
- Preserve raw response, assessment version, scoring rule version and result provenance according to retention policy.
- A percentage score is not a measure of Quran mastery or religious worth.
- Separate practice feedback, teacher assessment and verified mastery. Mastery must not be inferred from a single quiz.
- Regrading creates an auditable revision with actor, reason and timestamp; do not silently overwrite a released result.

## 6. Report card
A learner-facing report should show:
- skill dimensions separately: reading, tajwid, memorization, revision, translation and understanding;
- latest teacher-assessed result and assessment date;
- progress across comparable rubric versions only;
- strengths and one or two constructive next steps;
- assignments completed vs self-reported, clearly labeled;
- teacher feedback with privacy-aware visibility.

Do not show public leaderboards, class rank, comparisons with named peers, or punitive streaks. Teachers see only currently assigned learners and only data needed for instruction. Admin aggregate reports should minimize personally identifiable details and restrict drill-down by purpose.

## 7. Conceptual data model
Logical design only; map to the existing schema before proposing migrations:
- assessment_blueprints: owner, title, objective, target_level, state, release_policy.
- question_bank_items: versioned question content, rubric, answer key, provenance, review state.
- assessment_questions: blueprint/question version, order, points or rubric weight.
- learner_assessment_attempts: learner_id, assessment_version, status, started_at, submitted_at.
- learner_responses: attempt_id, question_version, response payload with strict size/type limits.
- assessment_results: attempt_id, score where appropriate, scoring_version, status, released_at.
- teacher_assessments: learner_id, skill_dimension, rubric_version, result, feedback, assessed_by, assessed_at.
- result_revision_events: result_id, prior_version, new_version, actor, reason, timestamp.
- report_snapshots (optional): generated_at, period, authorized scope, data freshness.

Do not duplicate existing quiz or hifz tables without a schema reconciliation. Do not store answer keys in learner-readable tables or client bundles. Avoid collecting unnecessary audio or free-form personal data.

## 8. Authorization and server-side integrity
- Learners can create/read only their own attempts and permitted released results.
- Teachers must have both current teacher role and current class assignment for every read/write.
- Admin privileges must be server-verified, least-privilege and audited.
- Client-supplied learner_id, assessor_id, role, score, correctness, submitted_at, release status or mastery status are not authoritative.
- Derive actor identity from authenticated server context; validate assessment publication and learner eligibility on the server.
- Enforce attempt limits, status transitions, answer shape/size, and idempotent submission on the server if product policy requires them.
- Protect answer keys and unpublished questions from anon/authenticated learner access.
- A role demotion or class reassignment must revoke access immediately according to the approved authorization policy.

## 9. Security and privacy test matrix
1. Anonymous user cannot read private questions, answer keys, attempts or results.
2. Learner cannot read another learner's attempt/result by changing IDs.
3. Learner cannot submit a forged score, correctness flag, assessor identity or mastery status.
4. Teacher without current class assignment cannot read or grade the learner.
5. Demoted teacher cannot continue grading through stale assignments or cached sessions.
6. Unpublished or retired question versions are not delivered to learners.
7. A client cannot alter the question/answer-key version after an attempt begins.
8. Repeated submit requests do not create duplicate attempts or inconsistent scores.
9. Released result corrections retain a traceable audit history.
10. Teacher reflection grading uses an approved rubric and supports reasoned responses.
11. Report cards never expose peer names or private notes.
12. Export, analytics and logs exclude secrets, tokens, answer keys, unnecessary contact data and sensitive notes.

## 10. Accessibility and child-safe assessment
Use readable instructions, RTL-safe Quran display, keyboard and screen-reader support, flexible timing and reasonable breaks. Provide accommodations and a teacher-supported alternative. Avoid anxiety-inducing countdowns, shame language, public scores and excessive repeated testing. Explain to learners what is assessed and who can see the result.

## 11. Delivery sequence
1. Inventory existing quiz schema, RPCs, RLS, grants and UI before adding anything.
2. Approve learning objectives, question types and rubrics with educators.
3. Define content provenance, editorial review and versioning.
4. Confirm role-demotion and class-assignment authorization gaps are fixed and tested.
5. Build with synthetic data in a non-production branch.
6. Validate server-side scoring, answer-key isolation, idempotency and audit.
7. Pilot with teacher supervision and age-appropriate feedback.
8. Review accessibility, privacy, retention and child-safety before release.
9. Obtain explicit approval before migrations, production changes or deployment.

## 12. Decisions required
- Which age bands and curriculum levels will each assessment support?
- Which assessment types are formative vs formal?
- Who can author, review, publish, retire and regrade questions?
- Which rubric versions are approved for reading, tajwid, memorization and reflection?
- What are attempt limits, feedback timing and score release rules?
- What evidence is retained, for how long, and who may access it?
- Are exports needed, and what safeguards and purposes are required?
- Which existing quiz tables/RPCs are the canonical source of truth?

## 13. Status and safety
This is a proposal only. No code, routes, schema, RLS policies, grants, functions, triggers, storage, quiz content or production settings were changed. No live learner data was accessed or altered. No migration, deployment, merge or release was performed. The rubric and report-card semantics require educator and privacy review before implementation.
