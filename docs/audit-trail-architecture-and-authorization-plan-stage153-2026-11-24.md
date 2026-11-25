# Stage 153 — Educational audit-trail architecture and authorization plan

Date: 2026-11-24  
Repository: `aymd524-rgb/masir-noor-thaqalayn`  
Related pull request: #9 (documentation/audit branch)

## Scope and evidence boundary

This stage defines a proposed, reviewable design for recording consequential changes to educational records. It is based on the source and migration reviews summarized in Stages 151–152, including teacher/student memorization workflows, attendance and grade paths, quiz submission, profile-contact separation, and the previously identified role-demotion questions.

This is an architecture proposal only. It does **not** assert that an audit table, trigger, RPC, retention job, or audit viewer currently exists. No live database was queried in this stage; no personal rows, contact values, answer keys, credentials, or secrets were accessed. No SQL, DDL, DML, grants, policies, functions, triggers, migrations, Auth settings, Data API settings, deployment, or production configuration were changed.

## 1. Events that should be auditable

Record successful, committed changes that affect a learner's educational history or access:

| Domain | Candidate events | Important context |
|---|---|---|
| Attendance | created, corrected, deleted/voided | class, session/date, affected enrollment |
| Grades and assessments | created, revised, voided | assessment, enrollment, prior/new value where justified |
| Hifz and review records | created, corrected, voided | surah/ayah range, record type, assessment status |
| Weekly assignments | assigned, changed, cancelled, completed | assignment, enrollment, due date |
| Student completion | submitted, accepted, returned, corrected | distinguish student self-report from teacher verification |
| Quizzes | published, unpublished, settings changed, attempt submitted, result released | never copy answer keys or full answer payload into the audit event |
| Enrollment and class access | enrolled, transferred, withdrawn, teacher assignment changed | capture authorization-relevant changes |
| Role/account administration | role changed, account access changed if a server-authoritative status field is introduced | actor and approval context |

Do not create events for ordinary reads by default. If access logging is later required for sensitive contact retrieval or bulk exports, design it as a separate, narrowly scoped security-access log with explicit retention and volume controls.

## 2. Proposed event envelope

Use a server-generated, append-only event record with a small, stable envelope:

- `event_id`: server-generated UUID.
- `occurred_at`: database/server timestamp; never accept a client-supplied timestamp as authoritative.
- `actor_user_id`: derived from the authenticated server context (for example, `auth.uid()`); never trust a client-provided actor ID.
- `action`: controlled vocabulary such as `attendance.corrected` or `hifz_record.created`.
- `resource_type` and `resource_id`: identify the affected record without duplicating its full contents.
- `class_id` / `enrollment_id`: include only the minimum scope keys needed to enforce visibility.
- `change_summary`: allowlisted, minimal before/after fields for the specific event type.
- `reason`: optional, bounded-length explanation for a correction; do not require sensitive personal details.
- `request_id` / `correlation_id`: optional server-generated identifier to connect related writes without exposing tokens or session data.

The database should derive actor and timestamp values. Client-supplied actor, role, class scope, and timestamp fields must be ignored or rejected. The event should be written in the same transaction as the business change so a committed change cannot silently lack its corresponding audit event.

## 3. Data minimization rules

The audit trail is not a second copy of the application database.

- Store only the changed fields needed to explain who changed what and when.
- Never store passwords, access/refresh tokens, API keys, secrets, phone numbers, or full contact records.
- Exclude private teacher notes and sensitive free-text by default; if a note itself changes, record that the note changed, not its full text.
- Do not store quiz answer keys, full answer payloads, or unnecessary student responses. For quiz events, prefer quiz/attempt identifiers and safe status/score metadata according to the approved result-release policy.
- For grades, consider whether the audit event needs exact old/new values or only a correction marker plus a protected detail reference. If exact values are retained, restrict them to authorized educational viewers.
- Define maximum payload size and an allowlist per action. Reject unknown fields rather than serializing arbitrary client JSON.
- Avoid logging raw request bodies, IP addresses, device identifiers, or user-agent strings unless a separate documented security need and retention policy justify them.

