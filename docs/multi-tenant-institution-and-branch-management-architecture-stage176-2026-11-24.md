# Stage 176 — Multi-Institution, Branch, and Organization Management Architecture

**Date:** 2026-11-24  
**Status:** Design proposal only; no implementation or production changes.

## 1. Purpose and scope

Define how the platform could support multiple independent Quran centers, institutes, mosques, schools, and affiliated branches within one application while preventing cross-organization data access. Each institution should manage its own learners, guardians, teachers, classes, courses, schedules, prices, certificates, and approved branding. Platform-wide operators retain narrowly scoped platform administration.

This is a tenancy and governance design, not a claim that tenant isolation currently exists. Reconcile this proposal with the live schema and prior admin, enrollment, finance, certificate, guardian, and classroom plans before implementation.

## 2. Organization hierarchy and lifecycle

Proposed hierarchy:
- Platform: global service and platform-level operational boundary.
- Institution/organization: an independently governed Quran center or educational organization.
- Branch/center: an optional physical or administrative unit belonging to one institution.
- Program/course/cohort/class: educational offerings owned by an institution and optionally assigned to a branch.
- Membership: a person's scoped relationship to an institution, branch, and role.

Suggested organization lifecycle: draft → pending_verification → active → suspended → closed. State transitions require authorized review and append-only audit events. Suspension should block new enrollment and privileged actions according to a documented policy while preserving authorized access to required records, learner exports, and dispute handling. Closure requires a retention/export plan and must not silently erase legally or educationally required history.

An institution may operate without branches. A branch cannot exist without one parent institution. Cross-institution branch ownership is invalid. A course, class, price, certificate template, or staff assignment must have an explicit owning institution; branch ownership is optional and must remain within that institution.

## 3. Roles and scoped permissions

Separate platform roles from institution roles. Example institution roles:
- Institution owner: manages institution settings and appoints authorized administrators.
- Institution administrator: manages scoped users, branches, programs, and operations.
- Academic supervisor: approves curricula, assessments, certificates, and teacher assignments as delegated.
- Finance manager/operator: handles scoped pricing, orders, scholarships, refunds, and reports.
- Teacher: accesses only assigned classes and learners in the relevant institution.
- Learner: accesses own learning data and enrolled offerings.
- Guardian: accesses only explicitly permitted information for a verified learner relationship.
- Branch coordinator: manages only the assigned branch and delegated resources.
- Auditor/read-only reviewer: sees approved, minimum-necessary records within a defined scope.

A person may hold different roles in different institutions. Do not store a single global profiles.role as the sole authorization source for multi-tenant access. Use explicit memberships and scoped role grants, with current status and effective dates. Platform support staff must not automatically inherit institution-owner permissions.

Permissions should be action-specific (read, create, update, approve, publish, export, issue, refund, invite, assign) and resource-scoped. Sensitive actions such as role grants, refund approval, certificate issuance, data export, and institution closure should support separation of duties and re-authentication where appropriate.

## 4. Membership and invitation lifecycle

Proposed membership states: invited → pending_acceptance → active → suspended/revoked/expired. Invitations are single-use, time-limited, scoped to one institution and optionally one branch, and cannot grant a broader role than the inviter is authorized to delegate. The recipient must authenticate and accept; do not activate membership solely because an email address was entered.

Membership changes record actor, target, institution, scope, role, effective time, expiry, reason category, and approval where required. Revocation immediately blocks future scoped access; existing sessions must re-check membership on sensitive requests. Historical authorship and issued records remain attributed to the original actor without granting continuing access.

For minors, guardian relationships and permissions are separate from institution membership. A guardian may have relationships with learners at more than one institution, but one institution must not see another institution's guardian or learner records.

## 5. Tenant ownership and data boundaries

Every tenant-owned resource must carry a non-null institution identifier, and branch-scoped resources may also carry a branch identifier. Examples include:
- learners' institution enrollment, teacher assignments, class rosters, attendance, grades, hifz tasks and records;
- courses, cohorts, lessons, announcements, classroom resources, assessments and results;
- prices, orders, payment events, scholarships, refunds, finance reports;
- certificate templates, signatory permissions, issued certificate records and verification configuration;
- institution branding, settings, support requests, and audit events.

