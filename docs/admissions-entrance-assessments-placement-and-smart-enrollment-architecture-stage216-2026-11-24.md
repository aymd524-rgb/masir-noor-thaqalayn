# Stage 216 — Admissions, Entrance Assessments, Placement, and Smart Enrollment Architecture
Date: 2026-11-24
Status: product and technical design only; no application, database, or production implementation.

## 1. Purpose and relationship to earlier stages
Define an end-to-end admissions and placement workflow for learners joining the platform, an institution, a branch, a program, a course, or a class. This stage operationalizes, rather than duplicates:
- Stage 159: learner onboarding and personalized learning path.
- Stage 172: Qur'an-specific learner placement.
- Stage 201: comprehensive examinations and academic assessment operations.
- Stage 176: multi-institution and branch membership boundaries.
- Stage 200: adaptive learning journey.
The new focus is the admissions lifecycle: discovery, application, eligibility, assessment, placement decision, authorized approval, enrollment, waitlist, transfer, and reassessment.

## 2. Scope and admission pathways
Support distinct entry routes without assuming every learner needs an entrance exam:
1. Open self-enrollment into a free introductory activity or public resource.
2. Application to a class or course with available capacity.
3. Institution/branch admission requiring document review or an interview where justified.
4. Placement-only assessment for learners already enrolled.
5. Transfer from another class, branch, program, or institution.
6. Re-entry after a pause, with prior records retained under policy.
7. Invitation by an authorized teacher or institution administrator, subject to learner/guardian acceptance.
8. Scholarship or sponsored admission, with financial review kept separate from academic placement.

Each program declares its own admission requirements. A placement result must not silently become a rejection decision.

## 3. Learner-facing application journey
1. Discover the institution, course, age band, language, delivery mode, schedule, cost, and prerequisites.
2. Read plain-language admission criteria, assessment format, data use, accessibility options, and expected decision timeline.
3. Start an application using the minimum necessary information.
4. Select learning goals and disclose prior study only where relevant; optional questions remain optional.
5. Request accommodations or a teacher-led assessment without being required to disclose a diagnosis.
6. Complete any required assessment, or schedule an approved human assessment.
7. Review the provisional result and recommended class/path with an explanation.
8. Accept, decline, or request review of the proposed placement.
9. Complete any required guardian consent and financial step separately.
10. Receive an enrollment confirmation only after all required approvals and capacity checks succeed.

The interface must show the current status and next action, and must not imply admission before approval.

## 4. Assessment catalogue and independent skill dimensions
Programs may select relevant assessment dimensions; no single universal score is permitted.

### Qur'an and religious learning
- Arabic letter and word recognition; reading accuracy and fluency.
- Tajwid knowledge and observed application.
- Memorization recall and revision habits.
- Translation and vocabulary familiarity.
- Tafsir and tadabbur comprehension, with age-appropriate prompts.
- Hadith, seerah, ethics, aqidah, and fiqh foundations where relevant to the course.
- Arabic language: vocabulary, morphology, syntax, comprehension, and translation.

### School and general education
- Grade- and subject-specific readiness for mathematics, Persian/language arts, science, English, and other offered subjects.
- Prerequisite knowledge rather than broad intelligence or personality testing.
- Reading comprehension and numeracy where required by the learning program.

### Creative, technical, and vocational learning
- Portfolio or sample task where relevant.
- Foundational digital literacy, programming, art, calligraphy, media production, research, or practical skills.
- Safety prerequisites for supervised practical activities.

Assessment dimensions are chosen by the program and published in advance. Results remain separate by skill; a learner may be advanced in one dimension and beginning in another.

## 5. Assessment formats and fairness
Permitted formats include short diagnostic quizzes, written exercises, oral teacher-led checks, practical demonstrations, portfolio review, and structured interviews when necessary.
- State duration, format, allowed aids, scoring rubric, and whether the assessment is formative or an admission requirement.
- Use age-appropriate language and accessible alternatives.
- Provide reasonable time flexibility and non-audio alternatives.
- Do not require camera access, biometric identity checks, emotion detection, or continuous proctoring for ordinary learning placement.
- Do not use speed as a proxy for ability unless speed is an explicit, educator-approved skill.
- Randomize equivalent question forms only where this improves fairness and does not change difficulty.
- Keep a documented rubric version and assessor guidance.
- Use human review for oral recitation, nuanced religious understanding, portfolio quality, and disputed results.
- Do not let an AI model make final admission, exclusion, scholarship, or official grade decisions.

## 6. Placement recommendation and decision rules
The system may recommend one or more suitable levels based on approved evidence:
- prerequisite mastery by dimension;
- learner-selected goals and preferred pace;
- class age band and curriculum sequence;
- schedule, modality, accessibility, and available capacity;
- teacher-reviewed prior learning evidence where accepted.

