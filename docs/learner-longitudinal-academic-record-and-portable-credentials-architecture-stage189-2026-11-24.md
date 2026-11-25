# Stage 189 — Learner Longitudinal Academic Record and Portable Credentials Architecture

**Date:** 2026-11-24  
**Status:** Design specification only  
**Related stages:** 154, 160, 166, 172, 174, 176, 183, 184, 185, and 188.

## 1. Purpose

Design a learner-controlled, privacy-preserving academic record that brings together verified learning history across courses, classes, branches, and institutions. The record should help a learner and authorized educators understand progress over time without turning unlike achievements into one misleading score.

The record may include Quran reading, fluency, tajwid, memorization, revision, translation, tafsir, tadabbur, hadith, Seerah, ethics, course completion, assessments, competition results, and formally issued certificates.

This is a design proposal only. It does not create a transcript, credential, database object, or production feature.

## 2. Core principles

- The learner's record is a longitudinal collection of evidence, not a public profile.
- Preserve the distinction between self-reported activity, teacher assessment, moderated result, and formally issued credential.
- Every record has provenance: issuing organization, class/course/event, responsible reviewer where applicable, date, rubric or content version, and verification status.
- Do not infer mastery from attendance, course enrollment, time spent, or an unverified self-report.
- Do not combine memorization, recitation, tafsir, and unrelated disciplines into a universal score.
- The learner should be able to inspect, download, and request correction of their own record.
- Cross-institution sharing is explicit, purpose-limited, and revocable prospectively where legally and technically possible.
- A receiving institution must not gain access to unrelated private history merely because a learner transfers.

## 3. Record sections

A learner's private record may contain the following sections:

### 3.1 Learning identity and current enrollment
- learner's platform identifier and minimum required display information;
- current institution/branch/class memberships;
- course enrollment and completion states;
- effective dates and transfer history where disclosure is authorized.

### 3.2 Quran learning progress
- reading and fluency assessments;
- tajwid knowledge and applied assessment;
- memorization and revision records;
- surah/ayah scope and the exact assessment method;
- teacher-assessed or moderated status;
- learning targets and progress snapshots, clearly separated from verified outcomes.

### 3.3 Religious and complementary learning
- translation and comprehension;
- tafsir and source-grounded understanding;
- tadabbur and reflection activities;
- hadith, Seerah, ethics, and Quranic sciences;
- source references and course/content version where relevant.

### 3.4 Courses and learning paths
- course title, provider, level, instructor or authorized issuer;
- start/end dates and completion status;
- assessed learning outcomes and rubric version;
- attendance shown separately from completion and mastery.

### 3.5 Assessments and competitions
- assessment type, date, discipline, result state, and rubric version;
- oral assessment outcome where authorized;
- competition participation and finalized placement;
- appeals, corrections, superseded results, and revocations as appropriate;
- no judge's confidential notes or other participants' information.

### 3.6 Certificates and honours
- formally issued certificates and verification status;
- issuer, signatories, issue date, credential identifier, and applicable course/event;
- achievement honours governed by Stages 166, 174, and 185;
- distinguish participation certificates from mastery credentials and competition awards.

## 4. Evidence and verification levels

Use explicit evidence labels:
1. **Learner-reported:** entered by the learner; not independently verified.
2. **Teacher-assessed:** recorded by an authorized teacher with an identified assessment method.
3. **Institution-reviewed:** reviewed under an institution's academic process.
4. **Moderated:** checked by an authorized independent or supervisory reviewer.
5. **Issuer-verified credential:** formally issued through the approved certificate workflow.
6. **External record, unverified:** imported or presented by the learner but not verified by the platform or issuer.

A record must never silently move to a higher evidence level. Verification changes require an authorized action and an audit event.

## 5. Cross-institution portability

A learner may request a portable record for a defined purpose, such as:
- transferring to another class or institution;
- enrolling in a new course;
- applying for an advanced learning level;
- presenting a specific certificate or assessment result.