Global canonical content (such as approved Quran text and shared licensed learning resources) may be platform-managed and read by multiple institutions under a defined license. Tenant-created adaptations, lesson notes, private uploads, assessments, and student data remain tenant-scoped unless explicit sharing is configured and approved.

Use composite foreign keys or equivalent trusted constraints to ensure related records share the same institution (and branch where required). Never rely only on a client-supplied institution_id. Resolve institution scope from authenticated membership and server-side authorization. Reject ambiguous or missing tenant context for tenant-owned writes.

## 6. Database and API authorization architecture

Recommended enforcement:
- Row-level security on every tenant-owned table, with institution membership and resource scope evaluated server-side.
- Trusted helper functions with fixed/empty search_path, least-privilege ownership, explicit grants, and careful SECURITY DEFINER review.
- Composite constraints prevent cross-tenant relationships even if an application bug submits mismatched IDs.
- Server endpoints derive actor and tenant from verified session/membership; they do not trust client role, institution, branch, or owner fields.
- Views use invoker security where suitable; functions and storage access receive separate threat review.
- Private object storage paths include opaque tenant/resource identifiers, but path naming alone is not authorization. Signed URLs are short-lived and issued only after membership and resource checks.
- Search, exports, realtime subscriptions, notifications, and background jobs must apply the same tenant boundary.
- Admin support access is time-bound, reasoned, audited, and preferably approved by the institution; emergency access is exceptional and reviewable.

Do not create broad policies such as "authenticated users can access all institutions." Avoid cross-tenant data joins, global counts that leak sensitive activity, and client-side-only filtering.

## 7. Institution onboarding and verification

Proposed workflow: application → verify organization identity and authorized representative → create draft institution → configure owner and initial roles → configure branches and branding → review policies and contact channels → activate → periodic review.

Verification requirements depend on jurisdiction and organization type and must be defined by the platform operator. Collect only necessary evidence, store it privately with restricted access and retention limits, and avoid collecting personal identity documents without a clear legal and operational need. Verification status and reviewer decisions must be auditable.

Support an individual teacher or small study circle that is not a registered institution through a distinct lightweight organization type, with limits clearly explained. Do not imply legal recognition or accreditation unless actually verified.

## 8. Institution-specific operations

Each institution may configure within its scope:
- name, approved logo, theme, language, timezone, public contact details and public course catalog;
- branches, rooms, class schedules, enrollment capacity, teacher assignments and course offerings;
- course prices, discounts, scholarship rules, refund policy and permitted payment methods;
- certificate issuer text, configurable header, approved signatories and certificate templates;
- academic calendar, approved content collections, assessment rubrics and notification preferences.

Platform-wide canonical Quran text, platform safety rules, security requirements, and shared service terms cannot be overridden by tenant branding or local settings. Institution settings should be versioned so historic receipts, certificates, and course enrollments preserve the terms and issuer details that applied at the time.

## 9. Cross-institution users and data portability

A teacher or learner may belong to multiple institutions using one authenticated account, but each institution's workspace and permissions must be selected explicitly. Switching institution context must not preserve privileged data from the prior tenant in client caches, search results, or open subscriptions. On switch, invalidate or scope cached data and reauthorize requests.

Learner transfer between institutions must be explicit and consent-aware. Default behavior is no automatic sharing of grades, private notes, recordings, guardian details, or assessment responses. If transfer is requested, define a minimum data package, verified destination, learner/guardian consent as applicable, source/destination approval, provenance, and audit record. Provide export and deletion/retention procedures consistent with applicable law and institutional obligations.

## 10. Reporting and billing boundaries

Institution dashboards and exports aggregate only that institution's data. Branch coordinators see only authorized branch summaries. Platform operators may see service-health and aggregate operational metrics, but should not see private educational records or institution finance data by default.

