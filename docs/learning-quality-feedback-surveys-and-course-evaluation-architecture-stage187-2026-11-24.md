# Stage 187 — Learning Quality Feedback, Surveys, and Course Evaluation Architecture

**Date:** 2026-11-24  
**Status:** Design specification only  
**Related stages:** 157, 158, 161, 163, 167, 176, 183, 184, and 186.

## 1. Purpose

Design a role-aware feedback and evaluation system that helps improve teaching quality, course design, learner experience, accessibility, and institutional operations. Feedback must be constructive, proportionate, privacy-preserving, and connected to a documented improvement process.

This system is not a public popularity contest, a mechanism for pressuring teachers or learners, or an automated judgment of a person's worth or competence. It does not replace formal academic supervision, safeguarding procedures, employment processes, or a direct support request.

## 2. Feedback channels and audience

Provide distinct feedback channels for:
- learners: clarity of lessons, pace, workload, learning resources, accessibility, and perceived progress;
- guardians: communication, schedule clarity, learner support, and course organization within their verified relationship and consent scope;
- teachers: curriculum fit, class resources, scheduling, learner support needs, and platform usability;
- institution administrators and academic supervisors: program quality, operational bottlenecks, and aggregate educational outcomes;
- platform users: general usability, accessibility, and technical experience.

A user may submit a general suggestion without being enrolled in a course. Course-specific evaluation should require a verified relationship to that course or cohort.

## 3. Survey types

Supported survey templates may include:
1. Short lesson pulse survey.
2. End-of-course evaluation.
3. Periodic learner experience survey.
4. Guardian communication and support survey.
5. Teacher resource and platform workflow survey.
6. Institution program review.
7. Accessibility and inclusion feedback.
8. Post-competition or event experience survey.
9. Open suggestion and feature request.

Each template must state its purpose, intended audience, estimated completion time, whether responses are anonymous or confidential, who can see results, and how long responses are retained. Avoid repeatedly surveying learners or interrupting core learning.

## 4. Question design and response types

Question formats may include:
- single choice and multiple choice;
- a clearly labelled rating scale with neutral midpoint where appropriate;
- optional short text;
- optional structured suggestion category;
- "not applicable" and "prefer not to answer" choices.

Questions should be neutral, age-appropriate, accessible, and limited to the stated purpose. Avoid leading questions, shame-based wording, religious piety scoring, sensitive demographic questions without a justified need, and questions that ask children to disclose private family circumstances.

Do not infer a teacher's quality from a single rating or a learner's motivation from survey completion. Provide an option to skip optional questions.

## 5. Anonymous, confidential, and attributed feedback

These modes must be clearly distinguished:
- **Anonymous:** the response is not linked to a user identity in the survey response dataset. Operational metadata must not be retained in a way that trivially re-identifies the respondent.
- **Confidential:** identity is known to a restricted authorized reviewer but is not shown to the subject of the feedback or ordinary viewers.
- **Attributed:** the response is associated with the submitter and visible only to the explicitly stated audience.

Do not label a survey anonymous if account IDs, exact timestamps, small cohorts, or metadata make re-identification reasonably easy. For minors, default to privacy-protective settings and age-appropriate explanations. Guardian visibility must not be assumed for every response; it must follow applicable policy, safety exceptions, and the consent/relationship model.

## 6. Survey lifecycle and governance

Suggested lifecycle:
- draft;
- academic_review;
- safeguarding_privacy_review (when required);
- scheduled;
- open;
- paused;
- closed;
- analysis_ready;
- archived.

Survey owners must define audience, scope, question version, opening and closing dates, response limits, publication rules, and retention before launch. Material changes after launch should create a new version or be clearly recorded; do not silently rewrite questions after responses have been collected.

Sensitive surveys require review by an authorized privacy or safeguarding function. A survey cannot be used to solicit reports that belong in the restricted safeguarding process described in Stage 186.

## 7. Access and tenant boundaries

- Learners may respond only to surveys available to them and see only their own submitted responses where the survey design permits review.
- Guardians may respond only for surveys explicitly addressed to verified guardians and within the relevant relationship scope.
- Teachers may create or view surveys only for authorized classes and assigned educational purposes.
- Academic supervisors may review class/course aggregates within their institution or branch scope.
- Institution administrators may view institution-level reports and authorized operational feedback, not another institution's responses.
- Platform operators may manage global templates and platform-level aggregates under least privilege.
- Survey analysts should receive de-identified or aggregated datasets by default, not raw identity-linked response exports.

Every survey read, response submission, edit, export, and result publication must be authorized server-side. Client-side filters are not an access-control boundary.

## 8. Results, thresholds, and interpretation

Report:
- eligible audience size;
- number of invitations and valid responses;
- response rate with denominator;
- question-level distributions;
- carefully summarized themes from optional text;
- comparison across periods only when survey versions and populations are sufficiently comparable.

Apply minimum cohort thresholds and suppression to prevent identification in small classes or groups. Do not expose raw individual ratings or comments to a teacher or manager when the survey promised anonymity or confidentiality.

Avoid misleading averages without showing response counts and scale definitions. Do not treat non-response as satisfaction or dissatisfaction. Separate self-reported experience from verified educational outcomes such as teacher-assessed reading or memorization progress.

## 9. Free-text moderation and safe handling