## 4. Write-path options and recommendation

### Option A — Database triggers

A trigger can capture row-level inserts, updates, and deletes even when writes come from different clients. It can derive the authenticated actor and database timestamp and insert the event in the same transaction.

Risks and controls:
- Trigger code must use a carefully reviewed fixed `search_path`, schema-qualified references, and least-privilege ownership.
- Ensure the trigger cannot be bypassed by ordinary application roles and that privileged maintenance paths are documented.
- Avoid indiscriminate `to_jsonb(OLD)` / `to_jsonb(NEW)` snapshots; use explicit allowlisted fields to prevent PII and sensitive notes from leaking.
- Test cascades, bulk writes, service-role operations, and failed transactions.

### Option B — Server-side RPC/write functions

A controlled RPC can validate the operation, perform the business write, and insert a matching audit event in one transaction.

Risks and controls:
- Every relevant write path must use the RPC; direct table writes must be denied or equivalently covered.
- SECURITY DEFINER functions require explicit authorization checks, an empty/fixed search path, schema-qualified object references, and narrowly scoped EXECUTE grants.
- Do not rely on frontend role checks.

### Option C — Client-generated audit events

Not recommended as the authoritative audit mechanism. A client can omit, forge, replay, or reorder events, and can claim another actor or timestamp. Client-side analytics may supplement product telemetry but must not be treated as an integrity-protected educational audit trail.

### Recommendation

Prefer a **database-enforced transactional audit mechanism**: triggers for consistently covered row-level mutations, or tightly controlled RPCs where business semantics require a validated multi-step operation. A hybrid may be appropriate, but each table/write path must have exactly one clearly defined authoritative event path to avoid missing or duplicate events. Do not implement until the write-path inventory and role-demotion policy are resolved.

## 5. Append-only integrity and access controls

Proposed controls for the future audit table:

- Enable RLS and deny direct INSERT, UPDATE, and DELETE to ordinary `anon` and `authenticated` clients.
- Permit writes only through the selected trusted database mechanism.
- No client-facing UPDATE or DELETE policy. Corrections to audit history should be represented by a new compensating event, never by rewriting the old event.
- Revoke unnecessary table privileges separately from RLS; RLS does not replace table-level privilege controls.
- Do not expose the raw audit table through broad client queries or an unrestricted view.
- If a privileged retention/purge process is legally or operationally required, isolate it behind a separately reviewed administrative process, document each purge, and retain a tamper-evident record of the action.
- Review whether database owners/service roles can alter or delete history; append-only controls within one database do not protect against every privileged operator or infrastructure compromise.

## 6. Role-based read visibility

The audit viewer must apply authorization on the server/database boundary, not by filtering rows only in React or another client.

| Viewer | Proposed visibility |
|---|---|
| Admin | Educational audit events across the institution, subject to purpose and data-minimization rules |
| Teacher | Events only for classes/enrollments the teacher is currently authorized to manage; role and active assignment must both be checked |
| Student | Only events concerning that student's own educational records, with a carefully limited event projection; no other student's identity or history |
| Anonymous | No audit-event access |

Additional requirements:
- A class assignment alone must not automatically grant teacher access if the account no longer has the teacher role. This directly addresses the role-demotion gap noted in earlier reviews.
- Re-evaluate access at read time; do not rely solely on the role or class assignment captured when the event was created.
- Student views should not expose internal moderation notes, staff-only reasons, other users' identifiers, or administrative metadata.
- Admin-wide access should be purpose-limited and auditable, especially for contact data and bulk exports.
- If the product later supports multiple institutions/tenants, include tenant scope in both write validation and read policies.

## 7. Staging verification matrix

Use dedicated synthetic accounts and synthetic records only. Do not run these tests against real student data.