If the platform later charges institutions for service usage, keep platform subscription billing distinct from each institution's learner course payments. Define billing owner, metering, invoice, grace period, suspension, dispute, and data export before enabling. Do not mix institution revenue with platform service fees.

## 11. Audit, monitoring, and incident response

Record tenant-sensitive events: institution creation/verification/suspension, membership invitations and role changes, branch/course ownership changes, exports, support access, certificate signing/issuance, finance approvals, data transfers, and security-policy changes. Audit records should be append-only, server-timestamped, actor-attributed, and tenant-scoped, with restricted audit-reader permissions.

Monitor cross-tenant authorization denials, unusual exports, invitation abuse, role escalation attempts, and storage access anomalies. Incident response must identify affected institutions, preserve relevant evidence, notify responsible parties according to approved policy, revoke compromised memberships/tokens, and verify isolation after remediation. Do not expose one institution's incident details to another.

## 12. Conceptual data model

Illustrative entities to reconcile with existing schema before migrations:
- institutions, institution_verification_cases, institution_settings_versions
- institution_branches
- institution_memberships, membership_role_grants, membership_invitations
- institution_programs, institution_course_offerings, institution_class_scopes
- resource_tenant_ownership or explicit institution_id/branch_id columns on tenant-owned resources
- institution_branding_assets and certificate_issuer_profiles
- tenant_data_transfer_requests and transfer_audit_events
- institution_support_access_grants
- institution_audit_events

Use stable UUIDs, explicit ownership, effective dates, status constraints, and composite tenant foreign keys. Avoid duplicating user authentication identities per institution. Schema names are illustrative and not instructions to create tables now.

## 13. Acceptance and security test matrix

Staging-only tests using synthetic tenants A and B:
- Institution A administrator cannot list, read, update, delete, export, or infer Institution B's learner, class, course, finance, certificate, or audit data.
- Teacher assigned to A cannot access B even when given a valid B resource UUID.
- Branch coordinator cannot access sibling branches unless separately authorized.
- Learner and guardian membership in A does not grant any access in B.
- A user with roles in both tenants sees only the explicitly selected and authorized tenant context.
- Revoked, expired, suspended, or demoted membership blocks subsequent reads, writes, realtime events, storage downloads, and exports.
- Client-supplied institution_id, branch_id, role, owner_id, or actor_id cannot change trusted scope.
- Composite constraints reject cross-tenant foreign-key combinations.
- Search indexes, full-text search, notifications, background jobs, and aggregate reports do not leak cross-tenant records.
- Signed storage URLs cannot be issued for another tenant's private object and expire as configured.
- Invitation tokens are single-use, expiring, scope-limited, and cannot escalate privileges.
- Support access is time-bound, approved where required, and fully audited.
- Institution suspension follows documented access and learner-record preservation rules.
- Transfer requires verified destination and explicit permission; only approved fields move.
- Historical certificate and receipt issuer snapshots remain stable after branding or price changes.
- Tenant-specific exports include only authorized institution data and are audited.
- Cross-tenant cache and realtime subscription isolation is verified on institution switching.

## 14. Decisions required before implementation

Owners must decide: organization types and verification criteria; whether individual teachers may create lightweight centers; role and permission matrix; branch inheritance rules; cross-institution teacher/learner membership behavior; tenant support-access approval; learner transfer policy; tenant-specific retention/export obligations; platform subscription billing; public directory and branding rules; and incident-notification responsibilities.

Recommended sequence: map all existing tables and storage objects to ownership → identify unscoped/global resources → design membership and tenant helper semantics → create synthetic A/B test matrix → review every RLS/function/storage/search/realtime/export path → pilot with isolated staging tenants → obtain explicit production authorization.

## 15. Explicit non-actions

This stage is documentation only. No code, database schema, RLS policy, SQL function, storage bucket, Auth configuration, tenant record, invitation, user membership, institution, branch, payment setting, migration, deployment, merge, or live Supabase configuration was changed. No institution or learner data was accessed.
