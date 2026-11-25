# Stage 177 — Mobile-first Quran learner and teacher experience

**Date:** 2026-11-24  
**Status:** Product and UX architecture proposal; documentation only  
**Scope:** Android-first responsive web/PWA experience for learners, teachers, and institution-scoped administrators.

## 1. Purpose and product boundary

Define a coherent, accessible mobile experience for the Quran learning platform without assuming that a native Android application, APK, app-store release, or production PWA pipeline already exists. The initial delivery target should be a responsive web experience that works well on common Android phone browsers. PWA installation is a later implementation option subject to a verified build and hosting pipeline.

The experience must serve children, teenagers, adults, teachers, and authorized institution staff while preserving role boundaries, learner privacy, source integrity, and low-bandwidth usability.

## 2. Experience principles

- Mobile-first layouts, progressive enhancement for tablets and desktop, and Persian/Arabic RTL as first-class layouts rather than mirrored afterthoughts.
- Clear, calm screens with a small number of primary actions; avoid manipulative streaks, public leaderboards, urgency prompts, or shame-based progress messaging.
- Keep Quran text, translation, tafsir, hadith, teacher commentary, and AI-generated explanations visibly distinct.
- Canonical Quran display uses the approved Uthmani script and verified edition/source metadata. Search normalization must never alter the displayed canonical text.
- Every role-sensitive screen and action is subject to server-side authorization; hiding a menu item is not a security control.
- Respect varied reading ability, age, device capability, network quality, and accessibility needs.

## 3. Learner mobile home

The learner home should prioritize the next useful learning action, not a dense analytics dashboard. Proposed sections:

1. Today's memorization task and its assigned ayah range.
2. Today's revision tasks, clearly distinguished from new memorization.
3. Next class/session and relevant class announcement.
4. Pending assignments and teacher feedback.
5. Recent learning activity and progress by skill dimension.
6. Notifications with clear read/unread state and user-controlled preferences.

Progress labels must distinguish learner self-report, teacher assessment, and verified mastery. A learner must never be shown another learner's private progress or class records.

## 4. Quran reader and memorization workspace

- Present surah/ayah navigation, readable Uthmani text, verse selection, bookmarks, and private notes with simple touch controls.
- Preserve exact canonical ayah boundaries and source/edition metadata.
- Audio controls must identify reciter, riwaya, source, and licensing/access conditions. Audio playback must not imply that audio metadata is Quran text.
- Support repeat-ayah and bounded passage practice as user-controlled study tools; do not infer mastery solely from playback or repetition.
- Keep translation, tafsir, tadabbur prompts, hadith, and teacher material in separate labeled panels.
- Provide adjustable text size, line spacing, contrast, and optional distraction-reduced reading mode.
- Avoid placing unrelated social or promotional controls inside the mushaf reading surface.

## 5. Teacher mobile home and classroom workflow

Teacher navigation should expose only assigned classes and authorized work queues. Suggested home sections:

- Assigned classes and upcoming sessions.
- Attendance actions for the relevant session roster.
- Assignments to create, review, or return for revision.
- Memorization and revision review queue.
- Recent learner submissions and teacher feedback tasks.
- Class announcements and approved learning resources.

Teacher class switching must re-check membership and authorization. A teacher must not gain access to a class merely by guessing its URL or identifier. Bulk actions require clear scope, confirmation, and auditability; destructive or irreversible actions should not be optimized for accidental one-tap use.

## 6. Institution and platform administration

Administrative views must be scoped to the selected institution and branch. Platform-level administration, institution ownership, branch coordination, academic supervision, and finance permissions remain distinct capabilities. A user belonging to multiple institutions must see an explicit active context and must not accidentally mix rosters, reports, certificates, or financial data across tenants.

Use progressive disclosure for complex administrative tasks. High-impact actions such as role changes, membership revocation, certificate issuance, and financial adjustments require explicit confirmation and auditable reasons where appropriate.

## 7. Navigation, routes, and deep links

- Define separate learner, teacher, guardian, and administrator navigation models.
- Use stable, human-readable route patterns where practical; avoid leaking personal information in URLs.
- Deep links to classes, assignments, Quran passages, submissions, and certificates must re-check authentication, current role, institution membership, class assignment, and resource ownership on the server.
- Expired sessions should return the user to a safe sign-in/recovery path without displaying stale private data.
- Role demotion, membership revocation, logout, and institution switching must invalidate previously cached authorization assumptions.
- Do not treat client-side route guards as substitutes for RLS and server-side checks.

## 8. Responsive design and accessibility

- Design and test narrow Android viewports first, then larger phones, tablets, and desktop.
- Use touch targets with comfortable spacing; avoid dense tables and hover-only interactions on phones.
- Support keyboard navigation, screen readers, semantic headings, visible focus, accessible labels, and meaningful error announcements.
- Ensure Arabic and Persian shaping, bidirectional punctuation, numerals, mixed-language labels, and text selection behave correctly.
- Provide captions or transcripts for instructional media where available.
- Respect system font scaling and avoid clipping Quranic diacritics or accessibility text.
- Test contrast in light and dark themes without relying on color alone to communicate status.