The learner selects which record sections or credentials to share. A receiving institution sees only the selected items and any minimum metadata required to verify them.

Transfer must not automatically move:
- private teacher notes;
- guardian contact information;
- raw audio/video recordings;
- safeguarding or support cases;
- private classroom conversations;
- unrelated grades or course history;
- internal disciplinary or operational notes.

Institution-to-institution sharing requires an authorized receiving destination and a clear purpose. Do not allow an institution to search a learner's complete history without a valid relationship and permission.

## 6. Consent and learner/guardian control

Before sharing, explain:
- which records will be shared;
- who will receive them;
- the purpose;
- whether the recipient can download or retain a copy;
- the expiry or review date;
- how future access can be withdrawn.

For minors, apply age-appropriate learner notice and the applicable guardian authorization model. Guardian authority must follow verified relationship, jurisdictional requirements, and safety exceptions. Do not assume that every guardian can view or transfer every record.

Withdrawal should stop future platform access to the shared record where feasible, but must not falsely promise deletion of copies already lawfully downloaded by a recipient. Record consent and withdrawal events with timestamps and policy versions.

## 7. Portable transcript and export formats

Offer a readable PDF summary and, where technically approved, a structured machine-readable export. Each export should include:
- learner-selected identity fields only;
- issuer and institution identifiers;
- record category and discipline;
- date and status;
- evidence/verification level;
- rubric or course version where material;
- credential verification reference;
- export creation date and scope.

Exports must clearly state that a summary is not an official certificate unless formally issued as one. Avoid embedding private contact details, guardian data, raw evidence, or internal notes.

Structured export should be versioned and schema-documented. Include integrity metadata or a signed verification mechanism only after key management, issuer identity, revocation, and verification endpoints are designed and reviewed.

## 8. Credential verification

A public verification page may confirm only minimal facts:
- credential is valid, revoked, expired, or superseded;
- issuer identity;
- credential type/title;
- issue date;
- limited achievement/course scope.

Do not expose the learner's full academic record, birth date, contact details, class roster, or private scores through a credential identifier or QR code.

Use unguessable identifiers, rate limiting, abuse monitoring, and a way for issuers to correct or revoke credentials. Verification must not reveal whether a person is a platform member beyond the credential facts intentionally published.

## 9. Corrections, disputes, and provenance

Learners may request correction of inaccurate identity, course, attendance, assessment, or credential metadata. Requests should route to the record's authorized issuer or responsible institution.

- Preserve the original record and append a correction event.
- Require reason and authorized reviewer for consequential changes.
- Allow a learner to attach relevant evidence through a private channel.
- Distinguish factual correction from disagreement with academic judgment.
- Provide an appeal route for disputed assessments or results.
- Do not let a receiving institution edit a record issued by another institution.
- If an issuer is unavailable, define a platform review process that does not fabricate verification.

A corrected record should show its current state while retaining a minimal audit trail.

## 10. Institution transfer and membership lifecycle

A transfer may involve:
1. learner or authorized guardian initiates a transfer request;
2. receiving institution is selected and confirms its identity;
3. learner chooses the records to share;
4. required consent and eligibility are validated;
5. sending institution may confirm only records it is authorized to attest;
6. receiving institution reviews and accepts selected records;
7. new enrollment is created separately from historical records;
8. prior institution membership is ended or retained only according to policy.

Historical achievements remain attributed to their original issuer. A new institution must not reissue or alter another institution's credentials as if it had issued them.

## 11. Multi-tenant authorization

- Learner: full private view of own record, subject to lawful restrictions and clear evidence labels.
- Guardian: only the linked learner's permitted record sections under verified relationship and consent.
- Teacher: records for currently assigned learners and only the educational scope required.
- Academic supervisor: authorized records within assigned institution/branch scope.
- Institution administrator: institution-issued records and permitted learner records associated with that institution; no unrestricted platform-wide history.
- Receiving institution: only explicitly shared and accepted transfer records.
- Credential verifier: minimal public credential facts only.
- Platform operator: system integrity and support duties under least privilege; no default unrestricted access to private learner evidence.

