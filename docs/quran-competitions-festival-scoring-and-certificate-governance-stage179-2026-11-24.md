# Stage 179 — Quran competitions, festival scoring, and certificate governance

**Date:** 2026-11-24  
**Status:** Product, academic, operational, and security design proposal  
**Scope:** End-to-end governance for Quran learning competitions, festivals, fair assessment, appeals, awards, and certificate issuance.

## 1. Purpose and relationship to prior designs

This stage consolidates competition operations and clarifies the governance controls that connect registration, eligibility, assessment, judging, appeals, awards, and certificates. It complements the earlier assessment and certificate designs (Stages 166 and 174); it does not replace them or imply that any workflow is implemented.

The platform should support small classroom events, institution-level festivals, and multi-institution competitions without exposing learner data across organizations or encouraging harmful public comparison.

## 2. Competition types and scope

Potential event formats:
- Individual Quran recitation and fluency.
- Memorization and revision.
- Tajwid knowledge or applied assessment.
- Translation and Quran understanding.
- Tadabbur and age-appropriate reflection.
- Hadith, ethics, and Quran-learning knowledge.
- Team or classroom learning activities.

Each event must declare its educational purpose, eligible age/level bands, format, language, schedule, location or online mode, institution/branch scope, capacity, accessibility arrangements, and responsible organizer. A competition should not mix unlike assessment formats or compare learners across materially different age/level groups without a documented rationale.

## 3. Governance and role separation

Define scoped responsibilities:
- Platform operator: platform-wide configuration and safety oversight, not automatic access to all learner submissions.
- Institution owner/admin: approves events within the institution.
- Academic supervisor: approves rubric, judges, and result publication.
- Event organizer: manages schedule, registration, and logistics.
- Judge: assesses only assigned entries and sees only necessary participant information.
- Appeals reviewer: independent of the original decision where feasible.
- Teacher: supports learners and may submit eligible entries but cannot alter judge scores.
- Learner: views own registration, instructions, results, and own issued certificate.
- Guardian: receives only explicitly authorized information for a verified linked learner.

Separate event creation, judging, result approval, financial handling, and certificate issuance where practical. High-impact actions require an audit trail.

## 4. Eligibility, registration, and participation

Registration rules must be clear before a learner joins:
- Eligible age/grade/learning-level bands and any prerequisites.
- Institution membership or open-entry policy.
- Required guardian permission for minors where applicable.
- Submission format, deadlines, permitted materials, and accessibility accommodations.
- Withdrawal, absence, rescheduling, and disqualification rules.
- Whether participation is free, sponsored, or fee-based; any payment process is separately governed and must not pressure minors.

Collect the minimum information required to administer the event. Public participant lists should be off by default. Use participant codes for judging where practical to reduce bias, while retaining a restricted identity mapping for authorized organizers.

## 5. Rubric and assessment design

Every event must publish a versioned rubric before registration closes. A rubric should specify:
- Assessment dimensions and plain-language definitions.
- Scoring scale, weights, minimum/maximum values, and rounding.
- Required evidence for each score.
- Treatment of incomplete submissions, technical failures, and accommodations.
- Tie-break rules and whether ties are allowed.
- Disqualification criteria and who may apply them.
- Judge calibration and conflict-of-interest rules.

For recitation, possible dimensions include fluency, articulation, application of taught tajwid principles, and memorization accuracy. For knowledge events, use source-grounded answer keys and accept documented equivalent answers where academically appropriate. Tadabbur/reflection must be judged by a transparent educational rubric, not by claims that one personal reflection is the only valid religious interpretation.

Do not score personal piety, family background, disability, popularity, social engagement, or unrelated behavioral data. Never use automated speech analysis as the sole basis for a consequential result.

## 6. Judge assignment and calibration

- Verify judge qualifications appropriate to the event.
- Declare conflicts of interest before assignment.
- Assign judges to limited entry sets and prevent access to unrelated learner records.
- Provide rubric orientation and sample calibration cases.
- Use blind or coded review where feasible.
- For high-stakes awards, require multiple independent judges or a documented moderation step.
- Record score changes with author, timestamp, reason, and prior value.
- Prohibit organizers from editing judge assessments without an authorized review process.

## 7. Scoring, ties, and result approval

Scoring must be reproducible and server-authoritative if implemented. Client-submitted totals are not trusted. Preserve individual judge scores, rubric version, moderation adjustments, and final approved result as separate records.

Before publication:
1. Confirm all eligible entries are accounted for.
2. Check missing, duplicate, and out-of-range scores.
3. Apply published tie-break rules consistently.
4. Review unusual score variance and conflicts.
5. Obtain approval from the designated academic authority.
6. Freeze the approved result version and retain an audit record.

If a correction is required after publication, issue a new result version with a visible correction notice to affected participants; do not silently overwrite historical outcomes.

## 8. Appeals and complaints

Publish an accessible appeal window, allowed grounds, evidence requirements, and expected response timeline. Valid grounds may include arithmetic or data-entry error, inconsistent application of the published rubric, procedural irregularity, conflict of interest, or documented technical failure.

Appeals should:
- Be submitted privately by the learner or authorized guardian.
- Be reviewed by someone independent of the original judge where feasible.
- Avoid exposing another learner's scores or private information.
- Record outcome, rationale, reviewer, and date.
- Support correction of the result and dependent certificate when justified.
- Provide a safeguarding route for inappropriate conduct, separate from score appeals.