Every recommendation must show its reasons, evidence date, rubric/version, limitations, and whether it is provisional. Keep distinct:
- learner self-report;
- objective quiz result;
- teacher observation;
- portfolio review;
- approved prior credential;
- final authorized placement decision.

A recommendation is not an official result until an authorized reviewer approves it. The learner may request reassessment or a different class where policy permits. Do not rank applicants publicly or label them as weak, gifted, or permanently behind.

## 7. Admission lifecycle and state machine
Suggested application states:
- draft;
- submitted;
- awaiting_required_information;
- awaiting_assessment;
- assessment_scheduled;
- assessment_in_progress;
- awaiting_human_review;
- placement_proposed;
- awaiting_guardian_consent;
- awaiting_financial_step;
- approved;
- waitlisted;
- declined_with_reason;
- withdrawn;
- expired;
- enrolled;
- transferred;
- closed.

State transitions must be server-authorized and audited. The UI must not allow a client to set approved/enrolled states directly. A decline must use a permitted, understandable reason category and offer an appeal/review route where appropriate. Sensitive safeguarding information must never be placed in ordinary admission notes.

## 8. Capacity, waitlist, and enrollment integrity
- Capacity is managed for the actual class/cohort/session, not merely the course catalogue.
- Reserve a seat only for a defined, short, policy-approved period.
- Use transactional capacity checks to prevent concurrent over-enrollment.
- Waitlist ordering rules must be published; avoid opaque manual favoritism.
- Authorized staff may override ordering only with a reason and audit record.
- An offer has an expiry date and clear accept/decline actions.
- Enrollment is created only after required approvals, consent, and payment/scholarship conditions are satisfied.
- Payment success must be verified by trusted server-side provider events; browser return pages are not proof of payment.
- Free admission must not require a payment method.
- Scholarship decisions and financial hardship details are visible only to authorized financial staff; teachers see only the minimum operational status needed.

## 9. Transfers, level changes, and reassessment
Support requests to move between:
- levels within a course;
- classes under the same institution;
- branches or programs;
- institutions, subject to the relevant consent and acceptance process.

A transfer must preserve historical attendance, assessments, certificates, and learning evidence according to policy while changing current access scopes. Old teacher access must end when assignment ends. Reassessment may be learner-requested, teacher-recommended, or curriculum-triggered, but should not be punitive or excessive. Keep prior placement versions and explain what changed.

## 10. Roles and authorization boundaries
- Applicant/learner: create and view own application, submit permitted evidence, accept/decline offers, request review.
- Guardian: act only for a verified linked minor and only within explicit consent and scope.
- Teacher/assessor: assess assigned applicants or learners only when assigned and currently authorized; cannot approve institutional admission unless separately granted that role.
- Admissions officer: review applications within assigned institution/branch.
- Academic supervisor: approve placement exceptions and rubric governance within scope.
- Institution administrator: manage admission settings and final decisions only within their tenant.
- Finance officer: see necessary financial eligibility and payment status, not academic notes.
- Platform administrator: exceptional platform-level support with least privilege and audit; not routine access to private learner evidence.

Institutional roles must be distinct from global platform roles. A role in one institution does not grant access to another institution. Current role and current assignment must be checked server-side on every sensitive operation.

## 11. Privacy, minors, and evidence handling
- Collect only fields required for a specific admission purpose.
- Prefer age bands over exact birth date where sufficient.
- Avoid collecting national identifiers, home address, family details, or health information unless a documented legal/operational need exists.
- Accommodation requests should capture the requested adjustment, not unnecessary diagnostic details.
- Audio, video, portfolios, and uploaded documents are optional unless the specific program has a justified requirement; disclose purpose, audience, retention, and deletion.
- Guardian consent must be verified and purpose-specific where required.
- Never expose applicant lists, assessment evidence, or rejection reasons publicly.
- Separate financial records from academic records.
- Define retention and deletion for incomplete, declined, withdrawn, and enrolled applications.
- Provide correction and access-request processes consistent with applicable law and product policy.

## 12. Conceptual data model
Logical concepts only; do not create migrations from this list without schema mapping and security review:
- admission_program_rules: program_id, published_requirements, age_band, prerequisites, assessment_policy_version.
- admission_applications: applicant_id, tenant_id, program_id, status, submitted_at, decision_at.
- admission_application_events: application_id, actor_id, event_type, timestamp, minimal_reason.
- admission_assessment_definitions: program_id, dimension, format, rubric_version, required_flag.
- admission_assessment_sessions: application_id, assessor_id, scheduled_at, status, rubric_version.
- admission_assessment_results: session_id, dimension, result, evidence_reference, assessor_source.
- admission_placement_proposals: application_id, proposed_level, rationale, confidence_limitations, status.
- admission_decisions: application_id, decision, authorized_actor_id, reason_category, decided_at.
- admission_offers: application_id, seat_id, expires_at, response_status.
- admission_waitlist_entries: application_id, cohort_id, priority_rule_version, position_snapshot.
- enrollment_transitions: enrollment_id, prior_scope, new_scope, actor_id, reason, timestamp.
- admission_consents: application_id, guardian_id, purpose, consent_status, verified_at.
- admission_evidence_metadata: application_id, storage_reference, classification, retention_until, access_scope.

