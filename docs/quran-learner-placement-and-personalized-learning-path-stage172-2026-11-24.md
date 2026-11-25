# Stage 172 — Qur'an Learner Placement and Personalized Learning Path
Date: 2026-11-24
Status: design/documentation only. No placement test, learner profile, pathway engine, database object, migration, UI or production setting implemented.

## 1. Purpose
Design a fair, supportive process for understanding a learner's current Qur'an learning level and proposing a suitable path. The system should guide learning in reading, fluency, tajwid, memorization, revision, translation and tadabbur without labeling learners negatively or assuming that one score captures their ability.

## 2. Guiding principles
- Placement is a starting estimate, not a permanent label or judgment of a learner.
- Learners may begin at different points in different skills.
- Assessments should be age-appropriate, short, accessible and low-pressure.
- A learner may skip a question, request help or ask for a teacher-led assessment.
- Separate learner self-report, automated objective results and teacher-observed performance.
- Do not infer ability from age, school grade, name, location, device or activity volume.
- Avoid public rankings, shame-based labels and high-stakes placement cutoffs.
- Allow reassessment and teacher correction without losing the previous history.

## 3. Onboarding and consent
The onboarding flow may include:
1. Welcome and explanation of how placement works.
2. Choose a learning goal (reading, fluency, tajwid, hifz, revision, meaning or a combination).
3. Ask for prior learning only as optional context.
4. Explain what information is collected and who can see it.
5. Obtain required guardian consent where applicable, with age-appropriate learner assent.
6. Offer a self-guided sample or teacher-led placement.
7. Show a provisional learning path and allow the learner to ask for changes.

Do not block access to general public learning content because a learner has not completed placement.

## 4. Skill dimensions
Maintain independent indicators for:
- Arabic letter recognition and articulation awareness
- connected reading and fluency
- common reading rules and stopping/starting awareness
- tajwid knowledge and observed application
- memorization recall
- revision retention
- vocabulary and translation comprehension
- reflection/tadabbur participation

The dimensions are not interchangeable. Strong memorization does not imply strong fluency; a reading result does not prove comprehension.

## 5. Placement methods
Possible methods:
- short multiple-choice knowledge checks for terminology or concepts
- selected reading passages with teacher observation
- optional learner self-description of confidence and goals
- teacher-reviewed recitation in class
- short memorization/revision recall activity
- translation or vocabulary questions with approved content

Automated scoring should be limited to objective items with reviewed answer keys. Pronunciation, fluency, tajwid application and recitation quality should not be scored by an unvalidated speech model. If audio is offered, it must be optional, consented, private and have a non-recording alternative.

## 6. Provisional levels and descriptors
Use skill-specific descriptive bands rather than one global rank. Example:
- Starting: needs guided introduction and supported practice.
- Developing: can complete parts with prompts or examples.
- Progressing: performs familiar tasks with increasing independence.
- Confident: performs the defined skill reliably in familiar contexts.
- Teacher review: evidence is insufficient, mixed or needs direct observation.

These labels describe current evidence for a particular skill only. They must not appear as a judgment of intelligence, religious worth or general capability. Course teams must approve descriptors and examples before use.

## 7. Learning path generation
A proposed path may combine:
- recommended starting module
- short-term learning objective
- approved lessons and resources
- practice activities
- review tasks and optional assessments
- teacher check-in points
- next-step criteria
- flexible pacing and rest options

The path should explain why each module is recommended and what evidence can demonstrate progress. It should be rules-based and explainable in the initial release, with teacher override and learner feedback. Do not use opaque or sensitive profiling.

## 8. Pathway examples
Illustrative only; not fixed prerequisites:
- Reading pathway: letter recognition → connected reading → fluency practice → stopping/starting awareness.
- Tajwid pathway: foundational concepts → focused rule practice → teacher-observed application during recitation.
- Hifz pathway: baseline review → manageable new memorization → recent revision → cumulative revision.
- Meaning pathway: vocabulary → approved translation → guided reflection with age-appropriate questions.

A learner may follow multiple pathways at once, with workload limits and teacher guidance.

## 9. Reassessment and progression
- Reassess when a learner or teacher requests it, after a learning milestone, or when evidence is outdated.
- Avoid frequent testing that interrupts learning.
- Use multiple evidence points for meaningful progression.
- Keep prior placement results and their rubric/version.
- Allow teacher override with reason and audit record.
- A lower result on one task should not automatically downgrade the learner's entire path.
- A learner may revisit earlier lessons without penalty.
- Show progress as skill-specific development, not a competitive score.

## 10. Teacher workspace
Authorized teachers may:
- review provisional placement evidence for assigned learners
- conduct or record teacher-led observations
- correct a skill descriptor with reason
- assign an appropriate pathway or module
- set workload and pacing boundaries
- add private instructional notes under a defined policy
- request reassessment or refer a learner for additional support
- compare current evidence with the learner's own previous evidence

Teachers cannot see unrelated classes or change another teacher's assessment without an authorized correction workflow.

## 11. Learner and guardian views
Learners see:
- their own goals and skill-specific learning path
- a plain-language explanation of recommended next steps
- completed and upcoming modules
- teacher feedback and ways to ask for help
- controls to request a slower pace or a different learning goal

