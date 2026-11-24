# Stage 184 — Guardian Learning Progress, Consent, and Family Dashboard

**Date:** 2026-11-24  
**Status:** Design specification only  
**Relationship:** Builds on Stage 167 (parent/guardian portal) and Stages 154, 161, 162, 170, 171, 179, and 183. This stage defines the family-facing learning summary and consent experience; it does not replace the existing guardian portal architecture.

## 1. Purpose

Design a safe, understandable family dashboard through which a verified guardian can follow the learner's educational journey, understand upcoming learning activities, respond to consent requests, and support the learner without receiving unrestricted access to classroom conversations, private teacher notes, judge records, or other learners' information.

## 2. Family home

The landing page should provide:
- learner profiles for only verified and currently authorized relationships;
- current course/class and responsible teacher, where disclosure is permitted;
- upcoming class sessions and learner-facing deadlines;
- a concise weekly learning summary;
- pending consent or administrative requests;
- recent teacher feedback intentionally shared with the learner/guardian;
- links to the learner's own issued certificates where guardian access is explicitly permitted.

For multiple linked learners, provide a clear learner switcher and never combine records into an ambiguous family-wide score.

## 3. Learning progress summary

Show progress by educational dimension, not a single opaque grade:
- Quran reading and fluency;
- tajwid;
- memorization;
- revision;
- translation and comprehension;
- tadabbur/reflection;
- hadith and ethics activities.

Clearly label each item as learner self-report, teacher assessment, or verified mastery. Include the assessment date, relevant period, and a short explanation of the rubric where useful. Do not imply that a self-reported completed task has been independently verified.

Avoid public comparisons, sibling comparisons, punitive streaks, or pressure-oriented language. Explain that learning pace varies and allow the teacher to record an agreed workload adjustment.

## 4. Attendance, assignments, and teacher feedback

Subject to verified relationship and configured disclosure:
- show attendance status and upcoming sessions;
- show assigned work, due dates, submission state, and whether teacher review is pending;
- show feedback specifically marked as shareable with the learner/guardian;
- provide a structured way to acknowledge a notice or request clarification;
- distinguish excused absence, cancellation, and missing attendance data.

Do not expose internal staff notes, safeguarding case details, private learner-to-teacher disclosures, or another learner's participation.

## 5. Consent center

Provide purpose-specific, understandable consent records rather than one broad all-purpose checkbox. Potential purposes include:
- participation in an event requiring guardian permission;
- optional learner audio recording and teacher review;
- optional media/publication use;
- approved off-platform communication;
- optional participation in a specific competition or trip.

For each request, show requesting organization, purpose, data involved, audience, duration/expiry, withdrawal method, and consequences of declining. Record who provided consent, authority verification, timestamp, policy version, and withdrawal. A guardian's consent must not override the learner's age-appropriate assent or applicable safeguarding rules.

Consent for one event must not automatically authorize another event or public publication.

## 6. Competitions and certificates

The family dashboard may show:
- invitations awaiting the learner/guardian response;
- competition discipline, scope (class, institution, or platform-wide), age/level category, rules, schedule, and published rubric;
- consent status and registration confirmation;
- learner's own result and feedback after the authorized release time;
- own issued certificate, if guardian download is permitted by policy.

Do not reveal other learners' private scores, judge notes, appeal evidence, or institution-only standings. A platform-wide public result must still obey the event's identity and minor-privacy settings. Guardian consent is not a substitute for event eligibility or the learner's own acceptance where required.

## 7. Communication and notifications

Use moderated, purpose-bound communication:
- class announcements and teacher notices;
- structured questions about assignments or schedules;
- consent requests and event updates;
- quiet hours, channel preferences, and digest options.

Do not introduce unrestricted adult-to-child or learner-to-learner private messaging through the family dashboard. Notifications should avoid exposing sensitive details on lock screens and shared devices.

## 8. Relationship verification and access lifecycle

- Verify guardian relationship through an approved institution workflow before exposing learner data.
- Support more than one authorized guardian where appropriate, with separate identity and consent records.
- Support relationship expiry, revocation, custody/safety restrictions, and disputed relationship review.
- Re-check authorization on every request and download; do not rely on a previously opened dashboard.
- When a relationship is revoked, invalidate relevant sessions, caches, signed links, and realtime subscriptions.
- Do not disclose the reason for a sensitive restriction to an unauthorized party.

## 9. Privacy, security, and data minimization

- Default to the minimum useful family summary.
- Keep phone numbers, addresses, private notes, raw audio, and safeguarding records outside ordinary progress cards.
- Apply tenant, learner, relationship, and purpose scopes server-side.
- Do not treat a user-editable profile relationship field as proof of guardianship.
- Exports must be optional, scoped, time-limited, audited, and minimized.
- Shared-device logout and cache-clearing behavior must be considered.
- Apply accessible RTL-first mobile layouts, clear language, and low-bandwidth support.

## 10. Conceptual records (not migrations)

Potential conceptual records:
- guardian_dashboard_preferences;
- guardian_shared_progress_items;
- guardian_consent_requests;
- guardian_consent_decisions;
- guardian_notice_acknowledgements;
- guardian_relationship_review_events.

These names are illustrative only. Reuse verified relationship, consent, notification, attendance, assignment, and certificate sources where possible; do not create duplicate sources of truth.

## 11. Acceptance and security tests

Use synthetic families, learners, and two institutions:
1. A guardian sees only learners linked through a verified active relationship.
2. An unverified or revoked guardian cannot read learner progress or download a certificate.
3. A guardian linked to Learner A cannot enumerate Learner B by changing an identifier.
4. One guardian's consent does not automatically represent another guardian or another learner.
5. Declining optional audio/publication consent does not block unrelated learning access.
6. Guardian sees only feedback marked for sharing, not private teacher notes.
7. Self-reported completion is visibly distinct from teacher-assessed and verified mastery.
8. Competition pages reveal only the learner's own result and authorized aggregate standings.
9. Shared-device logout removes cached private learner data and invalidates access to expired signed links.
10. Notifications do not leak sensitive details to lock screens or unauthorized family members.
11. Exports and realtime channels enforce the same relationship and tenant scope as page reads.
12. Relationship revocation takes effect on subsequent requests and invalidates stale access paths.

## 12. Decisions required before implementation

- Which progress dimensions should be visible to guardians by default?
- Which teacher feedback categories are shareable, and who controls that designation?
- What relationship verification and periodic re-verification process is acceptable?
- Which consent purposes require both guardian permission and learner assent?
- May guardians download issued certificates, or should this remain learner-only by default?
- What retention period applies to consent evidence and family exports?
- How should disputes or conflicting guardian permissions be escalated safely?

## 13. Explicit non-actions

This document does not implement a guardian portal, expose learner records, change consent settings, add database tables, modify RLS, create migrations, change Auth or storage configuration, issue certificates, send notifications, deploy, merge, or modify live Supabase data. All behavior remains a proposal pending safeguarding, product, legal, academic, privacy, and technical review.
