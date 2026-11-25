# Stage 183 — Institution Administration and Academic Oversight Dashboard

**Status:** design specification only  
**Date:** 2026-11-24  
**Branch:** `docs/live-schema-security-inventory-2026-11-23`

## 1. Purpose and scope

Define an institution-scoped administrative workspace for authorized institution owners, administrators, academic supervisors, branch coordinators, and auditors. The workspace gives a coherent view of academic operations without granting unrestricted access to learner data or replacing the existing authorization model.

This document is not an implementation, migration, policy change, or production approval.

## 2. Core dashboard areas

1. **Institution overview:** active programs, branches, courses, cohorts, classes, upcoming sessions, enrollment totals, and operational alerts.
2. **People and memberships:** invitations, pending approvals, membership status, role assignments, effective dates, and revocation history.
3. **Academic operations:** class rosters, teacher assignments, schedule coverage, attendance completion, assignment review queues, and assessment moderation.
4. **Learning quality:** aggregate progress by skill dimension (reading, fluency, tajwid, memorization, revision, translation, reflection), with self-reported, teacher-assessed, and verified outcomes clearly separated.
5. **Content governance:** lesson review queues, source/licence metadata, correction requests, publication status, and version history.
6. **Competition and certificates:** institution participation, class-level activity, provisional/final standings, certificate approval queues, and verification activity, all subject to their dedicated policies.
7. **Finance summary:** aggregate course orders, payment reconciliation status, scholarships, refunds, and outstanding operational exceptions; no card data or unnecessary payment details.
8. **Audit and compliance:** searchable, permission-filtered administrative events, exports subject to explicit authorization, and incident follow-up.

## 3. Role and scope matrix

- **Institution owner:** institution-wide configuration and membership governance; cannot access another tenant.
- **Institution administrator:** operational management within explicitly assigned institution scope.
- **Academic supervisor:** academic review, teacher/class oversight, assessment moderation, and content approval within assigned scope; no finance access by default.
- **Branch coordinator:** only assigned branch and its subordinate programs/classes.
- **Finance operator:** financial records and reconciliation only; no learner academic notes or private recitation media by default.
- **Auditor:** read-only, time-bounded access to approved audit/report surfaces; no mutation.
- **Teacher:** existing assigned-class workspace only; this dashboard must not silently widen teacher access.
- **Learner/guardian:** no access to institution administration routes.

Platform-level support roles, if ever introduced, must be distinct from institution roles, explicitly granted, audited, and unavailable through client-controlled profile fields.

## 4. Dashboard metrics and definitions

Every metric must include its definition, time window, scope, and data freshness. Avoid ambiguous labels such as “success rate” without a denominator and methodology.

Recommended measures:
- enrolled learners by active status and cohort;
- classes with an assigned teacher and classes needing coverage;
- sessions scheduled versus held or cancelled;
- attendance records awaiting completion or correction;
- assignments submitted, awaiting review, or returned for revision;
- assessment outcomes by skill dimension and rubric version;
- content items awaiting academic or rights review;
- competition entries and finalized results;
- finance reconciliation exceptions, visible only to authorized finance roles.

Do not create a single opaque score for a learner, teacher, class, or institution. Small cohorts should be suppressed or grouped where disclosure could identify a child.

## 5. Alerts and operational queues

Alerts should be actionable and non-punitive:
- teacher assignment missing or ending soon;
- class session schedule conflict;
- attendance or assessment review overdue;
- learner requests help or assignment needs teacher review;
- content source/licence metadata incomplete;
- certificate awaiting required signatory approval;
- payment webhook or reconciliation exception.

Use severity, owner, due date, and resolution state. Avoid public shaming, automated disciplinary decisions, or pressure-oriented engagement mechanics.

## 6. Tenant isolation and authorization

Resolve institution and branch scope on the server from authenticated membership records. Never trust tenant, branch, role, or class identifiers supplied by the browser as proof of authority.

