# Stage 174 — Online Quran Assessments, Competitions, and Certificate Issuance Workflow

**Date:** 2026-11-24  
**Status:** Design proposal only; no implementation or production changes.

## 1. Purpose and relationship to prior plans

Define a safe, accessible assessment and competition workflow for Quran learners, connecting the existing assessment/report-card plan (Stage 160) and certificate/competition design requirements (Stage 166). This document refines operational lifecycle, fairness, review, appeals, and issuance controls; it does not replace those plans.

## 2. Assessment types

Support separately configured assessment formats:
- Objective written quizzes: multiple choice, true/false, matching, and short structured answers.
- Quran reading and fluency: teacher-observed or scheduled oral assessment using a defined passage.
- Memorization and revision: learner recitation assessed against an explicit rubric.
- Tajwid: rule recognition and applied recitation assessment.
- Translation and tadabbur: source-grounded written or oral responses assessed with a rubric.
- Hadith, ethics, and course knowledge: source-attributed questions with age-appropriate wording.

Every assessment stores learning objective, course/class scope, level, language, rubric/version, author, reviewer, source references, accessibility settings, and publication state. Quran passage references use canonical surah/ayah identifiers; displayed canonical Arabic remains Uthmani text and must never be rewritten by search normalization.

## 3. Assessment lifecycle

Proposed states: draft → editorial_review → approved → scheduled/published → open → submitted → under_review → graded → released → archived. Cancellation and withdrawal are explicit audited transitions. A submitted attempt is immutable; corrections create a linked revision or authorized adjustment record rather than silently overwriting the original.

Rules:
- Server determines learner identity, eligibility, timestamps, attempt number, and objective score.
- Never trust client-supplied student_id, score, grade, correct-answer key, publication state, or review outcome.
- Enforce availability windows, attempt limits, and late-submission policy server-side.
- Use idempotency keys for retries; duplicate requests must not create duplicate attempts.
- Oral assessment may use teacher rubric and notes. Audio/video recording is optional, consent-based, private, and never required as the only assessment path.
- Provide a non-recorded live or teacher-observed alternative where feasible.

## 4. Fair and age-appropriate competitions

Competition modes may include individual knowledge quizzes, memorization review, team learning activities, and teacher-supervised recitation events. Competition configuration must state eligibility, scoring rubric, tie policy, schedule, accommodations, and whether results are private or published.

Safeguards:
- No public ranking by default, no shame-based labels, and no penalties for absence, disability, connectivity problems, or opting out.
- Prefer personal progress, team cooperation, and mastery recognition over high-pressure leaderboards.
- Public display requires explicit institutional approval and appropriate learner/guardian permission; display only minimum necessary information.
- Do not expose private answers, teacher notes, contact details, or child profile data.
- Provide accessible alternatives and reasonable time accommodations without disclosing sensitive reasons.

## 5. Scoring, review, and appeals

Use versioned rubrics with clear criteria and score ranges. Objective answer keys remain server-side. Oral and reflective work is teacher-assessed with criteria such as accuracy, fluency, tajwid application, completeness, and demonstrated understanding. Distinguish:
1. learner self-report;
2. teacher assessment;
3. independently verified mastery, where the program defines such a process.

Allow a learner to ask for clarification or review. A second reviewer may be required for disputed high-impact outcomes or formal awards. Record reviewer, rubric version, timestamps, reason for adjustment, and prior/new result in an append-only audit event. Do not silently modify released results.

## 6. Certificate eligibility and issuance

Certificate issuance must depend on explicit course completion rules configured by the authorized organization, not merely quiz participation or an automatically calculated score. Eligibility may combine attendance, required assignments, teacher-verified learning outcomes, and assessment completion. Publish criteria before enrollment.

Reuse and preserve the Stage 166 certificate requirements:
- Certificate title, issuer, organization/course branding, and header text are configurable by authorized administrators and permitted teachers; the platform name is not hard-coded as the issuer.
- Teacher signature image is optional, stored privately, permission-scoped, and selected explicitly for each eligible certificate/course. Preserve the exact signature asset version used on an issued certificate.
- Support separately authorized signature slots (teacher, academic supervisor, institution representative) with identity verification and approval; never permit impersonation.
- Learners can download only their own finalized, issued certificates.
- Assigned teachers may download only certificates for their authorized classes.
- Provide two distinct outputs: finalized signed digital certificate and unsigned print-ready draft. An unsigned draft must not appear as issued or verifiable.
- Certificate changes after issuance create a superseding version with reason and audit trail; never silently replace the historical artifact.
- Verification page/QR reveals only minimum fields needed to confirm authenticity and status; no learner contact details, date of birth, or private performance data.