Open comments may contain personal data, allegations, abuse disclosures, contact information, or offensive content. Therefore:
- warn respondents not to include passwords, phone numbers, addresses, or unnecessary personal details;
- apply restricted moderation before sharing comments with a broader audience;
- redact personal data and identifying details where appropriate;
- route safety concerns to the Stage 186 safeguarding process through a restricted, reviewed handoff;
- do not automatically forward an allegation to the person named in it;
- preserve original evidence only where necessary and under approved retention/access policy;
- do not use automated classifiers as the sole basis for dismissing a report or making disciplinary findings.

Summaries should preserve the meaning of feedback and distinguish direct quotes, paraphrases, and reviewer interpretation.

## 10. Improvement and action tracking

Feedback should lead to a visible, accountable improvement cycle:
1. collect feedback;
2. validate response quality and privacy thresholds;
3. identify themes and limitations;
4. assign an authorized owner;
5. create an improvement action;
6. set a target date and success measure;
7. review progress;
8. publish an appropriate "you said / we changed / we could not change" summary.

Action records should include scope, owner role, priority rationale, due date, status, outcome, and links to the relevant survey version. Do not expose private respondent identities or confidential comments in action summaries.

## 11. Teacher and course evaluation fairness

Teacher feedback is one input among several, not a standalone performance verdict. Interpret results with context such as course level, class size, attendance, learner age, course difficulty, accessibility needs, and response rate.

Safeguards:
- no public teacher popularity rankings;
- no automatic pay, employment, role, or assignment decisions from raw survey scores;
- no retaliation against learners or teachers for good-faith feedback;
- no pressure to give positive ratings or complete surveys;
- provide a review and correction path for misattributed or manipulated feedback;
- distinguish feedback about course design, institutional conditions, and individual teaching practice;
- use qualified human review for consequential academic decisions.

## 12. Conceptual records (not migrations)

Possible conceptual records:
- survey_templates: owner scope, audience, purpose, lifecycle, locale.
- survey_versions: immutable question set, version, review state, publication dates.
- survey_invitations: audience scope, delivery state, expiry, and eligibility snapshot.
- survey_responses: survey version, response mode, permitted identity reference, submission state.
- survey_answers: question identifier/version, structured answer, restricted free text.
- survey_access_events: sensitive read/export/publication audit.
- survey_aggregate_snapshots: thresholded aggregates, denominator, calculation version, publication state.
- feedback_themes: moderated de-identified theme and reviewer provenance.
- improvement_actions: owner, target, status, outcome, and related survey snapshot.
- survey_consent_and_notice_records: notice version, purpose, and applicable choices.

These are conceptual only. Reuse existing institution membership, course enrollment, consent, and audit sources. Avoid duplicating identity or authorization systems.

## 13. Data quality and abuse resistance

- Enforce eligibility and one-response or explicitly allowed update rules on the server.
- Use idempotent submission handling and protect against duplicate retries.
- Define whether edits are allowed before close and preserve version history.
- Rate-limit abusive submissions without blocking legitimate accessibility needs.
- Detect obvious automated spam using proportionate methods and human review.
- Do not treat device fingerprints or invasive tracking as a default anti-abuse mechanism.
- Keep survey participation optional unless a clearly justified educational requirement is approved; never make access to essential learning materials conditional on satisfaction ratings.

## 14. Accessibility and localization

Support Persian RTL, mixed Arabic/Persian/Latin text, screen readers, keyboard-only operation, sufficient contrast, clear scale labels, and low-bandwidth submission. Do not rely on color, icons, or visual charts alone to communicate results.

Provide age-appropriate wording and short surveys. Allow assistive technology and reasonable accommodations without marking a learner as less engaged.

## 15. Acceptance and security test plan

Use synthetic learners, guardians, teachers, and two institutions:
1. Learner cannot respond to a survey outside eligibility scope.
2. Guardian cannot access a survey beyond verified relationship and consent scope.
3. Teacher cannot view responses for an unassigned class.
4. Institution admin cannot inspect another tenant's raw responses.
5. Anonymous response storage does not retain direct identity links in the response dataset.
6. Small cohorts and free-text exports are suppressed or restricted to prevent re-identification.
7. Survey owner cannot silently alter a published question version.
8. Duplicate submissions and retries follow the declared response policy.
9. A safety disclosure is routed through the restricted safeguarding workflow.
10. A person named in a complaint cannot access or moderate that complaint by virtue of ordinary teacher/admin role.
11. Aggregates show denominators and do not equate non-response with a rating.
12. Teacher performance is not automatically determined from a raw score.
13. Exports, search, caches, realtime, and analytics preserve tenant and role scope.
14. A user can understand the purpose, audience, anonymity mode, and retention before submitting.
15. RTL, keyboard, screen-reader, and low-bandwidth flows remain usable.

## 16. Decisions required before implementation

- Which survey templates are needed for the first release?
- Which surveys are anonymous, confidential, or attributed, and what technical guarantees support those labels?
- What minimum cohort threshold is appropriate for each audience?
- Who approves surveys involving minors or sensitive topics?
- Which staff roles may see raw comments, and under what conditions?
- What retention periods apply to responses, free text, and aggregate snapshots?
- Which improvement actions may be visible to learners and guardians?
- How will teacher evaluation be separated from popularity ratings and handled fairly?
- Which languages and accessibility standards are required at launch?

## 17. Explicit non-actions

This document is a design proposal only. No survey, feedback form, rating system, analytics dashboard, teacher score, public ranking, database table, SQL function, RLS policy, migration, notification, export, or production behavior was implemented or changed. No learner, guardian, teacher, or institution response data was accessed. All proposed behavior requires product, academic, safeguarding, privacy, legal, accessibility, and technical approval before implementation.
