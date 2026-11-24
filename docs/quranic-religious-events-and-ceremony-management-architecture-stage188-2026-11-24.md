# Stage 188 — Quranic and Religious Events, Ceremonies, and Festival Management Architecture

**Date:** 2026-11-24  
**Status:** Design specification only  
**Related stages:** 157, 161, 162, 163, 166, 176, 179, 183, 184, 186, and 187.

## 1. Purpose and scope

Design a unified event-management capability for Quranic and educational gatherings, religious occasions, recitation circles, memorization festivals, course graduations, award ceremonies, workshops, and institution-wide programs.

Events may be organized at class, branch, institution, invited-institution, or platform-wide scope. An event is not automatically a competition: ordinary gatherings, learning sessions, ceremonies, and community programs must have appropriate workflows without competitive scoring.

This is a design proposal only. It does not create events or change production behavior.

## 2. Event types

Initial event catalogue may include:
- Quran recitation and tilawah gatherings;
- hifz and muraja'ah festivals;
- tajwid and reading workshops;
- tafsir, tadabbur, translation, and Quranic sciences seminars;
- hadith, Seerah, ethics, and Islamic learning sessions;
- religious occasion programs and commemorations;
- course opening and graduation ceremonies;
- teacher development and academic workshops;
- family and guardian orientation sessions;
- institution open days and inter-institution festivals;
- online webinars and hybrid gatherings.

Event type metadata should identify whether registration, guardian consent, attendance, judging, certificates, capacity limits, or special accessibility arrangements are applicable.

## 3. Event scope and ownership

Supported scopes:
1. Class or cohort event.
2. Branch event.
3. Institution-wide event.
4. Joint event between named institutions.
5. Platform-wide public or eligible-member event.
6. Private invitation-only event.

The organizer must hold an explicit permission at the relevant scope. An institution organizer cannot claim another institution as a co-host without its authorized acceptance. Platform-wide events must be created or approved by a platform-level event role.

Every event has one accountable owner and may have multiple authorized co-organizers. Ownership transfer, cancellation, and co-host acceptance must be audited.

## 4. Event lifecycle

Suggested lifecycle:
- draft;
- pending_review;
- approved;
- registration_open;
- registration_closed;
- scheduled;
- in_progress;
- completed;
- results_pending (only where judging applies);
- published;
- cancelled;
- archived.

State transitions must be server-validated. A cancelled event preserves its history and communicates the cancellation and any next steps to registrants. Rescheduling must preserve the original schedule and record the revised version.

## 5. Event details and schedule

Event page fields may include:
- title, description, event type, language, and age/level suitability;
- host institution and branch, with accepted co-hosts;
- date, local timezone, start/end time, and session agenda;
- physical venue, online meeting details, or hybrid participation instructions;
- registration opening/closing and capacity;
- audience eligibility and participation requirements;
- accessibility arrangements and contact route;
- organizer contact through an approved moderated channel;
- consent, photography/recording, and privacy notices;
- cancellation and attendance policy.

Do not expose private venue or meeting access details to non-registrants when the event is restricted. Avoid collecting a participant's home address.

## 6. Registration and eligibility

Registration modes:
- open to eligible platform members;
- class roster;
- institution/branch membership;
- invitation only;
- guardian-assisted registration where required;
- team or group registration.

Eligibility may depend on age band, learning level, course enrollment, institution membership, or event discipline. The rules must be published before registration opens and evaluated server-side.

Registration states may include invited, pending_consent, pending_review, confirmed, waitlisted, declined, withdrawn, attended, no_show, and disqualified where relevant. Do not treat invitation as confirmed participation.

Prevent duplicate registration while allowing an authorized guardian or teacher to assist within defined scope. A teacher must not register an entire class without the applicable notice and permission.

## 7. Capacity, waitlists, and changes

- Capacity should be optional for events without physical or online limits.
- Use transaction-safe capacity allocation to prevent overbooking under concurrent registration.
- Waitlist order and promotion rules must be transparent.
- A promoted participant receives a time-limited confirmation opportunity where appropriate.
- Record withdrawals and release capacity safely.
- For group registration, define whether capacity counts individuals or teams.
- Do not use hidden priority rules; any priority for accessibility, age category, or institution cohort must be published and reviewed.

## 8. Agenda, sessions, and program roles

