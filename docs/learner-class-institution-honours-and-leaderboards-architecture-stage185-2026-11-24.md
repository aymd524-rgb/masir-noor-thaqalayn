# Stage 185 — Learner, Class, and Institution Honours and Leaderboards Architecture

**Date:** 2026-11-24  
**Status:** Design specification only  
**Related stages:** 160, 166, 174, 176, 179, 183, and 184.

## 1. Purpose

Design a trustworthy honours and achievement record that recognizes learning milestones and competition outcomes at learner, class, and institution levels. This is not a public popularity contest, a single universal score, or a substitute for verified academic assessment.

The system must distinguish participation, completion, assessed achievement, and formally awarded honours. It must preserve historical accuracy when a result is corrected or an award is revoked.

## 2. Honours categories

Potential categories:
- Quran memorization milestones (declared surah/juz/scope).
- Revision milestones and sustained retention, where assessed.
- Reading fluency and recitation achievements.
- Tajwid knowledge and applied recitation.
- Translation and Quran comprehension.
- Tafsir and source-grounded understanding.
- Tadabbur and reflective learning.
- Hadith, Seerah, Quranic sciences, and ethics.
- Course completion and learning-path milestones.
- Competition participation, placement, and awards.
- Class/team achievements and institution festival awards.
- Improvement and perseverance recognitions, using transparent criteria.

Every honour must have a category, criterion definition, issuing authority, evidence type, date, scope, and status. Avoid vague labels that imply scholarly certification or religious authority without a qualified issuer.

## 3. Achievement levels and evidence

Use distinct evidence states:
1. **Self-reported milestone:** learner records progress; not independently verified.
2. **Teacher-assessed achievement:** authorized teacher records an assessment against a rubric.
3. **Moderated achievement:** assessment reviewed under the relevant academic process.
4. **Competition result:** frozen and approved result tied to a specific event and rubric version.
5. **Issued honour/certificate:** formally approved by the authorized issuer.

Never silently promote a self-report into a verified award. Keep the evidence source, reviewer, rubric/version, and approval chain attached to the achievement record.

## 4. Learner honours profile

The learner's private honours page may show:
- earned achievements and their discipline;
- date and issuing class/institution/event;
- evidence status and short criterion summary;
- issued certificates and verification state;
- competition participation and finalized placements;
- corrected, superseded, or revoked status where relevant.

Learners should be able to see their own record and request correction. They must not be able to edit the issuer, score, judge decision, or verification state.

Public profile and public sharing are off by default. Any public display requires a separate opt-in and applicable guardian permission for minors. Do not reveal full birth date, contact details, private learning history, judge notes, or raw audio.

## 5. Class honours and team achievements

Class honours may include:
- completed group learning projects;
- class participation in a festival;
- verified class-level competition placements;
- collective reading or revision goals with a declared methodology;
- improvement or teamwork recognitions.

Class awards must not be calculated by simply summing unlimited learner counts where larger classes gain an automatic advantage. Publish the formula, eligible roster snapshot, minimum participation threshold, and treatment of withdrawals before the event begins.

Do not publish individual learner performance as a condition of receiving a class award. A class aggregate does not grant access to private learner records.

## 6. Institution honours and inter-institution standings

Institution-level honours may include:
- discipline-specific festival placements;
- approved aggregate class/team results;
- participation and completion recognition;
- annual educational activity awards with transparent criteria.

For inter-institution rankings:
- use the event's pre-announced aggregation formula and frozen result set;
- normalize for eligible participants or use fixed team/category points where appropriate;
- set minimum cohort thresholds and suppress small-cell breakdowns;
- distinguish provisional standings from final approved rankings;
- show only the opponent institution's approved aggregate, never its private roster, individual learner scores, appeals, or internal notes;
- preserve the institution identity/display-label policy selected for that event.

No institution should receive a higher rank merely because it has more registered accounts. Rankings must be discipline- and event-specific unless a published multi-discipline formula is used.

## 7. Leaderboard types and periods

Supported leaderboard designs:
- event-specific individual standings;
- event-specific class/team standings;
- event-specific institution standings;
- discipline-specific seasonal standings;
- academic-term or annual honours summaries;
- private learner progress milestones.

A period leaderboard must state its time window, eligible events, point formula, tie rules, result finalization rules, and treatment of corrected or revoked results. Do not create a perpetual all-time ranking by default.

Avoid a single global ranking that combines memorization, recitation, tafsir, and unrelated activities into an opaque score. If a festival uses a combined award, disclose component weights and keep each discipline's independent result visible.

## 8. Points, medals, badges, and certificates

- Points are optional recognition metadata, not currency and not a measure of personal worth.
- Medal and badge definitions must be published and versioned.
- Participation badges must not be confused with competitive placement.
- A certificate is issued only through the authorized certificate workflow (Stages 166/174/179).
- Repeated events must not inflate a learner's verified mastery status automatically.
- Avoid rewards that pressure children into excessive practice, unhealthy competition, or disclosure of private information.

