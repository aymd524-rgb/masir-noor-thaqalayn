# Stage 186 — Platform Help Center, Support Requests, and Safeguarding Reporting Architecture

**Date:** 2026-11-24  
**Status:** Design specification only  
**Related stages:** 157, 158, 167, 168, 176, 183, and 184.

## 1. Purpose and boundaries

Design a unified help center and support-request workflow for learners, guardians, teachers, institution staff, and platform operators. It must distinguish ordinary product support, academic/course questions, account access problems, payment disputes, content corrections, and safeguarding concerns.

This is a design proposal, not a claim that support or reporting features currently exist. It does not replace emergency services, institutional safeguarding duties, qualified professional care, or formal legal reporting obligations.

## 2. Entry points and help center

Provide a searchable help center reachable without signing in for public product guidance and from authenticated role-specific dashboards for contextual help.

Content types:
- getting started, account and sign-in guidance;
- learner and guardian instructions;
- teacher, class, and institution administration guides;
- course enrollment, certificates, competition, and payment help;
- Quran content provenance, correction, and accessibility guidance;
- privacy, consent, account security, and data requests;
- known issues, service notices, and maintenance explanations.

Each article should include owner, audience, language, version, last-reviewed date, status, and escalation route. Draft, reviewed, published, archived, and superseded states must be distinct. High-impact policy and safeguarding articles require designated human review before publication.

## 3. Support request categories

Use separate categories with different routing and access rules:
1. Technical issue or bug report.
2. Account access, profile, or role problem.
3. Course, class, assignment, or teacher support.
4. Quran text, translation, recitation, or educational-content correction.
5. Certificate, competition, or assessment appeal.
6. Payment, refund, receipt, or scholarship inquiry.
7. Privacy, consent, data access, or account deletion request.
8. Safety, harassment, inappropriate communication, or safeguarding concern.

Do not force a reporter to select a sensitive category to submit a general support request. Provide a clear route to change category and a human escalation path.

## 4. Ticket lifecycle and service expectations

Suggested lifecycle:
- draft;
- submitted;
- triaged;
- awaiting_reporter;
- assigned;
- in_progress;
- escalated;
- resolved;
- closed;
- reopened.

Record every transition with server timestamp, authorized actor, and minimal reason. A ticket must not be silently deleted or closed to hide an unresolved concern. Reopening should preserve the prior resolution history.

Publish realistic response targets only after staffing and operational capacity are confirmed. Show the reporter the current status and next expected step without exposing internal notes, staff identities where unsafe, or other users' information.

## 5. Identity, role, and tenant scope

- Anonymous visitors may read public help articles and submit a limited public-site issue without being given access to account records.
- An authenticated learner may view and update only their own ordinary support requests.
- A verified guardian may act only within the learner relationship and consent scope already established in Stage 167/184.
- A teacher may submit personal support requests and may receive class-related support only for classes currently assigned to them.
- Institution staff may view institution-scoped operational requests only when explicitly authorized.
- Platform support staff receive least-privilege access through a separate support permission, not by assuming that every support worker is a platform administrator.
- Safeguarding specialists receive access only to cases assigned to their function and only to information necessary for safe handling.
- Cross-institution support access must not reveal another tenant's roster, learner history, grades, recordings, or private communications.

Every ticket read, search, assignment, export, attachment download, and status change must be authorized server-side. Client-side filters are not an authorization boundary.

## 6. Safeguarding and sensitive reports

Safety reports require a separate restricted workflow, not an ordinary ticket queue. Examples include harassment, coercion, threats, inappropriate contact, or concerns about a learner's safety.

Required safeguards:
- Provide a calm, age-appropriate explanation of what happens after submission.
- Do not promise absolute secrecy; explain that information may be shared with designated safeguarding personnel when necessary to protect someone or meet applicable obligations.
- Collect only the minimum details needed to understand and route the concern.
- Do not require a child to confront the person named in a report or to investigate the concern.
- Do not expose the report to the accused person, ordinary teachers, other learners, or unrelated institution staff.
- Prevent the subject of a report from being assigned as its reviewer.
- Provide a safe follow-up method and allow a reporter to indicate whether contacting them could create additional risk.
- Define escalation, urgent triage, conflict-of-interest handling, preservation, and closure rules with qualified safeguarding and legal review.
- Make clear that the platform is not an emergency response service; provide locally appropriate emergency guidance only after jurisdiction and policy have been established.

The platform must not use automated sentiment or risk scores as the sole basis for dismissing, prioritizing, or substantiating a report. Automation may assist routing only under reviewed policy and human oversight.

## 7. Content correction and educational review

For reports about Quran text, translation, recitation, tafsir, hadith, or lesson content:
- capture the exact content identifier and version where possible;
- distinguish typographical correction from scholarly disagreement, licensing complaint, or safety concern;
- preserve the published canonical Uthmani text as an immutable source version until an authorized editorial correction is approved;
- route religious-content questions to qualified reviewers and record source references and review outcomes;
- do not allow ordinary support agents to alter canonical text or mark a hadith authentic;
- publish a correction notice and version history when an approved change materially affects learners.

A report is a signal for review, not proof that the content is incorrect.

## 8. Attachments and privacy

Attachments should be optional. Apply file-type and size allowlists, malware scanning, private storage, short-lived authorized downloads, and retention limits. Strip unnecessary metadata where feasible.

Do not request passwords, one-time codes, payment-card numbers, government identifiers, or full private chat exports in support forms. Warn users not to upload sensitive personal information. Provide a safer account-verification workflow that never asks support staff to learn or repeat a password or authentication secret.