| Test | Expected result |
|---|---|
| Student creates or updates an allowed self-service record | Business change and exactly one server-attributed event commit together |
| Student supplies a forged actor ID or timestamp | Values are rejected or ignored; event uses authenticated actor and server time |
| Student requests another student's event | No rows or a non-disclosing denial |
| Teacher reads events for an assigned class while role is teacher | Only currently authorized class events are visible |
| Teacher retains class assignment after role demotion | Teacher-only event access and write actions are denied |
| Teacher requests another class's event | No rows or a non-disclosing denial |
| Admin reads institution-scoped events | Authorized events are visible without unnecessary sensitive payloads |
| Anonymous user reads or writes audit events | Denied |
| Authenticated client directly inserts/updates/deletes audit rows | Denied |
| Business write transaction fails | No orphan audit event remains |
| Business write succeeds | Exactly one matching audit event exists |
| Note/contact/answer-key field changes | Sensitive content is absent from the event payload |
| Bulk correction | Events are bounded, correctly attributed, and do not disclose unrelated rows |
| Retention job is exercised in staging | Only approved expired data is handled and purge activity is separately recorded |

Capture evidence for both positive and negative cases, including the effective database role, authenticated identity, class assignment, role state, and policy/function version. Do not use production identities or production rows as test fixtures.

## 8. Retention, operations, and observability

Before implementation, product and privacy owners should define:
- Retention periods by event category and any legal/educational record obligations.
- Whether events are partitioned by time and the operational process for archiving.
- Indexes needed for actor, resource, enrollment/class scope, and timestamp without over-indexing.
- Pagination and bounded date windows for teacher/admin views.
- Monitoring for failed audit writes, unexpected event volume, duplicate events, and denied access.
- Backup/restore expectations and how audit consistency is checked after restoration.
- A documented process for authorized data correction and privacy requests that preserves integrity while meeting applicable obligations.

Do not promise that an in-database append-only table is cryptographically tamper-proof. If stronger tamper evidence is required, assess independent immutable export/storage and key management as a separate project.

## 9. Implementation sequence and rollback plan

1. Resolve the product decisions below and confirm which educational records require an audit trail.
2. Inventory every mutation path (frontend, RPC, trigger, service role, admin workflow) and map each to one authoritative event mechanism.
3. Design the event schema and per-action allowlists; perform privacy review.
4. Implement in a separate feature branch and migration, with RLS and table grants designed together.
5. Test using synthetic staging accounts, including role demotion, direct API attempts, transaction rollback, and sensitive-field exclusion.
6. Verify query plans, pagination, retention, and backup/restore behavior.
7. Obtain review and explicit approval before any production migration or deployment.

Rollback must not silently erase already-created audit history. If a new writer causes incorrect events, disable or revert that writer through a reviewed migration while preserving prior events; correct erroneous entries with compensating events. Any destructive retention action requires separate authorization and evidence.

## 10. Product decisions required

1. Which records are legally/product-critical: attendance, grades, hifz records, weekly assignments, quiz lifecycle, enrollment, role changes, or all of these?
2. Should students see a limited history of teacher corrections to their own records, or only current values?
3. Which staff roles may see exact before/after grades and correction reasons?
4. Must a teacher's access end immediately when their role is demoted, even if class assignment rows remain?
5. What retention periods apply to each event category?
6. Are audit exports permitted, and which role may request them?
7. Should student completion remain a self-reported event until a teacher verifies it, with separate event types for each transition?

## Conclusion

An audit trail can improve accountability for educational changes only if events are generated by trusted server/database paths, committed atomically with the underlying change, minimized to avoid copying sensitive data, and protected by current role-and-class authorization on every read. The recommended next step is to settle the product decisions and complete the mutation-path inventory before implementing schema or policy changes.

**Stage status:** design/documentation only. No live database access or mutation, no migration execution, no deployment, and no PR merge.
