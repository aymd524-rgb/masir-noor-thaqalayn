# Stage 159 — Student Onboarding, Placement, and Personalized Learning Path
Date: 2026-11-24
Status: product/technical design only; no application or database implementation.

## 1. Goals
Define a safe, understandable first-run journey that identifies a learner's learning needs and proposes an adjustable Quran learning path. Placement is instructional guidance, not a judgment of ability, faith, intelligence, or worth. A learner may skip nonessential questions and request teacher support.

## 2. Onboarding journey
1. Welcome: explain the program, age-appropriate learning options, privacy basics and how to get help.
2. Account: authenticate using approved methods; collect only the minimum required profile fields.
3. Learner profile: choose preferred display name, language, education/learning level and preferred learning days. Avoid collecting exact birth date unless there is a documented need; use broad age bands where sufficient.
4. Learning goals: choose among starting Arabic reading, improving fluency, memorization, revision, translation, reflection, or a combination.
5. Prior learning: optional self-description of reading and memorization experience. Do not request public proof or compare learners.
6. Short placement: a teacher-reviewed, low-pressure reading/recall check with clear consent and the option to complete it with a teacher. No recording by default.
7. Suggested path: show a provisional plan, explain why it was suggested, and let the learner/authorized guardian or teacher adjust it according to approved policy.
8. First task: provide one clear, manageable activity and explain how to submit it.
9. Revisit: allow changes to goals and availability without losing historical assessment records.

## 3. Placement principles
- Separate reading fluency, tajwid/pronunciation, memorization, revision habits, translation familiarity and reflection; do not collapse them into one score.
- Use transparent criteria and age-appropriate language.
- Distinguish self-reported experience, automated checks (if ever approved), teacher assessment and verified mastery.
- A placement result is provisional and includes date, assessor/source, rubric version and confidence/limitations.
- Never infer religious commitment, family circumstances, disability, or personal traits from a placement result.
- Do not use facial recognition, voice identity, emotion detection or automated high-stakes profiling.
- Any audio submission is optional, purpose-limited, access-restricted and governed by explicit retention/deletion policy.

## 4. Assessment rubric (illustrative; requires educator approval)
| Dimension | Evidence | Possible teacher labels |
|---|---|---|
| Arabic reading | Short age-appropriate passage read with teacher | Starting / Developing / Independent |
| Fluency | Continuity and confidence over a short passage | Needs support / Progressing / Consistent |
| Tajwid | Selected, taught rules in the sample | Not yet assessed / Practicing / Demonstrated |
| Memorization | Learner-selected familiar passage | New / In progress / Teacher assessed |
| Revision | Ability to recall previously learned material | Needs guided review / Regular review |
| Translation | Explain a familiar word or simple meaning | Beginning / Developing / Confident |
| Reflection | Respond to a simple age-appropriate prompt | Participation / Developing / Thoughtful response |

The labels are formative and must not be treated as standardized grades. Define observable criteria, assessor guidance and accommodations before use. A learner can have different levels across dimensions.

## 5. Personalized path generation
Inputs may include approved learning goals, available study days, session duration preference, teacher assessment dimensions, current assigned material and learner-selected pace. Do not use sensitive personal data or engagement surveillance.

Path components:
- New memorization: a configurable target selected by learner/teacher, not a universal quota.
- Recent revision: review of recently learned passages.
- Spaced revision: suggested intervals that teachers can configure and override; scheduling is a prompt, not a claim of cognitive certainty.
- Reading/fluency practice: optional short practice appropriate to assessed level.
- Translation and reflection: age-appropriate, source-reviewed activities.
- Rest/flexibility: missed days should reschedule gently; no punitive streak loss or shame messaging.

The system must not auto-assign an excessive workload. Provide a weekly overview and a simple next action. Teachers can adjust the plan with a recorded reason when needed.

## 6. Progress states and provenance
Keep distinct records for:
- learner intention/goal;
- assigned target;
- learner-submitted completion;
- teacher assessment;
- verified mastery (only if a formally approved rubric and workflow exist).

Every assessment record should include subject/dimension, result, assessor identity from the authenticated server context, timestamp, rubric/version and optional concise feedback. Corrections should create a traceable revision rather than silently overwriting the historical record. Never let a client supply the authoritative assessor ID or verified status.

