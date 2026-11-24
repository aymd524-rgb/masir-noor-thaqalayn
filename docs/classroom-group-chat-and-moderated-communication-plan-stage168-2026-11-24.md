# Stage 168 — Classroom Group Chat and Moderated Communication
Date: 2026-11-24
Status: design/documentation only; no chat UI, messaging backend, storage, notification workflow, database object or production setting implemented.

## 1. Purpose
Design a safe class communication space where currently enrolled learners and their assigned teacher can discuss lessons, ask educational questions and receive class announcements. The feature is a moderated learning tool, not an unrestricted social network or private-messaging service.

## 2. Product principles
- Each class has a distinct conversation space with membership derived from current enrollment and teacher assignment.
- The assigned teacher and authorized moderators manage the space.
- Keep communication educational, respectful, age-appropriate and accessible.
- Do not enable learner-to-learner private direct messages by default.
- Do not expose personal phone numbers, email addresses, home addresses or location.
- Do not use public profiles, follower counts, popularity metrics, read-receipt pressure or public message rankings.
- Provide clear reporting, moderation and appeal routes.
- Preserve learner dignity; moderation should be proportionate, consistent and documented.
- Support guardian-facing notices separately; a guardian link does not automatically grant access to every class message.

## 3. Conversation types
Initial scope:
1. Class group discussion: enrolled learners and assigned teacher(s).
2. Teacher announcements: one-way posts for schedule changes, lesson notes and reminders.
3. Lesson question thread: learner asks a course-related question; teacher and class may respond under class rules.
4. Assignment discussion: messages attached to an assignment or lesson, visible only to authorized class members.
5. Support/report channel: private report to designated teacher/moderator, with clear limits on confidentiality and response hours.

Do not include unrestricted one-to-one learner DMs in the initial release. If private teacher-learner support is later required, design it as a safeguarded, auditable workflow with organizational visibility and guardian/safeguarding policy review, not an invisible private chat.

## 4. Membership and access lifecycle
- Membership is based on active enrollment in the relevant class and current teacher assignment.
- The server derives user identity from the authenticated session.
- A learner cannot add themselves, invite outsiders or change another member's role.
- Teacher assignment changes and enrollment completion/withdrawal update membership promptly.
- Former learners lose write access and, according to the retention policy, may retain only their own permitted historical records.
- Substitute teachers and moderators require explicit time-bounded authorization.
- Class roster and membership lists reveal only minimum display information.

## 5. Message capabilities
Potential capabilities:
- text messages with safe length limits
- threaded replies and teacher-answered questions
- reactions limited to a small, non-competitive set
- attachments restricted to approved file types and size limits
- audio recitation attachments only where the course enables them and consent/privacy rules permit
- pinned teacher announcements and lesson resources
- edit/delete own recent messages under a defined policy
- teacher/moderator removal or hiding with a reason category
- message reporting and blocking of abusive content pending review
- search limited to the user's currently authorized class spaces

Avoid unrestricted executable files, external embeds, public links by default, location sharing, disappearing messages and anonymous posting. Scan attachments and apply content-type validation; do not trust file extensions or client MIME claims.

## 6. Moderation and child safety
- Publish a short class code of conduct before first use.
- Explain that class messages are visible to authorized class members and moderators; do not promise absolute confidentiality.
- Provide report controls on messages and a clear path to a trusted adult or safeguarding contact.
- Give teachers tools to remove content, temporarily restrict posting, mute a thread and escalate a concern.
- Define escalation categories for bullying, harassment, threats, personal-data sharing, inappropriate content and safeguarding concerns.
- Avoid automated punitive decisions. Automated filters may flag content for human review but must not make high-impact judgments without an accountable reviewer.
- Moderators must have training, limited access and an audit trail.
- Do not allow adults to privately solicit personal contact details or move minors to unapproved external channels.
- Set clear operating hours and explain that chat is not an emergency service.
- Define retention, evidence preservation and escalation processes with legal/safeguarding review.

## 7. Teacher and moderator controls
- Create/pin/close class threads.
- Publish announcements and assignment discussions.
- Remove or hide a message with a recorded reason.
- Temporarily pause posting for a class or thread.
- Restrict a learner's posting only under a documented, time-limited and reviewable process.
- Review reports and record outcomes.
- Assign a second authorized moderator where needed.
- Export only the minimum records required for an approved educational or safeguarding purpose.
- No teacher may read conversations from classes they are not assigned to, except a specifically authorized safeguarding process.

## 8. Notifications
- In-app notifications for new class messages, teacher announcements and replies.
- Per-user controls for non-essential notification categories and quiet hours.
- No sensitive message body in lock-screen previews by default.
- Rate-limit notifications and batch high-volume activity.
- Avoid pressure-based reminders and streak mechanics.
- Notifications must respect membership revocation and current access scope.

## 9. Guardian relationship
- Guardian access to class chat is not automatic merely because a guardian is linked to a learner.
- Provide a separate, explicit policy decision for whether guardians receive announcements, selected teacher notices or a limited summary.
- Do not expose other children's messages or personal data through a guardian dashboard.
- If a guardian is permitted to participate, use a clearly labeled guardian identity and a separate guardian channel rather than silently joining as the learner.
- Consider learner age, assent, legal requirements and safeguarding circumstances before enabling guardian visibility.
- Guardian notification settings must not override learner privacy or class membership controls.