Separate ordinary support attachments from highly restricted safeguarding evidence. Restrict access and downloads, log every access, and apply a documented preservation/deletion schedule reviewed by qualified personnel.

## 9. Communication and notifications

Use in-app ticket threads for structured follow-up. Email or push notifications should contain minimal information and link back to an authenticated, authorized view; never include sensitive report details, private learner records, or attachments in notification previews.

For minors:
- avoid unsolicited one-to-one private messaging between adult support staff and learners;
- use moderated, auditable communication channels;
- apply guardian notification rules only where appropriate, lawful, and safe;
- do not automatically notify a guardian when doing so could increase risk; route such cases to the safeguarding policy and qualified reviewer;
- provide quiet hours and notification preferences for ordinary support.

## 10. Knowledge base feedback and service status

Allow readers to indicate whether an article helped, without exposing their identity publicly. Aggregate feedback only above a privacy threshold.

A public service-status page may show service availability, known incidents, and maintenance windows. It must not reveal security-sensitive incident details, internal infrastructure identifiers, affected learner identities, or exploitable operational information.

Incident notices should distinguish confirmed facts, investigation status, mitigation, and resolution. Avoid unsupported claims that data was or was not accessed.

## 11. Conceptual records (not migrations)

Possible conceptual records:
- help_articles: slug, locale, audience, version, owner, review state, publication dates.
- support_requests: requester, category, tenant scope, status, priority, created/updated timestamps.
- support_messages: request, author scope, visibility, body, created timestamp.
- support_assignments: request, assigned team, authorized assignee, assignment history.
- support_events: append-only status and routing audit.
- support_attachments: private object reference, classification, scan status, retention deadline.
- safeguarding_cases: separate restricted case identifier, intake channel, assigned specialist, severity workflow, and restricted status.
- safeguarding_access_events: append-only record of sensitive case access.
- content_correction_reports: content identifier/version, issue type, source details, review decision.
- service_incidents: public-safe summary, status, impact window, and update history.

These are conceptual only. Reuse existing identity, institution membership, consent, content-version, and audit sources where appropriate. Avoid duplicating user identity or tenant authority.

## 12. Retention, deletion, and audit

Define retention by category rather than applying one duration to all tickets. Ordinary technical requests, payment records, privacy requests, content corrections, and safeguarding cases may have different legal and operational requirements.

- Keep an append-only minimal event history for accountability.
- Restrict access to message bodies and attachments separately from metadata.
- Support lawful deletion or anonymization where permitted without destroying records that must be retained.
- Document legal holds, access review, breach response, and secure disposal.
- Never use support content to train public models or for unrelated marketing without a separately reviewed lawful basis and clear user choice.

## 13. Accessibility and localization

Support Persian RTL as a first-class layout, with correct mixed Persian/Arabic/Latin rendering, keyboard navigation, screen-reader labels, readable error messages, and low-bandwidth submission. Design the content model for additional locales without duplicating ticket authority or tenant boundaries.

Use plain language suitable for the intended age group. Avoid relying on color alone for status and provide accessible alternatives to attachment-only instructions.

## 14. Operational metrics

Track aggregate operational indicators such as:
- volume by category and time period;
- time to first human response and resolution;
- reopened and escalated request rates;
- article usefulness and unresolved search terms;
- backlog by authorized support team;
- content correction review time.

Do not rank individual support staff or institutions using raw ticket counts without context. Do not expose safeguarding case metrics at a granularity that could identify a reporter or subject.

## 15. Acceptance and security test plan

Use synthetic users, two institutions, and isolated safeguarding test cases:
1. Learner cannot read another learner's ticket by guessing its identifier.
2. Guardian cannot view a ticket outside verified relationship and consent scope.
3. Teacher cannot access unassigned classes or institution-wide support queues.
4. Institution staff cannot read another tenant's support messages or attachments.
5. Ordinary support agents cannot access safeguarding case bodies by default.
6. A conflicted reviewer cannot be assigned a safeguarding case involving them.
7. Ticket status transitions are authorized and audited.
8. Email/push previews contain no sensitive message body or attachment.
9. Attachments are private, scanned, size/type constrained, and access logged.
10. Content correction reports cannot directly modify canonical Quran or hadith content.
11. Search, exports, realtime, caches, and storage preserve the same access scope.
12. Retention jobs preserve required audit records and correctly dispose of expired attachments.
13. A reporter can safely indicate that a particular follow-up channel is unsafe.
14. Public service notices disclose no private or exploitable incident details.
15. RTL, keyboard, screen-reader, and low-bandwidth flows remain usable.

## 16. Decisions required before implementation

- Which team owns ordinary support and which qualified function owns safeguarding?
- What response targets can staffing realistically meet?
- Which categories are available to signed-out visitors?
- What guardian notification and exception policy is lawful and safe in each operating jurisdiction?
- What retention periods apply to each request and evidence category?
- Which staff roles may access payment disputes, privacy requests, and content correction queues?
- What escalation process and external referral guidance are approved?
- Which locales and accessibility standards are required for initial release?

## 17. Explicit non-actions

This document is a design proposal only. No help center, support ticket form, messaging queue, safeguarding report form, staff console, database table, SQL function, RLS policy, migration, storage bucket, notification, service-status page, support account, or production behavior was implemented or changed. No learner or support data was accessed. All proposed behavior requires product, safeguarding, privacy, legal, accessibility, and technical approval before implementation.
