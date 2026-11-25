# Stage 166 — Online Assessments, Qur'an Competitions, Learning Recognition, and Course Certificates
Date: 2026-11-24
Status: design/documentation only; no assessment UI, competition, scoring service, certificate generator, database, or production setting implemented.

## 1. Purpose and principles
Design fair, age-appropriate assessment and recognition workflows for Qur'an learning. Support practice quizzes, teacher-assessed recitation and memorization, optional supervised competitions, progress recognition and verifiable course-completion certificates.

Principles:
- Assess learning objectives, not a learner's worth or religious commitment.
- Distinguish practice, formative feedback, summative assessment and competition.
- Distinguish learner self-report from teacher assessment and verified mastery.
- Use transparent rubrics and explain scoring before an assessment.
- Avoid public ranking, shame, pressure, punitive streaks and excessive testing.
- Provide reasonable accommodations and accessible alternatives.
- Never award a certificate for attendance alone if the stated credential claims mastery.
- Do not imply that a course certificate is an academic, state or religious authorization unless formally accredited.

## 2. Assessment types and learning objectives
Possible assessment categories:
- Qur'an reading accuracy and fluency.
- Tajwid recognition and applied recitation.
- Hifz (memorization) and revision.
- Translation and vocabulary.
- Understanding/tadabbur at an age-appropriate level.
- Hadith and course-content comprehension.
- Course participation/completion, kept distinct from demonstrated proficiency.

For each assessment define:
- learning objective and syllabus alignment
- intended age/level and prerequisites
- format and estimated duration
- allowed materials and assistance
- question types and rubric
- attempt policy and availability window
- scoring/review method
- accessibility accommodations
- feedback and appeal/correction process
- publication/version and reviewer approval

Do not use one total score to collapse reading, tajwid, memorization and understanding into a misleading single measure.

## 3. Online quiz workflow
Suggested lifecycle:
1. Authorized teacher/editor creates a draft assessment from approved question-bank items.
2. Reviewer verifies wording, source, answer key, difficulty and age suitability.
3. Assessment is published with explicit instructions, duration and attempt rules.
4. Learner starts an attempt; server creates the authoritative attempt record.
5. Answers are submitted through an authenticated server endpoint.
6. Server validates attempt ownership, availability, question version and answer structure.
7. Objective items are scored server-side; subjective items enter a teacher review queue.
8. Result is released according to the configured policy.
9. Corrections and regrades are versioned and auditable.

Question and answer keys must not be sent to unauthorized clients before the assessment is completed. Randomization, if used, must preserve equivalent difficulty and valid answer keys. Client timers are advisory; server timestamps determine authoritative windows.

## 4. Oral recitation and hifz assessment
- Oral recitation, fluency and tajwid should initially be assessed by an authorized teacher using a published rubric.
- The rubric may cover correctness, continuity, pronunciation/tajwid and readiness, with clear descriptors.
- Record the assessed passage reference, date, assessor, rubric version and concise feedback.
- Do not claim automated speech recognition can reliably certify Qur'an recitation unless independently validated for the exact language, recitation tradition and use case.
- Audio recording is optional and requires a separate, explicit consent, access and retention policy; default to no recording.
- A learner's self-marked completion is not teacher-verified mastery.
- Permit reassessment after feedback without public penalty.
- Avoid comparing children by memorization speed or amount.

## 5. Competition design and safeguards
Competitions should be optional, educational and suitable for the age group.
- Define scope, rules, eligibility, age/level group, judging rubric and schedule in advance.
- Prefer skill bands or age-appropriate cohorts over one open ranking across all ages.
- Offer participation and learning feedback independently of winning.
- Do not publish learner names, photos, voice recordings, scores or rankings without a separate approved consent and safeguarding policy.
- Do not use public leaderboards or shame-based elimination.
- Ensure judging is consistent, conflicts of interest are declared and appeals are possible.
- Provide a non-competitive participation route.
- Avoid high-pressure time limits or excessive practice expectations.
- If prizes are considered, review applicable child-safety, legal and financial requirements separately; no prize/payment mechanics are included in this design.