## 9. PWA and offline behavior — proposed, not configured

If a PWA is implemented after pipeline verification:

- Cache only approved public or explicitly authorized learning content, with licensing and retention conditions respected.
- Offline Quran reading may use a verified, versioned content package; show its edition/version and last update.
- Keep private learner records, teacher notes, submissions, and account data out of shared or public caches.
- Any private offline data requires a documented threat model, device-protection assumptions, and secure account separation; do not promise encryption unless implemented and tested.
- Queue eligible offline submissions with idempotency keys and visible pending/synced/failed states.
- Do not overwrite server changes silently. Conflicts must be surfaced and resolved using a documented policy.
- On logout, account switch, institution switch, or access revocation, purge private cached data and queued actions that are no longer authorized.
- Offline mode must not falsely report that an attendance entry, assessment, or assignment has reached the server.

## 10. Notifications and safeguarding

- Request browser/device notification permission only after explaining the benefit and only following an explicit user action.
- Provide category controls, quiet hours, and an easy way to disable reminders.
- Default lock-screen notifications to minimal, non-sensitive wording; do not reveal grades, private notes, Quran assessment details, or personal information.
- Keep classroom communication moderated; no unrestricted learner-to-learner direct messaging in the initial design.
- Provide age-appropriate reporting and escalation routes, guardian controls only within verified and consented scope, and no public ranking by default.
- Avoid behavioral profiling, invasive tracking, and advertising-oriented analytics for minors.

## 11. Performance and resilience

- Set measurable budgets for initial route load, JavaScript, images, and audio; establish targets only after measuring representative low-end Android devices and constrained networks.
- Use pagination or bounded date windows for attendance, grades, hifz history, notifications, and teacher queues.
- Lazy-load nonessential media; provide user-controlled audio quality where supported and licensed.
- Include clear loading, empty, offline, permission-denied, session-expired, and retry states.
- Retry only safe/idempotent operations automatically. Never show a success state before server confirmation.
- Preserve user-entered drafts carefully, with clear disclosure when data is stored locally.

## 12. Privacy-preserving analytics

Collect only events needed to diagnose usability and reliability. Prefer aggregated operational metrics over individual behavioral histories. Do not collect Quran notes, private teacher feedback, audio recordings, phone numbers, or detailed child activity as analytics payloads. Document event purpose, retention, access, and deletion before implementation; disable nonessential tracking by default for minors.

## 13. Proposed navigation map

### Learner
Home · Quran · Memorization & revision · Classes · Assignments · Progress · Notifications · Profile

### Teacher
Home · My classes · Attendance · Assignments · Review queue · Hifz records · Resources · Announcements · Profile

### Guardian
Linked learners · Approved progress summary · Schedule · Notifications · Consent and privacy settings

### Institution administrator
Institution overview · Branches · Memberships · Courses/classes · Content operations · Certificates · Reports · Audit

The guardian and administrator surfaces must remain separate from learner and teacher views and be permission-scoped.

## 14. Verification matrix before implementation

| Area | Required checks |
|---|---|
| Viewports | Common Android widths, orientation changes, tablet and desktop layouts |
| RTL and text | Persian/Arabic shaping, Uthmani diacritics, mixed-direction content, selection and copy |
| Accessibility | Screen reader, keyboard, focus order, font scaling, contrast, captions |
| Authorization | Deep-link access, role demotion, membership revocation, cross-class and cross-tenant denial |
| Offline | Offline read, queued submission, retry, conflict, logout purge, account/institution cache isolation |
| Quran content | Canonical edition/version, ayah boundaries, source attribution, audio riwaya and license metadata |
| Notifications | Opt-in, category preferences, quiet hours, minimal lock-screen content |
| Reliability | Session expiry, network loss, server rejection, duplicate submission and idempotent retry |
| Privacy | No sensitive analytics payloads, no unauthorized guardian/teacher visibility, retention review |
| Performance | Representative low-end Android device and constrained-network measurements |

Use synthetic accounts and synthetic tenant/class data in staging. Do not test cross-tenant denial using real learner records.

## 15. Dependencies and decisions still required

- Confirm supported Android browser/version baseline and whether PWA installation is a product requirement.
- Verify an existing build/hosting pipeline before committing to service-worker or installability work.
- Approve the canonical Uthmani text edition and audio licensing/catalog sources.
- Decide the permitted offline data classes and retention behavior.
- Define notification categories, guardian consent boundaries, and quiet-hour defaults.
- Agree on performance budgets after baseline measurement.
- Confirm analytics governance and age-appropriate consent requirements.

## 16. Explicit non-actions

This stage is a design document only. No application code, routes, navigation, responsive styles, service worker, PWA manifest, native Android build, APK, app-store listing, analytics, notification provider, storage policy, database schema, RLS policy, SQL function, migration, Supabase setting, deployment, merge, or production configuration was changed. No learner or institution data was accessed. All behaviors described above are proposals pending implementation, testing, and separate authorization.