## 7. Conceptual data model

Potential entities (names illustrative; reconcile with existing schema before any migration):
- assessment_definitions, assessment_versions, assessment_items, assessment_sources
- assessment_assignments, assessment_eligibility, assessment_attempts, assessment_responses
- assessment_reviews, assessment_rubric_versions, assessment_adjustments, assessment_appeals
- competition_definitions, competition_entries, competition_rounds, competition_results
- certificate_templates, certificate_eligibility_rules, certificate_issuance, certificate_signatories, certificate_asset_versions, certificate_verification_events
- audit_events and notification_outbox

Store references to approved content and media rather than duplicating canonical Quran text or unlicensed materials. Keep answer keys, private recordings, signatures, and draft certificates in private storage or server-only records.

## 8. Authorization and privacy

- Learner: read own assignments, submit own attempts, see own released results, appeal/request clarification, and download own issued certificates.
- Teacher: create and review assessments only for assigned classes/courses; cannot self-grant class access or change institutional issuer settings without a separate permission.
- Reviewer: access only assigned review cases and only the minimum response data required.
- Administrator: manage institution-level templates, eligibility rules, competition publication, signatory permissions, and issuance approvals, all audited.
- Guardian: only a verified relationship with explicit purpose-specific permission may expose permitted progress summaries; no default access to private answers, recordings, teacher notes, or signature assets.
- Anonymous visitor: may verify a certificate using a high-entropy opaque token and see only the minimal public verification result.

Enforce authorization in database policies and trusted server functions, not only UI route guards. Re-check current role and current class/course assignment at every sensitive read/write. Role demotion or revoked assignment must remove future access. Avoid broad table grants and never expose answer keys or private storage objects through public URLs.

## 9. Accessibility, reliability, and safeguarding

Provide RTL-first Persian/Arabic layouts, keyboard and screen-reader support, readable contrast, captions/transcripts for approved media, low-bandwidth behavior, and save/retry states. Clearly distinguish saved, submitted, reviewed, and released states. Use server timestamps and explicit course timezone. Offer a reasonable offline draft path without allowing client timestamps or scores to establish official completion.

For minors, minimize collected data, use age-appropriate language, avoid unrestricted direct messaging, and route concerns through moderated teacher/admin processes. Recording is opt-in with documented consent and retention/deletion rules. No public leaderboard or certificate verification endpoint may reveal a child's private information.

## 10. Acceptance and security test matrix

Staging-only tests with synthetic accounts and data:
- Learner A cannot read, modify, submit for, or download learner B's attempts/results/certificates.
- Learner cannot submit client-supplied score, reviewer identity, student identity, or answer key.
- Unpublished, expired, or out-of-scope assessment cannot be attempted.
- Duplicate submission retries are idempotent and do not create multiple attempts.
- Teacher cannot review a class/course not currently assigned to them.
- Teacher role demotion or assignment revocation blocks subsequent sensitive operations.
- Reviewer cannot access unrelated learner records or private media.
- Guardian without verified relationship and explicit scope cannot access learner progress; permitted summary does not reveal private notes or audio.
- Private audio/signature/draft assets cannot be fetched by anonymous or unrelated users.
- Quran surah/ayah ranges are validated server-side and canonical Uthmani text remains unchanged.
- Rubric changes do not retroactively alter prior graded attempts without an audited regrade.
- Appeals and score adjustments preserve the original result and reviewer history.
- Certificate eligibility is enforced server-side; unsigned draft cannot pass public verification.
- Revoked/superseded certificate status is reflected by verification without exposing personal data.
- Public competition results obey configured consent and minimization rules.
- Timezone boundaries, late submissions, network retries, accessibility accommodations, and cancellation paths behave predictably.

## 11. Rollout and unresolved decisions

Before implementation, product owners must decide: supported assessment types for first release; whether oral assessments need a second reviewer; competition visibility defaults; tie-breaking rules; course completion criteria; guardian notification scope; signature approval hierarchy; certificate retention and revocation policy; and any external verification requirements.

Recommended rollout: prototype with synthetic data → security/RLS review → educator usability review → limited staging pilot → explicit owner approval → separately authorized production implementation. No step in this document authorizes production changes.

## 12. Explicit non-actions

This stage is documentation only. No application code, database schema, RLS policy, SQL function, storage bucket, Auth setting, payment provider, migration, test account, deployment, merge, or live Supabase setting was changed. No real learner records or media were accessed.