## 6. Feedback and learner progress
Feedback should be specific, constructive and private:
- what the learner demonstrated
- one or two strengths
- the next achievable learning step
- recommended review material
- whether the result is self-reported, teacher-assessed or verified

Progress views should show separate dimensions and trend context, not a single rank. Missing assessments must not be treated as failure. A learner should be able to see their own results and correction status; teachers see only learners in currently assigned classes.

## 7. Certificates and recognition
Certificate types should be clearly distinguished:
- participation certificate: attendance/participation only.
- course completion certificate: completion of defined course requirements.
- proficiency certificate: only when a documented rubric and qualified assessment establish the stated proficiency.
- competition recognition: placement/award within a specific event, not a general mastery claim.

Each certificate should state:
- learner display name according to privacy policy
- course/event title and exact version
- issuing organization
- issue date and certificate type
- criteria satisfied and assessment/rubric version where relevant
- unique opaque verification identifier
- verification URL or QR code that reveals only minimal public information
- limitations/disclaimer where it is not an accredited qualification

Do not include government identifiers, home address, phone number, birthdate or unnecessary personal details. Do not expose detailed grades or teacher notes on a public verification page.

## 8. Certificate issuance and revocation lifecycle
Suggested states:
- draft
- eligible
- issued
- revoked
- superseded

Issuance must be server-authorized after requirements are checked. Reissuing a corrected certificate should preserve an audit trail and invalidate the old verification token where appropriate. Revocation must require a reason category, authorized actor and notification process. Do not silently delete a previously issued record.

Public verification should return only:
- valid/invalid/revoked status
- certificate type
- course/event title
- issuing organization
- issue date
- minimal display name only if approved

Use non-sequential random identifiers or signed verification tokens; do not expose internal database IDs. Rate-limit verification endpoints and prevent enumeration.

## 9. Conceptual data model
Design concepts only; reconcile with existing quiz and report-card designs from Stages 150 and 160:
- assessments: title, objective, assessment_type, age_band, level, availability_window, attempt_policy, publication_state.
- assessment_versions: assessment_id, version, instructions, rubric_version, published_at.
- assessment_items: assessment_version_id, question_bank_item_id, order_key, points, item_config.
- assessment_attempts: assessment_version_id, learner_id, started_at, submitted_at, status, server_score, release_state.
- assessment_responses: attempt_id, item_id, response_payload, objective_score, review_state.
- assessment_reviews: attempt_id, reviewer_id, rubric_version, result, feedback, reviewed_at.
- competition_events: title, scope, age_band, rules_version, schedule, publication_state.
- competition_entries: event_id, learner_id, eligibility_state, consent_state, submitted_at.
- competition_judgements: entry_id, judge_id, rubric_version, result, conflict_check, reviewed_at.
- certificates: recipient_id, certificate_type, course_or_event_id, criteria_snapshot, verification_token_hash, status, issued_at, revoked_at.
- certificate_audit_events: certificate_id, actor_id, action, reason_code, timestamp.
- assessment_appeals: attempt_id, requester_id, reason_category, status, reviewer_id, resolution_note.

Use immutable published versions for question sets and rubrics. Avoid storing raw audio unless explicitly approved. Keep answer keys in server-only storage and separate from learner-readable records.

## 10. Authorization and privacy
- Learner reads only own attempts, results, appeals and certificates.
- Teacher reads/reviews only current assigned-class learners and only within approved assessment scope.
- Assessment author/editor cannot access private learner data without a separate authorized role.
- Competition judge sees only entries assigned for judging; hide identifying details where practical.
- Admin certificate issuance/revocation is least-privilege and audited.
- Public verification reveals minimal certificate metadata only.
- Anonymous users cannot access attempts, question keys, private results or rosters.
- Server derives actor from authenticated context; never trust client-supplied learner_id, score, reviewer_id or role.
- RLS protects direct data access; server-side RPCs enforce attempt state and scoring rules.
- Role demotion and class reassignment revoke access.
- Avoid sending learner names, results or audio to external AI services without a separate privacy, consent and vendor review.