Enforce scope consistently in database RLS and server-side operations for:
- dashboard aggregates and drill-downs;
- search, exports, reports, and downloads;
- realtime subscriptions and notifications;
- scheduled jobs, background tasks, and cached results;
- storage objects and signed URLs.

Use deny-by-default behavior when membership is missing, expired, suspended, or ambiguous. Re-check authorization on every sensitive action, not only when opening the dashboard. Membership changes and role revocation must invalidate relevant sessions/caches or otherwise prevent stale authorization.

## 7. Privacy and child safeguarding

- Show aggregate data by default; reveal individual learner records only when the role and task require it.
- Do not expose private guardian contacts, personal notes, raw learner audio, or sensitive accommodation details in institution-wide views.
- Provide no unrestricted direct-message or learner surveillance feature through this dashboard.
- Require purpose, scope, and audit trail for exports; minimize columns and apply expiry to generated files.
- Keep public leaderboards and competition standings governed by explicit event settings and consent; institution dashboard visibility does not imply public visibility.
- Use accessible, RTL-first, mobile-friendly layouts and plain-language labels.

## 8. Audit requirements

Record actor from the authenticated server context, institution/branch scope, action, target type and identifier, timestamp, outcome, and a minimal change summary. Never accept actor identity from client input. Avoid copying secrets, full private notes, contact details, tokens, or raw audio into audit payloads.

Sensitive actions requiring audit include role changes, membership invitations/revocations, teacher reassignment, class archival, assessment overrides, content publication, certificate approval, financial adjustments, and data exports.

## 9. Conceptual data model (not a migration)

Potential read models and operational entities:
- institution_dashboard_preferences;
- institution_alerts;
- institution_alert_assignments;
- academic_review_queue;
- report_definition_versions;
- report_export_requests;
- report_export_audit.

These are conceptual names only. Reuse existing institution, branch, membership, class, course, audit, and finance records where suitable. Do not create duplicate sources of truth for roles, membership, enrollments, or learner progress.

## 10. Acceptance and security test plan

Use synthetic accounts and at least two institutions with multiple branches:
1. Institution A owner/admin can see only Institution A.
2. Branch coordinator sees only assigned branch and descendants.
3. Academic supervisor cannot access finance-only records.
4. Finance operator cannot read academic notes, hifz details, or learner audio.
5. Teacher cannot use institution dashboard routes to enumerate unassigned classes.
6. Learner and guardian are denied all administrative endpoints.
7. Revoked/expired membership loses access on subsequent requests; stale caches and realtime channels do not leak data.
8. Search, export, pagination, aggregate counts, notifications, and storage downloads preserve tenant scope.
9. Small-cohort suppression is consistent across charts, filters, exports, and drill-downs.
10. Every privileged mutation and export produces a minimal audit event.
11. Direct API calls with forged institution/branch identifiers are denied.
12. Accessibility, RTL, keyboard navigation, and low-bandwidth behavior are verified.

## 11. Rollout and rollback

Begin with read-only synthetic staging dashboards. Validate role and tenant boundaries before enabling any mutation. Release by institution pilot with monitoring and documented support procedures. Feature flags must not bypass server authorization. Rollback should disable dashboard routes and exports without deleting academic or financial source records.

## 12. Decisions required before implementation

- Which institution roles may see individual learner progress versus aggregate metrics?
- Which roles may export data, and which fields and retention limits apply?
- Should branch coordinators see cross-branch comparisons? Default: no.
- Which academic indicators are approved and how are they defined?
- What minimum cohort size is required before aggregate display?
- Which audit events are visible to institution administrators versus auditors?
- What retention and approval rules apply to exported reports?
- Which finance summaries may be shown to owners versus finance operators?

## 13. Explicit non-goals and safety boundary

This stage does not implement the dashboard, alter database schema or RLS, grant permissions, change Auth/Data API settings, access or modify live learner data, deploy the application, merge this PR, or authorize institution-wide data exports. All proposed entities, metrics, and workflows require review and staging verification before implementation.
