# Stage 157 — Admin console and content operations architecture

Date: 2026-11-24  
Repository: `aymd524-rgb/masir-noor-thaqalayn`  
Related pull request: #9

## Scope and safety boundary

This document designs the administrative workspace for the Masir Noor Thaqalayn learning platform: user and role administration, course/catalog management, teacher assignment, enrollment, content review, operational monitoring, and controlled reporting.

This is architecture and workflow documentation only. It does not assert that an admin console exists or that any workflow is implemented. No live database was queried, no user/student records were read, and no SQL, schema, policy, grant, Auth/Data API setting, payment configuration, deployment, or production data was changed.

## 1. Design principles

1. **Server-side authority:** privileged actions must be authorized by trusted server-side checks. Hiding a button or route is not security.
2. **Least privilege:** staff receive only the capabilities required for their duties and current assignments.
3. **Separation of duties:** content authors should not automatically approve their own high-impact religious content or grant themselves administrative roles.
4. **Traceability:** sensitive actions create attributable, append-only audit events.
5. **Child privacy:** expose the minimum learner information needed for teaching and operations.
6. **Safe defaults:** new accounts have the least-privileged role; unpublished content and draft courses are private.
7. **Recoverability:** destructive operations should be reversible where possible, with confirmation and a documented recovery path.
8. **No client trust:** role, ownership, price, entitlement, enrollment, and approval claims supplied by a browser must be revalidated on the server.

## 2. Proposed staff roles and capability boundaries

Roles are conceptual until the product owner approves them. Avoid a single broad `admin` flag for every staff task.

| Role | Intended responsibilities | Explicit restrictions |
|---|---|---|
| Platform owner | High-impact configuration, appointing/removing administrators, emergency access review | Must use strong authentication and audited actions |
| Administrator | User support, course operations, approved staff assignments, operational overview | Cannot bypass audit or silently edit source history |
| Content editor | Create and revise lessons, metadata, translations, media references | Cannot approve own restricted content unless an explicit policy allows it |
| Scholarly reviewer | Review Qur'an, hadith, tafsir, and historical-source accuracy | No account, payment, or unrelated student-data administration |
| Course manager | Assemble courses, sections, schedules, and course-level staff | Limited to assigned courses |
| Teacher | View assigned learners and classes, assign approved lessons, assess learning | No access to unassigned classes or global account administration |
| Student | Access public/entitled/assigned learning materials and own progress | No staff tools or other learners' private records |
| Support operator | Resolve limited account and access issues | No access to private educational notes or religious review controls by default |

Prefer explicit capabilities such as `users.read_limited`, `roles.assign_teacher`, `courses.publish`, `content.review_hadith`, `enrollments.manage_assigned`, and `reports.view_aggregate` over implicit broad permissions. The final role-to-capability matrix requires product approval.

## 3. Admin console navigation

Recommended modules:

1. **Overview:** operational counts, pending work, service health indicators, and recent audited actions.
2. **People:** account lookup, minimal profile details, role requests, status review, and support history.
3. **Staff and assignments:** teacher/reviewer directory, class/course assignments, assignment end dates.
4. **Courses:** course drafts, sections, schedules, instructors, access model, publication status.
5. **Content library:** Qur'an references, translations, audio, tafsir, hadith, stories, games, source/license metadata.
6. **Review queue:** scholarly review, age-appropriateness review, rights review, and publication decisions.
7. **Enrollments:** enrollment requests, class membership, course access, and learner transfer.
8. **Assessments:** quiz definitions, protected answer keys, attempt policy, and result-release settings.
9. **Reports:** aggregate course and learning summaries with controlled drill-down.
10. **Audit and security:** role changes, publication actions, enrollment changes, access denials, and sensitive configuration history.
11. **Settings:** approved platform-level settings, feature flags, notification templates, and retention configuration.

Navigation should be generated from effective permissions, but each API/RPC/data operation must independently enforce the same authorization boundary.

## 4. User and role administration workflow

### Account lookup

- Search by a limited set of approved identifiers.
- Return only fields required for the support task.
- Mask or omit phone, email, date of birth, and address unless a specific capability and support reason permit access.
- Avoid exposing account existence through unrestricted public endpoints.
- Record the operator, purpose category, target account identifier, and timestamp for sensitive lookups where policy requires it.

### Role assignment

1. An authorized operator submits a role-change request with a reason.
2. The server validates the operator's capability and any required second approval.
3. The server checks the target account and role transition against policy.
4. The change is applied transactionally.
5. An audit event records actor, target, previous/new role, reason code, and timestamp.
6. Related class/course permissions are recalculated from current role and assignment state.

Do not let a user promote themselves, create another administrator, or change their own role through a normal profile update. High-privilege role changes should require a second authorized approver or platform-owner confirmation.

### Account status