## 9. Correction, appeal, and revocation

Every honour has a lifecycle such as draft, pending_review, approved, issued, corrected, superseded, or revoked. Preserve the original record and append a correction/revocation event with reason, authorized actor, timestamp, and affected certificate/result reference.

A learner or authorized guardian may submit a private correction request. The request must be reviewed by an authorized person who is not conflicted where feasible. Public standings and verification pages must update consistently after an approved correction, while retaining a minimal history for audit.

## 10. Visibility and authorization matrix

- Learner: own private achievements and own issued certificates.
- Guardian: only achievements explicitly shared for a verified linked learner and within the consent/relationship scope.
- Teacher: achievements of currently assigned learners and classes, limited to the teacher's role.
- Academic supervisor: institution/branch academic honours and moderation queues within assigned scope.
- Institution administrator: approved institution-level aggregates and authorized institution records; not another tenant's private learner details.
- Judge: assigned event entries and assessment material only; no unrestricted honours administration.
- Public/guest: only explicitly published event standings or honours with approved display fields and required consent.
- Platform operator: platform configuration and safeguarding oversight; no automatic unrestricted access to raw learner evidence.

Authorization must be checked server-side on every query, export, download, and realtime subscription.

## 11. Privacy and child safeguarding

- Private by default; no public learner leaderboard by default.
- Do not rank children by piety, popularity, family, disability, or unrelated behavior.
- Use age/level categories and fair accommodations.
- Avoid public shaming, negative rankings, streak pressure, or displaying "last place".
- Suppress small groups where aggregate data could identify a learner.
- Provide reporting and correction channels for inaccurate or harmful display.
- Keep private judge notes, raw recordings, guardian contacts, and safeguarding records out of honours cards.
- Obtain separate permission for public identity display, especially for minors.

## 12. Conceptual records (not migrations)

Possible conceptual records:
- honour_definitions: category, criterion, issuer class, version, and visibility defaults.
- learner_honours: learner, criterion version, evidence reference, status, issuer, and date.
- group_honours: class/team/institution scope, eligible roster snapshot, formula version, and result reference.
- leaderboard_definitions: period, discipline, scope, point formula, eligibility, and tie rules.
- leaderboard_snapshots: immutable computed standings, formula version, publication status, and timestamp.
- honour_review_events: approval, correction, appeal, and revocation audit events.
- honour_visibility_consents: purpose-specific public display choices and expiry.

These are conceptual only. Reuse existing competition results, certificate issues, assessment records, memberships, and audit sources where possible. Do not create duplicate sources of truth.

## 13. Calculation and data integrity

If points or aggregate standings are implemented:
- calculate on trusted server-side logic from eligible finalized records;
- store the exact formula/version and source record identifiers;
- use deterministic tie handling and idempotent recomputation;
- exclude withdrawn, void, duplicate, or superseded records according to published rules;
- make corrected results generate a new snapshot rather than silently rewriting history;
- protect against client-supplied scores, forged institution IDs, and cross-tenant aggregation;
- test totals and rankings against reproducible fixtures.

## 14. Acceptance and security test plan

Use synthetic learners, classes, and two institutions:
1. Learner can read only own private honours.
2. Guardian sees only explicitly shared honours for verified linked learner.
3. Teacher sees only assigned learners/classes.
4. Institution admin cannot query another institution's private honours.
5. Public pages expose only approved fields and consented display identities.
6. Self-reported milestones never appear as verified awards.
7. A revoked or superseded certificate is not shown as currently valid.
8. Class and institution standings use frozen roster and formula versions.
9. Large institutions do not win solely due to raw enrolment count.
10. Small-cell suppression applies to charts, exports, search, and drill-down.
11. Corrected competition results update derived standings consistently.
12. Unauthorized users cannot create, approve, edit, or revoke honours.
13. Export, search, cache, realtime, and storage paths preserve scope.
14. Public visibility can be withdrawn prospectively according to policy without corrupting the private audit record.

## 15. Decisions required before implementation

- Which honours categories are approved for initial release?
- Which achievements require teacher assessment versus academic moderation?
- Which roles may issue class and institution honours?
- Should term/annual leaderboards be enabled initially, or only event-specific standings?
- Which point systems, if any, are educationally appropriate?
- What minimum cohort size is required for aggregate display?
- Which public display fields and consent durations are allowed for minors?
- What correction and revocation retention policy applies?

## 16. Explicit non-actions

This document is a design proposal only. No leaderboard, points engine, badge, medal, honours profile, certificate, public page, database table, SQL function, RLS policy, migration, notification, storage object, Supabase setting, deployment, or production behavior was implemented or changed. No learner data was accessed. All proposed behavior requires academic, safeguarding, privacy, product, and technical approval before implementation.
