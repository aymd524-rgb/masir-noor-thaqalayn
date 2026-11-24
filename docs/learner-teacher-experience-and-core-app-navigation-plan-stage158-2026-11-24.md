# Stage 158 — Learner, Teacher, and Core App Experience Plan
Date: 2026-11-24
Status: design/documentation only; not implemented.

## 1. Purpose and boundaries
Define a coherent, accessible navigation and page model for Masir Noor Thaqalayn. This document is a product and UX specification, not evidence that any page, route, permission, or feature is implemented. Existing routes and components must be inventoried before implementation; do not assume this proposal matches the current UI.

## 2. Information architecture
Use role-aware navigation, while treating server-side authorization—not hidden links—as the security boundary.

- Public: Home, About, learning paths/catalog, course details, Quran reader preview, sign in, sign up, help, privacy and terms.
- Learner: Overview, My classes, Learning paths, Quran, Hifz plan, Review queue, Assignments, Quizzes, Progress, Bookmarks, Profile and privacy settings.
- Teacher: Overview, My assigned classes, Learner roster (only currently authorized enrollments), Attendance, Hifz/review assessment, Assignments, Quiz management where authorized, Content review queue if granted, Reports with bounded date ranges.
- Administrator: Overview, Users and roles, Classes and enrollments, Courses, Content library and editorial review, Assessments, operational reports, audit history, configuration.
- Shared: notifications and help; no open public chat or unmoderated user publishing is proposed.

Navigation must show only relevant destinations for usability, but every data request and mutation must independently enforce permissions in the database/API.

## 3. Core page requirements
### Public home
Explain the learning mission, show reviewed learning paths and course information, and provide clear sign-in/sign-up paths. Do not expose student identities, private class rosters, unpublished materials, or internal reports.

### Authentication and onboarding
Support clear loading, success, invalid-credentials, expired-session, and recoverable-error states. Do not reveal whether an email/phone belongs to an account. Collect only fields necessary for account operation. Role assignment must be server-controlled; signup metadata must never grant teacher/admin privileges.

### Learner dashboard
Prioritize next assignment, today's memorization/review tasks, due dates, recent teacher feedback, and a simple personal progress summary. Distinguish learner self-reports from teacher-assessed records and verified mastery. Avoid public rankings, shame-oriented comparisons, and unnecessary exposure of other learners.

### Quran reader
Use a verified Uthmani-script source with explicit edition/provenance and version. Provide surah/ayah navigation, readable Arabic typography, optional translation, audio controls, bookmarks and personal notes. Keep translation, tafsir, educator reflection and hadith visually/source-distinct from canonical Quran text. Respect each asset's license; do not assume all digital Uthmani text, fonts, translations or recordings are freely redistributable.

### Hifz and review
Show assigned ayah ranges, target dates, instructions, review items, and a clear submission state. Learner completion is self-reported until a teacher assessment exists. Do not silently convert a self-report into verified mastery. Provide accessible controls and avoid punitive streak mechanics.

### Teacher workspace
Default to the teacher's currently authorized classes and bounded time windows. Provide attendance and assessment workflows with confirmation before consequential writes, visible save/error states, and minimal student details. Do not fetch every learner's full history merely to render a dashboard. Role demotion or class reassignment must be enforced server-side.

### Course catalog and course detail
Show level, age suitability, learning objectives, instructor attribution, schedule, included content, prerequisites, accessibility, and price/entitlement terms when applicable. Clearly separate free preview from paid access. Payment must be handled by a trusted provider and server-verified entitlement; never trust a client-side success redirect or store card data in the app.

### Admin console
Use separate, purpose-specific sections for accounts/roles, classes/enrollments, courses, content, assessments, reports and audit. Require confirmation for role changes, enrollment removal, publication and other high-impact actions. Record actor, timestamp, target and outcome in an append-only audit design; do not put secrets or unnecessary sensitive data in logs.

## 4. Responsive and accessible behavior
- Mobile-first layouts; support narrow Android screens and larger desktop views.
- Semantic headings, keyboard navigation, visible focus, screen-reader labels, sufficient contrast and scalable text.
- Quran Arabic layout must preserve RTL shaping, verse markers and correct reading order; mixed Arabic/Persian/English content must not scramble controls.
- Audio controls need accessible names, play/pause state and clear loading/error feedback.
- Forms must explain validation near the relevant field and preserve safe user input after recoverable errors.
- Avoid relying on color alone to communicate status.