## 11. Fairness, accessibility and accommodations
- Use clear language appropriate to age and reading level.
- Support keyboard navigation, screen readers, RTL Persian/Arabic and accessible contrast.
- Provide reasonable time accommodations where relevant.
- Offer non-audio alternatives where an oral recording is not required.
- Ensure assessment difficulty and scoring are reviewed for age/level suitability.
- Provide a documented correction and appeal route.
- Do not penalize disability, connectivity interruptions or approved accommodations.
- Save progress safely and make submission status explicit.
- Do not use speed as a proxy for religious knowledge or learner worth.

## 12. Reliability and integrity
- Use server-side timestamps for attempt windows and submission.
- Make attempt creation and submission idempotent.
- Prevent duplicate submissions from producing multiple scores or certificates.
- Bind each attempt to the exact published assessment version.
- Validate response types and allowed values server-side.
- Keep objective answer keys private until release policy permits.
- Audit score changes, manual review, appeals and certificate issuance/revocation.
- Provide recovery for network interruption without silently discarding answers.
- Do not use invasive device surveillance or covert proctoring.
- Any future proctoring proposal requires a separate necessity, proportionality, privacy and child-safety review.

## 13. Acceptance and security tests
1. Learner A cannot access Learner B's attempt, response, score, appeal or certificate record.
2. Client cannot submit another learner's ID or self-assign a teacher/reviewer role.
3. Answer keys are not exposed before the configured release point.
4. Score is computed or verified server-side; client-submitted score is ignored.
5. Duplicate submissions and retries do not create multiple authoritative results.
6. Attempt is bound to the published assessment version used at start.
7. Teacher without current assignment cannot review a learner's attempt.
8. Role demotion and class reassignment revoke access.
9. Subjective/oral assessments require an authorized reviewer and rubric version.
10. Self-reported completion is never labeled teacher-verified mastery.
11. Competition results are not publicly exposed without approved consent and policy.
12. Judges cannot alter entries outside their assigned scope.
13. Certificate verification does not expose private grades, notes or personal identifiers.
14. Revoked/superseded certificate tokens no longer verify as valid.
15. Certificate issuance requires server-verified criteria and authorized issuer.
16. Appeals and corrections are auditable.
17. RTL, accessibility, accommodation and interrupted-network tests pass.
18. No covert recording or invasive proctoring is introduced.

## 14. Release sequence
1. Inventory current quiz RPCs, question bank, report-card and certificate-related objects.
2. Confirm server-side scoring and authorization behavior in staging.
3. Approve age/level rubrics, assessment attempt policy and appeals.
4. Implement practice quizzes first with synthetic learners and protected answer keys.
5. Add teacher-reviewed oral/hifz assessment without mandatory audio recording.
6. Pilot optional competitions with private results and non-competitive participation.
7. Define certificate criteria, issuer privileges and minimal verification endpoint.
8. Complete accessibility, child-safety, fairness, privacy and security review.
9. Obtain explicit approval before production migration, public certificate verification, competition publication or release.

## 15. Decisions required
- Which assessment types are included at launch?
- What are the attempt limits, time windows and result-release rules?
- Which rubrics define reading, tajwid, hifz and revision proficiency?
- Who is qualified to assess oral recitation?
- Are competitions needed at launch, and what age/level groupings apply?
- Will audio ever be recorded, and what consent/retention model applies?
- Which certificate types are offered and what exact criteria do they certify?
- Who may issue or revoke certificates?
- What minimum information is public on certificate verification?
- What appeal/correction process and response time are promised?

## 16. Status and safety
This is a design document only. No assessment, competition, leaderboard, scoring logic, certificate, verification endpoint, audio recording, database schema, RLS, grants, RPCs, triggers, external service or live setting was changed. No learner result or personal data was accessed or modified. No migration, deployment, merge or release was performed.