Enforce access server-side for pages, APIs, search, exports, storage, notifications, and realtime subscriptions. A role label alone is insufficient; verify tenant membership, current assignment, record issuer, purpose, and consent.

## 12. Retention and data minimization

Different record types may have different retention requirements. Define policy for:
- active learning records;
- historic course and assessment records;
- issued certificates and revocations;
- transfer packages and recipient access;
- raw learner evidence;
- consent and access logs;
- correction and appeal history.

Retain only what is necessary for the stated educational, verification, legal, or audit purpose. Avoid copying the same personal data into multiple institutions or exports. Provide a documented process for correction, anonymization, and deletion where permitted, while explaining records that must be retained.

## 13. Conceptual records (not migrations)

Possible conceptual records:
- learner_record_index: learner reference and record version.
- learner_record_entries: typed reference to source evidence, issuer, date, and verification level.
- record_issuer_registry: verified issuer identity and permitted credential scope.
- record_share_requests: sender, recipient, purpose, selected sections, state, and expiry.
- record_share_items: exact selected record references and versions.
- record_access_events: append-only access and export audit.
- portable_record_exports: schema version, scope, integrity metadata, expiry, and generation status.
- credential_verification_registry: minimal verification state and issuer reference.
- record_correction_requests: affected record, reason, evidence reference, and review status.
- record_correction_events: authorized before/after reference, reason, and timestamp.
- learner_transfer_requests: sending/receiving institution, consent state, and enrollment transition.

These are conceptual only. Reuse canonical course, assessment, competition, certificate, membership, consent, and audit records as sources of truth. Avoid duplicate score or certificate stores.

## 14. Acceptance and security test plan

Use synthetic learners and at least two institutions:
1. Learner can inspect their own complete permitted record.
2. Learner A cannot read Learner B's record by guessing identifiers.
3. Guardian cannot view records outside verified relationship and consent scope.
4. Teacher sees only currently assigned learners and required educational details.
5. Institution A cannot enumerate Institution B's private learner history.
6. Receiving institution sees only records selected for an active transfer.
7. Withdrawal blocks future access where supported and does not claim to erase recipient copies.
8. Self-reported progress is never displayed as issuer-verified achievement.
9. Attendance alone never becomes a mastery credential.
10. External imported records remain unverified until issuer validation.
11. A recipient cannot edit the source issuer's record.
12. Revoked or superseded credentials are not shown as currently valid.
13. Public verification reveals only approved minimal fields.
14. Exports exclude private notes, guardian contacts, raw media, and safeguarding records.
15. Search, cache, storage, realtime, and notification paths preserve tenant and consent boundaries.
16. Corrections preserve provenance and an auditable history.
17. Duplicate transfer requests and retries are handled idempotently.
18. Expired share links no longer grant access.
19. Record summaries distinguish course completion, attendance, assessment, and mastery.
20. RTL, accessible PDF, and structured export remain readable and versioned.

## 15. Decisions required before implementation

- Which record categories are included in the first release?
- Which institutions and external issuers can be verified?
- What guardian authorization rules apply to minors in each operating jurisdiction?
- Which record sections may be shared for a transfer?
- Can receiving institutions download a copy, and how long may they retain it?
- What evidence is sufficient to verify imported external credentials?
- What correction and appeal service levels can issuers support?
- Which public credential facts are permitted?
- What retention periods apply to historic assessments and issued certificates?
- Which export formats and integrity mechanisms are required?

## 16. Explicit non-actions

This document is a design proposal only. No academic transcript, learner record dashboard, transfer workflow, export, QR verification page, issuer registry, credential, database table, SQL function, RLS policy, migration, storage object, API, or production behavior was implemented or changed. No learner academic records, guardian information, or institutional data were accessed. All proposed behavior requires academic, safeguarding, privacy, legal, product, and technical approval before implementation.