An event may contain multiple sessions with:
- session title and description;
- scheduled time and timezone;
- room, venue, or online location;
- presenter, reciter, instructor, judge, or host role;
- participant capacity and attendance rules;
- required materials and accessibility notes.

Role assignment must be explicit and scoped to the event. A judge role for one competition does not grant broad access to institution records. A presenter does not automatically gain access to participant contact details.

## 9. Attendance and participation records

Attendance may be recorded by authorized event staff using:
- manual roster marking;
- approved check-in code or QR token;
- online session attendance confirmation;
- session-specific participation record.

Attendance status should distinguish present, late, excused, absent, withdrawn, and unknown. A QR code must be short-lived or event-scoped, non-guessable, and validated server-side; it must not expose participant details.

Attendance records are not proof of mastery or religious achievement. If an event includes a separate assessed activity, its results belong to the relevant assessment/competition workflow.

## 10. Competitions and awards integration

Where an event includes a competition:
- reuse the discipline, invitation, rubric, judge assignment, appeal, and standings architecture from Stage 179;
- freeze the applicable rubric and eligibility rules before the event starts;
- distinguish event attendance from competition entry and result;
- show provisional and final result states;
- use the honours and certificate governance from Stages 166, 174, and 185;
- avoid duplicate participant profiles or separate competing sources of truth.

Non-competitive events must not display scores, rankings, or winner labels by default.

## 11. Certificates and participation recognition

Participation certificates may be offered only when configured by an authorized organizer and issued through the established certificate workflow.

- Certificate header, issuer, course/event title, and authorized signatories follow Stage 166.
- Attendance eligibility must be explicit and must not be inferred from registration alone.
- A participation certificate must not imply a judged award or mastery credential.
- Learners may download only their own finalized issued certificates.
- Corrections and revocations must preserve audit history.
- A draft or print-ready unsigned copy must be clearly distinguished from a formally issued certificate.

## 12. Notifications and communication

Use Stage 162 notification preferences and quiet hours for:
- registration confirmation and waitlist updates;
- schedule changes and venue information;
- reminders and required preparation;
- cancellation and follow-up materials;
- certificate availability and final results.

Notifications should include minimal information and direct users to an authorized event page. Do not expose private participant lists or contact details in group messages.

For minors, avoid unmoderated direct messaging with adult organizers. Use event announcements and moderated question channels, with guardian communication governed by verified relationship and safety policy.

## 13. Online, in-person, and hybrid safeguards

For online events:
- protect meeting links and passwords;
- provide host controls, waiting rooms, and moderation;
- do not publish participant identities or recordings by default;
- clarify whether recording is enabled and obtain appropriate consent.

For in-person events:
- publish venue and arrival guidance appropriate to the audience;
- define check-in and authorized pickup/guardian procedures where applicable;
- provide accessibility and emergency contact information under approved local policy;
- do not collect unnecessary location or family information.

For hybrid events, apply the stricter relevant privacy and access controls to each participation mode.

## 14. Photography, audio, and video consent

Recording and photography must be separate, optional purposes with clear notices. Attendance or course access should not be conditioned on optional publicity consent.

- Specify whether images, audio, or video will be captured.
- State intended audience, channels, retention, and withdrawal process.
- For minors, follow applicable guardian permission and learner assent requirements.
- Provide a practical non-recorded participation option where feasible.
- Do not publish a participant's full name, school/class, location, or image without appropriate authorization.
- Keep event recordings in private storage with role-scoped access and retention rules.
- Do not allow attendees to download other learners' raw recordings by default.

## 15. Accessibility and inclusion

Event setup should capture accessibility needs only when necessary and with appropriate privacy. Support:
- step-free access and seating considerations;
- captions or transcripts for online sessions;
- readable schedules and low-bandwidth materials;
- quiet participation options where feasible;
- age-appropriate session durations and breaks;
- alternative participation when travel or connectivity is unavailable.

Do not make sensitive disability or health information visible to ordinary registrants. Offer a private, restricted route for accommodation requests.

## 16. Multi-tenant visibility and permissions

- Public visitors see only events explicitly published as public.
- Learners see events open to their eligibility scope and their own registrations.
- Guardians see only events for verified linked learners and within applicable consent.
- Teachers manage events only for assigned classes or delegated institution scope.
- Branch coordinators manage branch events only.
- Institution administrators manage their institution's events and accepted joint events.
- Platform event administrators manage platform-wide events and templates.
- Judges and presenters see only the event data required for their assigned duties.

