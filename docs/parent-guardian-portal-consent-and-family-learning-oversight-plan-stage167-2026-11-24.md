# Stage 167 — Parent/Guardian Portal, Consent Management, and Family Learning Oversight
Date: 2026-11-24
Status: design/documentation only; no parent portal, guardian account, consent workflow, messaging feature, database object, policy, or production setting implemented.

## 1. Purpose and principles
Design a safe, privacy-preserving family area for learners who need parent/guardian involvement. The portal should help an authorized guardian understand course participation, important notices, attendance and learning progress without turning family oversight into surveillance or pressure.

Principles:
- The learner remains the primary participant in their own learning.
- Collect only information necessary for education, safety and lawful consent.
- A parent/guardian relationship must be verified and explicitly authorized; never infer it from matching names, phone numbers or email addresses.
- A guardian sees only the learner(s) explicitly linked to that guardian and only the permitted data categories.
- Age, applicable law, safeguarding policy and the learner's evolving privacy needs determine consent and visibility rules.
- No public exposure of a child's enrollment, results, schedule, audio, image or contact details.
- Do not use progress data to shame, punish or compare siblings or classmates.
- Consent is specific, understandable, revocable where applicable, versioned and auditable.

## 2. Roles and relationship model
Possible roles:
- learner
- parent_or_guardian
- teacher
- course_manager
- safeguarding_contact
- administrator

A guardian relationship must have:
- learner account reference
- guardian account reference
- relationship type (parent, legal guardian, other approved caregiver)
- verification state and method
- requested_by / reviewed_by
- permissions scope
- effective date, expiry/review date where required
- status (pending, active, rejected, suspended, revoked)
- audit history

Do not allow a learner or guardian to self-assert a legal status that automatically grants broad access. Define a proportionate verification process with manual review for ambiguous cases. Avoid collecting identity documents unless necessary and legally reviewed; if ever collected, define restricted storage, retention and deletion rules separately.

## 3. Guardian onboarding and linking
Suggested flow:
1. Guardian creates an account or signs in.
2. Guardian requests a link using a one-time invitation initiated by an authorized school/course administrator or another approved verified process.
3. Learner and guardian relationship is reviewed according to age and safeguarding rules.
4. The system activates only the approved relationship and explicit permission scopes.
5. Guardian receives a plain-language explanation of what is visible and how to request correction or unlinking.
6. Periodic review and change-of-custody/safety procedures are available to authorized staff.

Invitation tokens must be random, short-lived, single-use, rate-limited and stored hashed. Do not use a child's public username or sequential learner ID as a linking secret. Do not permit account discovery by enumerating student identifiers.

## 4. Guardian dashboard
Potential dashboard sections:
- current courses and schedule for linked learners
- attendance summary with clear status definitions
- upcoming course milestones and teacher announcements
- high-level learning progress by dimension (reading, tajwid, memorization, revision, translation and reflection)
- assigned home practice, where the course explicitly enables guardian visibility
- finalized certificates issued to the learner, subject to policy
- consent and notification settings
- support and correction requests

Progress must distinguish:
- learner self-report
- teacher observation/assessment
- verified mastery under a published rubric

Do not display a misleading single score or rank. Missing data should be described as “not assessed” rather than failure. Avoid continuous activity tracking, location tracking and unnecessary minute-by-minute histories.

## 5. Consent and permission registry
Consent must be purpose-specific and separate from general account creation. Potential categories:
- course participation and essential account processing
- guardian access to defined learning summaries
- optional audio recording for a specific learning activity
- optional photo/video publication
- optional external service or AI processing
- optional event participation or public recognition
- optional communication channels

For each consent record store:
- subject learner and authorized decision-maker
- purpose and data categories
- policy/notice version and language shown
- decision (granted, denied, withdrawn, expired)
- timestamp and collection channel
- scope, duration and expiry/review date
- actor and evidence reference, avoiding unnecessary document copies
- withdrawal timestamp and resulting processing actions

Do not bundle optional media/AI/publicity consent with essential course participation. Declining optional consent must not block access to unrelated learning features. Where learner assent is appropriate, capture it separately from guardian consent. Apply jurisdiction-specific age and legal requirements only after legal review; do not hard-code a universal age threshold.

## 6. Family-teacher communication
Provide structured, moderated communication rather than unrestricted direct messaging by default:
- course announcements to linked guardians
- appointment or meeting requests
- attendance/learning concern notifications
- structured questions with category and response status
- teacher feedback scoped to the learner and course
- escalation to an authorized safeguarding contact

Controls:
- no public contact details
- no automatic disclosure of teacher personal phone/email
- no unmoderated group chat between adults and minors
- clear office hours and expected response windows
- moderation, reporting and audit policy
- prohibit sharing another learner's data in a family thread
- define emergency wording that directs users to local emergency services rather than implying the app is monitored continuously

## 7. Notifications and quiet hours
- Guardian chooses permitted notification channels and categories.
- Use quiet hours and digest options.
- Avoid alarming language, guilt, streak-loss threats or pressure-based reminders.
- Do not reveal sensitive learner details in lock-screen previews or email subject lines.
- Make notifications idempotent and record delivery state without retaining unnecessary message content.
- A guardian cannot enable optional data processing merely by changing notification settings.

## 8. Privacy boundaries and learner dignity
- Guardians see only linked learners and approved fields.
- Teacher access remains limited to current assigned classes.
- A guardian link does not grant access to private teacher notes, internal safeguarding records, other learners, answer keys or unrelated account/security information.
- Define age-appropriate learner visibility and private support pathways with safeguarding/legal review.
- Provide a process for disputes, unsafe household situations, custody changes and requests to suspend a link.
- Where a disclosure could create a safety risk, route the case to trained safeguarding staff; do not automatically notify every linked guardian.
- Never expose audio recordings, private annotations or sensitive communications merely because a guardian is linked.
- Use data minimization, retention schedules and deletion/rectification procedures.