Do not promise a particular outcome or treat disagreement alone as proof of misconduct.

## 9. Awards and recognition

Recognition should emphasize learning, effort, participation, and progress without humiliating or stigmatizing participants. Avoid public leaderboards by default. If the organizer chooses to publish winners, require explicit policy approval and appropriate consent for minors, and publish only the minimum information needed.

Possible recognition categories include participation, completion, skill-specific achievement, teamwork, and improvement. Categories must be defined before the event and must not imply a formal qualification unless the institution has authority to issue it.

## 10. Certificate issuance governance

Certificate issuance reuses the configurable certificate design from Stages 166 and 174:
- Institution/event/course title and issuer text are configurable by authorized administrators; platform name must not be hard-coded into every certificate.
- The certificate template is versioned and records issuer identity, event, achievement category, issue date, and unique certificate identifier.
- Authorized teacher signature image is optional, private, and versioned; it is included only with explicit authorization for the relevant event/certificate.
- Multiple signatory slots may be defined (for example, teacher, academic supervisor, institution representative), each with role-based authorization and approval.
- A signature image must never be treated as proof of approval without a recorded issuance decision.
- Learners may download only their own finalized, issued certificate.
- Teachers may access certificates only for their currently assigned classes and only where their role permits.
- A print-ready unsigned preview must be visibly distinguished from an issued certificate and must not appear as verified.
- QR/public verification should disclose only minimal certificate facts and must not expose learner contact details, grades, private notes, or unrelated class information.
- Revocation or correction must preserve the certificate history and verification status.

## 11. Certificate lifecycle

Proposed states:
draft → pending_approval → approved → issued → corrected_or_revoked

A separate draft/print-preview state must never be confused with issued. Each transition should verify the actor's current authorization and record the event. Re-issuance after a corrected result must link to the prior certificate and clearly invalidate the superseded version.

## 12. Privacy, safeguarding, and accessibility

- Keep registration, identity mapping, scores, judge notes, appeals, and certificates private by default.
- Apply tenant, event, class, and resource-level authorization at the server/database boundary.
- Limit judges to assigned entries and hide unnecessary identity fields.
- Do not expose minors' full names, contact details, voice recordings, or personal learning history in public event pages.
- Provide reasonable accessibility accommodations without penalizing participants.
- Use age-appropriate instructions, safe adult supervision, clear reporting channels, and moderated communication.
- Do not use public shaming, coercive streaks, popularity votes, or social-media sharing as a condition of participation.
- Define retention and deletion rules for raw submissions, judge notes, appeals, and result records.

## 13. Conceptual records (not migrations)

Potential records include:
- competition_events: scope, organizer, dates, format, eligibility, and state.
- competition_categories: age/level bands and category rules.
- competition_registrations: participant, consent state, eligibility decision, and status.
- competition_rubric_versions: immutable published criteria and weights.
- competition_judge_assignments: judge, entry scope, conflict declaration, and status.
- competition_assessments: rubric version, dimension scores, evidence references, and judge.
- competition_result_versions: calculated, moderated, approved, and published result snapshots.
- competition_appeals: grounds, evidence reference, reviewer, decision, and timeline.
- certificate_templates: issuer branding, header, layout version, and signatory slots.
- certificate_issues: learner, event, result version, signatory approvals, artifact version, and lifecycle state.
- certificate_verification_events: minimal verification activity.

Names are illustrative only. Final schema, constraints, tenant ownership, RLS, storage rules, and RPC design require separate review.

## 14. Security and correctness test matrix

Use synthetic event entries and accounts in isolated staging:
- Learner can register and view only own private registration and result.
- Guardian can act only within verified, consented scope.
- Judge sees only assigned entries and cannot edit another judge's score.
- Organizer cannot silently alter assessments or approved results.
- Cross-institution and cross-event reads/writes are denied.
- Result calculations are server-side, deterministic, versioned, and reproducible.
- Duplicate submissions and repeated issuance requests are idempotent.
- Unpublished results and draft certificates are not publicly verifiable.
- Learner download is restricted to own issued certificate.
- Teacher download is restricted to assigned class and authorized role.
- Revoked or superseded certificates return correct verification status.
- Public verification reveals no private learner data.
- Appeal outcome updates the result/certificate lifecycle with a full audit trail.
- Role demotion and membership revocation immediately remove access on subsequent requests.

## 15. Decisions required before implementation

- Which event formats and age/level categories are supported initially?
- Who has final academic approval authority at each institution?
- Which judging credentials and calibration process are required?
- What appeal window and independent-review policy apply?
- Which award categories may be public, and what consent is required?
- Who may configure certificate branding and signatory slots?
- Which certificate fields are mandatory and what constitutes formal issuer authority?
- What retention periods apply to recordings, scores, appeals, and certificates?

## 16. Explicit non-actions

This stage is documentation only. No competition registration, judge assignment, scoring engine, result publication, certificate template, signature upload, certificate PDF, QR verifier, storage bucket, database schema, RLS policy, SQL function, migration, payment integration, notification, analytics, Supabase configuration, deployment, merge, or production setting was created or changed. No learner, judge, or institution data was accessed. All workflows remain proposals pending academic, legal, safeguarding, privacy, product, and technical approval.