Avoid duplicating existing enrollment, assessment, profile, payment, or institution tables. Map these concepts to actual schema and choose one authoritative source for each state.

## 13. Security and data integrity requirements
- Enforce tenant and class scope in database policies and server-side functions, not merely client filters.
- Derive actor identity from authenticated server context; never trust client-supplied assessor, approver, tenant, or guardian IDs.
- Validate state transitions, eligibility, capacity, offer expiry, and payment events transactionally.
- Prevent applicants from changing their own assessment results, placement approval, scholarship status, or enrollment state.
- Restrict file access with private storage and short-lived authorized links.
- Ensure exports, search, notifications, logs, caches, and analytics respect the same tenant and privacy boundaries.
- Audit decisions and overrides without copying sensitive evidence into logs.
- Rate-limit application and assessment endpoints; provide accessible abuse handling without blocking legitimate applicants.

## 14. Notifications and communication
Send minimal status notifications for submission, missing information, assessment scheduling, result availability, offer, waitlist movement, and review outcome. Notifications should not expose scores, sensitive notes, or financial details on lock screens. Respect quiet hours and guardian notification policy. Provide a structured appeal/contact route; do not enable unrestricted direct messaging between applicants and staff.

## 15. Acceptance and abuse-case tests
1. A learner can browse public programs without submitting an application.
2. A learner cannot view or edit another applicant's application or evidence.
3. A teacher cannot assess an applicant outside current assignment and tenant scope.
4. An assessor cannot approve admission unless explicitly authorized.
5. A client cannot forge final placement, decision, enrollment, payment, or guardian-consent state.
6. Concurrent acceptances cannot exceed class capacity.
7. An expired offer cannot reserve a seat.
8. A waitlist override requires authorized role, reason, and audit event.
9. A transfer revokes old-scope access and grants only new-scope access after approval.
10. Reassessment preserves prior results and rubric versions.
11. Financial staff cannot read private academic notes; teachers cannot read scholarship hardship details.
12. Optional evidence is not collected without disclosed purpose and consent where required.
13. Public pages and leaderboards reveal no applicant status or private assessment data.
14. Age-appropriate and accessible assessment alternatives are available.
15. AI-generated recommendations cannot finalize admission or official placement.
16. Retention and deletion rules apply to withdrawn and declined applications.
17. Tenant-isolation tests pass with synthetic accounts across two institutions and branches.
18. Logs and notifications contain no unnecessary personal or assessment data.

## 16. Rollout sequence
1. Product owners define which programs require admission versus open enrollment.
2. Educators approve dimensions, rubrics, accommodations, and age-appropriate instructions.
3. Institutions define decision authority, capacity, waitlist, appeal, and offer expiry rules.
4. Privacy/legal owners approve data minimization, guardian consent, retention, and evidence handling.
5. Map all concepts to the current schema and existing enrollment/payment workflows.
6. Review RLS, grants, storage policies, and tenant boundaries before proposing any migration.
7. Build in a separate feature branch with synthetic applicants and no production data.
8. Test concurrency, role demotion, cross-tenant access, accessibility, and child-safety scenarios in staging.
9. Obtain explicit approval before any production migration, data collection, or release.

## 17. Decisions required before implementation
- Which programs are open enrollment and which require formal admission?
- Which age bands, prerequisites, and assessment dimensions apply to each program?
- Who may assess, recommend placement, approve admission, and grant exceptions?
- What is the published waitlist ordering and seat-hold duration?
- Which guardian consent steps are required for different age groups and activities?
- What evidence, if any, must be retained and for how long?
- Which transfer and reassessment rules apply?
- Which payment, scholarship, and free-seat conditions affect enrollment?
- What appeal timeline and independent reviewer are available?

## 18. Explicit non-actions and implementation status
This stage adds a design document only. It does not create admission forms, routes, tests, scoring engines, placement automation, tables, columns, RLS policies, RPCs, triggers, storage buckets, notifications, or payment integrations. No live Supabase data or settings were changed. No migration, deployment, merge, or release was performed. The proposed states, rubrics, and data concepts are not yet approved product policy or operational functionality.