## 17. Configurable certificate branding, signatures, and downloads (product requirement addendum)
The certificate header must not hard-code the platform name as the issuing organization for every course. The platform may provide a neutral template, but the visible issuer/organization title and optional subtitle are configurable per issuing organization, course, cohort or event, subject to authorization.

### 17.1 Header and template ownership
- Admin can define approved organization-level branding defaults and shared templates.
- An authorized teacher/course owner may set the course-specific certificate title, subtitle, issuing unit and permitted visual identity for courses they manage.
- The system must distinguish the platform name from the actual issuer. “مسیر نور ثقلین” may appear as platform attribution only when selected by an authorized administrator; it must not replace the course provider/issuer automatically.
- Store a versioned snapshot of the title, issuer, template and relevant course/event metadata at issuance so later edits do not silently rewrite previously issued certificates.
- Restrict logos, seals and issuer names to assets/organizations the actor is authorized to represent. Keep an audit record of template and branding changes.

### 17.2 Teacher profile signature asset
- Provide an optional signature-image upload field in the teacher profile, separate from the public profile avatar.
- Only the authenticated teacher may upload, replace or remove their own signature asset; administrators may manage it only under a documented support/authorization process.
- Validate file type and size, store the asset in a private bucket, and serve it only to authorized certificate-generation workflows. Do not expose a reusable public signature URL.
- Require an explicit per-certificate or course-level choice before applying the signature. A stored signature must not be stamped automatically on every document without the teacher's configured authorization.
- Record which authorized issuer identity/signature asset version was applied to each issued certificate. Replacing a profile signature affects future certificates only; it does not alter previously issued files.
- Provide a text fallback (teacher name and role) when no signature image is uploaded.

### 17.3 Student and teacher download flows
- A learner may download only their own finalized, issued certificate from their account. Draft, preview, revoked or unapproved certificates must not be presented as valid downloadable credentials.
- An authorized teacher may download a print-ready certificate batch or individual certificate for learners in currently assigned courses/classes, within their certificate permissions.
- Provide two explicit output modes where policy permits: (a) finalized digital copy with configured authorized signatures, and (b) print-ready unsigned copy with reserved signature areas for handwritten teacher/manager signatures.
- The print-ready copy must be clearly marked as an unsigned print copy or draft until signed and formally issued; it must not be confused with a valid issued certificate.
- If a teacher downloads a blank/template or prefilled unsigned version to sign by hand, the system must not mark it issued or create a valid public verification result until the authorized issuance step is completed.
- Downloads must be logged with actor, certificate/template version, output mode and timestamp. Do not log the file contents or signature bytes.

### 17.4 Multiple signatories and approval
- Support zero, one or multiple signature slots (for example instructor, academic supervisor or institution representative) according to the template's approval policy.
- Each signature slot has a role, display name/title, authorized signer and optional signature asset. A teacher cannot insert another person's signature or claim an institutional approval without permission.
- Where a wet signature is required, allow a print workflow followed by an authorized issuance/verification step; do not treat a downloaded unsigned file as proof of approval.
- Define whether the course teacher, program manager or administrator is the final issuer. Apply least privilege and record the decision.

### 17.5 Additional security and acceptance tests
1. A teacher cannot change the platform-wide issuer identity or edit branding for a course they do not manage.
2. A course-specific title/issuer can differ from the platform title and is frozen in the issued certificate snapshot.
3. Learner A cannot download Learner B's certificate, including by changing an identifier in a URL.
4. A learner cannot download a draft, unsigned, revoked or unapproved certificate as a valid credential.
5. A teacher cannot download certificates for classes outside their current assignment.
6. Signature assets are private, access-controlled, validated and unavailable through public bucket listing or guessed URLs.
7. A teacher cannot upload or apply another person's signature as their own.
8. Changing a teacher's signature affects only future certificates and preserves the historic issuance record.
9. An unsigned print copy is visibly distinguished from an issued certificate and cannot pass public verification.
10. Every final issue, reissue, revocation and authorized download is auditable.
11. QR/public verification reveals only the minimal fields defined in Section 8 and never exposes signature-image storage paths or private profile data.