## 7. Conceptual data model
This is a logical model, not a migration specification:
- learner_preferences: learner_id, language, preferred_days, optional session_length, updated_at.
- learning_goals: learner_id, goal_type, priority, status, created_at.
- placement_sessions: learner_id, rubric_version, status, assessor_id, assessed_at, summary.
- placement_observations: session_id, dimension, observed_level, evidence_reference, assessor_note.
- learning_paths: learner_id, version, status, created_by, created_at, reviewed_at.
- learning_path_items: path_id, activity_type, content_reference, target_range, due_date, sequence.
- learner_submissions: learner_id, path_item_id, self_reported_status, submitted_at.
- teacher_assessments: learner_id, submission_id, dimension, result, rubric_version, assessed_by, assessed_at.
- path_change_events: path_id, actor_id, change_reason, timestamp, minimal_change_summary.

Before implementation, map these concepts to the actual schema and avoid duplicate sources of truth. Enforce foreign keys, constraints, server-side actor identity, and transactional consistency.

## 8. Authorization and privacy
- Learners can view/update only permitted fields in their own preferences and goals.
- Learners cannot assign themselves a teacher/admin role, set teacher assessment outcomes, or mark mastery as verified.
- Teachers can view and assess only learners in currently assigned classes, with current teacher role checked on every operation.
- Admin access must be explicit, least-privilege and audited.
- Guardians, if supported, require a verified relationship model and clearly scoped permissions; do not infer relationships from matching names or contact details.
- Restrict access to any audio or sensitive assessment evidence; avoid public URLs.
- Do not expose placement results in public leaderboards or searchable profiles.
- Define retention, deletion, correction and export policy before collecting optional evidence.

## 9. Accessibility and inclusion
Offer accessible instructions, adjustable text size, keyboard navigation, RTL-safe Arabic display, screen-reader labels and reasonable time flexibility. Provide an alternative to audio or timed tasks where appropriate. Use supportive feedback and avoid labeling learners as weak or behind.

## 10. Acceptance and abuse-case tests
1. A new learner cannot set a privileged role through signup metadata or direct API calls.
2. A learner cannot read another learner's goals, placement or assessment records by changing identifiers.
3. A teacher without a current class assignment cannot view or assess that learner.
4. A demoted teacher loses teacher-only access even if an old assignment remains.
5. Learner self-report never writes teacher assessment or verified mastery fields.
6. The client cannot forge assessor identity, timestamp or rubric version where server authority is required.
7. Optional audio is not captured or retained without explicit approved consent and policy.
8. A learner can skip optional onboarding questions and still access an appropriate starting experience.
9. A plan can be adjusted without deleting the original assessment history.
10. Inactivity or missed days does not trigger shaming, public ranking or excessive catch-up workload.
11. RTL, screen-reader and keyboard checks pass for onboarding and placement.
12. Logs contain no audio, unnecessary notes, contact data, credentials or session tokens.

## 11. Release sequence
1. Educators approve the dimensions, rubric and age-appropriate wording.
2. Product/privacy owners approve minimum data, guardian model, retention and consent.
3. Map the logical model to the live schema and verify RLS/grants before any migration proposal.
4. Build onboarding and preferences in a feature branch with synthetic data.
5. Add placement workflow with teacher authorization and audit.
6. Add path suggestions as editable recommendations, not automatic high-stakes decisions.
7. Run negative role, privacy, accessibility and child-safety tests in staging.
8. Obtain explicit approval before production changes, data collection or release.

## 12. Decisions required
- Which learner age bands and education levels should be supported?
- Which reading, tajwid, memorization and revision rubrics will the educators approve?
- Is placement teacher-led, self-guided, or both?
- Are guardian accounts in scope, and what verification is required?
- Which data fields are genuinely necessary at signup?
- Are audio submissions required at all? If optional, what retention and deletion rules apply?
- Which default review intervals and daily/weekly target ranges are pedagogically approved?
- Who may change an assigned learning path and what audit reason is required?

## 13. Implementation status and safety
This document records a proposed workflow only. It does not add routes, forms, scoring logic, tables, RLS, functions, triggers, storage objects or content. No live Supabase changes, migrations, Auth settings, deployment, merge or release were performed. Do not treat the illustrative rubric or schedule as approved curriculum until educators review it.