A disabled/suspended state must be a server-owned, explicitly approved field or equivalent authoritative mechanism. A client-side `active: true` default is not evidence that an account is active. Define status semantics, session revocation behavior, appeal/re-enable workflow, and audit requirements before implementation.

## 5. Course and curriculum management

A course should have:
- Stable course identifier and title.
- Description, audience, age/learning bands, language, and learning objectives.
- Draft/published/archived status.
- Course owner and authorized managers.
- Sections/modules and ordered lesson references.
- Start/end dates or self-paced mode.
- Free/paid access classification and entitlement rules.
- Capacity and enrollment policy if applicable.
- Teacher assignments and review responsibilities.
- Version history and publication notes.

Recommended lifecycle:

`draft → internal_review → approved → published → archived`

A published course update should create a new version or a clearly recorded revision. Do not silently rewrite the historical course context for learners who already completed it.

### Course publishing checklist

- All linked content is approved and licensed for the intended use.
- Course age band and prerequisites are clear.
- Teacher assignments are valid and current.
- Enrollment and entitlement rules are tested server-side.
- Assessments do not expose answer keys.
- RTL, mobile, accessibility, and offline behavior are checked.
- A rollback/unpublish plan exists.

## 6. Teacher and reviewer assignment

- Assignments must include scope (course/class), effective start, optional end, assigning actor, and status.
- A teacher may manage only currently assigned classes/courses and only while the account has the required current role.
- Assignment history should be retained for audit, but expired assignments must not authorize new access.
- Removing a teacher role or ending an assignment must revoke associated write access according to the approved revocation policy.
- Reviewers should be scoped by domain (Qur'an text, hadith, tafsir, translation, historical story, age suitability, rights).
- A person should not approve their own sensitive submission without a documented exception and additional review.

## 7. Enrollment and learner lifecycle

Proposed states:
- `requested`
- `approved`
- `active`
- `paused`
- `completed`
- `withdrawn`
- `rejected`

Rules:
- Every transition has a permitted actor and server-side preconditions.
- Students may request enrollment but cannot self-approve paid or restricted enrollment.
- Teachers may request or recommend changes only within their assigned scope.
- Course managers may approve only within granted course capabilities.
- Transfers between classes must end the old assignment and create the new assignment in one consistent operation.
- Preserve learning records and audit history while limiting visibility to currently authorized roles.
- Avoid retaining unnecessary personal details after withdrawal; retention must follow an approved policy.

## 8. Content editorial workflow

Connect the admin console to Stage 156's content governance model.

Suggested statuses:
`draft → validation_pending → scholarly_review → rights_review → age_review → approved → published → retired`

Not every content type requires every review lane, but the workflow must state which reviews apply. For example:
- Uthmani text: edition/source validation and specialist text verification.
- Translation: translator/edition metadata, permission, and language review.
- Audio: reciter/riwayah metadata, source integrity, and usage rights.
- Tafsir: source fidelity and qualified scholarly review.
- Hadith: source locator and grading attribution review.
- Historical story: primary/secondary source review and clear separation of creative narration.
- Games: answer correctness, age suitability, and answer-key access tests.

Publication must be blocked when required provenance, permission, or review is missing. Corrections create a new version and retain the prior approved record for traceability. Takedown requests need an owner, response target, and documented disposition.

## 9. Payments and course entitlements

Payment processing is not implemented or specified by this design. Before enabling paid courses, decide:
- Supported payment provider and jurisdictions.
- Refund, cancellation, failed-payment, and chargeback rules.
- Whether a guardian/parent must authorize purchases for younger learners.
- What minimal payment metadata the app stores (prefer provider references and status, not card details).
- Whether a course is subscription-based, one-time purchase, scholarship, or free.
- How entitlement begins, expires, pauses, and is revoked.
- How support staff can inspect payment status without seeing sensitive payment credentials.

Security requirements:
- Never trust a client-supplied `is_paid`, price, receipt status, or entitlement.
- Verify provider webhooks on the server and make processing idempotent.
- Do not grant access from an unverified redirect or browser callback.
- Keep payment-provider secrets server-side.
- Separate payment operations from educational record permissions.
- Do not store card numbers, CVV, or bank credentials in the application database.

## 10. Reports and dashboards

Overview metrics should be aggregated by default:
- Active courses and classes.
- Pending content reviews and enrollment requests.
- Teacher assignment coverage.
- Completion and participation rates with explicit definitions.
- Memorization/review activity counts.
- Quiz participation and score distributions only where policy permits.

Learner-level drill-down must require a scoped capability and a clear operational purpose. Exports should be disabled by default until retention, authorization, audit, and data-minimization rules are approved. Avoid public leaderboards and comparative rankings of children.

Report definitions must distinguish:
- Student self-reported completion.
- Teacher-assessed performance.
- Independently verified mastery, if such a process is later defined.

## 11. Audit events and operational safeguards

Record high-impact actions such as:
- Role grant/revocation and account status changes.
- Teacher/reviewer assignments.
- Course creation, publication, archive, and entitlement changes.
- Enrollment transitions and class transfers.
- Content approval, correction, publication, and takedown.
- Assessment policy and result-release changes.
- Sensitive report access and export attempts.
- Administrative setting changes.

Audit events should be server-generated, append-only, timestamped by the server, and linked to the authenticated actor. Keep payloads minimal: do not duplicate phone numbers, private notes, passwords, tokens, payment credentials, or complete student records in audit JSON. Restrict audit access and define retention and incident-review procedures.

For risky operations, use:
- Explicit confirmation with a clear impact summary.
- Reason codes for role, status, enrollment, and publication changes.
- Optional second approval for administrator grants and bulk actions.
- Idempotency keys for retried operations.
- Rate limits and anomaly monitoring.
- A documented rollback or compensating action.

## 12. Authorization model and API boundaries

Every privileged action should follow this sequence on the server:
1. Authenticate the session.
2. Resolve the current server-owned account status and role.
3. Resolve the relevant current course/class assignment.
4. Check the specific capability for the requested action and target.
5. Validate all input and state transitions.
6. Perform the mutation transactionally.
7. Write the audit event in the same transaction where feasible.
8. Return only fields the caller is authorized to receive.

RLS remains a database boundary, not a replacement for business-rule validation. Use narrow RPCs or server endpoints for sensitive multi-step workflows. Avoid broad table writes for role changes, publication, payment entitlement, or bulk enrollment. Revoke unnecessary table/function privileges and verify effective grants as well as RLS policies.

## 13. Staging verification matrix

Use synthetic accounts and non-production data only.

| Scenario | Expected outcome |
|---|---|
| Student opens admin route directly | Denied by server-side authorization |
| Teacher queries an unassigned class | Denied; no row leakage |
| Teacher assignment expires | New teacher write operations denied |
| Teacher role is revoked but assignment remains | Teacher-only management denied |
| Content editor approves own restricted hadith item | Blocked or requires independent authorized reviewer |
| Course manager publishes a course with unlicensed audio | Publication blocked |
| Client changes role field in request body | Server ignores/rejects unauthorized change |
| Client forges paid entitlement | Access denied |
| Payment webhook is replayed | Idempotent; no duplicate entitlement |
| Student requests another learner's report | Denied |
| Support operator requests private educational notes | Denied unless explicitly granted and justified |
| Admin exports learner-level data without export capability | Denied and audited |
| Bulk role assignment partially fails | Transactional or clearly reconciled; no silent partial privilege escalation |
| Account is disabled | Session and server authorization behavior follow approved revocation policy |
| Content is corrected after publication | New version and audit trail retained |
| Audit record is updated/deleted by ordinary staff | Denied |

## 14. Rollout sequence

1. Approve role and capability matrix.
2. Confirm authoritative account status and role sources.
3. Confirm class/course assignment revocation semantics.
4. Implement read-only admin overview using synthetic/staging data.
5. Add limited user lookup and staff assignment workflows.
6. Add course drafts and content review queue.
7. Add enrollment lifecycle operations.
8. Add audited publishing and unpublishing.
9. Add aggregate reports; defer exports.
10. Design payment/entitlement integration separately after provider and guardian-consent decisions.
11. Run negative authorization tests and privacy review.
12. Obtain explicit approval before production migration or deployment.

## 15. Product decisions required

1. Which staff roles and capability boundaries are approved?
2. Who can appoint administrators, and is second approval mandatory?
3. What is the authoritative account-disable mechanism and session-revocation policy?
4. Can teachers manage multiple classes, and who approves assignments?
5. Which staff roles can approve Qur'an, hadith, tafsir, translation, and story content?
6. What are the course publication and revision rules?
7. Who approves enrollment, transfers, pauses, and withdrawals?
8. Will paid courses launch in the first release, and which payment provider/jurisdictions are in scope?
9. What guardian-consent requirements apply to purchases and learner accounts?
10. Which reports may identify a learner, and who may export them?
11. What are the audit retention, privacy, and incident-response policies?
12. Who owns correction, rights-holder takedown, and emergency unpublishing?

## Conclusion

The admin console should be a controlled operations workspace, not a universal superuser screen. Its core safety properties are narrowly scoped capabilities, current role-and-assignment checks, clear editorial separation, server-verified entitlements, minimal child data exposure, and durable audit history. Build read-only operational views first, then add carefully scoped workflows after product decisions and staging authorization tests are complete.

**Stage status:** design/documentation only. No live database access or mutation, no payment integration, no content import, no migration execution, no deployment, and no PR merge.