Guardians, where a verified relationship and explicit permission scope exist, may see a limited progress summary and upcoming learning goals. Do not expose private teacher notes, other learners' results or optional audio evidence by default.

## 12. Content and source governance
- Placement questions must be mapped to approved learning objectives.
- Qur'an excerpts must use canonical Uthmani text and verified surah/ayah identifiers.
- Translation, tafsir, hadith, teacher commentary and generated explanations remain separate content types.
- Each question has source, author/reviewer, rubric, version, license and publication status.
- Hadith-related questions include source and authenticity metadata reviewed by qualified editors.
- Avoid disputed religious rulings in automated placement questions.
- Withdraw or correct flawed questions without rewriting historical attempts.

## 13. Conceptual data model
Design only; reuse existing learner, enrollment, course and assessment entities where appropriate:
- placement_sessions: learner_id, course_id, method, status, consent_reference, started_at, completed_at.
- placement_items: session_id, question_or_observation_id, skill_dimension, response_reference, result_type.
- placement_assessments: learner_id, skill_dimension, descriptor, evidence_summary, assessor_id, rubric_version, assessed_at.
- learning_goals: learner_id, goal_type, priority, selected_at, status.
- pathway_templates: course_id, skill_dimension, version, approved_by, publication_state.
- pathway_modules: template_id, module_key, prerequisites, objectives, resource_references, progression_criteria.
- learner_pathways: learner_id, template_version, status, assigned_by, start_date, review_date.
- learner_pathway_steps: pathway_id, module_id, status, target_window, completion_evidence_reference.
- placement_corrections: assessment_id, actor_id, previous_value, corrected_value, reason, created_at.

Do not duplicate profile contact details or store unnecessary sensitive information in assessment payloads.

## 14. Privacy, authorization and safeguarding
- Learner reads only own placement and pathway records.
- Teacher accesses only learners in currently assigned classes.
- Guardian access is limited to explicitly permitted summaries.
- Admin access is least-privilege and audited.
- Verify consent/assent before collecting optional recordings or sensitive evidence.
- Do not require microphone, camera or location access for basic placement.
- Provide deletion/retention policy for recordings and assessment evidence.
- RLS is the authorization boundary; client filtering is not sufficient.
- Server validates session ownership, enrollment, assessor scope and state transitions.
- Role demotion and class reassignment revoke access promptly.
- Notifications avoid sensitive scores or labels in previews.

## 15. Accessibility and fairness
- Mobile-first RTL design with keyboard and screen-reader support.
- Provide text-based and teacher-led alternatives to audio tasks.
- Support low-bandwidth access and save-and-resume.
- Use clear instructions and examples; avoid trick questions.
- Validate that questions do not disadvantage learners due to dialect, disability or unfamiliar device controls.
- Review assessment bias across age bands and learning contexts.
- Offer accommodations without publicly identifying the learner.
- Do not penalize spelling or typing where the target skill is oral recitation.

## 16. Acceptance and security tests
1. Learner A cannot read or modify Learner B's placement or pathway.
2. Teacher cannot view or alter learners outside currently assigned classes.
3. Guardian sees only explicitly permitted summaries for verified linked learners.
4. Learner can access public learning content without completing placement.
5. Skipped or incomplete assessment produces an uncertain/provisional result, not a fabricated level.
6. A single low score does not downgrade unrelated skill dimensions.
7. Teacher correction records actor, reason and previous assessment.
8. Reassessment preserves historical rubric and prior result.
9. Client cannot set assessor identity, verified status or server timestamp.
10. Invalid or unapproved question content cannot enter a published assessment.
11. Audio collection is optional and respects consent and retention policy.
12. No microphone/camera/location permission is required for basic placement.
13. Canonical Uthmani text and verse references remain unchanged.
14. Role demotion and class reassignment revoke access promptly.
15. RTL, accessibility, low-bandwidth and save/resume paths are tested.
16. Notifications do not expose private scores or stigmatizing labels.
17. Skill-specific evidence is not combined into a misleading single rank.
18. Teacher override and pathway change events are auditable.

## 17. Rollout sequence
1. Inventory current onboarding, assessment, course and learner profile structures.
2. Approve skill dimensions, descriptors and placement rubrics with Qur'an educators.
3. Build a question/content review process before creating a question bank.
4. Prototype with synthetic learners across varied skill profiles.
5. Validate that the recommended path is explainable and not over-prescriptive.
6. Test accessibility, privacy, guardian scopes and role-based access.
7. Pilot with teacher-led review and no automated high-stakes decisions.
8. Collect feedback and adjust descriptors and pacing.
9. Obtain explicit approval before any schema change, production setting or release.

## 18. Decisions required
- Which skill dimensions are required for the first placement experience?
- Should initial placement be self-guided, teacher-led or offer both?
- Which descriptive bands and criteria should be approved?
- Which assessments may be automatically scored?
- What evidence is needed before a learner advances to the next module?
- Who approves and versions pathway templates?
- Which guardian summary fields are permitted?
- What are the consent and retention rules for optional recordings?
- How often may placement be repeated without over-testing learners?

## 19. Status and safety
This is a design document only. No placement test, learner score, pathway engine, profile field, database table, migration, RLS policy, RPC, trigger, UI, recording workflow or production setting was created or changed. No learner data was accessed or modified. No merge, deployment or release was performed.