## 9. Conceptual data model
Design concepts only; reconcile with existing profiles, course enrollment, attendance, notifications and audit designs before any implementation:
- guardian_relationships: learner_id, guardian_id, relationship_type, status, verification_method, reviewed_by, effective_at, expires_at.
- guardian_permission_scopes: relationship_id, data_category, permission_state, policy_version, updated_at.
- consent_notices: purpose_key, notice_version, locale, content_reference, effective_at.
- learner_consents: learner_id, decision_maker_id, purpose_key, notice_version, decision, scope, granted_at, withdrawn_at, expires_at.
- guardian_link_invitations: token_hash, invited_account/contact reference, learner_id, expires_at, consumed_at, status.
- family_support_requests: learner_id, guardian_id, course_id, category, status, assigned_staff_id, created_at, resolved_at.
- guardian_notification_preferences: guardian_id, category, channel, quiet_hours, enabled.
- guardian_access_audit: actor_id, learner_id, relationship_id, data_category, action, timestamp, reason_code.

Do not store raw invitation tokens, identity documents, or unnecessary copies of consent evidence. Use foreign keys, unique constraints and lifecycle timestamps. Keep safeguarding case details in a separately restricted system if required.

## 10. Authorization and RLS requirements
- A guardian can read only the approved data categories for active verified relationships.
- A guardian cannot create or activate their own relationship or elevate permission scope.
- Learner access to their own data remains independent of guardian access.
- Teacher access is based on current class/course assignment and role.
- Admin relationship review and permission changes are least-privilege and audited.
- Safeguarding staff access is separately scoped and audited.
- Server derives actor identity from authenticated context; never trust client-supplied guardian_id, learner_id, role or consent actor.
- RLS must enforce row-level boundaries; server-side RPCs validate relationship status, scope and consent version.
- Revocation, expiry, custody update or account suspension must invalidate access promptly.
- Avoid broad profile SELECT grants as a substitute for guardian-specific views/RPCs.
- Public/anonymous users must not enumerate learners, guardians, relationships or consent state.

## 11. Operational governance
Before launch, define:
- who verifies a guardian relationship and what evidence is proportionate
- who can suspend or revoke a link
- response and appeal process for disputed relationships
- handling of custody changes and conflicting guardian requests
- consent notice owner, translation and version approval
- retention and deletion schedule by data category
- safeguarding escalation ownership and operating hours
- applicable jurisdictional legal review and incident response
- process for learner transition to independent account permissions as they age

## 12. Acceptance and security tests
1. Guardian A cannot read a learner not linked to Guardian A.
2. Guardian cannot activate or self-verify a relationship by editing client requests.
3. Expired, pending, suspended or revoked links grant no learner-data access.
4. Guardian cannot read private teacher notes, internal safeguarding records or unrelated account data.
5. Guardian cannot access another guardian's profile or invitation.
6. Invitation tokens are single-use, expire, are rate-limited and are not stored in plaintext.
7. Consent for audio, image/video, publicity and external AI processing is independent and purpose-specific.
8. Withdrawal updates the applicable processing and access state according to the approved retention policy.
9. Denial of optional consent does not block unrelated course participation.
10. Teacher cannot view learners outside current assignments.
11. Learner A's family cannot access Learner B's attendance, progress, messages or certificates.
12. Custody/relationship dispute can trigger restricted review without automatic disclosure to all linked parties.
13. Notification previews do not disclose sensitive learner information.
14. Guardian quiet hours and channel preferences are respected.
15. Access and permission changes create audit events without logging sensitive content.
16. RTL, accessible language, keyboard navigation and low-bandwidth flows are tested.
17. No location tracking, covert monitoring or public child leaderboard is introduced.
18. Anonymous users cannot enumerate learner or guardian records.

## 13. Release sequence
1. Inventory current profiles, roles, course enrollment, attendance, notifications and existing privacy controls.
2. Obtain jurisdiction-specific legal and safeguarding review for guardian verification, consent and learner privacy.
3. Define guardian verification, permitted data categories and dispute procedures.
4. Implement relationship lifecycle in a non-production environment with synthetic accounts.
5. Add read-only dashboard summaries with strict RLS and server-side authorization.
6. Add purpose-specific consent registry and withdrawal workflows.
7. Pilot structured family-teacher communication with moderation and clear operating hours.
8. Test revocation, custody disputes, privacy boundaries, accessibility and incident response.
9. Obtain explicit approval before any production migration, account linking, notification or release.

## 14. Decisions required
- Which learner age groups require guardian access and what age-appropriate privacy rules apply?
- Which party may initiate and verify a guardian link?
- What verification evidence is proportionate and legally permitted?
- Which dashboard fields may guardians see by default?
- Which data categories require learner assent in addition to guardian consent?
- What are the retention and withdrawal consequences for audio/media/AI consent?
- Which communication channels are enabled at launch and who moderates them?
- How are custody disputes, unsafe situations and conflicting requests handled?
- What are the response times and escalation responsibilities?
- Which jurisdictions and legal frameworks govern the service?

## 15. Status and safety
This is a design document only. No guardian portal, relationship, consent, messaging, notification, database table, RLS policy, RPC, trigger, storage bucket, external service or live setting was created or changed. No learner or guardian personal data was accessed or modified. No migration, deployment, merge or release was performed.