Enforce authorization server-side on event details, registration, attendance, exports, files, notifications, and realtime channels. Tenant boundaries must be preserved even when institutions co-host an event.

## 17. Event analytics and reports

Organizer reports may include:
- registration totals and status breakdown;
- attendance by session and aggregate age/level band where safe;
- capacity and waitlist utilization;
- participant feedback aggregates from Stage 187;
- completion of event tasks and certificate issuance;
- competition results through the dedicated competition workflow.

Suppress small groups and avoid exposing participant-level attendance or contact data to unauthorized co-hosts. Separate registrations, attendance, learning assessment, and competition results in all reports.

## 18. Conceptual records (not migrations)

Possible conceptual records:
- events: owner scope, type, title, schedule, timezone, status, visibility.
- event_hosts: host organization, role, acceptance state, and scope.
- event_sessions: agenda, presenter, location, capacity, and schedule.
- event_eligibility_rules: audience, age/level band, membership and registration conditions.
- event_registrations: participant, status, consent state, and eligibility snapshot.
- event_waitlist_entries: queue position, promotion state, and expiry.
- event_attendance: session, participant, status, recorder, and timestamp.
- event_assets: private media/material references, license, and visibility.
- event_consent_records: notice version, purpose, guardian/participant choices, and timestamp.
- event_change_events: append-only schedule, ownership, cancellation, and status history.

These are conceptual only. Reuse existing membership, consent, notification, competition, certificate, attendance, and audit sources where possible.

## 19. Integrity, abuse prevention, and operational controls

- Use server-side eligibility and capacity checks.
- Make registration and check-in idempotent.
- Prevent forged host institution IDs and unauthorized co-host invitations.
- Rate-limit abusive registrations while preserving accessible alternatives.
- Require review for public event descriptions, uploaded media, and external links.
- Define incident, cancellation, and organizer handover procedures.
- Avoid public attendee directories and bulk participant exports by default.
- Keep payment lifecycle separate from registration; use Stage 175 course-finance and payment controls if an event has a fee.
- Never store card credentials or rely on client-supplied payment success.

## 20. Acceptance and security test plan

Use synthetic learners, guardians, teachers, branches, and two institutions:
1. Public visitor cannot see private event details or meeting links.
2. Learner cannot register outside published eligibility.
3. Guardian cannot register or inspect an unrelated learner.
4. Teacher cannot create events for an unassigned class.
5. Institution A cannot edit or enumerate Institution B's private events.
6. Co-host access begins only after authorized acceptance and is limited to agreed scope.
7. Concurrent registrations cannot exceed capacity.
8. Waitlist promotion follows published order and expiry rules.
9. A QR check-in token cannot be reused outside its event/session or after expiry.
10. Attendance does not automatically create a mastery result or competition placement.
11. Optional recording consent is separate from registration and can be withdrawn prospectively.
12. Judges cannot access unrelated institution or learner records.
13. Certificate issuance requires attendance/award criteria and authorized approval.
14. Cancellation and rescheduling preserve history and notify registrants safely.
15. Exports, search, storage, notifications, cache, and realtime preserve tenant scope.
16. Small-group analytics do not reveal identifiable participant details.
17. Online event links are not visible to non-registrants.
18. RTL, keyboard, screen-reader, and low-bandwidth registration remain usable.

## 21. Decisions required before implementation

- Which event types and scopes are included in the first release?
- Which roles may create platform-wide, institution-wide, branch, or class events?
- Which events require academic or safeguarding review before publication?
- What age/level categories and guardian permission rules apply?
- What are the approved capacity and waitlist policies?
- Which check-in methods are acceptable for online and in-person events?
- What photography, recording, and retention policies apply?
- Which event costs, refunds, or scholarships are supported?
- What accessibility commitments and operational response targets can organizers meet?

## 22. Explicit non-actions

This document is a design proposal only. No event calendar, event page, registration workflow, QR check-in, attendee list, schedule, notification, media asset, certificate, competition, database table, SQL function, RLS policy, migration, payment integration, or production behavior was implemented or changed. No learner, guardian, or event data was accessed. All proposed behavior requires product, academic, safeguarding, privacy, legal, accessibility, and technical approval before implementation.