## 5. Route and session behavior
- Define an explicit route inventory and route-to-role matrix before coding.
- Resolve sessions through the trusted auth client; render a neutral loading state until resolution completes.
- Fail closed on unresolved or malformed role data. Never infer a privileged role from local storage, URL parameters, signup metadata or client defaults.
- On sign-out, account deletion, role change or session expiry, clear sensitive client caches and return to an appropriate public route.
- Deep links must re-check authorization at the destination and at every backend operation.
- Prevent redirect loops; provide a safe public fallback for unknown routes and unauthorized access.

## 6. Data minimization and child safety
The product serves minors. Collect the minimum necessary information, restrict access by current role and class assignment, and avoid public profiles, public learner progress, direct messaging, location sharing, or unmoderated uploads by default. Provide clear reporting/escalation pathways for inappropriate content. Apply age-appropriate language and avoid manipulative engagement patterns. Retention, guardian involvement, consent and jurisdiction-specific requirements require product/legal review before launch.

## 7. Proposed page-to-data map (conceptual)
| Page | Data required | Authorization principle |
|---|---|---|
| Public catalog | Published courses/content only | Public read of explicitly published records |
| Learner dashboard | Own enrollment, assignments, own progress | auth.uid() ownership plus enrollment rules |
| Quran reader | Approved canonical text and licensed assets | Read access according to asset publication/license |
| Teacher workspace | Assigned classes and necessary learner records | Current teacher role AND current class assignment |
| Admin console | Operational records required for task | Server-verified admin permission and audit |
| Course purchase | Course, provider checkout reference, entitlement | Server-verified provider result; no client-trusted payment state |

This is conceptual. Confirm actual table names, views, RPCs, RLS and grants against the live schema before mapping implementation.

## 8. UX states and acceptance criteria
For every page, specify: initial loading, empty state, partial data, permission denied, offline/network failure, validation error, save in progress, success and stale-session behavior.

Minimum acceptance tests:
1. Anonymous users cannot read private learner or teacher data by navigating directly to a URL.
2. A learner can see only their own protected records, even when changing IDs in requests.
3. A teacher with no current assignment cannot read or mutate that class's records.
4. A demoted teacher loses teacher-only operations even if an old class assignment remains.
5. A learner's self-reported completion is not displayed as teacher-verified mastery.
6. Unpublished content and unlicensed assets are not exposed publicly.
7. Payment entitlement is granted only after server-side provider verification.
8. Expired or malformed sessions fail closed without exposing cached private data.
9. RTL, keyboard and screen-reader checks pass on the Quran reader and core forms.
10. Logs and analytics exclude secrets, tokens, phone numbers and unnecessary student notes.

## 9. Delivery sequence
1. Inventory existing routes, components, queries and role checks.
2. Approve route map, terminology, accessibility and privacy requirements.
3. Implement public shell and authentication states in a non-production branch.
4. Implement learner pages against existing authorized APIs.
5. Implement teacher pages only after role-demotion and class-assignment authorization gaps are resolved.
6. Implement admin console with server-enforced actions and audit.
7. Integrate Quran content only after source, edition, accuracy and licensing review.
8. Integrate paid-course entitlements only after provider and refund/access policies are approved.
9. Run role-based, child-safety, accessibility and regression tests in staging.
10. Obtain explicit approval before production migration or release.

## 10. Decisions still required
- Final public/learner/teacher/admin navigation labels and page priorities.
- Whether guardian accounts and guardian-to-learner relationships are in scope.
- Whether learners can create private notes and how long they are retained.
- Which Quran text edition, translation(s), recitations and tafsir sources are approved and licensed.
- Which teacher actions require second-person review.
- Course pricing, provider, refunds, scholarship/free access and entitlement expiry.
- Data retention, export/deletion, consent and applicable child privacy requirements.
- Whether notifications are in-app only or use external channels.

## 11. Safety and implementation status
This stage adds design documentation only. It does not modify application source code, database schema, RLS policies, grants, functions, triggers, Auth settings, storage, payment settings or production data. No migration, deployment, merge, or live content ingestion is performed. All proposed permissions require independent server-side verification before implementation.