## 10. Conceptual data model
Design only; reconcile with current schema and notification/audit plans before implementation:
- class_conversations: class_id, conversation_type, title, status, created_by, created_at.
- conversation_memberships: conversation_id, user_id, membership_role, status, joined_at, left_at, source_enrollment_or_assignment_id.
- conversation_messages: conversation_id, sender_id, parent_message_id, body, message_state, created_at, edited_at, removed_at.
- message_attachments: message_id, private_storage_key, media_type, byte_size, scan_state, retention_state.
- message_reports: message_id, reporter_id, category, description_minimized, status, assigned_moderator_id, created_at, resolved_at.
- moderation_actions: message_id, target_user_id, moderator_id, action_type, reason_code, duration_until, created_at.
- conversation_announcements: conversation_id, message_id, pinned_at, expires_at.
- communication_audit_events: actor_id, conversation_id, message_id, action, reason_code, timestamp.

Do not store public attachment URLs or plaintext secrets. Use private object storage and short-lived authorized access. Define deletion, legal hold and safeguarding retention separately.

## 11. Authorization and privacy
- Learner reads/writes only conversations where active membership permits the action.
- Teacher reads/moderates only currently assigned classes and explicitly authorized support channels.
- Admin access is least-privilege and audited; broad routine reading of all messages is not a default.
- Guardian cannot impersonate a learner or gain class chat access from a relationship link alone.
- Anonymous users cannot read or post.
- Server validates membership, role, class assignment, attachment policy and message state on every operation.
- RLS enforces row-level boundaries; server-side functions handle membership transitions, moderation and attachment authorization.
- Never trust client-supplied sender_id, class_id, role, moderator_id or timestamps.
- Search, previews, notifications, exports and attachment delivery must apply the same authorization checks.
- Revoked members must lose access promptly, including through cached URLs and search results.

## 12. Accessibility and learning quality
- Fully support RTL Persian and Arabic, keyboard navigation and screen readers.
- Provide readable font sizes, clear timestamps and accessible attachment labels.
- Make low-bandwidth text mode available.
- Avoid rapid auto-refresh that disrupts reading.
- Allow students to mute non-essential threads and manage notification preferences.
- Encourage constructive feedback and teacher-led discussion rather than speed or popularity contests.

## 13. Reliability and operations
- Use idempotency keys for message submission and attachment completion.
- Handle network retries without duplicate messages.
- Apply message and attachment size/rate limits.
- Use server timestamps and stable pagination.
- Define moderation queue ownership, escalation response times and backup coverage.
- Monitor service health without collecting message contents for unrelated analytics.
- Provide export/deletion workflows consistent with retention and safeguarding obligations.

## 14. Acceptance and security tests
1. Learner A cannot read or post in a class where they are not an active member.
2. Learner cannot add an external user or change membership roles.
3. Teacher cannot read or moderate a class outside current assignment.
4. Former learner loses access after enrollment ends or is revoked.
5. Guardian link alone does not grant access to class messages.
6. Guardian views do not reveal other learners' messages or identities.
7. Anonymous users cannot enumerate conversations, members, messages or attachments.
8. Sender identity and timestamps are server-derived, not client-controlled.
9. Attachment type, size, scanning and private access checks are enforced server-side.
10. Revoked members cannot access cached or newly requested attachment links.
11. Reports create a restricted moderation record and do not expose reporter identity to the reported learner by default.
12. Moderation actions require authorized actor, reason and audit event.
13. Automated filters only flag for review and do not impose unreviewed high-impact penalties.
14. Private support channel visibility is restricted to its authorized participants and safeguarding roles.
15. No unrestricted learner-to-learner direct messaging is available by default.
16. Notifications do not leak sensitive message content in lock-screen previews.
17. Quiet hours, rate limits, pagination and duplicate-submission handling work correctly.
18. RTL, screen reader, keyboard and low-bandwidth tests pass.
19. No external contact details, location sharing or unapproved off-platform solicitation is encouraged.
20. Message retention, deletion and safeguarding evidence procedures are applied consistently.

## 15. Release sequence
1. Inventory current class, enrollment, teacher assignment, notification, storage and audit structures.
2. Approve class conduct, moderation, safeguarding and retention policies.
3. Prototype text-only class announcements and discussion with synthetic accounts.
4. Implement membership authorization and RLS before enabling message UI.
5. Add reporting, moderation queue and audit events.
6. Add controlled attachments only after private storage and scanning review.
7. Pilot with a small supervised class and collect educator/learner feedback.
8. Review guardian notice policy and jurisdiction-specific requirements.
9. Obtain explicit approval before production schema changes, enabling chat, or releasing notifications.

## 16. Decisions required
- Are group conversations enabled for all courses or only classes whose teacher opts in?
- Which age bands and class conduct rules apply?
- Which teacher roles can moderate, and who provides backup coverage?
- Are attachments enabled at launch or text-only first?
- Are audio recitations permitted, and what consent/retention rules apply?
- Can guardians receive announcements or summaries, and under what age/assent policy?
- What are message edit/delete windows and retention periods?
- What is the escalation and response-time policy for reports?
- Are any safeguarded one-to-one support workflows needed later?

## 17. Status and safety
This is a design document only. No chat feature, message, attachment, storage bucket, notification, database table, RLS policy, RPC, trigger, moderation workflow or live setting was created or changed. No learner communication or personal data was accessed. No migration, deployment, merge or release was performed.
